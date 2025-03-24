# ChatGPT UI

An advanced chat interface for AI models built with Next.js, featuring multiple specialized task types and a modern user experience.

<img src="public/screenshot.png" alt="ChatGPT UI" width="70%" />

## Features

- **Multiple Task Types**
  - General conversation mode
  - Deep thinking mode (powered by deepseek-r1)
  - Paper innovation exploration
  - Paper outline generation
  
- **Modern User Interface**
  - Clean and responsive design with dark/light mode
  - Code highlighting for programming languages
  - Markdown support for rich text formatting
  
- **Conversation Management**
  - Create and manage multiple conversations
  - Automatic conversation titling based on context
  
- **Advanced Capabilities**
  - Seamless integration with various AI models
  - API configuration options
  - Environment variable support for API keys

## 项目简介 (Chinese Introduction)

这是一个基于Next.js构建的高级AI聊天界面，具有多种专业任务类型和现代用户体验。

### 主要功能

- 支持多种任务类型：普通对话、深度思考、论文创新点探索、论文大纲生成等
- 现代化用户界面：支持深色/浅色模式、代码高亮、Markdown渲染
- 会话管理：创建和管理多个会话，自动根据上下文生成会话标题
- 高级功能：与各种AI模型的无缝集成，API配置选项，支持环境变量配置API密钥

开始使用只需安装依赖并运行开发服务器，详见上方英文说明。


## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install



```

Then, configure your environment variables by creating a `.env.local` file in the root directory. You can use the `.env.example` file as a template:

```bash
# Copy the example environment variables
cp .env.example .env.local
# Edit the .env.local file with your API keys
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Run in cloud serve
```bash

# build 
npx next build --no-lint

# start server
npx next start -p 5173


npm install -g pm2
pm2 start "npx next start -p 5173" --name "nextapp"

pm2 stop nextapp
pm2 restart nextapp
```

## Environment Variables

The application uses the following environment variables:

```
# OpenAI API configuration
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_OPENAI_API_URL=https://api.openai.com/v1

# Qwen API configuration
NEXT_PUBLIC_QWEN_API_KEY=your_qwen_api_key_here
NEXT_PUBLIC_QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1

# Default API provider (openai or qwen)
NEXT_PUBLIC_DEFAULT_API_PROVIDER=openai
```

These environment variables can be set in the `.env.local` file for local development.
For server-side operations, the application also uses the following non-public environment variables:

```
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_URL=https://api.openai.com/v1
QWEN_API_KEY=your_qwen_api_key_here
QWEN_API_URL=https://dashscope.aliyuncs.com/api/v1
```

## Architecture

The project is built with:

- **Next.js 15** - React framework with server-side rendering
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **Zustand** - State management
- **OpenAI API** - AI model integration

## Project Structure

- `src/app` - Main application pages
- `src/components` - Reusable UI components
  - `chat` - Chat interface components
  - `layout` - Layout components
  - `task` - Task-specific components
  - `ui` - Basic UI elements
- `src/store` - State management
- `src/utils` - Utility functions
- `src/types` - TypeScript type definitions

## Deployment

The easiest way to deploy this application is using the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

For more information on deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---
