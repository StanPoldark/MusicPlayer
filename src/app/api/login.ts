import axios from 'axios';
import qs from 'querystring';

import { 
  QRCodeResponse, 
  LoginStateResponse, 
  CheckQRCodeResponse, 
  LogoutResponse 
} from '@/redux/modules/types'; 

axios.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.transformRequest = (data) => qs.stringify(data);
axios.defaults.withCredentials = true; // 跨域

// 使用拦截器配置 axios 实例
const apiClient = axios.create({
  baseURL: 'https://neteasecloudmusicapi-ashen-gamma.vercel.app',
  timeout: 10000, // 10秒超时
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 请求拦截器：添加公共参数和错误处理
apiClient.interceptors.request.use(
  config => {
    // 为每个请求添加时间戳，防止缓存
    config.params = {
      ...config.params,
      timestamp: Date.now()
    };
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器：统一处理错误
apiClient.interceptors.response.use(
  response => response.data,
  error => {
    const errorMsg = error.response?.data?.message || '请求失败';
    console.error('API Error:', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

// 封装 API 调用的通用错误处理函数
const handleApiCall = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

// Function to get login state
export const getLoginState = async (cookie: string): Promise<LoginStateResponse> => {
  return handleApiCall(() => 
    apiClient.get('/login/status', {
      params: { cookie }
    })
  );
};

// Function to request a QR code for login
export const loginByQRCode = async (): Promise<QRCodeResponse> => {
  return handleApiCall(() => 
    apiClient.get('/login/qr/key')
  );
};

// Function to get the QR code image
export const getQRCode = async (key: string): Promise<QRCodeResponse> => {
  return handleApiCall(() => 
    apiClient.get('/login/qr/create', {
      params: { 
        key, 
        qrimg: true 
      }
    })
  );
};

// Function to check QR code status
export const checkQRCodeState = async (key: string): Promise<CheckQRCodeResponse> => {
  return handleApiCall(() => 
    apiClient.get('/login/qr/check', {
      params: { key }
    })
  );
};

// Function to handle logout
export const logout = async (): Promise<LogoutResponse> => {
  return handleApiCall(() => 
    apiClient.post('/logout')
  );
};

// 导出 axios 实例，方便全局配置和拦截
export { apiClient };