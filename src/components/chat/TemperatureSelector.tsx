import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/store';

interface TemperatureSelectorProps {
  conversationId: string;
}

export const TemperatureSelector: React.FC<TemperatureSelectorProps> = ({ conversationId }) => {
  const { updateConversation, getConversation, apiConfig } = useStore();
  const conversation = getConversation(conversationId);
  
  // 使用会话特定的温度或默认温度
  const currentTemperature = conversation?.temperature !== undefined 
    ? conversation.temperature 
    : apiConfig.temperature;
  
  const [temperature, setTemperature] = useState(currentTemperature);
  
  // 当会话更新时，同步温度状态
  useEffect(() => {
    setTemperature(currentTemperature);
  }, [currentTemperature]);
  
  // 处理温度变更
  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTemp = parseFloat(e.target.value);
    setTemperature(newTemp);
  };
  
  // 温度变更完成后更新会话
  const handleTemperatureChangeComplete = () => {
    if (conversation) {
      updateConversation(conversationId, { temperature });
    }
  };
  
  return (
    <div className="relative">
      <div className="flex items-center space-x-2 px-3 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-300 text-sm">
        <span>温度:</span>
        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={handleTemperatureChange}
            onMouseUp={handleTemperatureChangeComplete}
            onTouchEnd={handleTemperatureChangeComplete}
            className="w-20 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span>{temperature.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
}; 