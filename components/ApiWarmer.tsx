'use client';

import { useEffect } from 'react';

/**
 * ApiWarmer组件 - 负责在页面加载时预热API连接
 * 完全在客户端工作，不会渲染任何内容
 */
const ApiWarmer = () => {
  useEffect(() => {
    // 页面加载时立即开始预热
    const warmupApi = async () => {
      try {
        console.log('客户端正在预热API连接...');
        
        // 设置超时，避免卡住太久
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch('/api/warmup', { 
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await res.json();
        console.log('API预热状态:', data);
      } catch (err) {
        // 忽略错误，预热失败不影响用户体验
        console.log('API预热失败 (这不会影响功能)');
      }
    };

    // 执行预热
    warmupApi();
  }, []);

  // 不渲染任何内容
  return null;
};

export default ApiWarmer;
