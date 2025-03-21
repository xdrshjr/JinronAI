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
    const { messages, conversationId, apiConfig } = await request.json();

    // 使用apiConfig中的配置，如果为空则尝试从环境变量中获取
    const config = {
      ...apiConfig,
      apiKey: apiConfig.apiKey || getEnvApiKey(apiConfig.provider),
      apiUrl: apiConfig.apiUrl || getEnvApiUrl(apiConfig.provider)
    };

    if (!config.apiKey) {
      return NextResponse.json(
        { error: '请先配置API密钥，或在环境变量中设置相应的API密钥' },
        { status: 400 }
      );
    }

    // 根据apiConfig.provider选择不同的调用方式
    if (config.provider === 'qwen') {
      // 阿里千问API调用
      return handleQwenApiCall(messages, config);
    } else {
      // 默认OpenAI API调用
      return handleOpenAIApiCall(messages, config);
    }
  } catch (error: any) {
    console.error('聊天请求失败:', error);
    return NextResponse.json(
      { error: error.message || '请求失败' },
      { status: 500 }
    );
  }
}

// 处理OpenAI API调用
async function handleOpenAIApiCall(messages: any[], apiConfig: any) {
  console.log('开始处理OpenAI API调用, 使用模型:', apiConfig.model);

  const openai = new OpenAI({
    apiKey: apiConfig.apiKey,
    baseURL: apiConfig.apiUrl,
  });

  try {
    // 创建流式响应
    console.log('正在创建OpenAI流式响应...');
    const stream = await openai.chat.completions.create({
      model: apiConfig.model,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: apiConfig.temperature,
      max_tokens: apiConfig.maxTokens,
      stream: true,
    });
    console.log('OpenAI流创建成功');

    // 创建一个ReadableStream来处理OpenAI的流
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          // 迭代OpenAI的流
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              // 立即发送文本块
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (error) {
          console.error('处理OpenAI流时出错:', error);
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    console.log('OpenAI流处理ReadableStream创建成功，准备返回Response');
    
    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('处理OpenAI API调用失败:', error);
    throw error;
  }
}

// 处理阿里千问API调用
async function handleQwenApiCall(messages: any[], apiConfig: any) {
  try {
    console.log('开始处理千问API调用, 使用模型:', apiConfig.model);
    
    // 创建一个编码器
    const encoder = new TextEncoder();
    
    // 创建一个新的ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 尝试使用流式API
          console.log('尝试使用流式API请求...');
          
          // 准备请求数据 (使用真正的流式API)
          const streamRequestBody = {
            model: apiConfig.model,
            messages: messages.map((msg: any) => ({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content,
            })),
            parameters: {
              temperature: apiConfig.temperature,
              max_tokens: apiConfig.maxTokens,
              // 为deepseek-r1模型启用思考过程
              ...(apiConfig.model === 'deepseek-r1' ? { 
                return_reasoning: true // 使用正确的参数启用思考过程
              } : {})
            },
            // 启用流式响应
            stream: true,
          };
          
          console.log('千问API URL:', `${apiConfig.apiUrl}/chat/completions`);
          
          try {
            // 尝试流式请求
            const streamResponse = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.apiKey}`,
                'Accept': 'text/event-stream',
              },
              body: JSON.stringify(streamRequestBody),
            });
            
            console.log('千问API流式响应状态:', streamResponse.status, streamResponse.statusText);
            
            if (!streamResponse.ok) {
              throw new Error(`流式请求失败: ${streamResponse.status} ${streamResponse.statusText}`);
            }
            
            if (!streamResponse.body) {
              throw new Error('流式响应体为空');
            }
            
            // 使用node-fetch的流处理方式
            let buffer = '';
            let chunkCount = 0;
            const decoder = new TextDecoder();
            let reasoningBuffer = ''; // 用于累积思考过程
            let contentBuffer = '';   // 用于累积最终答案
            let isFirstReasoningChunk = true; // 用于标记是否是第一个思考过程块
            let isFirstContentChunk = true;   // 用于标记是否是第一个内容块
            let hasOutputReasoningHeader = false; // 新增：标记是否已输出思考过程头部
            
            // 设置事件处理器
            streamResponse.body!.on('data', (chunk: Buffer) => {
              chunkCount++;
              const text = decoder.decode(chunk, { stream: true });
              buffer += text;

              // 处理可能的多行SSE数据
              let lineEnd = buffer.indexOf('\n');
              while (lineEnd !== -1) {
                const line = buffer.slice(0, lineEnd).trim();
                buffer = buffer.slice(lineEnd + 1);
                
                if (line.startsWith('data:')) {
                  try {
                    // 去掉 "data: " 前缀并解析JSON
                    const jsonStr = line.slice(5).trim();
                    
                    // 特殊处理结束标记
                    if (jsonStr === '[DONE]') {
                      console.log('收到流结束标记: [DONE]');
                      
                      // 如果是deepseek-r1模型，且已经有累积的思考过程，但尚未发送内容
                      // 则添加一个清晰的分隔标记
                      if (apiConfig.model === 'deepseek-r1' && reasoningBuffer && !contentBuffer) {
                        controller.enqueue(encoder.encode("\n\n最终答案：\n"));
                      }
                      
                      continue;
                    }
                    
                    const data = JSON.parse(jsonStr);
                    
                    // 检查是否有思考过程字段（针对deepseek-r1模型）
                    if (apiConfig.model === 'deepseek-r1') {
                      // 提取content字段和思考过程字段
                      const content = data.choices?.[0]?.delta?.content || '';
                      
                      // 输出思考过程(如果存在)
                      if (data.choices?.[0]?.delta?.reasoning_content) {
                        const reasoning = data.choices[0].delta.reasoning_content;
                        reasoningBuffer += reasoning;
                        
                        // 如果是第一个思考过程块，添加一个前缀标记
                        if (isFirstReasoningChunk) {
                          // 使用单独一个完整的请求发送思考过程标记
                          // 这样前端可以立即识别并应用正确的样式
                          controller.enqueue(encoder.encode("思考过程：\n"));
                          // 确保完成一次完整的处理后，再发送实际内容
                          setTimeout(() => {
                            controller.enqueue(encoder.encode(reasoning));
                          }, 10);
                          isFirstReasoningChunk = false;
                          hasOutputReasoningHeader = true;
                        } else {
                          controller.enqueue(encoder.encode(reasoning));
                        }
                      }
                      
                      // 输出内容(如果存在)
                      if (content) {
                        // 如果之前有思考过程但没有输出分隔标记，先输出分隔标记
                        if (reasoningBuffer && !contentBuffer && isFirstContentChunk) {
                          controller.enqueue(encoder.encode("\n\n最终答案：\n"));
                          isFirstContentChunk = false;
                        } else if (isFirstContentChunk && !reasoningBuffer) {
                          // 如果是第一个内容块但没有思考过程，直接标记为非首个内容块
                          isFirstContentChunk = false;
                        }
                        
                        contentBuffer += content;
                        controller.enqueue(encoder.encode(content));
                      }
                    } else {
                      // 其他模型只处理content字段
                      const content = data.choices?.[0]?.delta?.content || '';
                      if (content) {
                        controller.enqueue(encoder.encode(content));
                      }
                    }
                  } catch (e) {
                    console.error('解析SSE数据失败:', e, line);
                  }
                }
                
                lineEnd = buffer.indexOf('\n');
              }
            });
            
            // 处理流结束
            await new Promise<void>((resolve, reject) => {
              streamResponse.body!.on('end', () => {
                console.log('千问API流读取完成，总计处理', chunkCount, '个数据块');
                
                // 处理buffer中剩余的内容
                if (buffer.trim()) {
                  console.log('处理剩余buffer:', buffer);
                  const line = buffer.trim();
                  if (line.startsWith('data:')) {
                    try {
                      const jsonStr = line.slice(5).trim();
                      if (jsonStr !== '[DONE]') {
                        const data = JSON.parse(jsonStr);
                        
                        // 检查是否有思考过程字段（针对deepseek-r1模型）
                        if (apiConfig.model === 'deepseek-r1') {
                          // 提取content字段和思考过程字段
                          const content = data.choices?.[0]?.delta?.content || '';
                          
                          // 输出思考过程(如果存在)
                          if (data.choices?.[0]?.delta?.reasoning_content) {
                            const reasoning = data.choices[0].delta.reasoning_content;
                            reasoningBuffer += reasoning;
                            
                            // 如果是第一个思考过程块，添加一个前缀标记
                            if (isFirstReasoningChunk) {
                              // 使用单独一个完整的请求发送思考过程标记
                              controller.enqueue(encoder.encode("思考过程：\n"));
                              // 确保完成一次完整的处理后，再发送实际内容
                              setTimeout(() => {
                                controller.enqueue(encoder.encode(reasoning));
                              }, 10);
                              isFirstReasoningChunk = false;
                              hasOutputReasoningHeader = true;
                            } else {
                              controller.enqueue(encoder.encode(reasoning));
                            }
                            
                            console.log(`发送剩余思考过程: "${reasoning.length > 20 ? reasoning.substring(0, 20) + '...' : reasoning}"`);
                          }
                          
                          // 输出内容(如果存在)
                          if (content) {
                            // 如果之前有思考过程但没有输出分隔标记，先输出分隔标记
                            if (reasoningBuffer && !contentBuffer && isFirstContentChunk) {
                              controller.enqueue(encoder.encode("\n\n最终答案：\n"));
                              isFirstContentChunk = false;
                            } else if (isFirstContentChunk && !reasoningBuffer) {
                              // 如果是第一个内容块但没有思考过程，直接标记为非首个内容块
                              isFirstContentChunk = false;
                            }
                            
                            contentBuffer += content;
                            console.log(`发送剩余内容: "${content.length > 20 ? content.substring(0, 20) + '...' : content}"`);
                            controller.enqueue(encoder.encode(content));
                          }
                        } else {
                          // 其他模型只处理content字段
                          const content = data.choices?.[0]?.delta?.content || '';
                          if (content) {
                            controller.enqueue(encoder.encode(content));
                          }
                        }
                      }
                    } catch (e) {
                      console.error('解析剩余SSE数据失败:', e);
                    }
                  }
                }
                
                console.log('千问API流处理完成，关闭控制器');
                controller.close();
                resolve();
              });
              
              streamResponse.body!.on('error', (err: Error) => {
                console.error('千问API流处理出错:', err);
                reject(err);
              });
            });
          } catch (streamError) {
            // 流式API失败，回退到非流式API
            console.error('流式API请求失败，回退到非流式API:', streamError);
            
            // 准备非流式请求数据
            const nonStreamRequestBody = {
              model: apiConfig.model,
              messages: messages.map((msg: any) => ({
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content,
              })),
              parameters: {
                temperature: apiConfig.temperature,
                max_tokens: apiConfig.maxTokens,
                // 为deepseek-r1模型启用思考过程
                ...(apiConfig.model === 'deepseek-r1' ? { 
                  return_reasoning: true // 使用正确的参数启用思考过程
                } : {})
              },
              // 禁用流式响应
              stream: false,
            };
            
            console.log('使用非流式API作为回退...');
            
            // 发送非流式请求
            const nonStreamResponse = await fetch(`${apiConfig.apiUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.apiKey}`,
              },
              body: JSON.stringify(nonStreamRequestBody),
            });
            
            console.log('千问API非流式响应状态:', nonStreamResponse.status);
            
            if (!nonStreamResponse.ok) {
              const errorText = await nonStreamResponse.text();
              throw new Error('非流式请求也失败了: ' + errorText);
            }
            
            // 解析完整响应
            const responseData = await nonStreamResponse.json() as {
              choices?: Array<{
                message?: {
                  content?: string;
                  reasoning_content?: string;
                };
              }>;
            };
            
            // 检查是否有思考过程和内容
            const responseText = responseData.choices?.[0]?.message?.content || '';
            const reasoningText = apiConfig.model === 'deepseek-r1' 
              ? (responseData.choices?.[0]?.message?.reasoning_content || '') 
              : '';
            
            // 每次发送的字符数
            const chunkSize = 8;
            
            // 如果有思考过程，先模拟流式输出思考过程
            if (reasoningText) {
              console.log('模拟流式输出思考过程，总共字符数:', reasoningText.length);
              
              // 添加思考过程前缀，单独发送确保前端能立即识别
              controller.enqueue(encoder.encode("思考过程：\n"));
              
              // 添加小延迟以确保前端完成一次完整的处理
              await new Promise(resolve => setTimeout(resolve, 50));
              
              // 拆分思考过程并模拟流式发送
              for (let i = 0; i < reasoningText.length; i += chunkSize) {
                const chunk = reasoningText.substring(i, i + chunkSize);
                controller.enqueue(encoder.encode(chunk));
                
                // 添加小延迟以模拟真实流式响应
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }
            
            // 如果既有思考过程又有内容，添加分隔标记
            if (reasoningText && responseText) {
              controller.enqueue(encoder.encode("\n\n最终答案：\n"));
              
              // 添加小延迟以确保前端完成一次完整的处理
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // 再模拟流式输出内容
            if (responseText) {
              console.log('模拟流式输出内容，总共字符数:', responseText.length);
              
              // 拆分文本并模拟流式发送
              for (let i = 0; i < responseText.length; i += chunkSize) {
                const chunk = responseText.substring(i, i + chunkSize);
                controller.enqueue(encoder.encode(chunk));
                
                // 添加小延迟以模拟真实流式响应
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }
            
            console.log('千问API模拟流式处理完成，关闭控制器');
            controller.close();
          }
        } catch (error) {
          console.error('千问API处理失败:', error);
          controller.error(error);
        }
      }
    });
    
    console.log('千问API流处理ReadableStream创建成功，准备返回Response');
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('千问API调用失败:', error);
    throw error;
  }
} 