import { NavigationClient } from './client';
import { MockNavigationClient } from './mock';

const isDevEnvironment = import.meta.env.DEV;
const useRealApi = import.meta.env.VITE_USE_REAL_API === 'true';

// 导出单例 API 实例
export const api =
    isDevEnvironment && !useRealApi
        ? new MockNavigationClient()
        : new NavigationClient(isDevEnvironment ? 'http://localhost:8788/api' : '/api');
