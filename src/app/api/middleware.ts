import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 调试函数，输出详细信息
function debugLog(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] MIDDLEWARE: ${message}`);
  if (data !== undefined) {
    try {
      if (typeof data === 'object') {
        console.log(JSON.stringify(data, null, 2));
      } else {
        console.log(data);
      }
    } catch (e) {
      console.log('无法序列化数据:', typeof data);
    }
  }
}

// 这个中间件将处理所有API请求的跨域问题
export function middleware(request: NextRequest) {
  // 获取请求的路径
  const path = request.nextUrl.pathname;
  
  // 只处理API路由请求
  if (!path.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // 记录请求详情
  const requestHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    requestHeaders[key] = value;
  });
  
  debugLog('收到API请求', {
    path,
    method: request.method,
    url: request.url,
    headers: requestHeaders
  });
  
  // 处理OPTIONS预检请求
  if (request.method === 'OPTIONS') {
    debugLog('处理OPTIONS预检请求');
    
    const response = new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*', // 或者指定域名
        'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
        'Access-Control-Max-Age': '86400', // 24小时内不再发送预检请求
      },
    });
    
    debugLog('返回OPTIONS响应', {
      status: 204,
      headers: Object.fromEntries([...response.headers.entries()])
    });
    
    return response;
  }
  
  // 对于其他请求，添加CORS头部然后继续处理
  const response = NextResponse.next();
  
  // 添加CORS头部
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', '*'); // 或者指定域名
  response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  debugLog('继续处理API请求', {
    path,
    headers: Object.fromEntries([...response.headers.entries()])
  });
  
  return response;
}

// 配置需要应用此中间件的路径
export const config = {
  matcher: '/api/:path*',
}; 