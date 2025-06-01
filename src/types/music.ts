// 统一的音乐数据类型定义

export interface Track {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  album: string;
  albumId?: string;
  duration: number; // 秒
  cover?: string;
  url?: string;
  lyric?: string;
  source: string; // 音乐源标识
  sourceTrackId: string; // 原始音乐源的ID
  quality?: 'low' | 'medium' | 'high' | 'lossless';
  bitrate?: number;
  size?: number;
  available?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  source: string;
  sourceArtistId: string;
}

export interface Album {
  id: string;
  name: string;
  artist: string;
  artistId?: string;
  cover?: string;
  releaseDate?: string;
  description?: string;
  trackCount?: number;
  source: string;
  sourceAlbumId: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  cover?: string;
  creator?: string;
  trackCount?: number;
  tracks?: Track[];
  source: string;
  sourcePlaylistId: string;
}

export interface SearchResult {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  total: number;
  hasMore: boolean;
}

export interface LyricLine {
  time: number;
  text: string;
}

export interface Lyric {
  lines: LyricLine[];
  translation?: LyricLine[];
  source: string;
}

export interface MusicQuality {
  quality: 'low' | 'medium' | 'high' | 'lossless';
  bitrate: number;
  format: string;
  size?: number;
  url?: string;
}

export interface SearchOptions {
  keyword: string;
  type?: 'track' | 'artist' | 'album' | 'playlist' | 'all';
  limit?: number;
  offset?: number;
  source?: string; // 指定音乐源，不指定则搜索所有
}

export interface MusicSourceInfo {
  id: string;
  name: string;
  description: string;
  icon?: string;
  enabled: boolean;
  priority: number; // 优先级，数字越小优先级越高
  supportedFeatures: {
    search: boolean;
    getTrackUrl: boolean;
    getLyrics: boolean;
    getPlaylist: boolean;
    getAlbum: boolean;
    getArtist: boolean;
  };
  rateLimit?: {
    requestsPerSecond: number;
    requestsPerMinute: number;
  };
}

export interface MusicSourceError {
  code: string;
  message: string;
  source: string;
  details?: any;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: MusicSourceError;
  source: string;
}

// 搜索聚合结果
export interface AggregatedSearchResult {
  results: Map<string, SearchResult>; // 按音乐源分组的结果
  merged: SearchResult; // 合并后的结果
  errors: MusicSourceError[]; // 搜索过程中的错误
} 