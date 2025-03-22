import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// 从环境变量获取API配置
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
    return process.env.NEXT_PUBLIC_QWEN_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
  }
  return '';
};

export async function POST(request: Request) {
  try {
    const { text, targetLang, provider = 'qwen', model = 'qwen-max' } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: '文本内容不能为空' },
        { status: 400 }
      );
    }

    // 获取API配置
    const apiKey = getEnvApiKey(provider);
    const apiUrl = getEnvApiUrl(provider);

    if (!apiKey) {
      return NextResponse.json(
        { error: '请先配置API密钥，或在环境变量中设置相应的API密钥' },
        { status: 400 }
      );
    }

    // 构建提示信息
    let prompt = '';
    if (targetLang === 'zh') {
      prompt = `请将以下英文文本翻译成中文，保持学术风格:\n\n${text}`;
    } else if (targetLang === 'en') {
      prompt = `请将以下中文文本翻译成英文，保持学术风格:\n\n${text}`;
    } else {
      return NextResponse.json(
        { error: '不支持的目标语言' },
        { status: 400 }
      );
    }

    // 根据provider选择不同的API调用方式
    if (provider === 'qwen') {
      // 阿里千问API调用
      const requestBody = {
        model: model || 'qwen-max',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        parameters: {
          temperature: 0.1,  // 低温度以保持翻译的准确性
          max_tokens: 4000
        }
      };

      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`千问API请求失败: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      const translation = responseData.choices?.[0]?.message?.content || '';

      return NextResponse.json({ translation });
    } else {
      // 默认使用OpenAI API
      const openai = new OpenAI({
        apiKey,
        baseURL: apiUrl
      });

      const completion = await openai.chat.completions.create({
        model: model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,  // 低温度以保持翻译的准确性
        max_tokens: 2000
      });

      const translation = completion.choices[0]?.message?.content || '';

      return NextResponse.json({ translation });
    }
  } catch (error: any) {
    console.error('翻译请求失败:', error);
    return NextResponse.json(
      { error: error.message || '翻译请求失败' },
      { status: 500 }
    );
  }
} 