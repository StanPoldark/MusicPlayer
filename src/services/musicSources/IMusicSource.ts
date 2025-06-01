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
  ApiResponse
} from '@/types/music';

/**
 * 音乐源抽象接口
 * 所有音乐源都必须实现这个接口
 */
export abstract class IMusicSource {
  protected info: MusicSourceInfo;

  constructor(info: MusicSourceInfo) {
    this.info = info;
  }

  /**
   * 获取音乐源信息
   */
  getInfo(): MusicSourceInfo {
    return this.info;
  }

  /**
   * 检查音乐源是否可用
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * 搜索音乐
   */
  abstract search(options: SearchOptions): Promise<ApiResponse<SearchResult>>;

  /**
   * 获取歌曲播放链接
   */
  abstract getTrackUrl(trackId: string, quality?: string): Promise<ApiResponse<string>>;

  /**
   * 获取歌词
   */
  abstract getLyrics(trackId: string): Promise<ApiResponse<Lyric>>;

  /**
   * 获取歌曲详细信息
   */
  abstract getTrackInfo(trackId: string): Promise<ApiResponse<Track>>;

  /**
   * 获取艺术家信息
   */
  abstract getArtistInfo(artistId: string): Promise<ApiResponse<Artist>>;

  /**
   * 获取专辑信息
   */
  abstract getAlbumInfo(albumId: string): Promise<ApiResponse<Album>>;

  /**
   * 获取播放列表信息
   */
  abstract getPlaylistInfo(playlistId: string): Promise<ApiResponse<Playlist>>;

  /**
   * 获取可用的音质选项
   */
  abstract getAvailableQualities(trackId: string): Promise<ApiResponse<MusicQuality[]>>;

  /**
   * 检查歌曲是否可用
   */
  abstract checkTrackAvailability(trackId: string): Promise<ApiResponse<boolean>>;

  /**
   * 获取热门歌曲
   */
  abstract getHotTracks(limit?: number): Promise<ApiResponse<Track[]>>;

  /**
   * 获取推荐歌曲
   */
  abstract getRecommendedTracks(limit?: number): Promise<ApiResponse<Track[]>>;

  /**
   * 标准化Track数据
   * 将音乐源特有的数据格式转换为统一格式
   */
  protected abstract normalizeTrack(sourceTrack: any): Track;

  /**
   * 标准化Artist数据
   */
  protected abstract normalizeArtist(sourceArtist: any): Artist;

  /**
   * 标准化Album数据
   */
  protected abstract normalizeAlbum(sourceAlbum: any): Album;

  /**
   * 标准化Playlist数据
   */
  protected abstract normalizePlaylist(sourcePlaylist: any): Playlist;

  /**
   * 处理API错误
   */
  protected handleError(error: any, operation: string): ApiResponse<any> {
    console.error(`[${this.info.id}] ${operation} error:`, error);
    
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

  /**
   * 创建成功响应
   */
  protected createSuccessResponse<T>(data: T): ApiResponse<T> {
    return {
      success: true,
      data,
      source: this.info.id
    };
  }

  /**
   * 生成统一的ID
   * 格式: source_originalId
   */
  protected generateId(originalId: string): string {
    return `${this.info.id}_${originalId}`;
  }

  /**
   * 从统一ID中提取原始ID
   */
  protected extractOriginalId(unifiedId: string): string {
    const prefix = `${this.info.id}_`;
    return unifiedId.startsWith(prefix) ? unifiedId.substring(prefix.length) : unifiedId;
  }

  /**
   * 速率限制检查
   */
  protected async checkRateLimit(): Promise<boolean> {
    // 子类可以重写此方法实现具体的速率限制逻辑
    return true;
  }

  /**
   * 缓存键生成
   */
  protected getCacheKey(operation: string, params: any): string {
    const paramStr = typeof params === 'string' ? params : JSON.stringify(params);
    return `${this.info.id}_${operation}_${paramStr}`;
  }
} 