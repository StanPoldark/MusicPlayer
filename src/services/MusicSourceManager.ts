import { musicSourceFactory } from './musicSources/MusicSourceFactory';
import { IMusicSource } from './musicSources/IMusicSource';
import {
  Track,
  Artist,
  Album,
  Playlist,
  SearchResult,
  Lyric,
  SearchOptions,
  MusicSourceInfo,
  ApiResponse,
  AggregatedSearchResult,
  MusicSourceError
} from '@/types/music';

/**
 * 音乐源配置
 */
interface MusicSourceConfig {
  enabled: boolean;
  priority: number;
  settings?: any;
}

/**
 * 音乐源管理器配置
 */
interface ManagerConfig {
  defaultSource: string;
  sources: { [sourceId: string]: MusicSourceConfig };
  aggregateSearch: boolean;
  maxConcurrentSources: number;
}

/**
 * 音乐源管理器
 * 统一管理所有音乐源，提供聚合搜索和统一API
 */
export class MusicSourceManager {
  private static instance: MusicSourceManager | null = null;
  private sources: Map<string, IMusicSource> = new Map();
  private enabledSources: IMusicSource[] = [];
  private defaultSource: IMusicSource | null = null;
  private config: ManagerConfig;
  private readonly CONFIG_KEY = 'musicSourceManager_config';

  private constructor() {
    this.config = this.loadConfig();
    this.initializeSources();
  }

  /**
   * 获取单例实例
   */
  static getInstance(): MusicSourceManager {
    if (!MusicSourceManager.instance) {
      MusicSourceManager.instance = new MusicSourceManager();
    }
    return MusicSourceManager.instance;
  }

  /**
   * 加载配置
   */
  private loadConfig(): ManagerConfig {
    try {
      if (typeof window !== "undefined") {
        const savedConfig = localStorage.getItem(this.CONFIG_KEY);
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          return {
          defaultSource: config.defaultSource || 'netease',
          sources: config.sources || {},
          aggregateSearch: config.aggregateSearch !== false,
          maxConcurrentSources: config.maxConcurrentSources || 3,
        };
        }
      }
    } catch (error) {
      console.warn('[MusicSourceManager] Failed to load config:', error);
    }

