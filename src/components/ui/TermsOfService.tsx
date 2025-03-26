import React from 'react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">服务条款</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. 服务协议的接受</h2>
          <p className="text-gray-600 dark:text-gray-300">
            欢迎使用JinronAI 稷人服务。通过访问或使用我们的服务，您同意受本服务条款的约束。
            如果您不同意这些条款，请勿使用我们的服务。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. 服务说明</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            JinronAI 稷人提供基于人工智能的对话和任务处理服务。我们保留随时修改、暂停或终止服务的权利，恕不另行通知。
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            我们不保证服务不会中断或无错误，也不保证服务中的任何缺陷都会被纠正。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. 用户责任</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-3">
            您同意不使用本服务进行任何违法或被禁止的活动，包括但不限于：
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-300">
            <li>发布、传输任何非法、有害、威胁、虐待、骚扰、诽谤、猥亵的内容</li>
            <li>冒充任何人或实体，或以虚假方式陈述或歪曲您与任何人或实体的关系</li>
            <li>干扰服务或与服务相连的服务器或网络</li>
            <li>收集或存储服务其他用户的个人数据</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. 知识产权</h2>
          <p className="text-gray-600 dark:text-gray-300">
            服务中的所有内容，包括但不限于文本、图形、标志、图标、图像以及软件，均为JinronAI或其内容提供商的财产，
            受国际版权法保护。未经明确许可，不得复制、修改、发布、传输、分发、展示、执行、复制或利用任何此类内容。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. 免责声明</h2>
          <p className="text-gray-600 dark:text-gray-300">
            本服务按"原样"和"可用"的基础提供，不附带任何明示或暗示的保证。
            JinronAI不保证服务将满足您的要求，或服务将不中断、及时、安全或无误。
            您使用从服务获得的任何信息需自行承担风险。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. 条款变更</h2>
          <p className="text-gray-600 dark:text-gray-300">
            我们保留随时修改这些条款的权利。修改后的条款将在我们的网站上发布，并在发布后立即生效。
            继续使用服务将被视为接受修改后的条款。
          </p>
        </section>
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        最后更新日期：2024年3月25日
      </div>
    </div>
  );
};

export default TermsOfService; 