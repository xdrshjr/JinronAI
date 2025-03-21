'use client';

import React, { useState } from 'react';
import { Message } from '@/types';
import { formatDate, copyToClipboard } from '@/utils/helpers';
import { useStore } from '@/store/store';
import clsx from 'clsx';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import { User, Bot, Pencil, Lightbulb } from 'lucide-react';

// 导入常用语言高亮支持
import 'highlight.js/lib/common';
import 'highlight.js/styles/atom-one-dark.css';

// 引入一些常用的语言支持
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import typescript from 'highlight.js/lib/languages/typescript';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';

// 定义内联SVG组件
const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

interface MessageItemProps {
  message: Message;
  conversationId: string;
  onEdit?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

export const MessageItem = ({ message, conversationId, onEdit, onDelete }: MessageItemProps) => {
  const { updateMessage } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedCodeBlocks, setCopiedCodeBlocks] = useState<Record<string, boolean>>({});
  
  const isUser = message.role === 'user';
  
  // 检测消息内容中是否有思考过程和最终答案的分隔
  // deepseek-r1 模型的思考过程通常在消息开头，最终答案在后面
  const processDeepseekContent = () => {
    if (isUser || !message.content) return { reasoning: null, answer: message.content };
    
    // 如果消息内容已经包含明确的"思考过程："和"最终答案："标记
    if (message.content.includes('思考过程：')) {
      // 尝试查找 "最终答案："
      const finalAnswerIndex = message.content.indexOf('最终答案：');
      
      if (finalAnswerIndex !== -1) {
        // 既有思考过程又有最终答案
        const reasoningPart = message.content.substring(
          message.content.indexOf('思考过程：') + '思考过程：'.length, 
          finalAnswerIndex
        ).trim();
        
        const answerPart = message.content.substring(finalAnswerIndex + '最终答案：'.length).trim();
        
        return { 
          reasoning: reasoningPart, 
          answer: answerPart 
        };
      } else {
        // 只有思考过程，可能最终答案尚未生成完毕
        const reasoningPart = message.content.substring(
          message.content.indexOf('思考过程：') + '思考过程：'.length
        ).trim();
        
        return {
          reasoning: reasoningPart,
          answer: '' // 暂时没有最终答案
        };
      }
    } else if (message.content.includes('最终答案：')) {
      // 只有最终答案，可能思考过程尚未包含或被省略
      const answerPart = message.content.substring(
        message.content.indexOf('最终答案：') + '最终答案：'.length
      ).trim();
      
      return {
        reasoning: null,
        answer: answerPart
      };
    }
    
    // 尝试分离思考过程和最终答案
    // 使用一些常见的分隔符模式来检测
    const patterns = [
      /思考过程[:：]?([\s\S]*?)(?:最终答案[:：]|总结[:：]|回答[:：]|答案[:：])([\s\S]*)/i,
      /我来思考一下[:：]?([\s\S]*?)(?:因此[:：]|所以[:：]|综上所述[:：]|最终答案[:：]|回答[:：])([\s\S]*)/i,
      /首先(?:，|,)?([\s\S]*?)(?:因此[:：]|所以[:：]|综上所述[:：]|最终答案[:：]|回答[:：])([\s\S]*)/i,
      /Let me think([\s\S]*?)(?:Therefore|So|In conclusion|Final answer|Answer)([\s\S]*)/i,
    ];
    
    for (const pattern of patterns) {
      const match = message.content.match(pattern);
      if (match && match[1] && match[2]) {
        return { 
          reasoning: match[1].trim(), 
          answer: match[2].trim() 
        };
      }
    }
    
    // 如果没有找到明确的分隔，使用启发式方法：
    // 如果消息很长并且包含推理性语言，将前70%作为思考过程
    if (message.content.length > 200 && 
        (message.content.includes('首先') || 
         message.content.includes('其次') || 
         message.content.includes('分析') ||
         message.content.includes('考虑') ||
         message.content.includes('思考'))) {
      const splitPoint = Math.floor(message.content.length * 0.7);
      return {
        reasoning: message.content.substring(0, splitPoint).trim(),
        answer: message.content.substring(splitPoint).trim()
      };
    }
    
    // 默认情况，返回整个内容作为答案
    return { reasoning: null, answer: message.content };
  };
  
  const { reasoning, answer } = processDeepseekContent();
  
