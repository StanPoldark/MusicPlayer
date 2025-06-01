import { MusicSourceInfo } from '@/types/music';

/**
 * 音乐源配置
 */
export const MUSIC_SOURCE_CONFIG = {
  // 默认音乐源
  defaultSource: 'netease',
  
  // 搜索配置
  search: {
    defaultLimit: 30,
    maxLimit: 100,
    timeout: 10000, // 10秒超时
    enableAggregation: true, // 是否启用聚合搜索
  },
  
  // 缓存配置
  cache: {
    searchTTL: 5 * 60 * 1000, // 搜索结果缓存5分钟
    trackUrlTTL: 30 * 60 * 1000, // 播放链接缓存30分钟
    lyricsTTL: 60 * 60 * 1000, // 歌词缓存1小时
    trackInfoTTL: 60 * 60 * 1000, // 歌曲信息缓存1小时
  },
  
  // 重试配置
  retry: {
    maxAttempts: 3,
    delay: 1000, // 1秒延迟
    backoff: 2, // 指数退避
  },
  
  // 音质配置
  quality: {
    default: 'high',
    fallback: ['high', 'medium', 'low'], // 降级顺序
  }
};

/**
 * 音乐源预设配置
 */
export const MUSIC_SOURCE_PRESETS: { [key: string]: Partial<MusicSourceInfo> } = {
  netease: {
    id: 'netease',
    name: '网易云音乐',
    description: '网易云音乐API，提供丰富的中文音乐资源',
    icon: '🎵',
    enabled: true,
    priority: 1,
    supportedFeatures: {
      search: true,
      getTrackUrl: true,
      getLyrics: true,
      getPlaylist: true,
      getAlbum: true,
      getArtist: true,
    },
    rateLimit: {
      requestsPerSecond: 10,
      requestsPerMinute: 300,
    }
  },
  
  // QQ音乐预设（示例）
  qqmusic: {
    id: 'qqmusic',
    name: 'QQ音乐',
    description: 'QQ音乐API，腾讯音乐平台',
    icon: '🎶',
    enabled: false, // 默认禁用，需要实现后启用
    priority: 2,
    supportedFeatures: {
      search: true,
      getTrackUrl: true,
      getLyrics: true,
      getPlaylist: true,
      getAlbum: true,
      getArtist: true,
    },
    rateLimit: {
      requestsPerSecond: 5,
      requestsPerMinute: 200,
    }
  },
  
  // 酷狗音乐预设（示例）
  kugou: {
    id: 'kugou',
    name: '酷狗音乐',
    description: '酷狗音乐API',
    icon: '🎤',
    enabled: false,
    priority: 3,
    supportedFeatures: {
      search: true,
      getTrackUrl: true,
      getLyrics: true,
      getPlaylist: false,
      getAlbum: true,
      getArtist: true,
    },
    rateLimit: {
      requestsPerSecond: 8,
      requestsPerMinute: 250,
    }
  },
  
  // Spotify预设（示例）
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    description: 'Spotify API，国际音乐平台',
    icon: '🎧',
    enabled: false,
    priority: 4,
    supportedFeatures: {
      search: true,
      getTrackUrl: false, // Spotify通常不提供直接播放链接
      getLyrics: false,
      getPlaylist: true,
      getAlbum: true,
      getArtist: true,
    },
    rateLimit: {
      requestsPerSecond: 20,
      requestsPerMinute: 1000,
    }
  }
};

/**
 * 获取音乐源配置
 */
export function getMusicSourceConfig(sourceId: string): Partial<MusicSourceInfo> | undefined {
  return MUSIC_SOURCE_PRESETS[sourceId];
}

/**
 * 获取所有可用的音乐源预设
 */
export function getAllMusicSourcePresets(): { [key: string]: Partial<MusicSourceInfo> } {
  return MUSIC_SOURCE_PRESETS;
}

/**
 * 检查音乐源是否支持特定功能
 */
export function isFeatureSupported(sourceId: string, feature: keyof MusicSourceInfo['supportedFeatures']): boolean {
  const config = getMusicSourceConfig(sourceId);
  return config?.supportedFeatures?.[feature] ?? false;
}

/**
 * 获取音乐源的速率限制配置
 */
export function getRateLimit(sourceId: string): { requestsPerSecond: number; requestsPerMinute: number } | undefined {
  const config = getMusicSourceConfig(sourceId);
  return config?.rateLimit;
} 