export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// 任务类型枚举
export type TaskType = 
  | 'normal_chat'     // 普通对话任务
  | 'thinking'        // 思考任务
  | 'paper_innovation' // 论文创新点探索
  | 'paper_outline'   // 论文大纲生成任务
  | string;           // 支持自定义任务类型

// 任务类别枚举
export type TaskCategory = 
  | 'general'         // 通用类别
  | 'paper_assistant' // 论文辅助写作类别
  | string;           // 支持自定义类别

// 任务详情接口
export interface TaskInfo {
  type: TaskType;
  category: TaskCategory;
  name: string;        // 任务显示名称
  description: string; // 任务描述
  defaultModel?: string; // 默认模型
  icon?: string;       // 任务图标
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  folderId?: string;
  model?: string;
  temperature?: number;
  contextCleared?: boolean;
  systemNotification?: string;
  taskType?: TaskType;  // 添加任务类型
  createdAt: number;
  updatedAt: number;
}

export interface Folder {
  id: string;
  name: string;
  isExpanded: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ApiConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  provider: 'openai' | 'qwen' | string;
}

export interface ApiProvider {
  id: string;
  name: string;
  provider: 'openai' | 'qwen' | string;
  apiKey: string;
  apiUrl: string;
  availableModels: Array<{value: string, label: string}>;
}

export interface ChatCompletionRequest {
  model: string;
  messages: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Theme {
  name: 'light' | 'dark';
  label: string;
}

export interface Language {
  code: string;
  name: string;
}

export interface Store {
  conversations: Conversation[];
  folders: Folder[];
  apiConfig: ApiConfig;
  currentConversationId: string | null;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  addFolder: (folder: Folder) => void;
  updateFolder: (id: string, updates: Partial<Folder>) => void;
  deleteFolder: (id: string) => void;
  setCurrentConversation: (id: string | null) => void;
  updateApiConfig: (config: ApiConfig) => void;
} 