  // 复制消息内容
  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };
  
  // 复制代码块内容
  const handleCopyCodeBlock = async (codeContent: string, blockId: string) => {
    const success = await copyToClipboard(codeContent);
    if (success) {
      setCopiedCodeBlocks({...copiedCodeBlocks, [blockId]: true});
      setTimeout(() => {
        setCopiedCodeBlocks(prev => ({...prev, [blockId]: false}));
      }, 2000);
    }
  };
  
  // 保存编辑的消息
  const handleSaveEdit = () => {
    if (editedContent.trim() && editedContent !== message.content) {
      updateMessage(conversationId, message.id, editedContent);
    }
    setIsEditing(false);
  };
  
  // 处理键盘输入
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditedContent(message.content);
      setIsEditing(false);
    }
  };
  
  return (
    <div className={`py-6 ${isUser ? 'bg-gray-800' : 'bg-gray-900'}`}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-start">
          {/* 头像 */}
          <div className={`flex-shrink-0 mr-4 rounded-full w-8 h-8 flex items-center justify-center ${
            isUser ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
          }`}>
            {isUser ? (
              <User size={24} />
            ) : (
              <Bot size={24} />
            )}
          </div>
          
          {/* 消息内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <div className="font-medium text-gray-200">
                {isUser ? '用户' : '助手'}
              </div>
              <div className="ml-2 text-xs text-gray-400">
                {formatDate(new Date(message.timestamp))}
              </div>
            </div>
            
            {isEditing ? (
              <div className="mt-2">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full min-h-[100px] p-3 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
                <div className="mt-2 flex items-center text-sm">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <CheckIcon />
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditedContent(message.content);
                      setIsEditing(false);
                    }}
                    className="ml-2 flex items-center px-3 py-1 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600"
                  >
                    取消
                  </button>
                  <div className="ml-4 text-gray-400">
                    按下 Ctrl+Enter 保存，Esc 取消
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden prose prose-invert max-w-none markdown-body">
                {/* 思考过程部分 - 使用独立的容器并添加明确的样式区分 */}
                {reasoning && !isUser && (
                  <div className="mb-6 bg-gray-800/80 rounded-md p-3 border border-gray-700">
                    <div className="flex items-center mb-3">
                      <Lightbulb size={16} className="text-yellow-400 mr-2" />
                      <h4 className="font-medium text-yellow-400 text-sm">思考过程</h4>
                    </div>
                    {/* 将整个思考过程包装在斜体容器内，而不仅仅依赖于 Markdown 渲染 */}
                    <div className="text-gray-400 border-l-2 border-gray-700 pl-4">
                      <div className="italic">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[
                            rehypeSanitize,
                            [rehypeHighlight, {
                              detect: true,
                              ignoreMissing: true,
                              subset: false
                            }]
                          ]}
                          components={{
                            // 代码块不应该有斜体
                            code({node, className, children, ...props}: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !className;
                              const codeContent = String(children).replace(/\n$/, '');
                              const blockId = isInline ? '' : `code-block-${Math.random().toString(36).substr(2, 9)}`;
                              
                              return !isInline ? (
                                <div className="relative group not-italic">
                                  <pre className="code-block bg-gray-950 rounded-md overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 code-header">
                                      <span className="text-xs text-gray-400">
                                        {match ? match[1] : '代码'}
                                      </span>
                                      <button
                                        onClick={() => handleCopyCodeBlock(codeContent, blockId)}
                                        className="text-gray-400 hover:text-gray-200 transition-colors code-copy-button"
                                        title="复制代码"
                                      >
                                        {copiedCodeBlocks[blockId] ? (
                                          <span className="flex items-center text-green-400">
                                            <CheckIcon />
                                            <span className="ml-1 text-xs">已复制</span>
                                          </span>
                                        ) : (
                                          <span className="flex items-center">
                                            <ClipboardIcon />
                                            <span className="ml-1 text-xs">复制</span>
                                          </span>
                                        )}
                                      </button>
                                    </div>
                                    <code
                                      className={match ? `language-${match[1]}` : ''}
                                      {...props}
                                    >
                                      {children}
                                    </code>
                                  </pre>
                                </div>
                              ) : (
                                <code className="inline-code bg-gray-800 px-1 py-0.5 rounded text-sm not-italic" {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {reasoning}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 最终答案部分 - 使用更清晰的视觉分隔 */}
                {answer && (
                  <div className={reasoning && !isUser ? "bg-gray-900 rounded-md p-4 border border-gray-600" : ""}>
                    {reasoning && !isUser && (
                      <div className="flex items-center mb-3">
                        <h4 className="font-medium text-green-400 text-base">最终答案</h4>
                      </div>
                    )}
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[
                        rehypeSanitize,
                        [rehypeHighlight, {
                          detect: true,
                          ignoreMissing: true,
                          subset: false
                        }]
                      ]}
                      components={{
                        code({node, className, children, ...props}: any) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !className;
                          const codeContent = String(children).replace(/\n$/, '');
                          const blockId = isInline ? '' : `code-block-${Math.random().toString(36).substr(2, 9)}`;
                          
                          return !isInline ? (
                            <div className="relative group">
                              <pre className="code-block bg-gray-950 rounded-md overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 code-header">
                                  <span className="text-xs text-gray-400">
                                    {match ? match[1] : '代码'}
                                  </span>
                                  <button
                                    onClick={() => handleCopyCodeBlock(codeContent, blockId)}
                                    className="text-gray-400 hover:text-gray-200 transition-colors code-copy-button"
                                    title="复制代码"
                                  >
                                    {copiedCodeBlocks[blockId] ? (
                                      <span className="flex items-center text-green-400">
                                        <CheckIcon />
                                        <span className="ml-1 text-xs">已复制</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center">
                                        <ClipboardIcon />
                                        <span className="ml-1 text-xs">复制</span>
                                      </span>
                                    )}
                                  </button>
                                </div>
                                <code
                                  className={match ? `language-${match[1]}` : ''}
                                  {...props}
                                >
                                  {children}
                                </code>
                              </pre>
                            </div>
                          ) : (
                            <code className="inline-code bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {answer}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="ml-4 flex-shrink-0 flex space-x-2">
            {isUser && onEdit && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditedContent(message.content);
                }}
                className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
              >
                <PencilIcon />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="p-1 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded"
            >
              {isCopied ? (
                <CheckIcon />
              ) : (
                <ClipboardIcon />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 