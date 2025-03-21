'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useStore } from '@/store/store';
import { ApiConfig, ApiProvider } from '@/types';
import { generateId } from '@/utils/helpers';

// 内联SVG图标
const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 mr-2">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53-1.794-1.794a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);

interface ApiConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// 提供商选项
const providerOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'qwen', label: '阿里千问' },
];

// 默认OpenAI模型选项
const openaiModelOptions = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo (16K)' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4-32k', label: 'GPT-4 (32K)' },
];

// 默认阿里千问模型选项
const qwenModelOptions = [
  { value: 'qwen-max', label: 'Qwen-Max' },
  { value: 'qwen-plus', label: 'Qwen-Plus' },
  { value: 'qwen-turbo', label: 'Qwen-Turbo' },
];

export const ApiConfigPanel: React.FC<ApiConfigPanelProps> = ({ isOpen, onClose }) => {
  const { 
    apiConfig, 
    updateApiConfig, 
    apiProviders, 
    currentApiProviderId, 
    setCurrentApiProviderId,
    updateApiProvider,
    addApiProvider,
    deleteApiProvider
  } = useStore();
  
  const [config, setConfig] = useState<ApiConfig>(apiConfig);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'success' | 'error'>('none');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'providers'>('general');
  const [editingProviderId, setEditingProviderId] = useState<string | null>(currentApiProviderId);
  const [newProvider, setNewProvider] = useState<Omit<ApiProvider, 'id'> | null>(null);
  const [isEditingModels, setIsEditingModels] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelValue, setNewModelValue] = useState('');
  
  // 当store中的apiConfig变化时更新本地状态
  useEffect(() => {
    setConfig(apiConfig);
  }, [apiConfig]);
  
  // 当currentApiProviderId变化时更新editingProviderId
  useEffect(() => {
    if (currentApiProviderId) {
      setEditingProviderId(currentApiProviderId);
    }
  }, [currentApiProviderId]);
  
  // 获取当前正在编辑的API提供商
  const editingProvider = apiProviders.find(p => p.id === editingProviderId) || null;
  
  // 处理通用配置变化
  const handleConfigChange = (field: keyof ApiConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // 处理提供商选择变化
  const handleProviderChange = (providerId: string) => {
    setEditingProviderId(providerId);
  };
  
  // 处理提供商编辑
  const handleProviderEdit = (field: keyof ApiProvider, value: any) => {
    if (!editingProviderId) return;
    
    updateApiProvider(editingProviderId, { [field]: value });
    
    // 如果更改的是当前选中的提供商，同步更新apiConfig
    if (editingProviderId === currentApiProviderId) {
      if (field === 'apiKey' || field === 'apiUrl' || field === 'provider') {
        updateApiConfig({ [field]: value });
      }
    }
  };
  
  // 创建新的API提供商
  const createNewProvider = () => {
    setNewProvider({
      name: '',
      provider: 'openai',
      apiKey: '',
      apiUrl: 'https://api.openai.com/v1',
      availableModels: openaiModelOptions,
    });
  };
  
  // 取消创建新的API提供商
  const cancelNewProvider = () => {
    setNewProvider(null);
  };
  
  // 保存新的API提供商
  const saveNewProvider = () => {
    if (!newProvider || !newProvider.name) return;
    
    const id = generateId();
    addApiProvider({
      id,
      ...newProvider
    });
    
    setNewProvider(null);
    setEditingProviderId(id);
  };
  
  // 处理新提供商变更
  const handleNewProviderChange = (field: keyof Omit<ApiProvider, 'id'>, value: any) => {
    if (!newProvider) return;
    
    // 特殊处理提供商类型变更，更新默认URL和可用模型
    if (field === 'provider') {
      let apiUrl = 'https://api.openai.com/v1';
      let availableModels = openaiModelOptions;
      
      if (value === 'qwen') {
        apiUrl = 'https://dashscope.aliyuncs.com/api/v1';
        availableModels = qwenModelOptions;
      }
      
      setNewProvider(prev => ({
        ...prev!,
        provider: value,
        apiUrl,
        availableModels,
      }));
    } else {
      setNewProvider(prev => ({
        ...prev!,
        [field]: value
      }));
    }
  };
  
  // 设置为当前使用的API提供商
  const setAsCurrentProvider = (providerId: string) => {
    setCurrentApiProviderId(providerId);
  };
  
  // 删除API提供商
  const removeProvider = (providerId: string) => {
    if (apiProviders.length <= 1) return; // 至少保留一个提供商
    deleteApiProvider(providerId);
  };
  
  // 测试API连接
  const testConnection = async () => {
    if (!editingProvider || !editingProvider.apiKey) {
      setConnectionStatus('error');
      setErrorMessage('请输入API密钥');
      return;
    }
    
    setIsConnecting(true);
    setConnectionStatus('none');
    setErrorMessage('');
    
    const testPayload = {
      apiKey: editingProvider.apiKey,
      apiUrl: editingProvider.apiUrl,
      model: editingProvider.availableModels[0]?.value || '',
      provider: editingProvider.provider
    };
    
    try {
      const response = await fetch('/api/chat/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setErrorMessage(data.error || '连接失败');
      }
    } catch (error: any) {
      setConnectionStatus('error');
      setErrorMessage('连接失败，请检查网络');
    } finally {
      setIsConnecting(false);
    }
  };
  
  // 保存配置
  const saveConfig = () => {
    updateApiConfig(config);
    onClose();
  };
  
  // 添加新模型到提供商
  const addModelToProvider = () => {
    if (!editingProviderId || !newModelName || !newModelValue) return;
    
    const provider = apiProviders.find(p => p.id === editingProviderId);
    if (!provider) return;
    
    const updatedModels = [
      ...provider.availableModels,
      { label: newModelName, value: newModelValue }
    ];
    
    updateApiProvider(editingProviderId, { availableModels: updatedModels });
    
    // 重置表单
    setNewModelName('');
    setNewModelValue('');
  };
  
  // 从提供商中删除模型
  const removeModelFromProvider = (modelValue: string) => {
    if (!editingProviderId) return;
    
    const provider = apiProviders.find(p => p.id === editingProviderId);
    if (!provider) return;
    
    const updatedModels = provider.availableModels.filter(
      model => model.value !== modelValue
    );
    
    updateApiProvider(editingProviderId, { availableModels: updatedModels });
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-gray-100">API 配置</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <XMarkIcon />
          </button>
        </div>
        
        {/* 选项卡 */}
        <div className="flex border-b border-gray-700">
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'general' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('general')}
          >
            通用设置
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${activeTab === 'providers' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('providers')}
          >
            API提供商
          </button>
        </div>
        
        {/* 通用设置 */}
        {activeTab === 'general' && (
          <div className="p-6 space-y-4">
            <div className="flex-1">
              <Input
                label="温度"
                type="number"
                min="0"
                max="2"
                step="0.1"
                fullWidth
                value={config.temperature.toString()}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <Input
                label="最大令牌数"
                type="number"
                min="1"
                max="8000"
                fullWidth
                value={config.maxTokens.toString()}
                onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
              />
            </div>
          </div>
        )}
        
        {/* API提供商设置 */}
        {activeTab === 'providers' && (
          <div className="flex h-96">
            {/* 左侧提供商列表 */}
            <div className="w-1/3 border-r border-gray-700 overflow-y-auto">
              <div className="p-4">
                <Button
                  variant="outline"
                  className="mb-2 w-full"
                  onClick={createNewProvider}
                  leftIcon={<PlusIcon />}
                >
                  添加提供商
                </Button>
                
                <div className="space-y-1 mt-4">
                  {apiProviders.map(provider => (
                    <button
                      key={provider.id}
                      className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md ${provider.id === editingProviderId ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                      onClick={() => handleProviderChange(provider.id)}
                    >
                      <span>{provider.name}</span>
                      {provider.id === currentApiProviderId && (
                        <span className="text-xs bg-blue-600 px-1.5 py-0.5 rounded text-white">当前</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* 右侧编辑区域 */}
            <div className="w-2/3 p-4 overflow-y-auto">
              {newProvider ? (
                /* 新提供商表单 */
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-200">添加新提供商</h3>
                  
                  <Input
                    label="名称"
                    fullWidth
                    value={newProvider.name}
                    onChange={(e) => handleNewProviderChange('name', e.target.value)}
                    placeholder="例如: 我的OpenAI账户"
                  />
                  
                  <Select
                    label="提供商类型"
                    options={providerOptions}
                    value={newProvider.provider}
                    onChange={(value) => handleNewProviderChange('provider', value)}
                    fullWidth
                  />
                  
                  <Input
                    label="API密钥"
                    type="password"
                    fullWidth
                    value={newProvider.apiKey}
                    onChange={(e) => handleNewProviderChange('apiKey', e.target.value)}
                    placeholder="sk-..."
                  />
                  
                  <Input
                    label="API URL"
                    fullWidth
                    value={newProvider.apiUrl}
                    onChange={(e) => handleNewProviderChange('apiUrl', e.target.value)}
                    placeholder={newProvider.provider === 'openai' ? 
                      "https://api.openai.com/v1" : 
                      "https://dashscope.aliyuncs.com/api/v1"}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="ghost" onClick={cancelNewProvider}>取消</Button>
                    <Button 
                      onClick={saveNewProvider}
                      disabled={!newProvider.name || !newProvider.apiKey}
                    >
                      保存
                    </Button>
                  </div>
                </div>
              ) : editingProvider ? (
                /* 编辑现有提供商 */
                <>
                {!isEditingModels ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-200">{editingProvider.name}</h3>
                      <div className="flex space-x-2">
                        {editingProvider.id !== currentApiProviderId && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setAsCurrentProvider(editingProvider.id)}
                          >
                            设为当前
                          </Button>
                        )}
                        
                        {apiProviders.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                            onClick={() => removeProvider(editingProvider.id)}
                          >
                            <TrashIcon />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <Input
                      label="名称"
                      fullWidth
                      value={editingProvider.name}
                      onChange={(e) => handleProviderEdit('name', e.target.value)}
                    />
                    
                    <Select
                      label="提供商类型"
                      options={providerOptions}
                      value={editingProvider.provider}
                      onChange={(value) => handleProviderEdit('provider', value)}
                      fullWidth
                    />
                    
                    <Input
                      label="API密钥"
                      type="password"
                      fullWidth
                      value={editingProvider.apiKey}
                      onChange={(e) => handleProviderEdit('apiKey', e.target.value)}
                      placeholder="sk-..."
                    />
                    
                    <Input
                      label="API URL"
                      fullWidth
                      value={editingProvider.apiUrl}
                      onChange={(e) => handleProviderEdit('apiUrl', e.target.value)}
                      placeholder={editingProvider.provider === 'openai' ? 
                        "https://api.openai.com/v1" : 
                        "https://dashscope.aliyuncs.com/api/v1"}
                    />
                    
                    <div className="flex justify-between items-center mt-6 mb-2">
                      <h4 className="font-medium text-gray-300">可用模型</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditingModels(true)}
                      >
                        管理模型
                      </Button>
                    </div>
                    
                    <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-700 rounded-md p-2">
                      {editingProvider.availableModels.length > 0 ? (
                        editingProvider.availableModels.map((model, index) => (
                          <div key={index} className="flex justify-between items-center text-sm py-1 px-2 hover:bg-gray-700 rounded-md">
                            <div className="flex-1">
                              <span className="text-gray-300">{model.label}</span>
                              <span className="text-gray-500 text-xs ml-2">({model.value})</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm py-2 text-center">没有可用模型</div>
                      )}
                    </div>
                    
                    <Button 
                      onClick={testConnection} 
                      variant="outline" 
                      isLoading={isConnecting}
                      className="w-full"
                    >
                      测试连接
                    </Button>
                    
                    {connectionStatus === 'success' && (
                      <div className="flex items-center text-green-500 mt-2">
                        <CheckCircleIcon />
                        <span>连接成功</span>
                      </div>
                    )}
                    
                    {connectionStatus === 'error' && (
                      <div className="text-red-500 mt-2">
                        <p>连接错误: {errorMessage}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-200">管理模型 - {editingProvider.name}</h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsEditingModels(false)}
                      >
                        <XMarkIcon />
                      </Button>
                    </div>
                    
                    <div className="border-b border-gray-700 pb-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">添加新模型</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          label="显示名称"
                          value={newModelName}
                          onChange={(e) => setNewModelName(e.target.value)}
                          placeholder="例如：GPT-4o"
                        />
                        <Input
                          label="模型ID"
                          value={newModelValue}
                          onChange={(e) => setNewModelValue(e.target.value)}
                          placeholder="例如：gpt-4o"
                        />
                      </div>
                      <Button 
                        onClick={addModelToProvider}
                        disabled={!newModelName || !newModelValue}
                        className="mt-2 w-full"
                      >
                        添加模型
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">当前模型列表</h4>
                      <div className="space-y-1 max-h-64 overflow-y-auto">
                        {editingProvider.availableModels.length > 0 ? (
                          editingProvider.availableModels.map((model, index) => (
                            <div key={index} className="flex justify-between items-center text-sm py-2 px-3 hover:bg-gray-700 rounded-md">
                              <div>
                                <span className="text-gray-300">{model.label}</span>
                                <span className="text-gray-500 text-xs ml-2">({model.value})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                onClick={() => removeModelFromProvider(model.value)}
                              >
                                <TrashIcon />
                              </Button>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-500 text-sm py-4 text-center border border-gray-700 rounded-md">
                            没有可用模型，请添加一些模型
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  选择一个API提供商或添加新的提供商
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="px-6 py-4 bg-gray-900 flex justify-end">
          <div className="space-x-2">
            <Button onClick={onClose} variant="ghost">
              取消
            </Button>
            <Button onClick={saveConfig}>
              保存设置
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 