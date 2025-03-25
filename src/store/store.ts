import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Conversation, Message, Folder, ApiConfig, ApiProvider, TaskType } from '@/types';
import { generateId } from '@/utils/helpers';
import { getTaskByType } from '@/utils/taskConfig';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  folders: Folder[];
  apiConfig: ApiConfig;
  apiProviders: ApiProvider[];
  currentApiProviderId: string | null;
  isLoadingResponse: boolean;
  isTaskSelectorOpen: boolean;
  currentComponent: string | null;
  
  // 会话管理
  getConversation: (id: string) => Conversation | undefined;
  createConversation: (title: string, taskType?: TaskType) => string;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  setCurrentConversationId: (id: string | null) => void;
  clearConversationContext: (id?: string) => void;
  clearContextKeepHistory: (id?: string) => void;
  
  // 文件夹管理
  createFolder: (name: string) => string;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  
  // 消息管理
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'createdAt'>) => void;
  updateMessage: (conversationId: string, messageId: string, content: string) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  
  // API配置
  updateApiConfig: (config: Partial<ApiConfig>) => void;
  
  // API提供商管理
  addApiProvider: (provider: ApiProvider) => void;
  updateApiProvider: (id: string, updates: Partial<ApiProvider>) => void;
  deleteApiProvider: (id: string) => void;
  setCurrentApiProviderId: (id: string | null) => void;
  getCurrentApiProvider: () => ApiProvider | undefined;
  
  // 任务管理
  openTaskSelector: () => void;
  closeTaskSelector: () => void;
  
  // 加载状态
  setIsLoadingResponse: (isLoading: boolean) => void;
  
  // 组件导航
  setCurrentComponent: (componentName: string | null) => void;
}

// 默认OpenAI模型选项
const openaiModelOptions = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o-mini' },
];

// 默认阿里千问模型选项
const qwenModelOptions = [
  { value: 'qwen-max', label: 'Qwen-Max' },
  { value: 'qwen-turbo', label: 'Qwen-Turbo' },
  { value: 'deepseek-r1', label: 'DeepSeek-R1' },
];

// 从环境变量读取API配置
const getEnvApiKey = (provider: string): string => {
  if (provider === 'openai') {
    return process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  } else if (provider === 'qwen') {
    return process.env.NEXT_PUBLIC_QWEN_API_KEY || '';
  }
  return '';
};

const getEnvApiUrl = (provider: string): string => {
  if (provider === 'openai') {
    return process.env.NEXT_PUBLIC_OPENAI_API_URL || 'https://api.openai.com/v1';
  } else if (provider === 'qwen') {
    return process.env.NEXT_PUBLIC_QWEN_API_URL || 'https://dashscope.aliyuncs.com/api/v1';
  }
  return provider === 'openai' ? 'https://api.openai.com/v1' : 'https://dashscope.aliyuncs.com/api/v1';
};

// 获取默认提供商
const getDefaultProvider = (): string => {
  const defaultProvider = process.env.NEXT_PUBLIC_DEFAULT_API_PROVIDER;
  return defaultProvider === 'qwen' ? 'qwen' : 'openai';
};

// 默认API配置
const defaultProvider = getDefaultProvider();
const defaultApiConfig: ApiConfig = {
  apiKey: getEnvApiKey(defaultProvider),
  apiUrl: getEnvApiUrl(defaultProvider),
  model: defaultProvider === 'openai' ? 'gpt-4o-mini' : 'qwen-max',
  temperature: 0.7,
  maxTokens: 2000,
  provider: defaultProvider,
};

// 默认API提供商
const defaultApiProviders: ApiProvider[] = [
  {
    id: 'openai-default',
    name: 'OpenAI',
    provider: 'openai',
    apiKey: getEnvApiKey('openai'),
    apiUrl: getEnvApiUrl('openai'),
    availableModels: openaiModelOptions,
  },
  {
    id: 'qwen-default',
    name: '阿里千问',
    provider: 'qwen',
    apiKey: getEnvApiKey('qwen'),
    apiUrl: getEnvApiUrl('qwen'),
    availableModels: qwenModelOptions,
  }
];

