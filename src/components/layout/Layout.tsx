import React from 'react';
import { Sidebar } from './Sidebar';
import { ApiConfigPanel } from '../chat/ApiConfigPanel';
import { useStore } from '@/store/store';
import { Header } from './Header';
import { SubHeader } from './SubHeader';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isApiConfigOpen, setIsApiConfigOpen] = React.useState(false);
  
  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      {/* 侧边栏 */}
      <Sidebar className="hidden md:flex" />
      
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部导航栏 */}
        <Header onOpenApiConfig={() => setIsApiConfigOpen(true)} />
        
        {/* 子导航栏 - 会话选择、模型选择等 */}
        <SubHeader />
        
        {/* 主要内容 */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      
      {/* API配置面板 */}
      <ApiConfigPanel
        isOpen={isApiConfigOpen}
        onClose={() => setIsApiConfigOpen(false)}
      />
    </div>
  );
}; 