    // 默认配置
    return {
      defaultSource: 'netease',
      sources: {
        netease: { enabled: true, priority: 1 },
        qqmusic: { enabled: false, priority: 2 },
      },
      aggregateSearch: true,
      maxConcurrentSources: 3,
    };
  }

  /**
   * 保存配置
   */
  private saveConfig(): void {
    
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(this.CONFIG_KEY, JSON.stringify(this.config));
      }
    } catch (error) {
      console.error('[MusicSourceManager] Failed to save config:', error);
    }
  }

  /**
   * 初始化音乐源
   */
  private initializeSources(): void {
    // 从工厂获取所有可用的音乐源
    const availablePlugins = musicSourceFactory.getAllPlugins();
    
    for (const plugin of availablePlugins) {
      const source = musicSourceFactory.getSource(plugin.id);
      if (source) {
        this.registerSource(source);
        
        // 应用配置
        const sourceConfig = this.config.sources[plugin.id];
        if (sourceConfig) {
          const info = source.getInfo();
          info.enabled = sourceConfig.enabled;
          info.priority = sourceConfig.priority;
        }
      }
    }

    this.setDefaultSource(this.config.defaultSource);
    this.updateEnabledSources();
  }

  /**
   * 注册音乐源
   */
  registerSource(source: IMusicSource): void {
    const info = source.getInfo();
    this.sources.set(info.id, source);
    console.log(`[MusicSourceManager] Registered source: ${info.name}`);
  }

  /**
   * 注销音乐源
   */
  unregisterSource(sourceId: string): void {
    if (this.sources.has(sourceId)) {
      this.sources.delete(sourceId);
      delete this.config.sources[sourceId];
      this.updateEnabledSources();
      this.saveConfig();
      console.log(`[MusicSourceManager] Unregistered source: ${sourceId}`);
    }
  }

  /**
   * 设置默认音乐源
   */
  setDefaultSource(sourceId: string): void {
    const source = this.sources.get(sourceId);
    if (source) {
      this.defaultSource = source;
      this.config.defaultSource = sourceId;
      this.saveConfig();
      console.log(`[MusicSourceManager] Set default source: ${sourceId}`);
    }
  }

  /**
   * 获取所有音乐源信息
   */
  getAllSources(): MusicSourceInfo[] {
    return Array.from(this.sources.values()).map(source => source.getInfo());
  }

  /**
   * 获取启用的音乐源信息
   */
  getEnabledSources(): MusicSourceInfo[] {
    return this.enabledSources.map(source => source.getInfo());
  }

  /**
   * 启用/禁用音乐源
   */
  setSourceEnabled(sourceId: string, enabled: boolean): void {
    const source = this.sources.get(sourceId);
    if (source) {
      const info = source.getInfo();
      info.enabled = enabled;
      
      // 更新配置
      if (!this.config.sources[sourceId]) {
        this.config.sources[sourceId] = { enabled, priority: info.priority };
      } else {
        this.config.sources[sourceId].enabled = enabled;
      }
      
      this.updateEnabledSources();
      this.saveConfig();
      console.log(`[MusicSourceManager] ${enabled ? 'Enabled' : 'Disabled'} source: ${sourceId}`);
    }
  }

  /**
   * 设置音乐源优先级
   */
  setSourcePriority(sourceId: string, priority: number): void {
    const source = this.sources.get(sourceId);
    if (source) {
      const info = source.getInfo();
      info.priority = priority;
      
      // 更新配置
      if (!this.config.sources[sourceId]) {
        this.config.sources[sourceId] = { enabled: info.enabled, priority };
      } else {
        this.config.sources[sourceId].priority = priority;
      }
      
      this.updateEnabledSources();
      this.saveConfig();
      console.log(`[MusicSourceManager] Set priority for ${sourceId}: ${priority}`);
    }
  }

  /**
   * 更新启用的音乐源列表
   */
  private updateEnabledSources(): void {
    this.enabledSources = Array.from(this.sources.values())
      .filter(source => source.getInfo().enabled)
      .sort((a, b) => a.getInfo().priority - b.getInfo().priority);
  }

  /**
   * 检查所有音乐源的可用性
   */
  async checkAvailability(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    const checks = Array.from(this.sources.entries()).map(async ([id, source]) => {
      try {
        const available = await source.isAvailable();
        results.set(id, available);
      } catch (error) {
        console.error(`[MusicSourceManager] Availability check failed for ${id}:`, error);
        results.set(id, false);
      }
    });

    await Promise.allSettled(checks);
    return results;
  }

  /**
   * 聚合搜索
   * 在所有启用的音乐源中搜索，并合并结果
   */
  async search(options: SearchOptions): Promise<AggregatedSearchResult> {
    const { source: specifiedSource } = options;
    
    // 如果指定了音乐源，只在该源中搜索
    if (specifiedSource) {
      const source = this.sources.get(specifiedSource);
      if (!source) {
        throw new Error(`音乐源 ${specifiedSource} 不存在`);
      }
      
      const result = await source.search(options);
      const aggregated: AggregatedSearchResult = {
        results: new Map([[specifiedSource, result.data || this.createEmptySearchResult()]]),
        merged: result.data || this.createEmptySearchResult(),
        errors: result.success ? [] : [result.error!]
      };
      
      return aggregated;
    }

    // 如果禁用聚合搜索，只使用默认源
    if (!this.config.aggregateSearch && this.defaultSource) {
      const result = await this.defaultSource.search(options);
      const sourceId = this.defaultSource.getInfo().id;
      const aggregated: AggregatedSearchResult = {
        results: new Map([[sourceId, result.data || this.createEmptySearchResult()]]),
        merged: result.data || this.createEmptySearchResult(),
        errors: result.success ? [] : [result.error!]
      };
      
      return aggregated;
    }

    // 在启用的音乐源中并发搜索（限制并发数）
    const sourcesToSearch = this.enabledSources.slice(0, this.config.maxConcurrentSources);
    const searchPromises = sourcesToSearch.map(async (source) => {
      try {
        const result = await source.search(options);
        return { sourceId: source.getInfo().id, result };
      } catch (error) {
        console.error(`[MusicSourceManager] Search failed for ${source.getInfo().id}:`, error);
        return {
          sourceId: source.getInfo().id,
          result: {
            success: false,
            error: {
              code: 'SEARCH_FAILED',
              message: `搜索失败: ${error}`,
              source: source.getInfo().id,
              details: error
            },
            source: source.getInfo().id
          } as ApiResponse<SearchResult>
        };
      }
    });

    const results = await Promise.allSettled(searchPromises);
    
    const sourceResults = new Map<string, SearchResult>();
    const errors: MusicSourceError[] = [];
    
    // 处理搜索结果
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { sourceId, result: searchResult } = result.value;
        if (searchResult.success && searchResult.data) {
          sourceResults.set(sourceId, searchResult.data);
        } else if (searchResult.error) {
          errors.push(searchResult.error);
        }
      }
    });

    // 合并结果
    const merged = this.mergeSearchResults(Array.from(sourceResults.values()));
    
    return {
      results: sourceResults,
      merged,
      errors
    };
  }

  /**
   * 合并多个搜索结果
   */
  private mergeSearchResults(results: SearchResult[]): SearchResult {
    const merged: SearchResult = {
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
      total: 0,
      hasMore: false
    };

    for (const result of results) {
      merged.tracks.push(...result.tracks);
      merged.artists.push(...result.artists);
      merged.albums.push(...result.albums);
      merged.playlists.push(...result.playlists);
      merged.total += result.total;
      merged.hasMore = merged.hasMore || result.hasMore;
    }

    // 去重和排序
    merged.tracks = this.deduplicateTracks(merged.tracks);
    merged.artists = this.deduplicateArtists(merged.artists);
    merged.albums = this.deduplicateAlbums(merged.albums);
    merged.playlists = this.deduplicatePlaylists(merged.playlists);

    return merged;
  }

  /**
   * 歌曲去重
   */
  private deduplicateTracks(tracks: Track[]): Track[] {
    const seen = new Set<string>();
    return tracks.filter(track => {
      const key = `${track.name}_${track.artist}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 艺术家去重
   */
  private deduplicateArtists(artists: Artist[]): Artist[] {
    const seen = new Set<string>();
    return artists.filter(artist => {
      const key = artist.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 专辑去重
   */
  private deduplicateAlbums(albums: Album[]): Album[] {
    const seen = new Set<string>();
    return albums.filter(album => {
      const key = `${album.name}_${album.artist}`.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 歌单去重
   */
  private deduplicatePlaylists(playlists: Playlist[]): Playlist[] {
    const seen = new Set<string>();
    return playlists.filter(playlist => {
      const key = playlist.name.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 获取歌曲播放链接
   * 优先从默认源获取，失败则尝试其他源
   */
  async getTrackUrl(trackId: string, quality?: string): Promise<ApiResponse<string>> {
    const sourceId = this.extractSourceFromId(trackId);
    
    // 如果ID包含音乐源信息，直接使用对应源
    if (sourceId) {
      const source = this.sources.get(sourceId);
      if (source) {
        return source.getTrackUrl(trackId, quality);
      }
    }

    // 否则尝试所有启用的音乐源
    for (const source of this.enabledSources) {
      try {
        const result = await source.getTrackUrl(trackId, quality);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.warn(`[MusicSourceManager] Failed to get track URL from ${source.getInfo().id}:`, error);
      }
    }

    return {
      success: false,
      error: {
        code: 'TRACK_URL_NOT_FOUND',
        message: '无法获取歌曲播放链接',
        source: 'manager',
        details: { trackId, quality }
      },
      source: 'manager'
    };
  }

  /**
   * 获取歌词
   */
  async getLyrics(trackId: string): Promise<ApiResponse<Lyric>> {
    const sourceId = this.extractSourceFromId(trackId);
    
    if (sourceId) {
      const source = this.sources.get(sourceId);
      if (source) {
        return source.getLyrics(trackId);
      }
    }

    // 尝试所有启用的音乐源
    for (const source of this.enabledSources) {
      try {
        const result = await source.getLyrics(trackId);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.warn(`[MusicSourceManager] Failed to get lyrics from ${source.getInfo().id}:`, error);
      }
    }

    return {
      success: false,
      error: {
        code: 'LYRICS_NOT_FOUND',
        message: '无法获取歌词',
        source: 'manager',
        details: { trackId }
      },
      source: 'manager'
    };
  }

  /**
   * 获取歌曲详细信息
   */
  async getTrackInfo(trackId: string): Promise<ApiResponse<Track>> {
    const sourceId = this.extractSourceFromId(trackId);
    
    if (sourceId) {
      const source = this.sources.get(sourceId);
      if (source) {
        return source.getTrackInfo(trackId);
      }
    }

    return {
      success: false,
      error: {
        code: 'TRACK_NOT_FOUND',
        message: '无法获取歌曲信息',
        source: 'manager',
        details: { trackId }
      },
      source: 'manager'
    };
  }

  /**
   * 获取热门歌曲
   */
  async getHotTracks(limit: number = 50, sourceId?: string): Promise<ApiResponse<Track[]>> {
    const source = sourceId ? this.sources.get(sourceId) : this.defaultSource;
    
    if (!source) {
      return {
        success: false,
        error: {
          code: 'SOURCE_NOT_FOUND',
          message: '音乐源不存在',
          source: 'manager',
          details: { sourceId }
        },
        source: 'manager'
      };
    }

    return source.getHotTracks(limit);
  }

  /**
   * 获取推荐歌曲
   */
  async getRecommendedTracks(limit: number = 30, sourceId?: string): Promise<ApiResponse<Track[]>> {
    const source = sourceId ? this.sources.get(sourceId) : this.defaultSource;
    
    if (!source) {
      return {
        success: false,
        error: {
          code: 'SOURCE_NOT_FOUND',
          message: '音乐源不存在',
          source: 'manager',
          details: { sourceId }
        },
        source: 'manager'
      };
    }

    return source.getRecommendedTracks(limit);
  }

  /**
   * 检查歌曲可用性
   */
  async checkTrackAvailability(trackId: string): Promise<ApiResponse<boolean>> {
    const sourceId = this.extractSourceFromId(trackId);
    
    if (sourceId) {
      const source = this.sources.get(sourceId);
      if (source) {
        return source.checkTrackAvailability(trackId);
      }
    }

    return {
      success: true,
      data: false,
      source: 'manager'
    };
  }

  /**
   * 获取管理器配置
   */
  getConfig(): ManagerConfig {
    return { ...this.config };
  }

  /**
   * 更新管理器配置
   */
  updateConfig(newConfig: Partial<ManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    
    // 如果默认源改变，更新默认源
    if (newConfig.defaultSource) {
      this.setDefaultSource(newConfig.defaultSource);
    }
  }

  /**
   * 重置配置为默认值
   */
  resetConfig(): void {
    localStorage.removeItem(this.CONFIG_KEY);
    this.config = this.loadConfig();
    this.initializeSources();
  }

  /**
   * 导出配置
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 导入配置
   */
  importConfig(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      this.config = { ...this.config, ...config };
      this.saveConfig();
      this.initializeSources();
      return true;
    } catch (error) {
      console.error('[MusicSourceManager] Failed to import config:', error);
      return false;
    }
  }

  /**
   * 从ID中提取音乐源标识
   */
  private extractSourceFromId(id: string): string | null {
    const parts = id.split('_');
    if (parts.length >= 2 && this.sources.has(parts[0])) {
      return parts[0];
    }
    return null;
  }

  /**
   * 创建空的搜索结果
   */
  private createEmptySearchResult(): SearchResult {
    return {
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
      total: 0,
      hasMore: false
    };
  }
} 