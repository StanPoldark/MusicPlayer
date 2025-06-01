// axiosConfig.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import qs from 'querystring';

// Simple in-memory cache
interface CacheItem {
  data: any;
  timestamp: number;
  expiry: number;
}

class ApiCache {
  private cache: Map<string, CacheItem> = new Map();
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes default

  // Generate a cache key from the request
  private generateCacheKey(config: AxiosRequestConfig): string {
    const { url, method, params, data } = config;
    return `${method || 'GET'}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
  }

  // Check if a request exists in cache and is valid
  public get(config: AxiosRequestConfig): any | null {
    const key = this.generateCacheKey(config);
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // Check if cache has expired
    if (Date.now() > item.timestamp + item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  // Set cache for a request
  public set(config: AxiosRequestConfig, data: any, expiry = this.DEFAULT_EXPIRY): void {
    const key = this.generateCacheKey(config);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  // Clear entire cache
  public clear(): void {
    this.cache.clear();
  }

  // Clear expired cache items
  public clearExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

const apiCache = new ApiCache();

// Store for retry counts
const retryMap = new Map<string, number>();

// Create a uniform axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://neteasecloudmusicapi-ashen-gamma.vercel.app',
  timeout: 15000, // Increased timeout
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Global default value configuration
axios.defaults.headers['Content-Type'] = 'application/x-www-form-urlencoded';
axios.defaults.transformRequest = (data) => qs.stringify(data);
axios.defaults.withCredentials = true;

// Retry configuration
const MAX_RETRIES = 2;
const isRetryableError = (error: AxiosError): boolean => {
  return !error.response || error.response.status >= 500 || error.response.status === 429;
};

// Helper to get cache key for request
const getCacheKeyForRequest = (config: AxiosRequestConfig): string => {
  const { url, method, params, data } = config;
  return `${method || 'GET'}-${url}-${JSON.stringify(params)}-${JSON.stringify(data)}`;
};

// Uniform request interceptor
apiClient.interceptors.request.use(
  config => {
    // Check if we should skip caching
    const shouldCache = config.method?.toLowerCase() === 'get';
    
    // Add caching capability for GET requests
    if (shouldCache) {
      const cachedData = apiCache.get(config);
      if (cachedData) {
        // Create a canceled request with cached data
        const source = axios.CancelToken.source();
        config.cancelToken = source.token;
        setTimeout(() => {
          source.cancel(JSON.stringify(cachedData));
        }, 0);
      }
    }

    // Add timestamp to prevent caching on server side
    config.params = {
      ...config.params,
      timestamp: Date.now()
    };
    
    return config;
  },
  error => Promise.reject(error)
);

// Uniform response interceptor
apiClient.interceptors.response.use(
  response => {
    // Cache successful GET responses
    const shouldCache = response.config.method?.toLowerCase() === 'get';
    if (shouldCache) {
      apiCache.set(response.config, response.data);
    }
    
    return response.data;
  },
  async (error) => {
    // Return cached data if this was a canceled request due to cache hit
    if (axios.isCancel(error)) {
      try {
        return JSON.parse(error.message);
      } catch (e) {
        return error.message; 
      }
    }

    // Handle retry logic
    if (error.config && isRetryableError(error)) {
      const cacheKey = getCacheKeyForRequest(error.config);
      const retryCount = retryMap.get(cacheKey) || 0;
      
      if (retryCount < MAX_RETRIES) {
        // Increment retry count
        retryMap.set(cacheKey, retryCount + 1);
        
        // Exponential backoff delay
        const delay = Math.pow(2, retryCount + 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Clear retry count after 60 seconds
        setTimeout(() => {
          retryMap.delete(cacheKey);
        }, 60000);
        
        return apiClient(error.config);
      }
      
      // Clear the retry count
      retryMap.delete(cacheKey);
    }

    // Handle API errors with better error messages
    const status = error.response?.status;
    let errorMsg = '';
    
    if (error.response?.data?.message) {
      errorMsg = error.response.data.message;
    } else if (status === 401) {
      errorMsg = '认证失败，请重新登录';
    } else if (status === 403) {
      errorMsg = '无权限访问该资源';
    } else if (status === 404) {
      errorMsg = '请求的资源不存在';
    } else if (status === 429) {
      errorMsg = '请求过于频繁，请稍后再试';
    } else if (status && status >= 500) {
      errorMsg = '服务器错误，请稍后再试';
    } else if (!error.response) {
      errorMsg = '网络错误，请检查网络连接';
    } else {
      errorMsg = '请求失败';
    }
    
    console.error(`API Error [${status}]:`, errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

// Unified API call error handling with retry
export const handleApiCall = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  try {
    return await apiCall();
  } catch (error: any) {
    // Further processing can be added here
    console.error('API Call Error:', error.message);
    throw error;
  }
};

// Clear expired cache items every hour
setInterval(() => {
  apiCache.clearExpired();
}, 60 * 60 * 1000);

// Export cache for direct manipulation if needed
export { apiClient, apiCache };