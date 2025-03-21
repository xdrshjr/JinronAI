'use client';

import React, { useState } from 'react';
import { useStore } from '@/store/store';
import { Button } from '@/components/ui/Button';
import { v4 as uuidv4 } from 'uuid';

export const PaperInnovationExplorer: React.FC<{ conversationId: string }> = ({ conversationId }) => {
  const { updateConversation, getConversation } = useStore();
  const [keywords, setKeywords] = useState('');
  const [paperCount, setPaperCount] = useState(5);
  const [detail, setDetail] = useState('medium');
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const conversation = getConversation(conversationId);
  
  // 处理关键词变化
  const handleKeywordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setKeywords(e.target.value);
  };
  
  // 处理论文数量变化
  const handlePaperCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0 && value <= 20) {
      setPaperCount(value);
    }
  };
  
  // 处理详细程度变化
  const handleDetailChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDetail(e.target.value);
  };
  
  // 开始探索创新点
  const handleExploreInnovation = async () => {
    if (!keywords.trim() || !conversation) return;
    
    setIsSearching(true);
    setProgress(0);
    
    // 创建系统提示信息
    const systemPrompt = `你是一个研究助手，将帮助用户探索论文创新点。
请基于以下关键词/描述，分析${paperCount}篇最新的相关论文，并探索可能的创新点：
关键词/描述: ${keywords}
详细程度: ${detail === 'high' ? '高 (深入分析每个创新点)' : detail === 'medium' ? '中等 (平衡分析)' : '低 (简要列出创新点)'}

分析步骤:
1. 首先列出该领域最新的${paperCount}篇相关论文标题和作者
2. 对每篇论文的主要内容和贡献进行概述
3. 分析现有研究的局限性和不足
4. 基于分析，提出3-5个可能的创新研究方向
5. 对每个创新方向进行可行性评估

请保持分析的学术性和专业性。`;

    // 添加用户消息和系统提示
    updateConversation(conversationId, {
      messages: [
        ...(conversation.messages || []),
        {
          id: uuidv4(),
          role: 'user',
          content: `请帮我探索论文创新点。\n研究关键词/描述: ${keywords}\n检索论文数量: ${paperCount}篇\n详细程度: ${detail === 'high' ? '高' : detail === 'medium' ? '中等' : '低'}`,
          timestamp: Date.now(),
        },
        {
          id: uuidv4(),
          role: 'assistant',
          content: `正在为您探索论文创新点，基于关键词: "${keywords}"，我将分析${paperCount}篇相关论文并提供可能的创新研究方向...`,
          timestamp: Date.now(),
        }
      ]
    });
    
    // 模拟进度更新
    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 5;
        if (newProgress >= 100) {
          clearInterval(timer);
          generateFinalResponse();
          return 100;
        }
        return newProgress;
      });
    }, 500);
    
    // 模拟最终响应生成
    const generateFinalResponse = async () => {
      try {
        // 这里是实际发送请求给API生成响应的地方
        // 为了演示，我们使用模拟延迟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 在实际应用中，这会从API获取，这里简化为直接更新
        const lastMessageIndex = conversation?.messages?.length;
        if (lastMessageIndex && lastMessageIndex > 0) {
          // 获取并更新最后一条消息
          const updatedMessages = [...conversation.messages];
          updatedMessages[lastMessageIndex - 1] = {
            ...updatedMessages[lastMessageIndex - 1],
            content: `# 论文创新点探索：${keywords}

## 相关论文概述

根据您提供的关键词"${keywords}"，我检索了${paperCount}篇最新相关论文：

1. **深度学习在自然语言处理中的应用新进展** (Wang et al., 2023)
   - 主要贡献：提出了一种新的Transformer变体架构，在低资源环境下表现更好
   - 核心技术：注意力机制优化，参数共享改进

2. **语言模型的可解释性研究** (Smith & Johnson, 2023)
   - 主要贡献：提供了一种新的方法来解释大型语言模型的决策过程
   - 核心发现：模型内部表示与人类语言认知存在可测量的对应关系

3. **跨语言理解的统一框架** (Zhang et al., 2023)
   - 主要贡献：构建了一个能够在100多种语言之间进行无损知识转移的模型
   - 创新点：使用了符号引导的对比学习方法

4. **多模态学习中的语言引导** (Brown et al., 2023)
   - 主要贡献：证明了如何使用语言先验知识来改进视觉理解任务
   - 技术突破：提出了语言-视觉对齐的新方法

5. **大型语言模型的知识更新机制** (Garcia & Kumar, 2023)
   - 主要贡献：解决了预训练模型知识过时的问题
   - 方法：提出了一种增量学习框架，无需完全重新训练

## 现有研究的局限性

1. **计算资源需求**：大多数先进方法需要大量计算资源，限制了广泛应用
2. **数据偏见问题**：现有模型仍然继承训练数据中的偏见和不平衡
3. **跨领域泛化能力**：模型在特定领域表现良好，但跨领域迁移仍有挑战
4. **可解释性与性能权衡**：性能提升往往以牺牲可解释性为代价
5. **知识时效性**：模型捕获的知识会随时间变得过时

## 潜在创新研究方向

### 1. 资源高效的语言模型训练
- **研究思路**：开发新的参数压缩和知识蒸馏技术，使高性能模型能在消费级硬件上运行
- **可行性评估**：中高。已有初步研究显示参数共享和混合专家模型可以显著减少资源需求
- **潜在突破点**：层次化稀疏激活方法，动态计算分配

### 2. 自适应知识更新框架
- **研究思路**：设计一个框架允许语言模型根据外部资源自动更新其知识库
- **可行性评估**：中等。需要解决知识一致性和冲突解决的挑战
- **潜在突破点**：知识模块化存储，增量更新策略

### 3. 跨文化语言理解增强
- **研究思路**：开发专门的方法来捕捉和保留不同文化背景中的语言细微差别
- **可行性评估**：中高。多语言数据集已存在，但需要更精细的文化语境标注
- **潜在突破点**：文化背景表示学习，语境相对性建模

### 4. 语言-专业知识对齐技术
- **研究思路**：改进语言模型与专业领域知识的对齐，尤其是科学、医学和法律等领域
- **可行性评估**：高。专业数据集已广泛存在，可直接应用于对齐研究
- **潜在突破点**：领域特定的预训练目标，专家引导的微调

### 5. 多阶段推理框架
- **研究思路**：开发能够分解复杂推理任务并逐步解决的语言模型架构
- **可行性评估**：中等。需要新的训练方法和架构调整
- **潜在突破点**：思维链模块化，推理路径规划

## 总结与建议

基于分析，我认为最有前景的研究方向是"语言-专业知识对齐技术"和"资源高效的语言模型训练"。这两个方向解决了当前研究中的关键痛点，同时技术可行性较高。

建议您重点考虑以下研究问题：
1. 如何在不增加模型大小的情况下提高专业领域的性能？
2. 如何设计适用于特定领域的参数高效微调技术？
3. 如何评估和量化模型在专业知识领域的表现？

这些研究方向既有学术价值，也有实际应用前景，适合作为下一步研究的突破点。`,
            timestamp: Date.now(),
          };
          
          updateConversation(conversationId, {
            messages: updatedMessages
          });
        }
        
      } catch (error) {
        console.error('生成创新点探索失败:', error);
      } finally {
        setIsSearching(false);
      }
    };
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">论文创新点探索</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          输入研究关键词，探索可能的论文创新点
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {/* 关键词输入 */}
        <div className="mb-4">
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            研究关键词/描述
          </label>
          <textarea
            id="keywords"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            rows={3}
            placeholder="输入研究关键词或简短描述（例如：大型语言模型的多模态理解能力）"
            value={keywords}
            onChange={handleKeywordsChange}
            disabled={isSearching}
          />
        </div>
        
        {/* 参数设置 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="paperCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              检索论文数量
            </label>
            <input
              id="paperCount"
              type="number"
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={paperCount}
              onChange={handlePaperCountChange}
              disabled={isSearching}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              建议设置1-20之间的值
            </p>
          </div>
          
          <div>
            <label htmlFor="detail" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              详细程度
            </label>
            <select
              id="detail"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              value={detail}
              onChange={handleDetailChange}
              disabled={isSearching}
            >
              <option value="low">低 (简要列出创新点)</option>
              <option value="medium">中等 (平衡分析)</option>
              <option value="high">高 (深入分析每个创新点)</option>
            </select>
          </div>
        </div>
        
        {/* 开始探索按钮 */}
        <Button
          onClick={handleExploreInnovation}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md shadow"
          disabled={isSearching || !keywords.trim()}
        >
          {isSearching ? "正在探索创新点..." : "开始探索"}
        </Button>
        
        {/* 进度条 */}
        {isSearching && (
          <div className="mt-6">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200 dark:bg-blue-900 dark:text-blue-200">
                    探索进度
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600 dark:text-blue-400">
                    {Math.round(progress)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200 dark:bg-gray-700">
                <div 
                  style={{ width: `${progress}%` }} 
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 dark:bg-blue-600 transition-all duration-300"
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {progress < 30 ? "检索相关论文中..." : 
                 progress < 60 ? "分析论文内容与贡献..." : 
                 progress < 90 ? "生成创新点与评估..." : 
                 "完成最终报告..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 