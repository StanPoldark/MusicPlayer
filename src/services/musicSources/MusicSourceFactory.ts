import { IMusicSource } from './IMusicSource';
import { NetEaseMusicSource } from './NetEaseMusicSource';
import { QQMusicSource } from './QQMusicSource';
import { MusicSourceInfo } from '@/types/music';

/**
 * 音乐源构造函数类型
 */
export type MusicSourceConstructor = new () => IMusicSource;

/**
 * 音乐源插件信息
 */
export interface MusicSourcePlugin {
  id: string;
  name: string;
  version: string;
  description: string;
  constructor: MusicSourceConstructor;
  config?: any;
}

/**
 * 音乐源工厂类
 * 负责注册、创建和管理音乐源实例
 */
export class MusicSourceFactory {
  private static instance: MusicSourceFactory | null = null;
  private plugins: Map<string, MusicSourcePlugin> = new Map();
  private instances: Map<string, IMusicSource> = new Map();

  private constructor() {
    this.registerBuiltinSources();
  }

  /**
   * 获取工厂单例实例
   */
  static getInstance(): MusicSourceFactory {
    if (!MusicSourceFactory.instance) {
      MusicSourceFactory.instance = new MusicSourceFactory();
    }
    return MusicSourceFactory.instance;
  }

  /**
   * 注册内置音乐源
   */
  private registerBuiltinSources(): void {
    // 注册网易云音乐源
    this.registerPlugin({
      id: 'netease',
      name: '网易云音乐',
      version: '1.0.0',
      description: '网易云音乐API，提供丰富的中文音乐资源',
      constructor: NetEaseMusicSource,
    });

    // 注册QQ音乐源
    this.registerPlugin({
      id: 'qqmusic',
      name: 'QQ音乐',
      version: '1.0.0',
      description: 'QQ音乐API，腾讯音乐平台',
      constructor: QQMusicSource,
    });
  }

  /**
   * 注册音乐源插件
   */
  registerPlugin(plugin: MusicSourcePlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  /**
   * 注销音乐源插件
   */
  unregisterPlugin(pluginId: string): void {
    if (this.plugins.has(pluginId)) {
      this.plugins.delete(pluginId);
      // 同时移除实例
      if (this.instances.has(pluginId)) {
        this.instances.delete(pluginId);
      }
    
    }
  }

  /**
   * 创建音乐源实例
   */
  createSource(sourceId: string): IMusicSource | null {
    // 如果实例已存在，直接返回
    if (this.instances.has(sourceId)) {
      return this.instances.get(sourceId)!;
    }

    const plugin = this.plugins.get(sourceId);
    if (!plugin) {
      console.error(`[MusicSourceFactory] Plugin not found: ${sourceId}`);
      return null;
    }

    try {
      const instance = new plugin.constructor();
      this.instances.set(sourceId, instance);
      return instance;
    } catch (error) {
      console.error(`[MusicSourceFactory] Failed to create instance for ${sourceId}:`, error);
      return null;
    }
  }

  /**
   * 获取音乐源实例
   */
  getSource(sourceId: string): IMusicSource | null {
    return this.instances.get(sourceId) || this.createSource(sourceId);
  }

  /**
   * 获取所有已注册的插件信息
   */
  getAllPlugins(): MusicSourcePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取所有可用的音乐源信息
   */
  getAllSourceInfos(): MusicSourceInfo[] {
    return Array.from(this.plugins.values()).map(plugin => {
      const instance = this.getSource(plugin.id);
      return instance ? instance.getInfo() : {
        id: plugin.id,
        name: plugin.name,
        description: plugin.description,
        enabled: false,
        priority: 999,
        supportedFeatures: {
          search: false,
          getTrackUrl: false,
          getLyrics: false,
          getPlaylist: false,
          getAlbum: false,
          getArtist: false,
        }
      };
    });
  }

  /**
   * 检查插件是否存在
   */
  hasPlugin(sourceId: string): boolean {
    return this.plugins.has(sourceId);
  }

  /**
   * 清理所有实例
   */
  clearInstances(): void {
    this.instances.clear();
  }
}

// 导出工厂单例
export const musicSourceFactory = MusicSourceFactory.getInstance(); 