'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/store/store';
import { formatRelativeTime } from '@/utils/helpers';
import { Conversation, Folder } from '@/types';
import { cn } from '@/utils/cn';

// 使用内联SVG替代Heroicons
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

// 添加任务图标
const TaskIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
  </svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const ChatBubbleLeftRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
  </svg>
);

const Bars3Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);

const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const ClearIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
  </svg>
);

const ClearAllIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { 
    conversations, 
    folders, 
    currentConversationId,
    createConversation,
    setCurrentConversationId,
    deleteConversation,
    createFolder,
    updateFolder,
    deleteFolder,
    openTaskSelector
  } = useStore();
  
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 处理创建对话
  const handleNewChat = () => {
    createConversation('对话');
  };
  
  // 处理打开任务选择器
  const handleOpenTaskSelector = () => {
    openTaskSelector();
  };
  
  // 切换文件夹展开/折叠状态
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };
  
  // 开始创建文件夹
  const startCreatingFolder = () => {
    setIsCreatingFolder(true);
    setNewFolderName('');
  };
  
  // 完成创建文件夹
  const finishCreatingFolder = () => {
    if (newFolderName.trim()) {
      const folderId = createFolder(newFolderName.trim());
      setExpandedFolders(prev => ({
        ...prev,
        [folderId]: true
      }));
    }
    setIsCreatingFolder(false);
  };
  
  // 开始编辑文件夹
  const startEditingFolder = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };
  
  // 完成编辑文件夹
  const finishEditingFolder = () => {
    if (editingFolderId && editingFolderName.trim()) {
      updateFolder(editingFolderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
  };
  
  // 删除文件夹确认
  const confirmDeleteFolder = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除此文件夹吗？')) {
      deleteFolder(folderId);
    }
  };
  
  // 获取未归类的对话
  const unorganizedConversations = conversations.filter(conv => !conv.folderId);
  
  // 获取每个文件夹中的对话
  const getConversationsInFolder = (folderId: string) => {
    return conversations.filter(conv => conv.folderId === folderId);
  };
  
  // 清除所有对话
  const clearAllConversations = () => {
    if (window.confirm('确定要清除所有对话吗？此操作不可恢复。')) {
      conversations.forEach(conv => deleteConversation(conv.id));
    }
  };
  
  return (
    <aside className={cn(
      "flex flex-col bg-gray-900 text-gray-100 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64",
      className
    )}>
      {/* 顶部横栏 */}
      <div className="h-16 border-b border-gray-700 flex items-center justify-between px-4 bg-gray-900">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => isCollapsed && setIsCollapsed(false)}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <ChatBubbleLeftRightIcon />
          </div>
          {!isCollapsed && <span className="text-lg font-semibold">JR-AI</span>}
        </div>
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <XMarkIcon />
          </Button>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
        {/* 顶部任务和对话按钮 - 两行布局 */}
        <div className="flex flex-col gap-2 mb-4">
          {/* 第一行按钮 - 任务按钮独占一行 */}
          <Button
            onClick={handleOpenTaskSelector}
            className={cn(
              "w-full bg-blue-800 hover:bg-blue-700 border border-blue-700",
              isCollapsed ? "px-2" : ""
            )}
            leftIcon={<TaskIcon />}
          >
            {!isCollapsed && "任务"}
          </Button>
          
          {/* 第二行按钮 - 对话和清空各占一半 */}
          <div className="flex gap-2">
            <Button
              onClick={handleNewChat}
              className={cn(
                "flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700",
                isCollapsed ? "px-2" : ""
              )}
              leftIcon={<PlusIcon />}
            >
              {!isCollapsed && "对话"}
            </Button>
            
            {!isCollapsed && (
              <Button
                onClick={clearAllConversations}
                className="flex-1 bg-red-900/30 hover:bg-red-900/50 border border-red-900/50 text-red-300"
                leftIcon={<ClearAllIcon />}
              >
                清空
              </Button>
            )}
          </div>
        </div>
        
        <div className="space-y-1 mb-4">
          <div className="flex justify-between items-center px-2 py-1">
            {!isCollapsed && <h2 className="text-xs uppercase font-semibold text-gray-400">对话</h2>}
            {!isCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={startCreatingFolder}
                className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md"
              >
                <FolderIcon />
              </Button>
            )}
          </div>
          
          {/* 新建文件夹输入框 */}
          {isCreatingFolder && !isCollapsed && (
            <div className="flex items-center px-2 py-1">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="文件夹名称"
                className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishCreatingFolder();
                  if (e.key === 'Escape') setIsCreatingFolder(false);
                }}
                onBlur={finishCreatingFolder}
              />
            </div>
          )}
          
          {/* 文件夹列表 */}
          {folders.map(folder => (
            <div key={folder.id} className="space-y-1">
              <div 
                className="flex items-center px-2 py-1 hover:bg-gray-800 rounded-md cursor-pointer"
                onClick={() => toggleFolder(folder.id)}
              >
                {expandedFolders[folder.id] ? (
                  <ChevronDownIcon />
                ) : (
                  <ChevronRightIcon />
                )}
                
                {!isCollapsed && (
                  <>
                    {editingFolderId === folder.id ? (
                      <input
                        type="text"
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') finishEditingFolder();
                          if (e.key === 'Escape') setEditingFolderId(null);
                        }}
                        onBlur={finishEditingFolder}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="flex-1 truncate">{folder.name}</span>
                    )}
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => startEditingFolder(folder, e)}
                        className="p-1 hover:bg-gray-700 rounded-md"
                      >
                        <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => confirmDeleteFolder(folder.id, e)}
                        className="p-1 hover:bg-gray-700 rounded-md"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {/* 文件夹内的对话 */}
              {expandedFolders[folder.id] && !isCollapsed && (
                <div className="pl-6 space-y-1">
                  {getConversationsInFolder(folder.id).map(conversation => (
                    <ConversationItem 
                      key={conversation.id}
                      conversation={conversation} 
                      isActive={conversation.id === currentConversationId}
                      onClick={() => setCurrentConversationId(conversation.id)}
                      onDelete={(e) => {
                        e.stopPropagation();
                        if (window.confirm('确定要删除此对话吗？')) {
                          deleteConversation(conversation.id);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* 未分类对话 */}
          {!isCollapsed && (
            <div className="mt-4">
              <h3 className="text-xs uppercase font-semibold text-gray-400 px-2 py-1">
                最近任务
              </h3>
              <div className="space-y-1 mt-1">
                {unorganizedConversations.map(conversation => (
                  <ConversationItem 
                    key={conversation.id}
                    conversation={conversation} 
                    isActive={conversation.id === currentConversationId}
                    onClick={() => setCurrentConversationId(conversation.id)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      if (window.confirm('确定要删除此对话吗？')) {
                        deleteConversation(conversation.id);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 底部应用下载按钮 */}
      <div className={cn(
        "mt-auto border-t border-gray-700 bg-gray-800",
        isCollapsed ? "p-2" : "p-4"
      )}>
        <Button
          variant="outline"
          className="w-full justify-center bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200"
          leftIcon={<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>}
        >
          {!isCollapsed && "下载应用"}
        </Button>
      </div>
    </aside>
  );
};

// 对话项组件
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ 
  conversation, 
  isActive, 
  onClick, 
  onDelete 
}) => {
  return (
    <div
      className={cn(
        "flex items-center px-2 py-1.5 rounded-md cursor-pointer group",
        isActive ? "bg-gray-800 border border-gray-700" : "hover:bg-gray-800"
      )}
      onClick={onClick}
    >
      <ChatBubbleLeftRightIcon />
      <span className="flex-1 truncate text-sm">{conversation.title}</span>
      <button
        onClick={onDelete}
        className="p-1 hover:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <TrashIcon />
      </button>
    </div>
  );
}; 