import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import fetch from 'node-fetch';

// 从环境变量获取API配置
const getEnvApiKey = (provider: string): string => {
  if (provider === 'openai') {
    return process.env.OPENAI_API_KEY || '';
  } else if (provider === 'qwen') {
    return process.env.QWEN_API_KEY || '';
  }
  return '';
};

const getEnvApiUrl = (provider: string): string => {
  if (provider === 'openai') {
    return process.env.OPENAI_API_URL || 'https://api.openai.com/v1';
  } else if (provider === 'qwen') {
    return process.env.QWEN_API_URL || 'https://dashscope.aliyuncs.com/api/v1';
  }
  return provider === 'openai' ? 'https://api.openai.com/v1' : 'https://dashscope.aliyuncs.com/api/v1';
};

export async function POST(request: Request) {
  try {
    const { apiKey, apiUrl, model, provider } = await request.json();

    // 使用提供的配置，如果为空则尝试从环境变量中获取
    const key = apiKey || getEnvApiKey(provider);
    const url = apiUrl || getEnvApiUrl(provider);

    if (!key) {
      return NextResponse.json(
        { error: 'API密钥不能为空，请配置API密钥或在环境变量中设置相应的API密钥' },
        { status: 400 }
      );
    }

    // 根据provider类型执行不同的测试
    if (provider === 'qwen') {
      // 阿里千问测试连接逻辑
      try {
        const response = await fetch(`${url}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: model || 'qwen-turbo',
            messages: [
              {
                role: 'user',
                content: 'Hello'
              }
            ],
            max_tokens: 5,
            stream: false // 关闭流式请求
          })
        });

        if (!response.ok) {
          const error = await response.json() as { message?: string };
          throw new Error(error.message || '连接失败');
        }
        
        // 验证响应格式
        const responseData = await response.json() as { choices?: Array<any> };
        if (!responseData.choices || !responseData.choices.length) {
          throw new Error('返回数据格式不正确');
        }
        
        return NextResponse.json({ success: true });
      } catch (error: any) {
        console.error('阿里千问API测试失败:', error);
        return NextResponse.json(
          { error: error.message || '连接失败' },
          { status: 500 }
        );
      }
    } else {
      // OpenAI测试连接逻辑
      const openai = new OpenAI({
        apiKey: key,
        baseURL: url,
      });

      // 发送一个简单的测试请求
      await openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
        max_tokens: 5,
      });

      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error('API测试失败:', error);
    return NextResponse.json(
      { error: error.message || '连接失败' },
      { status: 500 }
    );
  }
} 