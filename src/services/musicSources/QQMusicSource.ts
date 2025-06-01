import { IMusicSource } from './IMusicSource';
import {
  Track,
  Artist,
  Album,
  Playlist,
  SearchResult,
  Lyric,
  MusicQuality,
  SearchOptions,
  MusicSourceInfo,
  ApiResponse,
  LyricLine
} from '@/types/music';

/**
 * QQ音乐源实现
 * 这是一个示例实现，展示如何添加新的音乐源
 */
export class QQMusicSource extends IMusicSource {
  private baseUrl: string;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  constructor() {
    const info: MusicSourceInfo = {
      id: 'qqmusic',
      name: 'QQ音乐',
      description: 'QQ音乐API，腾讯音乐平台',
      icon: '🎶',
      enabled: false, // 默认禁用，需要配置API后启用
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
    };

    super(info);
    this.baseUrl = '/api/proxy/qqmusic'; // 需要配置QQ音乐代理
  }

  async isAvailable(): Promise<boolean> {
    try {
      // 检查QQ音乐API是否可用
      const response = await fetch(`${this.baseUrl}/ping`, {
        method: 'GET',
        timeout: 5000,
      } as any);
      return response.ok;
    } catch (error) {
      console.warn('[QQMusicSource] Availability check failed:', error);
      return false;
    }
  }

  async search(options: SearchOptions): Promise<ApiResponse<SearchResult>> {
    try {
      const { keyword, type = 'all', limit = 30, offset = 0 } = options;
      
      if (!keyword.trim()) {
        return this.handleError(new Error('搜索关键词不能为空'), 'search');
      }

      // 缓存检查
      const cacheKey = this.getCacheKey('search', options);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached);
      }

      // QQ音乐搜索API调用
      const searchResult: SearchResult = {
        tracks: [],
        artists: [],
        albums: [],
        playlists: [],
        total: 0,
        hasMore: false
      };

      // 注意：这里是示例实现，实际需要根据QQ音乐API文档进行调整
      if (type === 'all' || type === 'track') {
        const trackResponse = await this.searchTracks(keyword, limit, offset);
        if (trackResponse.success && trackResponse.data) {
          searchResult.tracks = trackResponse.data;
          searchResult.total += trackResponse.data.length;
        }
      }

      if (type === 'all' || type === 'artist') {
        const artistResponse = await this.searchArtists(keyword, limit, offset);
        if (artistResponse.success && artistResponse.data) {
          searchResult.artists = artistResponse.data;
        }
      }

      if (type === 'all' || type === 'album') {
        const albumResponse = await this.searchAlbums(keyword, limit, offset);
        if (albumResponse.success && albumResponse.data) {
          searchResult.albums = albumResponse.data;
        }
      }

      if (type === 'all' || type === 'playlist') {
        const playlistResponse = await this.searchPlaylists(keyword, limit, offset);
        if (playlistResponse.success && playlistResponse.data) {
          searchResult.playlists = playlistResponse.data;
        }
      }

      // 缓存结果
      this.setCache(cacheKey, searchResult, 5 * 60 * 1000); // 5分钟缓存

