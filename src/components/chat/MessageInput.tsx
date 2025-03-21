'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../ui/Button';
import { useStore } from '@/store/store';

// 定义内联SVG组件
const PaperAirplaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

// 回收站图标（清除对话）
const RecycleBinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

// 剪刀图标（仅清除上下文）
const ScissorsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.848 8.25l1.536.887M7.848 8.25a3 3 0 1 1-5.196-3 3 3 0 0 1 5.196 3Zm1.536.887a2.165 2.165 0 0 1 1.083 1.839c.005.351.054.695.14 1.024M9.384 9.137l2.077 1.199M7.848 15.75l1.536-.887m-1.536.887a3 3 0 1 0-5.196 3 3 3 0 0 0 5.196-3Zm1.536-.887a2.165 2.165 0 0 0 1.083-1.838c.005-.352.054-.695.14-1.025m-1.223 2.863 2.077-1.199m0-3.328a4.323 4.323 0 0 1 2.068-1.379l5.325-1.628a4.5 4.5 0 0 1 2.48-.044l.803.215-7.794 4.5m-2.882-1.664A4.331 4.331 0 0 0 10.607 12m3.736 0 7.794 4.5-.802.215a4.5 4.5 0 0 1-2.48-.043l-5.326-1.629a4.324 4.324 0 0 1-2.068-1.379M14.343 12l-2.882 1.664" />
  </svg>
);

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isLoading,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { clearConversationContext, clearContextKeepHistory, currentConversationId } = useStore();
  
  // 自动调整文本区域高度
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);
  
  // 处理消息发送
  const handleSendMessage = () => {
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      
      // 重置文本区域高度
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };
  
  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 处理清除对话
  const handleClearConversation = () => {
    if (currentConversationId) {
      clearConversationContext();
    }
  };

  // 处理仅清除上下文
  const handleClearContextOnly = () => {
    if (currentConversationId) {
      clearContextKeepHistory();
    }
  };
  
  return (
    <div className="bg-gray-900 border-t border-gray-700 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex-1">
          <div className="relative bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              className="w-full bg-gray-800 text-gray-100 p-3 resize-none focus:outline-none"
              rows={1}
              disabled={isLoading || disabled}
            />
            <div className="absolute right-2 bottom-2">
              <Button
                onClick={handleSendMessage}
                isLoading={isLoading}
                disabled={!message.trim() || isLoading || disabled}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white h-8 w-8 p-1"
              >
                <PaperAirplaneIcon />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex space-x-2">
            <Button
              onClick={handleClearConversation}
              disabled={!currentConversationId}
              variant="ghost"
              className="text-gray-400 hover:text-gray-200 hover:bg-gray-700 h-8 p-1 flex items-center text-xs"
              title="清除对话并重置"
            >
              <RecycleBinIcon />
              <span className="ml-1">清除对话</span>
            </Button>
            
            <Button
              onClick={handleClearContextOnly}
              disabled={!currentConversationId}
              variant="ghost"
              className="text-gray-400 hover:text-gray-200 hover:bg-gray-700 h-8 p-1 flex items-center text-xs"
              title="仅清除上下文，保留历史消息"
            >
              <ScissorsIcon />
              <span className="ml-1">仅清除上下文</span>
            </Button>
          </div>
          <div className="text-xs text-gray-400 text-right">
            按 Enter 发送，Shift + Enter 换行
          </div>
        </div>
      </div>
    </div>
  );
}; 