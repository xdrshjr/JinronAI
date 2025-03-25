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
import { PdfTranslation } from '@/components/task/PdfTranslation';
import { About } from '@/components/ui/About';
import { Blog } from '@/components/ui/Blog';
import { HelpCenter } from '@/components/ui/HelpCenter';
import { TermsOfService } from '@/components/ui/TermsOfService';

export default function Home() {
  const {
    conversations,
    currentConversationId,
    createConversation,
    updateConversation,
    setCurrentConversationId,
    apiConfig,
    currentComponent,
    setCurrentComponent
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

  // 处理返回到主对话界面
  const handleBackToChat = () => {
    setCurrentComponent(null);
  };

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

  // 根据任务类型或当前组件渲染不同内容
  const renderContent = () => {
    // 如果有当前组件，优先渲染组件
    if (currentComponent) {
      switch (currentComponent) {
        case 'About':
          return (
            <div className="relative">
              <button 
                onClick={handleBackToChat}
                className="absolute top-4 left-4 text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                返回对话
              </button>
              <About />
            </div>
          );
        case 'Blog':
          return (
            <div className="relative">
              <button 
                onClick={handleBackToChat}
                className="absolute top-4 left-4 text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                返回对话
              </button>
              <Blog />
            </div>
          );
        case 'HelpCenter':
          return (
            <div className="relative">
              <button 
                onClick={handleBackToChat}
                className="absolute top-4 left-4 text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                返回对话
              </button>
              <HelpCenter />
            </div>
          );
        case 'TermsOfService':
          return (
            <div className="relative">
              <button 
                onClick={handleBackToChat}
                className="absolute top-4 left-4 text-blue-600 hover:text-blue-800 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                返回对话
              </button>
              <TermsOfService />
            </div>
          );
        default:
          return null;
      }
    }

    // 没有当前组件时，根据任务类型渲染
    if (!currentConversation) return null;
    
    // 根据任务类型渲染不同组件
    switch (currentConversation.taskType) {
      case 'paper_innovation':
        return <PaperInnovationExplorer conversationId={currentConversation.id} />;
      case 'paper_search':
        return <PaperSearch conversationId={currentConversation.id} />;
      case 'pdf_translation':
        return <PdfTranslation conversationId={currentConversation.id} />;
      default:
        // 默认聊天界面
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto">
              <MessageList 
                messages={currentConversation.messages || []}
                conversationId={currentConversation.id}
                isLoading={isLoading}
              />
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 py-4">
              <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
          </div>
        );
    }
  };

  return (
    <Layout>
      {renderContent()}
      
      {/* 任务选择器 */}
      <TaskSelector />
    </Layout>
  );
}
