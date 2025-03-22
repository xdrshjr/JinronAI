declare namespace NodeJS {
  interface ProcessEnv {
    // 客户端环境变量
    NEXT_PUBLIC_OPENAI_API_KEY?: string;
    NEXT_PUBLIC_OPENAI_API_URL?: string;
    NEXT_PUBLIC_QWEN_API_KEY?: string;
    NEXT_PUBLIC_QWEN_API_URL?: string;
    NEXT_PUBLIC_DEFAULT_API_PROVIDER?: string;
    
    // 服务器端环境变量
    OPENAI_API_KEY?: string;
    OPENAI_API_URL?: string;
    QWEN_API_KEY?: string;
    QWEN_API_URL?: string;
  }
} 