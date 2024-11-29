import axios from 'axios';
import qs from 'querystring';

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
      ...config.params
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


const handleApiCall = async <T>(apiCall: () => Promise<T>): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
};

// Function to get login state
export const getUserMusicList = async (uid: number): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/user/playlist', {
      params: { uid, limit: 100, }
    })
  );
};


export const getDetailList = async ( id: number | string,
  offset?: number,
  limit: number = 20): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/playlist/track/all', {
      params: { id, offset, limit  }
    })
  );
};



export const getSongUrl = async (id: number): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/song/url', {
      params: { id }
    })
  );
};

export const checkSong = async (id: number): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/check/music', {
      params: { id }
    })
  );
};




export const getlyric = async (id: number): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/lyric', {
      params: { id }
    })
  );
};


