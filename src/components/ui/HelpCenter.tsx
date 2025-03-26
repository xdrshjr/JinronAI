import React, { useState } from 'react';

export const HelpCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');

  // FAQ数据
  const faqs = [
    {
      id: 1,
      question: '如何开始一个新的对话？',
      answer: '在侧边栏点击"对话"按钮即可开始一个新的对话。您也可以通过点击"任务"按钮选择特定的任务类型。',
    },
    {
      id: 2,
      question: '如何清空所有对话记录？',
      answer: '在侧边栏点击"清空"按钮，确认后将删除所有对话记录。请注意，此操作不可恢复。',
    },
    {
      id: 3,
      question: '如何创建和管理文件夹？',
      answer: '在侧边栏的对话列表上方，点击文件夹图标可以创建新文件夹。您可以将对话拖入文件夹进行整理，也可以编辑或删除文件夹。',
    },
    {
      id: 4,
      question: '忘记密码怎么办？',
      answer: '请点击登录页面的"忘记密码"链接，按照提示进行密码重置操作。',
    },
  ];

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">帮助中心</h1>
      
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'faq'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('faq')}
        >
          常见问题
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'contact'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('contact')}
        >
          联系我们
        </button>
      </div>

      {activeTab === 'faq' && (
        <div className="space-y-6">
          {faqs.map((faq) => (
            <div key={faq.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">{faq.question}</h3>
              <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'contact' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">联系我们</h3>
          <p className="mb-4">如果您有任何问题或建议，请通过以下方式联系我们：</p>
          <ul className="space-y-2">
            <li><span className="font-medium">电子邮件：</span> support@jinronai.com</li>
            <li><span className="font-medium">客服电话：</span> 400-888-9999</li>
            <li><span className="font-medium">工作时间：</span> 周一至周五 9:00-18:00</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default HelpCenter; 