'use client';

import React, { useRef, useEffect } from 'react';
import { MessageItem } from './MessageItem';
import { Message } from '@/types';
import { useStore } from '@/store/store';

interface MessageListProps {
  messages: Message[];
  conversationId: string;
  isLoading?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  conversationId,
  isLoading = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { conversations } = useStore();
  const currentConversation = conversations.find(conv => conv.id === conversationId);
  
  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // 当消息更新或加载状态改变时滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  return (
    <div className="flex-1 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-4">👋</div>
            <h3 className="text-xl font-medium text-gray-300 mb-2">欢迎使用 ChatGPT UI</h3>
            <p className="max-w-md text-gray-400">
              发送一条消息开始与AI助手对话。您可以询问任何问题，AI助手将尽力帮助您。
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              conversationId={conversationId}
            />
          ))}
          
          {/* 显示系统通知 */}
          {currentConversation?.systemNotification && (
            <div className="py-4 bg-yellow-900 bg-opacity-20 border-l-4 border-yellow-500">
              <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4 rounded-full w-8 h-8 flex items-center justify-center bg-yellow-500 text-gray-900">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="text-yellow-300 font-medium">系统通知</div>
                    <div className="text-gray-300">{currentConversation.systemNotification}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {isLoading && (
            <div className="py-6 bg-gray-900">
              <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 mr-4 rounded-full w-8 h-8 flex items-center justify-center bg-green-600 text-white">
                    AI
                  </div>
                  <div className="flex-1">
                    <div className="flex space-x-2">
                      <div className="h-3 w-3 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="h-3 w-3 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                      <div className="h-3 w-3 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}; 