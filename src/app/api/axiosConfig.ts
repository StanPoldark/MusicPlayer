// axiosConfig.ts
import axios, { AxiosInstance } from 'axios';
import qs from 'querystring';

// 创建统一的 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://neteasecloudmusicapi-ashen-gamma.vercel.app',
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 全局默认值配置
axios.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.transformRequest = (data) => qs.stringify(data);
axios.defaults.withCredentials = true;

// 统一的请求拦截器
apiClient.interceptors.request.use(
  config => {
    config.params = {
      ...config.params,
      timestamp: Date.now()
    };
    return config;
  },
  error => Promise.reject(error)
);

// 统一的响应拦截器
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    const errorMsg = error.response?.data?.message || '请求失败';
    console.error('API Error:', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

// 统一的 API 调用错误处理
export const handleApiCall = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

export { apiClient };