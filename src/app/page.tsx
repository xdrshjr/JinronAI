'use client';

import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { useStore } from '@/store/store';
import { v4 as uuidv4 } from 'uuid';
import { TaskSelector } from '@/components/task/TaskSelector';
import { PaperInnovationExplorer } from '@/components/task/PaperInnovationExplorer';
import { PaperSearch } from '@/components/task/PaperSearch';

export default function Home() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    updateConversation,
    setCurrentConversationId,
    apiConfig,
  } = useStore();

  const [isLoading, setIsLoading] = React.useState(false);
  
  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );

  // 如果没有当前会话，创建一个新的
  React.useEffect(() => {
    if (!currentConversationId && conversations.length === 0) {
      // 创建新会话
      const newConversationId = createConversation('对话');
      setCurrentConversationId(newConversationId);
      
      // 添加欢迎消息
      setTimeout(() => {
        const conversation = conversations.find(conv => conv.id === newConversationId);
        if (conversation) {
          updateConversation(newConversationId, {
            messages: [
              {
                id: uuidv4(),
                role: 'assistant',
                content: `你好，有什么可以帮到你的吗？

我可以帮你编写各种编程语言的代码，例如：

\`\`\`javascript
// 一个简单的JavaScript函数
function greet(name) {
  return \`Hello, \${name}!\`;
}

console.log(greet('世界'));  // 输出: Hello, 世界!
\`\`\`

\`\`\`python
# Python示例
def factorial(n):
    if n == 0 or n == 1:
        return 1
    else:
        return n * factorial(n - 1)

# 计算5的阶乘
result = factorial(5)
print(f"5的阶乘是: {result}")  # 输出: 5的阶乘是: 120
\`\`\`

或者帮你解释一些概念，编写文档等。请告诉我你需要什么帮助？`,
                timestamp: Date.now(),
              }
            ]
          });
        }
      }, 100); // 短暂延迟确保会话已创建
    }
  }, [currentConversationId, conversations, createConversation, setCurrentConversationId, updateConversation]);

  const handleSendMessage = async (content: string) => {
    if (!currentConversation) return;

    const userMessage = {
      id: uuidv4(),
      role: 'user' as const,
      content,
      timestamp: Date.now(),
    };

    // 是否是用户的第一条消息
    const isFirstUserMessage = !currentConversation.messages.some(msg => msg.role === 'user');
    
    // 如果是第一条消息，更新会话标题
    let updatedTitle = currentConversation.title;
    if (isFirstUserMessage) {
      updatedTitle = content.length > 20 
        ? `${content.substring(0, 20)}...` 
        : content;
    }

    // 添加用户消息，并清除可能存在的系统通知
    updateConversation(currentConversation.id, {
      title: updatedTitle,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: Date.now(),
      // 清除系统通知，下次不再显示
      systemNotification: undefined
    });

    setIsLoading(true);

    try {
      // 获取当前会话的模型设置或使用默认设置
      const model = currentConversation.model || apiConfig.model;
      const temperature = currentConversation.temperature !== undefined 
        ? currentConversation.temperature 
        : apiConfig.temperature;

      // 如果对话上下文已清除，则只发送当前消息
      let messagesToSend;
      if (currentConversation.contextCleared) {
        // 上下文已清除，只发送当前用户消息
        messagesToSend = [
          { role: 'system', content: '以下是新的对话，之前的对话上下文已被清除。' },
          { role: 'user', content: userMessage.content }
        ];
        // 重置contextCleared标志
        updateConversation(currentConversation.id, {
          contextCleared: false
        });
      } else {
        // 正常发送所有消息
        messagesToSend = [...currentConversation.messages, userMessage].map(
          ({ role, content }) => ({ role, content })
        );
      }

      // 发送请求到API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesToSend,
          conversationId: currentConversation.id,
          apiConfig: {
            ...useStore.getState().apiConfig,
            model,
            temperature
          },
        }),
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      // 创建AI回复消息
      const assistantMessage = {
        id: uuidv4(),
        role: 'assistant' as const,
        content: '',
        timestamp: Date.now(),
      };

      // 添加空的AI回复消息
      updateConversation(currentConversation.id, {
        messages: [
          ...currentConversation.messages,
          userMessage,
          assistantMessage,
        ],
        updatedAt: Date.now(),
      });

      // 处理流式响应
      if (!response.body) throw new Error('无法读取响应流');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedContent = '';

      // 使用更高效的方式处理流
      try {
        let lastUpdateTime = 0;
        const updateInterval = 50; // 50ms的更新间隔，避免过于频繁的状态更新

        while (true) {
          const { done, value } = await reader.read();
          
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            accumulatedContent += chunk;

            // 限制更新频率，减少不必要的渲染
            const now = Date.now();
            if (now - lastUpdateTime > updateInterval || done) {
              // 更新AI回复消息的内容
              updateConversation(currentConversation.id, {
                messages: [
                  ...currentConversation.messages,
                  userMessage,
                  {
                    ...assistantMessage,
                    content: accumulatedContent,
                  },
                ],
                updatedAt: now,
              });
              lastUpdateTime = now;
            }
          }

          if (done) break;
        }
      } catch (error) {
        console.error('读取流失败:', error);
        throw error;
      } finally {
        // 确保最终状态是最新的
        updateConversation(currentConversation.id, {
          messages: [
            ...currentConversation.messages,
            userMessage,
            {
              ...assistantMessage,
              content: accumulatedContent,
            },
          ],
          updatedAt: Date.now(),
        });
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      // 这里可以添加错误提示
    } finally {
      setIsLoading(false);
    }
  };

  // 根据任务类型渲染不同内容
  const renderContent = () => {
    if (!currentConversation) return null;
    
    // 根据任务类型渲染不同组件
    switch (currentConversation.taskType) {
      case 'paper_innovation':
        return <PaperInnovationExplorer conversationId={currentConversation.id} />;
      case 'paper_search':
        return <PaperSearch conversationId={currentConversation.id} />;
      case 'normal_chat':
      case 'thinking':
      default:
        // 普通对话和思考任务显示聊天界面
        return (
          <>
            <MessageList
              messages={currentConversation.messages || []}
              conversationId={currentConversation.id}
              isLoading={isLoading}
            />
            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </>
        );
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {renderContent()}
      </div>
      
      {/* 任务选择器 */}
      <TaskSelector />
    </Layout>
  );
}
