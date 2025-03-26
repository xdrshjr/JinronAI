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
      "h-auto bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2",
      className
    )}>
      <div className="flex flex-wrap items-center gap-2 max-w-4xl w-full mx-auto">
        <div className="w-full md:w-auto">
          <ConversationSelector />
        </div>
        
        {currentConversationId && (
          <>
            <div className="w-auto">
              <ApiProviderSelector />
            </div>
            <div className="w-auto">
              <ModelSelector conversationId={currentConversationId} />
            </div>
            <div className="w-auto">
              <TemperatureSelector conversationId={currentConversationId} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}; 