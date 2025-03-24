'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/store';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// PDF翻译参数接口
interface TranslationParams {
  service: string;
  langFrom: string;
  langTo: string;
  pageRange: string;
  customPages: string;
  threads: string;
  skipSubsetFonts: boolean;
  ignoreCache: boolean;
  customPrompt: string;
  useBabeldoc: boolean;
}

// 翻译状态接口
interface TranslationStatus {
  status: string;
  progress: number;
  message: string;
  resultFiles?: {
    mono?: string;
    dual?: string;
  };
}

// 服务映射
const serviceOptions = [
  { value: 'Google', label: 'Google' },
  { value: 'Bing', label: 'Bing' },
  { value: 'DeepL', label: 'DeepL' },
  { value: 'DeepLX', label: 'DeepLX' },
  { value: 'Ollama', label: 'Ollama' },
  { value: 'OpenAI', label: 'OpenAI' },
  { value: 'Azure', label: 'Azure Translator' },
  { value: 'AzureOpenAI', label: 'Azure OpenAI' }
];

// 语言映射
const languageOptions = [
  { value: 'Simplified Chinese', label: '简体中文' },
  { value: 'Traditional Chinese', label: '繁体中文' },
  { value: 'English', label: '英语' },
  { value: 'French', label: '法语' },
  { value: 'German', label: '德语' },
  { value: 'Japanese', label: '日语' },
  { value: 'Korean', label: '韩语' },
  { value: 'Russian', label: '俄语' },
  { value: 'Spanish', label: '西班牙语' },
  { value: 'Italian', label: '意大利语' }
];

// 页面范围映射
const pageRangeOptions = [
  { value: 'All', label: '全部页面' },
  { value: 'First', label: '第一页' },
  { value: 'First 5 pages', label: '前5页' },
  { value: 'Others', label: '自定义页面' }
];

