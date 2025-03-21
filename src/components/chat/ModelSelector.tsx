import React, { useState } from 'react';
import { useStore } from '@/store/store';

// 内联SVG图标
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

// 模型选项，可以扩展
export const modelOptions = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo (16K)' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4-32k', label: 'GPT-4 (32K)' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
];

interface ModelSelectorProps {
  conversationId: string;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({ conversationId }) => {
  const { 
    updateConversation, 
    getConversation, 
    apiConfig, 
    apiProviders, 
    currentApiProviderId 
  } = useStore();
  
  const conversation = getConversation(conversationId);
  const [isOpen, setIsOpen] = useState(false);
  
  // 获取当前API提供商
  const currentProvider = apiProviders.find(p => p.id === currentApiProviderId);
  
  // 获取当前提供商可用的模型列表
  const availableModels = currentProvider?.availableModels || [];
  
  // 使用会话特定的模型或默认模型
  const currentModel = conversation?.model || apiConfig.model;
  
  // 找到当前模型的标签
  const currentModelLabel = availableModels.find(m => m.value === currentModel)?.label || currentModel;
  
  // 处理模型变更
  const handleModelChange = (modelValue: string) => {
    if (conversation) {
      updateConversation(conversationId, { model: modelValue });
    }
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        className="flex items-center space-x-1 px-3 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={availableModels.length === 0}
      >
        <span>{currentModelLabel}</span>
        <ChevronDownIcon />
      </button>
      
      {isOpen && availableModels.length > 0 && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
          <div className="py-1 max-h-64 overflow-y-auto">
            {availableModels.map(model => (
              <button
                key={model.value}
                className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-700 ${model.value === currentModel ? 'bg-gray-700' : ''}`}
                onClick={() => handleModelChange(model.value)}
              >
                {model.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 