'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/store';
import { CATEGORY_LABELS, getTasksByCategory, getAllCategories } from '@/utils/taskConfig';
import { TaskIcon } from '@/components/ui/TaskIcon';
import { cn } from '@/utils/cn';
import { TaskType, TaskInfo } from '@/types';

export const TaskSelector: React.FC = () => {
  const { isTaskSelectorOpen, closeTaskSelector, createConversation } = useStore();
  const [activeCategory, setActiveCategory] = useState<string>('general');
  
  const tasksByCategory = getTasksByCategory();
  const allCategories = getAllCategories();
  
  // 如果选择器未打开，则不渲染
  if (!isTaskSelectorOpen) {
    return null;
  }
  
  const handleTaskSelect = (task: TaskInfo) => {
    createConversation(task.name, task.type as TaskType);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold">选择任务类型</h2>
          <button 
            onClick={closeTaskSelector}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* 类别选择器 */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto">
            {allCategories.map(category => (
              <button
                key={category}
                className={cn(
                  "px-4 py-2 whitespace-nowrap font-medium text-sm",
                  activeCategory === category 
                    ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" 
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                )}
                onClick={() => setActiveCategory(category)}
              >
                {CATEGORY_LABELS[category] || category}
              </button>
            ))}
          </div>
        </div>
        
        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tasksByCategory[activeCategory] || []).map(task => (
            <button
              key={task.type}
              className="flex items-start p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
              onClick={() => handleTaskSelect(task)}
            >
              <div className="mr-4 mt-1 bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
                <TaskIcon iconName={task.icon} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">{task.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                {task.defaultModel && (
                  <span className="inline-block mt-2 text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                    默认模型: {task.defaultModel}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 