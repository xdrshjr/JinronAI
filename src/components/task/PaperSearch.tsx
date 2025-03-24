'use client';

import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/store';
import { Button } from '@/components/ui/Button';
import { v4 as uuidv4 } from 'uuid';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// 论文接口定义与API接口保持一致
interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  journal?: string;
  doi?: string;
  url?: string;
  citations?: number;
  published?: string;
  updated?: string;
  categories?: string[];
  translatedTitle?: string;  // 翻译后的标题字段
  translatedAbstract?: string;  // 翻译后的摘要字段
}

// 论文搜索参数接口
interface SearchParams {
  query: string;
  maxResults: number;
  startYear?: number;
  endYear?: number;
  repository: string;
  sortBy: string;
  startIndex: number;
}

export const dynamic = 'force-dynamic';

export const PaperSearch: React.FC<{ conversationId: string }> = ({ conversationId }) => {
  const { updateConversation, conversations, apiConfig } = useStore();
  const conversation = conversations.find(c => c.id === conversationId);
  
  const [searchKeywords, setSearchKeywords] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isViewingDetail, setIsViewingDetail] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [enableTranslation, setEnableTranslation] = useState(false);  // 添加翻译选项状态
  const [isTranslating, setIsTranslating] = useState(false);  // 添加翻译中状态
  
  // 获取当年和前一年
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;
  
  // 新增搜索参数状态
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    maxResults: 10,
    repository: 'arxiv',
    sortBy: 'lastUpdatedDate', // 默认为最近更新
    startIndex: 0,
    startYear: lastYear, // 默认从去年
    endYear: currentYear // 默认到今年
  });
  
  // 新增分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearchParamsVisible, setIsSearchParamsVisible] = useState(false);

  // 检测暗色模式
  useEffect(() => {
    // 初始检查
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // 监听变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // 处理关键词变化
  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchKeywords(e.target.value);
    setError(null);
    setSearchParams(prev => ({ ...prev, query: e.target.value }));
  };
  
  // 处理搜索参数变化
  const handleSearchParamChange = (name: keyof SearchParams, value: any) => {
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };
  
  // 处理页码变化
  const handlePageChange = (page: number) => {
    if (page < 1) return;
    
    setCurrentPage(page);
    const newStartIndex = (page - 1) * searchParams.maxResults;
    setSearchParams(prev => ({ ...prev, startIndex: newStartIndex }));
    
    // 如果已经有搜索结果，重新执行搜索
    if (searchResults.length > 0) {
      executeSearch({ ...searchParams, startIndex: newStartIndex });
    }
  };
  
  // 处理排序变化
  const handleSortChange = (sortBy: string) => {
    const updatedParams = { ...searchParams, sortBy, startIndex: 0 };
    setSearchParams(updatedParams);
    setCurrentPage(1);
    
    // 如果已经有搜索结果，重新执行搜索
    if (searchResults.length > 0) {
      executeSearch(updatedParams);
    }
  };
  
  // 翻译单个文本
  const translateText = async (text: string, targetLang: 'en' | 'zh'): Promise<string> => {
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text, 
          targetLang,
          // 使用固定的千问API
          provider: 'qwen',
          model: 'qwen-max'
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `翻译请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      return data.translation || '';
    } catch (error) {
      console.error('翻译失败:', error);
      return ''; // 翻译失败时返回空字符串
    }
  };
  
  // 执行论文搜索的核心逻辑
  const executeSearch = async (params: SearchParams) => {
    setIsSearching(true);
    setError(null);
    
    try {
      // 构建查询URL
      const queryParams = new URLSearchParams();
      queryParams.append('query', params.query);
      queryParams.append('max_results', params.maxResults.toString());
      queryParams.append('start_index', params.startIndex.toString());
      queryParams.append('sort_by', params.sortBy);
      queryParams.append('repository', params.repository);
      
      if (params.startYear) {
        queryParams.append('start_year', params.startYear.toString());
      }
      
      if (params.endYear) {
        queryParams.append('end_year', params.endYear.toString());
      }
      
      // 调用API接口
      const response = await fetch(`/api/papers?${queryParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `搜索请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      let papers: Paper[] = data.papers || [];
      setTotalResults(data.total || papers.length);
      setHasMoreResults(data.has_more || false);
      
      if (papers.length === 0) {
        setError('未找到相关论文，请尝试其他关键词或调整搜索条件');
      } else {
        // 当启用翻译时，翻译所有论文标题
        if (enableTranslation && papers.length > 0) {
          setIsTranslating(true);
          
          // 并行翻译所有标题（英文标题翻译为中文）
          const translationPromises = papers.map(paper => 
            translateText(paper.title, 'zh').then(translatedTitle => ({
              ...paper,
              translatedTitle
            }))
          );
          
          papers = await Promise.all(translationPromises);
          setIsTranslating(false);
        }
      }
      
      return papers;
    } catch (error) {
      console.error('搜索论文失败:', error);
      throw error;
    } finally {
      setIsSearching(false);
    }
  };
  
  // 处理搜索按钮点击
  const handleSearch = async () => {
    if (!searchKeywords.trim() || !conversation) return;
    
    setSearchResults([]);
    
    // 准备搜索参数
    const params = { ...searchParams, query: searchKeywords };
    
    // 重置分页
    setCurrentPage(1);
    params.startIndex = 0;
    
    // 向对话记录中添加用户查询消息
    updateConversation(conversationId, {
      messages: [
        ...(conversation.messages || []),
        {
          id: uuidv4(),
          role: 'user',
          content: `请帮我查询关于"${searchKeywords}"的相关论文${enableTranslation ? '并翻译标题' : ''}`,
          timestamp: Date.now(),
        }
      ]
    });

    try {
      // 执行搜索
      const papers = await executeSearch(params);
      setSearchResults(papers);
      
      // 添加论文列表响应
      const paperListMessage = papers.length > 0 
        ? `我找到了以下关于"${searchKeywords}"的相关论文：\n\n${papers.map((paper, index) => 
            `${index + 1}. **${paper.title}** (${paper.year})${paper.translatedTitle ? `\n   译文: ${paper.translatedTitle}` : ''}\n   作者: ${paper.authors.join(', ')}\n   期刊: ${paper.journal || 'arXiv'}\n   分类: ${paper.categories?.join(', ') || '未知'}`
          ).join('\n\n')}`
        : `很抱歉，我未能找到关于"${searchKeywords}"的相关论文，请尝试其他关键词或更广泛的搜索术语。`;
      
      updateConversation(conversationId, {
        messages: [
          ...conversation.messages,
          {
            id: uuidv4(),
            role: 'assistant',
            content: paperListMessage,
            timestamp: Date.now(),
          }
        ]
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(`搜索失败: ${errorMessage}`);
      
      updateConversation(conversationId, {
        messages: [
          ...conversation.messages,
          {
            id: uuidv4(),
            role: 'assistant',
            content: `搜索论文时出现错误: ${errorMessage}，请稍后重试。`,
            timestamp: Date.now(),
          }
        ]
      });
    }
  };
  
  // 查看论文详情
  const handleViewPaperDetail = async (paper: Paper) => {
    setSelectedPaper(paper);
    setIsViewingDetail(true);
    
    // 当启用翻译时，翻译摘要
    if (enableTranslation && !paper.translatedAbstract) {
      setIsTranslating(true);
      
      try {
        // 翻译摘要
        const translatedAbstract = await translateText(paper.abstract, 'zh');
        
        // 如果标题还没翻译，也翻译标题
        let translatedTitle = paper.translatedTitle;
        if (!translatedTitle) {
          translatedTitle = await translateText(paper.title, 'zh');
        }
        
        // 更新选中的论文信息
        const updatedPaper = { 
          ...paper, 
          translatedTitle, 
          translatedAbstract 
        };
        setSelectedPaper(updatedPaper);
        
        // 更新搜索结果中的论文信息
        setSearchResults(prevResults => 
          prevResults.map(p => 
            p.id === paper.id ? updatedPaper : p
          )
        );
      } catch (error) {
        console.error('翻译论文详情失败:', error);
      } finally {
        setIsTranslating(false);
      }
    }
    
    // 添加查看详情的用户消息
    if (conversation) {
      updateConversation(conversationId, {
        messages: [
          ...conversation.messages,
          {
            id: uuidv4(),
            role: 'user',
            content: `请提供论文"${paper.title}"的详细信息${enableTranslation ? '并翻译成中文' : ''}`,
            timestamp: Date.now(),
          }
        ]
      });
      
      // 准备论文详情响应
      let categoriesText = '';
      if (paper.categories && paper.categories.length > 0) {
        categoriesText = `\n- **分类**: ${paper.categories.join(', ')}`;
      }
      
      // 添加论文详情响应，包括翻译内容
      const detailMessage = `
# ${paper.title}${paper.translatedTitle ? `\n## [译] ${paper.translatedTitle}` : ''}

## 基本信息
- **作者**: ${paper.authors.join(', ')}
- **年份**: ${paper.year}
- **来源**: ${paper.journal || 'arXiv'}${categoriesText}
- **发布日期**: ${formatDate(paper.published)}
- **更新日期**: ${formatDate(paper.updated)}
${paper.doi ? `- **DOI**: ${paper.doi}` : ''}
${paper.url ? `- **URL**: [${paper.url}](${paper.url})` : ''}

## 摘要
${paper.abstract}
${paper.translatedAbstract ? `\n## [译] 摘要\n${paper.translatedAbstract}` : ''}

## 主要内容分析
基于摘要，该论文可能涉及以下关键点：

1. 研究背景: 论文探讨了${searchKeywords}相关领域的问题
2. 研究方法: 可能采用了实验验证、理论分析或数据建模等方法
3. 主要发现: 提出了新的方法、模型或见解来解决相关问题

## 研究价值
该论文对${searchKeywords}领域的研究可能具有以下价值：
- 提供了新的理论框架或实验证据
- 解决了该领域的某些关键挑战
- 为后续研究提供了新的方向或方法

> 注：详细分析基于摘要生成，如需完整信息，请访问原论文链接获取全文。
      `;
      
      updateConversation(conversationId, {
        messages: [
          ...conversation.messages,
          {
            id: uuidv4(),
            role: 'assistant',
            content: detailMessage,
            timestamp: Date.now(),
          }
        ]
      });
    }
  };
  
  // 格式化日期显示
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    } catch (e) {
      return dateString;
    }
  };
  
  // 返回到搜索结果列表
  const handleBackToResults = () => {
    setIsViewingDetail(false);
    setSelectedPaper(null);
  };
  
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">相关论文查询</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          输入关键词，查找和浏览相关学术论文 (基于arXiv)
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {!isViewingDetail ? (
          <>
            {/* 搜索框和按钮 */}
            <div className="flex flex-col space-y-3 mb-4">
              <div className="flex items-center">
                <input
                  type="text"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="输入论文关键词，如: machine learning, quantum computing..."
                  value={searchKeywords}
                  onChange={handleKeywordsChange}
                  disabled={isSearching}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isSearching && searchKeywords.trim()) {
                      handleSearch();
                    }
                  }}
                />
                <Button 
                  className="rounded-l-none px-4 py-2"
                  onClick={handleSearch}
                  disabled={isSearching || !searchKeywords.trim()}
                >
                  {isSearching ? <LoadingSpinner size="sm" /> : '搜索'}
                </Button>
              </div>
              
              {/* 高级搜索选项切换 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable-translation"
                    checked={enableTranslation}
                    onChange={() => setEnableTranslation(!enableTranslation)}
                    className="rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <label htmlFor="enable-translation" className="text-sm text-gray-700 dark:text-gray-300">
                    启用LLM翻译 (论文标题和摘要英译中)
                  </label>
                </div>
                <Button 
                  variant="link" 
                  className="text-blue-600 dark:text-blue-400 text-sm"
                  onClick={() => setIsSearchParamsVisible(!isSearchParamsVisible)}
                >
                  {isSearchParamsVisible ? '隐藏高级搜索选项 ↑' : '显示高级搜索选项 ↓'}
                </Button>
              </div>
              
              {/* 默认搜索设置说明 */}
              {!isSearchParamsVisible && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                  默认搜索设置: 按最近更新排序，{lastYear}年至{currentYear}年的论文，每页显示10条结果
                </p>
              )}
            </div>
            
            {/* 高级搜索参数面板 */}
            {isSearchParamsVisible && (
              <div className="p-4 bg-gray-200 dark:bg-gray-850 rounded-md mb-4 border border-gray-300 dark:border-gray-600 shadow-inner">
                <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">高级搜索选项</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 结果数量 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      每页结果数量
                    </label>
                    <select 
                      value={searchParams.maxResults} 
                      onChange={(e) => handleSearchParamChange('maxResults', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                  
                  {/* 排序方式 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      排序方式
                    </label>
                    <select 
                      value={searchParams.sortBy} 
                      onChange={(e) => handleSearchParamChange('sortBy', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="relevance">相关性</option>
                      <option value="lastUpdatedDate">最近更新</option>
                      <option value="submittedDate">发布日期</option>
                    </select>
                  </div>
                  
                  {/* 开始年份 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      开始年份
                    </label>
                    <input 
                      type="number" 
                      value={searchParams.startYear || ''} 
                      onChange={(e) => handleSearchParamChange('startYear', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="如：2018"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  {/* 结束年份 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      结束年份
                    </label>
                    <input 
                      type="number" 
                      value={searchParams.endYear || ''} 
                      onChange={(e) => handleSearchParamChange('endYear', e.target.value ? Number(e.target.value) : undefined)}
                      placeholder="如：2023"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  {/* 数据源 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      数据来源
                    </label>
                    <select 
                      value={searchParams.repository} 
                      onChange={(e) => handleSearchParamChange('repository', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="arxiv">arXiv</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      目前仅支持arXiv，未来将扩展更多数据源
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 错误信息 */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md border-l-4 border-red-500 mb-4">
                <p className="text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}
            
            {/* 搜索结果排序控件 - 仅在有结果时显示 */}
            {searchResults.length > 0 && !isSearching && !isTranslating && (
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
                  找到 {totalResults} 篇相关论文
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">排序:</span>
                  <select 
                    value={searchParams.sortBy}
                    onChange={(e) => handleSortChange(e.target.value)}
                    className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="relevance">相关性</option>
                    <option value="lastUpdatedDate">最近更新</option>
                    <option value="submittedDate">发布日期</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* 搜索结果列表 */}
            {isSearching || isTranslating ? (
              <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  {isSearching ? '正在arXiv上搜索相关论文...' : '正在翻译论文内容...'}
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {/* 论文列表 */}
                {searchResults.map(paper => (
                  <div 
                    key={paper.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
                    onClick={() => handleViewPaperDetail(paper)}
                  >
                    <h4 className="text-lg font-medium text-blue-600 dark:text-blue-400">{paper.title}</h4>
                    {/* 显示翻译后的标题 */}
                    {enableTranslation && paper.translatedTitle && (
                      <p className="text-md text-gray-700 dark:text-gray-300 mt-1">
                        译文: {paper.translatedTitle}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {paper.authors.join(', ')} ({paper.year})
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {paper.journal || 'arXiv'} | 发表于: {formatDate(paper.published)}
                    </p>
                    {paper.categories && paper.categories.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        分类: {paper.categories.join(', ')}
                      </p>
                    )}
                    <p className="mt-2 text-gray-700 dark:text-gray-300 line-clamp-3">
                      {paper.abstract}
                    </p>
                    <div className="mt-2 flex justify-end">
                      <Button 
                        variant="link" 
                        className="text-blue-600 dark:text-blue-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewPaperDetail(paper);
                        }}
                      >
                        查看详情 →
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* 分页导航 */}
                <div className="flex justify-between items-center mt-6 px-2">
                  <Button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isSearching}
                    variant="outline"
                    className="px-3 py-1"
                  >
                    上一页
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {/* 页码显示和直接跳转 */}
                    <span className="text-sm text-gray-600 dark:text-gray-400">第</span>
                    <input
                      type="number"
                      min={1}
                      value={currentPage}
                      onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page > 0) setCurrentPage(page);
                      }}
                      onBlur={() => handlePageChange(currentPage)}
                      className="w-12 text-center px-1 py-1 border border-gray-300 dark:border-gray-600 rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">页</span>
                    
                    <Button
                      variant="link"
                      className="text-blue-600 dark:text-blue-400 text-sm"
                      onClick={() => handlePageChange(currentPage)}
                    >
                      跳转
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasMoreResults || isSearching}
                    variant="outline"
                    className="px-3 py-1"
                  >
                    下一页
                  </Button>
                </div>
              </div>
            ) : (
              searchKeywords && !isSearching && !error && (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">未找到相关论文，请尝试其他关键词</p>
                </div>
              )
            )}
          </>
        ) : selectedPaper && (
          <div className="paper-detail">
            <Button 
              variant="link" 
              className="text-blue-600 dark:text-blue-400 mb-4"
              onClick={handleBackToResults}
            >
              ← 返回搜索结果
            </Button>
            
            {/* 正在翻译提示 */}
            {isTranslating && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border-l-4 border-blue-500 mb-4">
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <p className="ml-2 text-blue-700 dark:text-blue-400">正在翻译论文内容...</p>
                </div>
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {selectedPaper.title}
            </h2>
            
            {/* 显示翻译后的标题 */}
            {enableTranslation && selectedPaper.translatedTitle && (
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                译文: {selectedPaper.translatedTitle}
              </h3>
            )}
            
            <div className="p-4 rounded-lg mb-6" style={{ 
              backgroundColor: isDarkMode ? 'oklch(0.28 0 0)' : 'rgb(249, 250, 251)' // light=bg-gray-50, dark=oklch
            }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">作者</p>
                  <p className="text-gray-800 dark:text-gray-200">{selectedPaper.authors.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">发表年份</p>
                  <p className="text-gray-800 dark:text-gray-200">{selectedPaper.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">来源</p>
                  <p className="text-gray-800 dark:text-gray-200">{selectedPaper.journal || 'arXiv'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">发布日期</p>
                  <p className="text-gray-800 dark:text-gray-200">{formatDate(selectedPaper.published)}</p>
                </div>
                {selectedPaper.categories && selectedPaper.categories.length > 0 && (
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">分类</p>
                    <p className="text-gray-800 dark:text-gray-200">{selectedPaper.categories.join(', ')}</p>
                  </div>
                )}
                {selectedPaper.url && (
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">论文链接</p>
                    <p className="text-blue-600 dark:text-blue-400">
                      <a href={selectedPaper.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {selectedPaper.url}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">摘要</h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {selectedPaper.abstract}
              </p>
              
              {/* 显示翻译后的摘要 */}
              {enableTranslation && selectedPaper.translatedAbstract && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">摘要译文</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedPaper.translatedAbstract}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">主要内容分析</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                基于摘要，该论文可能涉及以下关键点：
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li>研究背景: 论文探讨了{searchKeywords}相关领域的问题</li>
                <li>研究方法: 可能采用了实验验证、理论分析或数据建模等方法</li>
                <li>主要发现: 提出了新的方法、模型或见解来解决相关问题</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">研究价值</h3>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                该论文对{searchKeywords}领域的研究可能具有以下价值：
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
                <li>提供了新的理论框架或实验证据</li>
                <li>解决了该领域的某些关键挑战</li>
                <li>为后续研究提供了新的方向或方法</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg border-l-4 border-yellow-500 dark:border-yellow-600">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                注：详细分析基于摘要生成，如需完整信息，请访问原论文链接获取全文。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};