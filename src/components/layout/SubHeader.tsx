import React from 'react';
import { useStore } from '@/store/store';
import { cn } from '@/utils/cn';
import { ModelSelector } from '../chat/ModelSelector';
import { TemperatureSelector } from '../chat/TemperatureSelector';
import { ConversationSelector } from '../chat/ConversationSelector';
import { ApiProviderSelector } from '../chat/ApiProviderSelector';

interface SubHeaderProps {
  className?: string;
}

export const SubHeader: React.FC<SubHeaderProps> = ({ className }) => {
  const { 
    conversations, 
    currentConversationId
  } = useStore();

  return (
    <div className={cn(
      "h-12 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center px-4",
      className
    )}>
      <div className="flex items-center space-x-4 max-w-4xl w-full">
        <ConversationSelector />
        
        {currentConversationId && (
          <>
            <ApiProviderSelector />
            <ModelSelector conversationId={currentConversationId} />
            <TemperatureSelector conversationId={currentConversationId} />
          </>
        )}
      </div>
    </div>
  );
}; 