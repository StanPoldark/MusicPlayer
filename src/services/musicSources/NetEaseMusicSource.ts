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
 * 网易云音乐源实现
 */
export class NetEaseMusicSource extends IMusicSource {
  private baseUrl: string;
  private cache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();

  constructor() {
    const info: MusicSourceInfo = {
      id: 'netease',
      name: '网易云音乐',
      description: '网易云音乐API',
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
    };

    super(info);
    this.baseUrl = 'https://neteasecloudmusicapi-ashen-gamma.vercel.app';
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/search?keywords=test&limit=1`);
      return response.ok;
    } catch (error) {
      console.error('[NetEase] Availability check failed:', error);
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

      const searchPromises: Promise<any>[] = [];
      const searchTypes: number[] = [];

      // 根据类型确定搜索范围
      if (type === 'all' || type === 'track') {
        searchPromises.push(this.searchByType(keyword, 1, limit, offset)); // 歌曲
        searchTypes.push(1);
      }
      if (type === 'all' || type === 'artist') {
        searchPromises.push(this.searchByType(keyword, 100, limit, offset)); // 歌手
        searchTypes.push(100);
      }
      if (type === 'all' || type === 'album') {
        searchPromises.push(this.searchByType(keyword, 10, limit, offset)); // 专辑
        searchTypes.push(10);
      }
      if (type === 'all' || type === 'playlist') {
        searchPromises.push(this.searchByType(keyword, 1000, limit, offset)); // 歌单
        searchTypes.push(1000);
      }

      const results = await Promise.allSettled(searchPromises);
      
      const searchResult: SearchResult = {
        tracks: [],
        artists: [],
        albums: [],
        playlists: [],
        total: 0,
        hasMore: false
      };

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value?.result) {
          const data = result.value.result;
          const searchType = searchTypes[index];

          switch (searchType) {
            case 1: // 歌曲
              if (data.songs) {
                searchResult.tracks = data.songs.map((song: any) => this.normalizeTrack(song));
                searchResult.total += data.songCount || 0;
                searchResult.hasMore = searchResult.hasMore || (data.songCount > limit);
              }
              break;
            case 100: // 歌手
              if (data.artists) {
                searchResult.artists = data.artists.map((artist: any) => this.normalizeArtist(artist));
              }
              break;
            case 10: // 专辑
              if (data.albums) {
                searchResult.albums = data.albums.map((album: any) => this.normalizeAlbum(album));
              }
              break;
            case 1000: // 歌单
              if (data.playlists) {
                searchResult.playlists = data.playlists.map((playlist: any) => this.normalizePlaylist(playlist));
              }
              break;
          }
        }
      });

      // 缓存结果
      this.setCache(cacheKey, searchResult, 5 * 60 * 1000); // 5分钟缓存

      return this.createSuccessResponse(searchResult);
    } catch (error) {
      return this.handleError(error, 'search');
    }
  }

  private async searchByType(keyword: string, type: number, limit: number, offset: number): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/search?keywords=${encodeURIComponent(keyword)}&type=${type}&limit=${limit}&offset=${offset}`
    );
    
    if (!response.ok) {
      throw new Error(`搜索失败: ${response.status}`);
    }
    
    return response.json();
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

      const response = await fetch(`${this.baseUrl}/song/url?id=${originalId}&br=${this.getQualityBitrate(quality)}`);
      
