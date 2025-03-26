import React, { useEffect, useState } from 'react';
import { useStore } from '@/store/store';
import { useTheme } from 'next-themes';
import { Button } from '../ui/Button';
import { cn } from '@/utils/cn';

// 导入静态SVG图标而不是动态的Heroicons
const SunIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="h-5 w-5"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" 
    />
  </svg>
);

const MoonIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="h-5 w-5"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 1.252-19.5" 
    />
  </svg>
);

const CogIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    fill="none" 
    viewBox="0 0 24 24" 
    strokeWidth={1.5} 
    stroke="currentColor" 
    className="h-5 w-5"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.432l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.432l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" 
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" 
    />
  </svg>
);

interface HeaderProps {
  className?: string;
  onOpenApiConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({ className, onOpenApiConfig }) => {
  const { theme, setTheme } = useTheme();
  const { 
    conversations, 
    currentConversationId,
    toggleMobileSidebar
  } = useStore();
  
  // 添加客户端状态以修复水合问题
  const [mounted, setMounted] = useState(false);

  // 客户端挂载后再显示图标
  useEffect(() => {
    setMounted(true);
  }, []);

  // 获取当前会话
  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );

  return (
    <header className={cn(
      "h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4",
      className
    )}>
      <div className="flex items-center">
        <button 
          className="md:hidden text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          onClick={toggleMobileSidebar}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="ml-2 text-xl font-semibold text-gray-900 dark:text-gray-100">
          {currentConversation ? currentConversation.title : 'ChatGPT UI'}
        </h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          {mounted ? (
            theme === 'dark' ? <SunIcon /> : <MoonIcon />
          ) : (
            // 渲染一个占位符以避免水合错误
            <span className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenApiConfig}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
        >
          <CogIcon />
        </Button>
      </div>
    </header>
  );
}; 