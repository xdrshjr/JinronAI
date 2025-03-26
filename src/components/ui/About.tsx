import React from 'react';

export const About: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">关于我们</h1>
      <p className="mb-4">
        JinronAI 稷人是一个先进的AI助手，专注于提供智能、高效的AI交互体验。
        我们的使命是让人工智能技术更加便捷地服务于日常生活和工作。
      </p>
      <p className="mb-4">
        我们的团队由一群热爱技术和创新的专业人士组成，致力于不断提升AI技术的边界，
        为用户提供更加智能、个性化的服务体验。
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-3">我们的愿景</h2>
      <p className="mb-4">
        打造最懂用户的AI助手，成为您工作和生活中不可或缺的智能伙伴。
      </p>
    </div>
  );
};

export default About; 