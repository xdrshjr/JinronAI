import React, { useState } from 'react';
import { useStore } from '@/store/store';

// 内联SVG图标
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

interface ApiProviderSelectorProps {
  className?: string;
}

export const ApiProviderSelector: React.FC<ApiProviderSelectorProps> = ({ className }) => {
  const { 
    apiProviders, 
    currentApiProviderId, 
    setCurrentApiProviderId 
  } = useStore();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // 获取当前API提供商
  const currentProvider = apiProviders.find(p => p.id === currentApiProviderId);
  
  // 处理API提供商变更
  const handleProviderChange = (providerId: string) => {
    setCurrentApiProviderId(providerId);
    setIsOpen(false);
  };
  
  if (!currentProvider) return null;
  
  return (
    <div className={`relative ${className || ''}`}>
      <button
        className="flex items-center space-x-1 px-3 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700 text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>API: {currentProvider.name}</span>
        <ChevronDownIcon />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
          <div className="py-1 max-h-64 overflow-y-auto">
            {apiProviders.map(provider => (
              <button
                key={provider.id}
                className={`flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-700 ${provider.id === currentApiProviderId ? 'bg-gray-700' : ''}`}
                onClick={() => handleProviderChange(provider.id)}
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 