      if (!response.ok) {
        throw new Error(`获取播放链接失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200 || !data.data || !data.data[0] || !data.data[0].url) {
        throw new Error('歌曲暂时无法播放');
      }

      const originalUrl = data.data[0].url;
      // 通过本地代理返回URL
      const proxyUrl = `/api/proxy/music?url=${encodeURIComponent(originalUrl)}`;
      
      // 缓存结果
      this.setCache(cacheKey, proxyUrl, 30 * 60 * 1000); // 30分钟缓存

      return this.createSuccessResponse(proxyUrl);
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

      const response = await fetch(`${this.baseUrl}/lyric?id=${originalId}`);
      
      if (!response.ok) {
        throw new Error(`获取歌词失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200) {
        throw new Error('歌词获取失败');
      }

      const lyric: Lyric = {
        lines: this.parseLyric(data.lrc?.lyric || ''),
        translation: data.tlyric?.lyric ? this.parseLyric(data.tlyric.lyric) : undefined,
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
      
      const response = await fetch(`${this.baseUrl}/song/detail?ids=${originalId}`);
      
      if (!response.ok) {
        throw new Error(`获取歌曲信息失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200 || !data.songs || !data.songs[0]) {
        throw new Error('歌曲信息获取失败');
      }

      const track = this.normalizeTrack(data.songs[0]);
      return this.createSuccessResponse(track);
    } catch (error) {
      return this.handleError(error, 'getTrackInfo');
    }
  }

  async getArtistInfo(artistId: string): Promise<ApiResponse<Artist>> {
    try {
      const originalId = this.extractOriginalId(artistId);
      
      const response = await fetch(`${this.baseUrl}/artist/detail?id=${originalId}`);
      
      if (!response.ok) {
        throw new Error(`获取艺术家信息失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200 || !data.data) {
        throw new Error('艺术家信息获取失败');
      }

      const artist = this.normalizeArtist(data.data.artist);
      return this.createSuccessResponse(artist);
    } catch (error) {
      return this.handleError(error, 'getArtistInfo');
    }
  }

  async getAlbumInfo(albumId: string): Promise<ApiResponse<Album>> {
    try {
      const originalId = this.extractOriginalId(albumId);
      
      const response = await fetch(`${this.baseUrl}/album?id=${originalId}`);
      
      if (!response.ok) {
        throw new Error(`获取专辑信息失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200 || !data.album) {
        throw new Error('专辑信息获取失败');
      }

      const album = this.normalizeAlbum(data.album);
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
        throw new Error(`获取播放列表失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200 || !data.playlist) {
        throw new Error('播放列表获取失败');
      }

      const playlist = this.normalizePlaylist(data.playlist);
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
      // 网易云音乐的可用性检查逻辑
      return this.createSuccessResponse(true);
    } catch {
      return this.createSuccessResponse(false);
    }
  }

  async getHotTracks(limit: number = 50): Promise<ApiResponse<Track[]>> {
    try {
      const response = await fetch(`${this.baseUrl}/top/song?type=0&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`获取热门歌曲失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.code !== 200 || !data.data) {
        throw new Error('热门歌曲获取失败');
      }

      const tracks = data.data.map((song: any) => this.normalizeTrack(song));
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
      
      if (data.code !== 200 || !data.data || !data.data.dailySongs) {
        throw new Error('推荐歌曲获取失败');
      }

      const tracks = data.data.dailySongs.map((song: any) => this.normalizeTrack(song));
      return this.createSuccessResponse(tracks);
    } catch (error) {
      return this.handleError(error, 'getRecommendedTracks');
    }
  }

  // 数据标准化方法
  protected normalizeTrack(sourceTrack: any): Track {
    const artists = sourceTrack.ar || sourceTrack.artists || [];
    const album = sourceTrack.al || sourceTrack.album || {};
    
    return {
      id: this.generateId(sourceTrack.id.toString()),
      name: sourceTrack.name || '',
      artist: artists.map((ar: any) => ar.name).join(', ') || '未知艺术家',
      artistId: artists[0] ? this.generateId(artists[0].id.toString()) : undefined,
      album: album.name || '未知专辑',
      albumId: album.id ? this.generateId(album.id.toString()) : undefined,
      duration: Math.floor((sourceTrack.dt || sourceTrack.duration || 0) / 1000),
      cover: album.picUrl || sourceTrack.picUrl || '',
      source: this.info.id,
      sourceTrackId: sourceTrack.id.toString(),
      available: !sourceTrack.noCopyrightRcmd && sourceTrack.privilege?.st !== -200
    };
  }

  protected normalizeArtist(sourceArtist: any): Artist {
    return {
      id: this.generateId(sourceArtist.id.toString()),
      name: sourceArtist.name || '',
      avatar: sourceArtist.picUrl || sourceArtist.img1v1Url || '',
      description: sourceArtist.briefDesc || '',
      source: this.info.id,
      sourceArtistId: sourceArtist.id.toString()
    };
  }

  protected normalizeAlbum(sourceAlbum: any): Album {
    const artist = sourceAlbum.artist || sourceAlbum.artists?.[0] || {};
    
    return {
      id: this.generateId(sourceAlbum.id.toString()),
      name: sourceAlbum.name || '',
      artist: artist.name || '未知艺术家',
      artistId: artist.id ? this.generateId(artist.id.toString()) : undefined,
      cover: sourceAlbum.picUrl || '',
      releaseDate: sourceAlbum.publishTime ? new Date(sourceAlbum.publishTime).toISOString() : undefined,
      description: sourceAlbum.description || '',
      trackCount: sourceAlbum.size || 0,
      source: this.info.id,
      sourceAlbumId: sourceAlbum.id.toString()
    };
  }

  protected normalizePlaylist(sourcePlaylist: any): Playlist {
    return {
      id: this.generateId(sourcePlaylist.id.toString()),
      name: sourcePlaylist.name || '',
      description: sourcePlaylist.description || '',
      cover: sourcePlaylist.coverImgUrl || '',
      creator: sourcePlaylist.creator?.nickname || '',
      trackCount: sourcePlaylist.trackCount || 0,
      tracks: sourcePlaylist.tracks ? sourcePlaylist.tracks.map((track: any) => this.normalizeTrack(track)) : undefined,
      source: this.info.id,
      sourcePlaylistId: sourcePlaylist.id.toString()
    };
  }

  // 辅助方法
  private getQualityBitrate(quality: string): number {
    const qualityMap: { [key: string]: number } = {
      'low': 128000,
      'medium': 192000,
      'high': 320000,
      'lossless': 999000
    };
    return qualityMap[quality] || 320000;
  }

  private parseLyric(lyricText: string): LyricLine[] {
    if (!lyricText) return [];
    
    const lines: LyricLine[] = [];
    const lyricLines = lyricText.split('\n');
    
    for (const line of lyricLines) {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const milliseconds = parseInt(match[3].padEnd(3, '0'));
        const text = match[4].trim();
        
        if (text) {
          lines.push({
            time: minutes * 60 + seconds + milliseconds / 1000,
            text
          });
        }
      }
    }
    
    return lines.sort((a, b) => a.time - b.time);
  }

  // 缓存管理
  private getFromCache(key: string): any {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  private setCache(key: string, value: any, ttl: number): void {
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }
} 