export const useStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversationId: null,
      folders: [],
      apiConfig: defaultApiConfig,
      apiProviders: defaultApiProviders,
      currentApiProviderId: 'openai-default',
      isLoadingResponse: false,
      isTaskSelectorOpen: false,
      currentComponent: null,
      
      // 会话管理
      getConversation: (id) => get().conversations.find(c => c.id === id),
      
      createConversation: (title, taskType) => {
        const id = generateId();
        const now = Date.now();
        
        // 确定模型
        let model = get().apiConfig.model;
        if (taskType) {
          const taskInfo = getTaskByType(taskType);
          if (taskInfo?.defaultModel) {
            model = taskInfo.defaultModel;
          }
        }
        
        // 创建欢迎消息
        const welcomeMessage: Message = {
          id: generateId(),
          content: "你好，有什么可以帮到你的吗？",
          role: 'assistant',
          timestamp: now
        };
        
        // 创建会话对象
        const newConversation: Conversation = {
          id,
          title,
          messages: [welcomeMessage],
          taskType,
          model,
          createdAt: now,
          updatedAt: now
        };
        
        set(state => ({
          conversations: [newConversation, ...state.conversations],
          currentConversationId: id,
          isTaskSelectorOpen: false
        }));
        
        return id;
      },
      
      updateConversation: (id, updates) => {
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv.id === id 
              ? { ...conv, ...updates, updatedAt: Date.now() }
              : conv
          )
        }));
      },
      
      deleteConversation: (id) => {
        set(state => ({
          conversations: state.conversations.filter(c => c.id !== id),
          currentConversationId: state.currentConversationId === id ? null : state.currentConversationId
        }));
      },
      
      setCurrentConversationId: (id) => {
        set({ currentConversationId: id });
      },
      
      // 文件夹管理
      createFolder: (name) => {
        const id = generateId();
        const now = Date.now();
        
        set(state => ({
          folders: [
            ...state.folders,
            {
              id,
              name,
              isExpanded: true,
              createdAt: now,
              updatedAt: now
            }
          ]
        }));
        
        return id;
      },
      
      updateFolder: (id, name) => {
        set(state => ({
          folders: state.folders.map(folder => 
            folder.id === id 
              ? { ...folder, name, updatedAt: Date.now() }
              : folder
          )
        }));
      },
      
      deleteFolder: (id) => {
        // 移除文件夹中的所有会话的文件夹关联
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv.folderId === id 
              ? { ...conv, folderId: undefined }
              : conv
          ),
          folders: state.folders.filter(f => f.id !== id)
        }));
      },
      
      // 消息管理
      addMessage: (conversationId, message) => {
        const newMessage: Message = {
          id: generateId(),
          content: message.content,
          role: message.role,
          timestamp: Date.now()
        };
        
        const state = get();
        const conversation = state.conversations.find(c => c.id === conversationId);
        
        // 如果是用户的第一条消息，使用其内容作为会话标题（截取前20个字符）
        let titleUpdates = {};
        if (conversation && 
            message.role === 'user' && 
            conversation.messages.filter(msg => msg.role === 'user').length === 0) {
          const title = message.content.length > 20 
            ? `${message.content.substring(0, 20)}...` 
            : message.content;
          titleUpdates = { title };
        }
        
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv.id === conversationId
              ? {
                  ...conv,
                  ...titleUpdates,
                  messages: [...conv.messages, newMessage],
                  updatedAt: Date.now()
                }
              : conv
          )
        }));
      },
      
      updateMessage: (conversationId, messageId, content) => {
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.map(msg => 
                    msg.id === messageId
                      ? { ...msg, content }
                      : msg
                  ),
                  updatedAt: Date.now()
                }
              : conv
          )
        }));
      },
      
      deleteMessage: (conversationId, messageId) => {
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv.id === conversationId
              ? {
                  ...conv,
                  messages: conv.messages.filter(msg => msg.id !== messageId),
                  updatedAt: Date.now()
                }
              : conv
          )
        }));
      },
      
      // 清除对话上下文，保留对话标题但清空所有消息
      clearConversationContext: (id) => {
        const targetId = id || get().currentConversationId;
        if (!targetId) return;
        
        const now = Date.now();
        
        // 创建欢迎消息
        const welcomeMessage: Message = {
          id: generateId(),
          content: "已清除历史对话，有什么可以帮到你的吗？",
          role: 'assistant',
          timestamp: now
        };
        
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv.id === targetId
              ? {
                  ...conv,
                  messages: [welcomeMessage],
                  updatedAt: now
                }
              : conv
          )
        }));
      },
      
      // 清除上下文但保留历史聊天记录
      clearContextKeepHistory: (id) => {
        const targetId = id || get().currentConversationId;
        if (!targetId) return;
        
        const now = Date.now();
        const state = get();
        const conversation = state.conversations.find(c => c.id === targetId);
        
        if (!conversation) return;
        
        // 不使用常规消息形式，而是设置一个特殊的系统提示标记
        set(state => ({
          conversations: state.conversations.map(conv => 
            conv.id === targetId
              ? {
                  ...conv,
                  // 不再添加新消息，而是设置系统通知标记
                  contextCleared: true,
                  systemNotification: "上下文已清除，历史记录已保留。机器人将不再记住之前的对话内容。",
                  updatedAt: now
                }
              : conv
          )
        }));
      },
      
      // API提供商管理
      addApiProvider: (provider) => {
        set(state => ({
          apiProviders: [...state.apiProviders, provider]
        }));
      },
      
      updateApiProvider: (id, updates) => {
        set(state => ({
          apiProviders: state.apiProviders.map(provider => 
            provider.id === id ? { ...provider, ...updates } : provider
          )
        }));
        
        // 如果更新的是当前API提供商，同时更新apiConfig
        const currentState = get();
        if (id === currentState.currentApiProviderId) {
          const updatedProvider = currentState.apiProviders.find(p => p.id === id);
          if (updatedProvider) {
            set({
              apiConfig: {
                ...currentState.apiConfig,
                apiKey: updates.apiKey ?? updatedProvider.apiKey,
                apiUrl: updates.apiUrl ?? updatedProvider.apiUrl,
                provider: updates.provider ?? updatedProvider.provider,
              }
            });
          }
        }
      },
      
      deleteApiProvider: (id) => {
        // 不允许删除最后一个API提供商
        const { apiProviders, currentApiProviderId } = get();
        if (apiProviders.length <= 1) return;
        
        set(state => ({
          apiProviders: state.apiProviders.filter(p => p.id !== id),
          // 如果删除的是当前选中的提供商，则选择第一个可用的提供商
          currentApiProviderId: id === state.currentApiProviderId 
            ? state.apiProviders.filter(p => p.id !== id)[0]?.id || null
            : state.currentApiProviderId
        }));
      },
      
      setCurrentApiProviderId: (id) => {
        const provider = get().apiProviders.find(p => p.id === id);
        if (!provider) return;
        
        set(state => ({
          currentApiProviderId: id,
          apiConfig: {
            ...state.apiConfig,
            apiKey: provider.apiKey,
            apiUrl: provider.apiUrl,
            provider: provider.provider,
            // 如果当前所选模型不在新提供商的可用模型列表中，则使用第一个可用模型
            model: provider.availableModels.some(m => m.value === state.apiConfig.model)
              ? state.apiConfig.model
              : provider.availableModels[0]?.value || state.apiConfig.model
          }
        }));
      },
      
      getCurrentApiProvider: () => {
        const { apiProviders, currentApiProviderId } = get();
        return apiProviders.find(p => p.id === currentApiProviderId);
      },
      
      updateApiConfig: (config) => {
        set(state => ({
          apiConfig: { ...state.apiConfig, ...config }
        }));
        
        // 同步更新当前API提供商的配置
        const { currentApiProviderId } = get();
        if (currentApiProviderId && (config.apiKey || config.apiUrl)) {
          set(state => ({
            apiProviders: state.apiProviders.map(provider => 
              provider.id === currentApiProviderId 
                ? { 
                    ...provider, 
                    apiKey: config.apiKey ?? provider.apiKey,
                    apiUrl: config.apiUrl ?? provider.apiUrl
                  } 
                : provider
            )
          }));
        }
      },
      
      // 任务管理
      openTaskSelector: () => set({ isTaskSelectorOpen: true }),
      closeTaskSelector: () => set({ isTaskSelectorOpen: false }),
      
      // 加载状态
      setIsLoadingResponse: (isLoading) => {
        set({ isLoadingResponse: isLoading });
      },
      
      // 设置当前组件
      setCurrentComponent: (componentName) => {
        set({ currentComponent: componentName });
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        conversations: state.conversations,
        folders: state.folders,
        apiConfig: state.apiConfig,
        apiProviders: state.apiProviders,
        currentApiProviderId: state.currentApiProviderId,
      }),
    }
  )
); 