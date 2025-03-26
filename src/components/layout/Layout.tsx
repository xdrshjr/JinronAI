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
  const { isMobileSidebarOpen, toggleMobileSidebar } = useStore();
  
  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      {/* 桌面端侧边栏 - 只在md及以上设备显示 */}
      <div className="hidden md:block">
        <Sidebar className="flex" />
      </div>
      
      {/* 移动端侧边栏 - 仅在移动设备且isMobileSidebarOpen为true时显示 */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* 背景遮罩层 */}
          <div 
            className="fixed inset-0 bg-gray-900/80" 
            onClick={toggleMobileSidebar}
          />
          
          {/* 侧边栏内容 */}
          <div className="fixed inset-y-0 left-0 w-3/4 max-w-xs">
            <Sidebar className="h-full" />
          </div>
        </div>
      )}
      
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