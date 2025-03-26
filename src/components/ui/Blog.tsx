import React from 'react';

export const Blog: React.FC = () => {
  // 模拟博客文章数据
  const blogPosts = [
    {
      id: 1,
      title: 'AI技术的未来发展趋势',
      summary: '探讨人工智能技术未来的发展方向和可能带来的影响...',
      date: '2024-03-20',
    },
    {
      id: 2,
      title: 'JinronAI最新功能介绍',
      summary: '详细介绍我们最新版本中的创新功能和使用技巧...',
      date: '2024-03-15',
    },
    {
      id: 3,
      title: '如何利用AI提升工作效率',
      summary: '分享几种利用AI助手提高日常工作效率的实用方法...',
      date: '2024-03-10',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">博客文章</h1>
      <div className="space-y-6">
        {blogPosts.map((post) => (
          <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-3">{post.summary}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">{post.date}</span>
              <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                阅读更多
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Blog; 