// 音频缓存管理器
class AudioCacheManager {
  private cache: Map<string, Blob> = new Map();
  private maxCacheSize: number = 50 * 1024 * 1024; // 50MB 缓存限制
  private currentCacheSize: number = 0;
  private accessOrder: string[] = []; // LRU 访问顺序

  private static instance: AudioCacheManager;

  public static getInstance(): AudioCacheManager {
    if (!AudioCacheManager.instance) {
      AudioCacheManager.instance = new AudioCacheManager();
    }
    return AudioCacheManager.instance;
  }

  // 检查是否为本地文件或相对路径
  private isLocalFile(url: string): boolean {
    // 检查是否为本地文件：
    // 1. 以 / 开头但不是 /api/ 的静态文件路径
    // 2. 不包含协议的相对路径
    // 3. 排除网络URL (http://, https://) 和API路径 (/api/)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return false; // 网络URL
    }
    if (url.startsWith('/api/')) {
      return false; // API路径
    }
    return true; // 其他都认为是本地文件
  }

  // 缓存音频数据
  async cacheAudio(url: string, trackId: number): Promise<string | null> {
    try {
      const cacheKey = `track_${trackId}`;
      
      // 如果已经缓存，直接返回
      if (this.cache.has(cacheKey)) {
        this.updateAccessOrder(cacheKey);
        const blob = this.cache.get(cacheKey)!;
        return URL.createObjectURL(blob);
      }

      // 检查是否为本地文件，如果是则不进行缓存
      if (this.isLocalFile(url)) {
        return null; // 返回 null 表示不缓存，使用原始 URL
      }

      // 下载音频数据
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status}`);
      }

      const blob = await response.blob();
      const blobSize = blob.size;

      // 检查缓存空间
      this.ensureCacheSpace(blobSize);

      // 添加到缓存
      this.cache.set(cacheKey, blob);
      this.currentCacheSize += blobSize;
      this.updateAccessOrder(cacheKey);

      
      // 返回 blob URL
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to cache audio:', error);
      return null;
    }
  }

  // 获取缓存的音频
  getCachedAudio(trackId: number): string | null {
    const cacheKey = `track_${trackId}`;
    
    if (this.cache.has(cacheKey)) {
      this.updateAccessOrder(cacheKey);
      const blob = this.cache.get(cacheKey)!;
      return URL.createObjectURL(blob);
    }
    
    return null;
  }

  // 检查是否已缓存
  isCached(trackId: number): boolean {
    return this.cache.has(`track_${trackId}`);
  }

  // 播放开始后的智能缓存（在音频开始播放后调用）
  async cacheAfterPlayStart(url: string, trackId: number): Promise<void> {
    if (this.isCached(trackId) || this.isLocalFile(url)) {
      return;
    }

    try {
      // 延迟缓存，确保播放已经稳定开始
      setTimeout(async () => {
        try {
          const cachedUrl = await this.cacheAudio(url, trackId);
          if (cachedUrl) {
            console.log(`Smart cache completed for currently playing track ${trackId}`);
          }
        } catch (error) {
          console.error('Smart caching failed:', error);
        }
      }, 3000); // 延迟3秒，确保播放稳定
    } catch (error) {
      console.error('Smart cache setup failed:', error);
    }
  }

  // 预缓存音频（后台下载）
  async preCacheAudio(url: string, trackId: number): Promise<void> {
    if (this.isCached(trackId)) {
      return;
    }

    // 检查是否为本地文件，如果是则跳过预缓存
    if (this.isLocalFile(url)) {
      return;
    }

    try {
      // 在后台下载，不阻塞当前播放
      // 增加延迟时间，降低优先级
      setTimeout(async () => {
        try {
          await this.cacheAudio(url, trackId);
        } catch (error) {
          // 预缓存失败不影响用户体验，静默处理
          console.error('Pre-cache failed:', error);
        }
      }, 5000); // 延迟5秒开始预缓存，确保当前播放稳定
    } catch (error) {
      console.error('Pre-cache setup failed:', error);
    }
  }

  // 清理特定缓存
  clearCache(trackId: number): void {
    const cacheKey = `track_${trackId}`;
    
    if (this.cache.has(cacheKey)) {
      const blob = this.cache.get(cacheKey)!;
      this.currentCacheSize -= blob.size;
      this.cache.delete(cacheKey);
      this.accessOrder = this.accessOrder.filter(key => key !== cacheKey);

    }
  }

  // 清理所有缓存
  clearAllCache(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.currentCacheSize = 0;
  }

  // 获取缓存统计信息
  getCacheStats(): { size: number; count: number; maxSize: number } {
    return {
      size: this.currentCacheSize,
      count: this.cache.size,
      maxSize: this.maxCacheSize
    };
  }

  // 确保缓存空间足够（LRU 清理）
  private ensureCacheSpace(requiredSize: number): void {
    while (this.currentCacheSize + requiredSize > this.maxCacheSize && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift()!;
      const blob = this.cache.get(oldestKey);
      
      if (blob) {
        this.currentCacheSize -= blob.size;
        this.cache.delete(oldestKey);
      }
    }
  }

  // 更新访问顺序（LRU）
  private updateAccessOrder(cacheKey: string): void {
    // 移除旧的位置
    this.accessOrder = this.accessOrder.filter(key => key !== cacheKey);
    // 添加到末尾（最新访问）
    this.accessOrder.push(cacheKey);
  }

  // 设置缓存大小限制
  setMaxCacheSize(sizeInMB: number): void {
    this.maxCacheSize = sizeInMB * 1024 * 1024;
    this.ensureCacheSpace(0); // 立即清理超出的缓存
  }
}

export default AudioCacheManager; 