export const PdfTranslation: React.FC<{ conversationId: string }> = ({ conversationId }) => {
  const { updateConversation, conversations } = useStore();
  const conversation = conversations.find(c => c.id === conversationId);
  
  // 状态
  const [file, setFile] = useState<File | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationStatus, setTranslationStatus] = useState<TranslationStatus | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [advancedOptionsVisible, setAdvancedOptionsVisible] = useState(false);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 翻译参数
  const [translationParams, setTranslationParams] = useState<TranslationParams>({
    service: 'Google',
    langFrom: 'English',
    langTo: 'Simplified Chinese',
    pageRange: 'First',
    customPages: '',
    threads: '4',
    skipSubsetFonts: false,
    ignoreCache: false,
    customPrompt: '',
    useBabeldoc: false
  });

  // 检测暗色模式
  useEffect(() => {
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
      
      // 清理可能存在的对象 URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [previewUrl, downloadUrl]);

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      
      // 创建预览
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(objectUrl);
    } else if (selectedFile) {
      setError('只支持PDF文件');
      setFile(null);
    }
  };

  // 处理参数变化
  const handleParamChange = (name: keyof TranslationParams, value: any) => {
    setTranslationParams(prev => ({ ...prev, [name]: value }));
  };

  // 开始翻译
  const startTranslation = async () => {
    if (!file) {
      setError('请选择一个PDF文件');
      return;
    }

    setIsTranslating(true);
    setError(null);
    setTranslationStatus({
      status: 'starting',
      progress: 0,
      message: '正在开始翻译...'
    });

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('service', translationParams.service);
      formData.append('langFrom', translationParams.langFrom);
      formData.append('langTo', translationParams.langTo);
      formData.append('pageRange', translationParams.pageRange);
      formData.append('customPages', translationParams.customPages);
      formData.append('threads', translationParams.threads);
      formData.append('skipSubsetFonts', String(translationParams.skipSubsetFonts));
      formData.append('ignoreCache', String(translationParams.ignoreCache));
      formData.append('customPrompt', translationParams.customPrompt);
      formData.append('useBabeldoc', String(translationParams.useBabeldoc));

      // 发送翻译请求
      const response = await fetch('http://localhost:7860/translate_pdf', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`翻译请求失败: ${response.status}`);
      }

      const data = await response.json();
      
      // 设置状态检查定时器
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }

      statusIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await fetch('http://localhost:7860/translate_pdf_status');
          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            setTranslationStatus({
              status: statusData.status,
              progress: statusData.progress || 0,
              message: statusData.message || '翻译中...',
              resultFiles: statusData.resultFiles
            });

            // 检查翻译是否完成
            if (statusData.status === 'completed') {
              if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
              }
              
              // 设置预览和下载链接
              if (statusData.resultFiles?.mono) {
                setPreviewUrl(`http://localhost:7860/files/${statusData.resultFiles.mono}`);
              }
              
              setIsTranslating(false);
            }
            
            // 检查翻译是否出错
            if (statusData.status === 'error') {
              if (statusIntervalRef.current) {
                clearInterval(statusIntervalRef.current);
                statusIntervalRef.current = null;
              }
              setError(statusData.message || '翻译过程中发生错误');
              setIsTranslating(false);
            }
          }
        } catch (e) {
          console.error('获取翻译状态失败:', e);
        }
      }, 2000);

    } catch (e) {
      console.error('翻译请求失败:', e);
      setError(e instanceof Error ? e.message : '翻译过程中发生未知错误');
      setIsTranslating(false);
      
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
        statusIntervalRef.current = null;
      }
    }
  };

  // 取消翻译
  const cancelTranslation = async () => {
    try {
      const response = await fetch('http://localhost:7860/cancel_translation', {
        method: 'POST'
      });

      if (response.ok) {
        setIsTranslating(false);
        setTranslationStatus(prev => prev ? { ...prev, status: 'cancelled', message: '翻译已取消' } : null);
      }
    } catch (e) {
      console.error('取消翻译失败:', e);
    }

    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
      statusIntervalRef.current = null;
    }
  };

  // 下载结果
  const downloadResult = (type: 'mono' | 'dual') => {
    if (!translationStatus?.resultFiles) return;
    
    const fileUrl = type === 'mono' 
      ? `http://localhost:7860/files/${translationStatus.resultFiles.mono}`
      : `http://localhost:7860/files/${translationStatus.resultFiles.dual}`;
    
    // 创建链接并模拟点击下载
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = type === 'mono' ? 'translated.pdf' : 'translated-dual.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={`p-4 flex flex-col ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
      <h2 className="text-xl font-semibold mb-4">PDF翻译任务</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 左侧 - 参数设置 */}
        <div className="space-y-4">
          {/* 文件上传 */}
          <div className="rounded-lg border border-gray-300 dark:border-gray-700 p-4">
            <label className="block mb-2 font-medium">选择PDF文件</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 dark:text-gray-300
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         dark:file:bg-blue-900 dark:file:text-blue-200
                         hover:file:bg-blue-100 dark:hover:file:bg-blue-800"
              disabled={isTranslating}
            />
            {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
          </div>

          {/* 基本参数 */}
          <div className="rounded-lg border border-gray-300 dark:border-gray-700 p-4">
            <h3 className="font-medium mb-3">翻译设置</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium">翻译服务</label>
                <select
                  value={translationParams.service}
                  onChange={(e) => handleParamChange('service', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
                  disabled={isTranslating}
                >
                  {serviceOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium">线程数</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={translationParams.threads}
                  onChange={(e) => handleParamChange('threads', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
                  disabled={isTranslating}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1 text-sm font-medium">源语言</label>
                <select
                  value={translationParams.langFrom}
                  onChange={(e) => handleParamChange('langFrom', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
                  disabled={isTranslating}
                >
                  {languageOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block mb-1 text-sm font-medium">目标语言</label>
                <select
                  value={translationParams.langTo}
                  onChange={(e) => handleParamChange('langTo', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
                  disabled={isTranslating}
                >
                  {languageOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 text-sm font-medium">页面范围</label>
              <select
                value={translationParams.pageRange}
                onChange={(e) => handleParamChange('pageRange', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
                disabled={isTranslating}
              >
                {pageRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            {translationParams.pageRange === 'Others' && (
              <div className="mb-4">
                <label className="block mb-1 text-sm font-medium">自定义页面 (例如: 1-5,8,10-12)</label>
                <input
                  type="text"
                  value={translationParams.customPages}
                  onChange={(e) => handleParamChange('customPages', e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md"
                  placeholder="1-5,8,10-12"
                  disabled={isTranslating}
                />
              </div>
            )}
          </div>
          
          {/* 高级选项折叠面板 */}
          <div className="rounded-lg border border-gray-300 dark:border-gray-700 p-4">
            <button
              className="flex justify-between items-center w-full text-left"
              onClick={() => setAdvancedOptionsVisible(!advancedOptionsVisible)}
              disabled={isTranslating}
            >
              <span className="font-medium">高级选项</span>
              <svg
                className={`w-5 h-5 transition-transform ${advancedOptionsVisible ? 'transform rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            
            {advancedOptionsVisible && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="skipSubsetFonts"
                    checked={translationParams.skipSubsetFonts}
                    onChange={(e) => handleParamChange('skipSubsetFonts', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                    disabled={isTranslating}
                  />
                  <label htmlFor="skipSubsetFonts" className="ml-2 text-sm">
                    跳过字体子集化 (可能提高速度但降低质量)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ignoreCache"
                    checked={translationParams.ignoreCache}
                    onChange={(e) => handleParamChange('ignoreCache', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                    disabled={isTranslating}
                  />
                  <label htmlFor="ignoreCache" className="ml-2 text-sm">
                    忽略缓存 (强制重新翻译)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useBabeldoc"
                    checked={translationParams.useBabeldoc}
                    onChange={(e) => handleParamChange('useBabeldoc', e.target.checked)}
                    className="w-4 h-4 text-blue-600"
                    disabled={isTranslating}
                  />
                  <label htmlFor="useBabeldoc" className="ml-2 text-sm">
                    使用BabelDOC (实验性)
                  </label>
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-medium">自定义提示词 (仅限LLM翻译)</label>
                  <textarea
                    value={translationParams.customPrompt}
                    onChange={(e) => handleParamChange('customPrompt', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md h-20"
                    placeholder="输入自定义提示词..."
                    disabled={isTranslating}
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="flex space-x-3">
            {!isTranslating ? (
              <Button
                onClick={startTranslation}
                disabled={!file || isTranslating}
                className="flex-1"
                color="blue"
              >
                开始翻译
              </Button>
            ) : (
              <Button
                onClick={cancelTranslation}
                className="flex-1"
                color="red"
              >
                取消翻译
              </Button>
            )}
          </div>
          
          {/* 翻译状态 */}
          {translationStatus && (
            <div className="rounded-lg border border-gray-300 dark:border-gray-700 p-4">
              <h3 className="font-medium mb-2">翻译状态</h3>
              <p className="mb-2">{translationStatus.message}</p>
              
              {/* 进度条 */}
              {isTranslating && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-blue-600 dark:bg-blue-500 h-2.5 rounded-full"
                    style={{ width: `${translationStatus.progress * 100}%` }}
                  ></div>
                </div>
              )}
              
              {/* 结果下载按钮 */}
              {translationStatus.status === 'completed' && translationStatus.resultFiles && (
                <div className="flex space-x-3 mt-2">
                  {translationStatus.resultFiles.mono && (
                    <Button
                      onClick={() => downloadResult('mono')}
                      size="sm"
                      color="green"
                    >
                      下载翻译结果 (单语言)
                    </Button>
                  )}
                  
                  {translationStatus.resultFiles.dual && (
                    <Button
                      onClick={() => downloadResult('dual')}
                      size="sm"
                      color="green"
                    >
                      下载翻译结果 (双语言)
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 右侧 - 预览区域 */}
        <div className="h-full">
          <div className="rounded-lg border border-gray-300 dark:border-gray-700 h-[600px] overflow-hidden">
            <h3 className="font-medium p-4 border-b border-gray-300 dark:border-gray-700">PDF预览</h3>
            
            <div className="h-[550px] overflow-y-auto p-4">
              {previewUrl ? (
                <iframe 
                  src={previewUrl} 
                  className="w-full h-full" 
                  title="PDF预览"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg 
                      className="w-12 h-12 mx-auto mb-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={1.5} 
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" 
                      />
                    </svg>
                    <p>上传PDF文件后预览</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 