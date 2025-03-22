import { TaskInfo } from '@/types';

// 所有可用任务配置
export const TASKS: TaskInfo[] = [
  {
    type: 'normal_chat',
    category: 'general',
    name: '普通对话任务',
    description: '与AI进行一般性的对话交流',
    icon: 'chat'
  },
  {
    type: 'thinking',
    category: 'general',
    name: '思考任务',
    description: '使用深度思考模型进行推理和分析',
    defaultModel: 'deepseek-r1',
    icon: 'brain'
  },
  {
    type: 'paper_innovation',
    category: 'paper_assistant',
    name: '论文创新点探索',
    description: '探索研究领域的创新点和研究方向',
    icon: 'lightbulb'
  },
  {
    type: 'paper_outline',
    category: 'paper_assistant',
    name: '论文大纲生成任务',
    description: '生成论文的结构大纲',
    icon: 'document'
  },
  {
    type: 'paper_search',
    category: 'paper_assistant',
    name: '相关论文查询',
    description: '根据关键词检索和查看相关论文',
    icon: 'search'
  }
];

// 获取按类别分组的任务
export const getTasksByCategory = () => {
  const tasksByCategory: Record<string, TaskInfo[]> = {};
  
  TASKS.forEach(task => {
    if (!tasksByCategory[task.category]) {
      tasksByCategory[task.category] = [];
    }
    tasksByCategory[task.category].push(task);
  });
  
  return tasksByCategory;
};

// 获取任务类别名称映射
export const CATEGORY_LABELS: Record<string, string> = {
  'general': '通用类别',
  'paper_assistant': '论文辅助写作类别'
};

// 通过任务类型获取任务信息
export const getTaskByType = (type: string): TaskInfo | undefined => {
  return TASKS.find(task => task.type === type);
};

// 获取所有任务类别
export const getAllCategories = (): string[] => {
  return [...new Set(TASKS.map(task => task.category))];
}; 