      return this.createSuccessResponse(searchResult);
    } catch (error) {
      return this.handleError(error, 'search');
    }
  }

  private async searchTracks(keyword: string, limit: number, offset: number): Promise<ApiResponse<Track[]>> {
    try {
      // 示例API调用 - 实际需要根据QQ音乐API调整
      const response = await fetch(
        `${this.baseUrl}/search/song?keyword=${encodeURIComponent(keyword)}&limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`搜索歌曲失败: ${response.status}`);
      }

      const data = await response.json();
      
      // 根据QQ音乐API响应格式调整
      const tracks = data.data?.list?.map((song: any) => this.normalizeTrack(song)) || [];
      
      return this.createSuccessResponse(tracks);
    } catch (error) {
      return this.handleError(error, 'searchTracks');
    }
  }

  private async searchArtists(keyword: string, limit: number, offset: number): Promise<ApiResponse<Artist[]>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/singer?keyword=${encodeURIComponent(keyword)}&limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`搜索歌手失败: ${response.status}`);
      }

      const data = await response.json();
      const artists = data.data?.list?.map((artist: any) => this.normalizeArtist(artist)) || [];
      
      return this.createSuccessResponse(artists);
    } catch (error) {
      return this.handleError(error, 'searchArtists');
    }
  }

  private async searchAlbums(keyword: string, limit: number, offset: number): Promise<ApiResponse<Album[]>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/album?keyword=${encodeURIComponent(keyword)}&limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`搜索专辑失败: ${response.status}`);
      }

      const data = await response.json();
      const albums = data.data?.list?.map((album: any) => this.normalizeAlbum(album)) || [];
      
      return this.createSuccessResponse(albums);
    } catch (error) {
      return this.handleError(error, 'searchAlbums');
    }
  }

  private async searchPlaylists(keyword: string, limit: number, offset: number): Promise<ApiResponse<Playlist[]>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/search/playlist?keyword=${encodeURIComponent(keyword)}&limit=${limit}&offset=${offset}`
      );
      
      if (!response.ok) {
        throw new Error(`搜索歌单失败: ${response.status}`);
      }

      const data = await response.json();
      const playlists = data.data?.list?.map((playlist: any) => this.normalizePlaylist(playlist)) || [];
      
      return this.createSuccessResponse(playlists);
    } catch (error) {
      return this.handleError(error, 'searchPlaylists');
    }
  }

  async getTrackUrl(trackId: string, quality: string = 'standard'): Promise<ApiResponse<string>> {
    try {
      const originalId = this.extractOriginalId(trackId);
      
      // 缓存检查
      const cacheKey = this.getCacheKey('trackUrl', { trackId: originalId, quality });
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached);
      }

      const response = await fetch(`${this.baseUrl}/song/url?songmid=${originalId}&quality=${quality}`);
      
      if (!response.ok) {
        throw new Error(`获取播放链接失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data.playUrl) {
        throw new Error('歌曲暂时无法播放');
      }

      const url = data.data.playUrl;
      
      // 缓存结果
      this.setCache(cacheKey, url, 30 * 60 * 1000); // 30分钟缓存

      return this.createSuccessResponse(url);
    } catch (error) {
      return this.handleError(error, 'getTrackUrl');
    }
  }

  async getLyrics(trackId: string): Promise<ApiResponse<Lyric>> {
    try {
      const originalId = this.extractOriginalId(trackId);
      
      // 缓存检查
      const cacheKey = this.getCacheKey('lyrics', originalId);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return this.createSuccessResponse(cached);
      }

      const response = await fetch(`${this.baseUrl}/lyric?songmid=${originalId}`);
      
      if (!response.ok) {
        throw new Error(`获取歌词失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data || !data.data.lyric) {
        throw new Error('歌词获取失败');
      }

      const lyric: Lyric = {
        lines: this.parseLyric(data.data.lyric),
        translation: data.data.trans ? this.parseLyric(data.data.trans) : undefined,
        source: this.info.id
      };

      // 缓存结果
      this.setCache(cacheKey, lyric, 60 * 60 * 1000); // 1小时缓存

      return this.createSuccessResponse(lyric);
    } catch (error) {
      return this.handleError(error, 'getLyrics');
    }
  }

  async getTrackInfo(trackId: string): Promise<ApiResponse<Track>> {
    try {
      const originalId = this.extractOriginalId(trackId);
      
      const response = await fetch(`${this.baseUrl}/song/detail?songmid=${originalId}`);
      
      if (!response.ok) {
        throw new Error(`获取歌曲信息失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        throw new Error('歌曲信息获取失败');
      }

      const track = this.normalizeTrack(data.data);
      
      return this.createSuccessResponse(track);
    } catch (error) {
      return this.handleError(error, 'getTrackInfo');
    }
  }

  async getArtistInfo(artistId: string): Promise<ApiResponse<Artist>> {
    try {
      const originalId = this.extractOriginalId(artistId);
      
      const response = await fetch(`${this.baseUrl}/singer/detail?singermid=${originalId}`);
      
      if (!response.ok) {
        throw new Error(`获取歌手信息失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        throw new Error('歌手信息获取失败');
      }

      const artist = this.normalizeArtist(data.data);
      
      return this.createSuccessResponse(artist);
    } catch (error) {
      return this.handleError(error, 'getArtistInfo');
    }
  }

  async getAlbumInfo(albumId: string): Promise<ApiResponse<Album>> {
    try {
      const originalId = this.extractOriginalId(albumId);
      
      const response = await fetch(`${this.baseUrl}/album/detail?albummid=${originalId}`);
      
      if (!response.ok) {
        throw new Error(`获取专辑信息失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        throw new Error('专辑信息获取失败');
      }

      const album = this.normalizeAlbum(data.data);
      
      return this.createSuccessResponse(album);
    } catch (error) {
      return this.handleError(error, 'getAlbumInfo');
    }
  }

  async getPlaylistInfo(playlistId: string): Promise<ApiResponse<Playlist>> {
    try {
      const originalId = this.extractOriginalId(playlistId);
      
      const response = await fetch(`${this.baseUrl}/playlist/detail?id=${originalId}`);
      
      if (!response.ok) {
        throw new Error(`获取歌单信息失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.data) {
        throw new Error('歌单信息获取失败');
      }

      const playlist = this.normalizePlaylist(data.data);
      
      return this.createSuccessResponse(playlist);
    } catch (error) {
      return this.handleError(error, 'getPlaylistInfo');
    }
  }

  async getAvailableQualities(): Promise<ApiResponse<MusicQuality[]>> {
    try {
      const qualities: MusicQuality[] = [
        { quality: 'low', bitrate: 128, format: 'mp3' },
        { quality: 'medium', bitrate: 320, format: 'mp3' },
        { quality: 'high', bitrate: 999, format: 'flac' },
      ];
      
      return this.createSuccessResponse(qualities);
    } catch (error) {
      return this.handleError(error, 'getAvailableQualities');
    }
  }

  async checkTrackAvailability(): Promise<ApiResponse<boolean>> {
    try {
      // QQ音乐的可用性检查逻辑
      return this.createSuccessResponse(true);
    } catch {
      return this.createSuccessResponse(false);
    }
  }

  async getHotTracks(limit: number = 50): Promise<ApiResponse<Track[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/top/songs?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`获取热门歌曲失败: ${response.status}`);
      }

      const data = await response.json();
      const tracks = data.data?.list?.map((song: any) => this.normalizeTrack(song)) || [];
      
      return this.createSuccessResponse(tracks);
    } catch (error) {
      return this.handleError(error, 'getHotTracks');
    }
  }

  async getRecommendedTracks(limit: number = 30): Promise<ApiResponse<Track[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/recommend/songs?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`获取推荐歌曲失败: ${response.status}`);
      }

      const data = await response.json();
      const tracks = data.data?.list?.map((song: any) => this.normalizeTrack(song)) || [];
      
      return this.createSuccessResponse(tracks);
    } catch (error) {
      return this.handleError(error, 'getRecommendedTracks');
    }
  }

  // 数据标准化方法 - 根据QQ音乐API响应格式调整
  protected normalizeTrack(sourceTrack: any): Track {
    return {
      id: this.generateId(sourceTrack.songmid || sourceTrack.id?.toString() || ''),
      name: sourceTrack.songname || sourceTrack.title || '',
      artist: sourceTrack.singer?.map((s: any) => s.name).join(', ') || '未知艺术家',
      artistId: sourceTrack.singer?.[0]?.mid ? this.generateId(sourceTrack.singer[0].mid) : undefined,
      album: sourceTrack.albumname || '未知专辑',
      albumId: sourceTrack.albummid ? this.generateId(sourceTrack.albummid) : undefined,
      duration: sourceTrack.interval || 0,
      cover: sourceTrack.albumpic || '',
      source: this.info.id,
      sourceTrackId: sourceTrack.songmid || sourceTrack.id?.toString() || '',
      available: sourceTrack.pay?.payplay !== 1 // QQ音乐付费逻辑
    };
  }

  protected normalizeArtist(sourceArtist: any): Artist {
    return {
      id: this.generateId(sourceArtist.singermid || sourceArtist.id?.toString() || ''),
      name: sourceArtist.singername || sourceArtist.name || '',
      avatar: sourceArtist.singerpic || '',
      description: sourceArtist.desc || '',
      source: this.info.id,
      sourceArtistId: sourceArtist.singermid || sourceArtist.id?.toString() || ''
    };
  }

  protected normalizeAlbum(sourceAlbum: any): Album {
    return {
      id: this.generateId(sourceAlbum.albummid || sourceAlbum.id?.toString() || ''),
      name: sourceAlbum.albumname || sourceAlbum.name || '',
      artist: sourceAlbum.singername || '未知艺术家',
      artistId: sourceAlbum.singermid ? this.generateId(sourceAlbum.singermid) : undefined,
      cover: sourceAlbum.albumpic || '',
      releaseDate: sourceAlbum.publictime || undefined,
      description: sourceAlbum.desc || '',
      trackCount: sourceAlbum.songnum || 0,
      source: this.info.id,
      sourceAlbumId: sourceAlbum.albummid || sourceAlbum.id?.toString() || ''
    };
  }

  protected normalizePlaylist(sourcePlaylist: any): Playlist {
    return {
      id: this.generateId(sourcePlaylist.dissid || sourcePlaylist.id?.toString() || ''),
      name: sourcePlaylist.dissname || sourcePlaylist.title || '',
      description: sourcePlaylist.introduction || '',
      cover: sourcePlaylist.imgurl || '',
      trackCount: sourcePlaylist.songnum || 0,
      creator: sourcePlaylist.nickname || '未知用户',
      source: this.info.id,
      sourcePlaylistId: sourcePlaylist.dissid || sourcePlaylist.id?.toString() || ''
    };
  }

  // 工具方法
  protected parseLyric(lyricText: string): LyricLine[] {
    if (!lyricText) return [];
    
    const lines = lyricText.split('\n');
    const lyricLines: LyricLine[] = [];
    
    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const [, minutes, seconds, milliseconds, text] = match;
        const time = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(milliseconds.padEnd(3, '0')) / 1000;
        lyricLines.push({ time, text: text.trim() });
      }
    }
    
    return lyricLines.sort((a, b) => a.time - b.time);
  }

  protected generateId(originalId: string): string {
    return `qq_${originalId}`;
  }

  protected extractOriginalId(id: string): string {
    return id.startsWith('qq_') ? id.substring(3) : id;
  }

  protected getCacheKey(method: string, params: any): string {
    return `${this.info.id}_${method}_${JSON.stringify(params)}`;
  }

  protected getFromCache(key: string): any {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  protected setCache(key: string, value: any, ttl: number): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }

  protected createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      source: this.info.id
    };
  }

  protected handleError(error: any, operation: string): ApiResponse<any> {
    console.error(`[QQMusic] ${operation} error:`, error);
    
    return {
      success: false,
      error: {
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || `${operation} failed`,
        source: this.info.id,
        details: error
      },
      source: this.info.id
    };
  }
} 