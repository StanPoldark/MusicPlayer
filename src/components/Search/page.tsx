"use client";
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { search, getSongUrls, checkSong, getlyric, getSongsDetail } from "@/app/api/music";
import { List, Input, Spin, message, Select, Button, Space, Tooltip } from "antd";
import { LucidePlus, Search as SearchIcon } from "lucide-react";
import {
  setCurrentTrack,
  addTrackToPlaylist,
} from "@/redux/modules/musicPlayer/reducer";
import { Track } from "@/redux/modules/types";
import "./index.scss";
import DownloadAudio from "@/utils/SongList/downloadAudio"
import { VerticalAlignBottomOutlined, SettingOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { debounce } from 'lodash';
import { motion } from "framer-motion";
import { MusicSourceManager } from "@/services/MusicSourceManager";
import { SearchOptions } from "@/types/music";
import MusicSourceManagerComponent from "@/components/MusicSourceManager";
import AudioCacheManager from "@/utils/AudioCache";
import { SearchHistoryManager, SearchHistoryItem } from "@/utils/searchHistory";
import SearchHistoryDropdown from "./SearchHistoryDropdown";

const { Option } = Select;

// 工具函数：确保 Track 对象的序列化安全
const sanitizeTrack = (track: any): Track => {
  return {
    id: Number(track.id) || 0,
    name: String(track.name || ''),
    ar: Array.isArray(track.ar) ? track.ar.map(String) : [String(track.ar || '')],
    url: String(track.url || ''),
    time: Number(track.time || 0),
    picUrl: track.picUrl ? String(track.picUrl) : null,
    lyric: String(track.lyric || ''),
    source: track.source ? String(track.source) : undefined,
  };
};

// 安全的日志函数，避免Next.js开发环境的reactRender错误
const safeLog = {
  error: (...args: any[]) => {
    // 使用setTimeout异步调用，避免触发Next.js的错误拦截器
    setTimeout(() => {
      try {
        console.warn('[ERROR]', ...args);
      } catch (e) {
        console.error('[ERROR]', e);
      }
    }, 0);
  },
  warn: (...args: any[]) => {
    setTimeout(() => {
      try {
        console.warn(...args);
      } catch {        // 静默处理
        console.warn('[ERROR]', ...args);
      }
    }, 0);
  },
  info: (...args: any[]) => {
    setTimeout(() => {
      try {
        console.info(...args);
      } catch {
        console.warn('[ERROR]', ...args);
      }
    }, 0);
  }
};

// 定义音乐搜索组件
const MusicSearch: React.FC = () => {
  // 使用 Redux 的 dispatch 方法
  const dispatch = useAppDispatch();
  const { playlist: reduxPlaylist } = useAppSelector((state) => state.musicPlayer);
  
  // 定义搜索结果的状态
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  // 定义搜索关键词的状态
  const [searchTerm, setSearchTerm] = useState<string>("");
  // 定义加载状态的状态
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 定义当前处理中的歌曲ID状态
  const [processingTrackId, setProcessingTrackId] = useState<number | null>(null);
  // 定义已存储歌曲的状态
  const [storedTracks, setStoredTracks] = useState<Track[]>([]);
  // 定义错误状态
  const [error, setError] = useState<string | null>(null);
  // 音乐源相关状态
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [availableSources, setAvailableSources] = useState<any[]>([]);
  const [sourceManagerVisible, setSourceManagerVisible] = useState(false);
  
  // 搜索记录相关状态
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [historyDropdownVisible, setHistoryDropdownVisible] = useState(false);
  
  // 添加ref来获取search-content的高度
  const searchContentRef = useRef<HTMLDivElement>(null);
  const [searchContentHeight, setSearchContentHeight] = useState<number>(0);

  const musicSourceManager = MusicSourceManager.getInstance();
  const audioCache = useMemo(() => AudioCacheManager.getInstance(), []);
  const searchHistoryManager = useMemo(() => SearchHistoryManager.getInstance(), []);

  // 使用 useMemo 创建一个记忆化的Redux歌曲映射，提高查找性能
  const reduxTracksMap = useMemo(() => {
    const map = new Map<number, Track>();
    reduxPlaylist.forEach(track => {
      if (track.id && track.lyric) {
        map.set(track.id, track);
      }
    });
    return map;
  }, [reduxPlaylist]);

  // 加载可用的音乐源
  const loadSources = useCallback(() => {
    const sources = musicSourceManager.getEnabledSources();
    setAvailableSources(sources);
  }, [musicSourceManager]);

  // 加载搜索记录
  const loadSearchHistory = useCallback(() => {
    const history = searchHistoryManager.getSearchHistory();
    setSearchHistory(history);
  }, [searchHistoryManager]);

  // 处理选择搜索记录
  const handleSelectHistory = useCallback((keyword: string) => {
    setSearchTerm(keyword);
    setHistoryDropdownVisible(false);
  }, []);

  // 处理删除搜索记录
  const handleDeleteHistory = useCallback((id: string) => {
    searchHistoryManager.removeSearchHistory(id);
    loadSearchHistory();
  }, [searchHistoryManager, loadSearchHistory]);

  // 处理清空搜索记录
  const handleClearHistory = useCallback(() => {
    searchHistoryManager.clearSearchHistory();
    loadSearchHistory();
    setHistoryDropdownVisible(false);
  }, [searchHistoryManager, loadSearchHistory]);

  useEffect(() => {
    loadSources();
    loadSearchHistory();
  }, [loadSources, loadSearchHistory]);

  // 获取search-content的初始高度
  useEffect(() => {
    const getInitialHeight = () => {
      if (searchContentRef.current && searchResults.length === 0 && !searchTerm) {
        const height = searchContentRef.current.clientHeight;
        if (height > 0) {
          setSearchContentHeight(height);
        }
      }
    };

    // 延迟获取高度，确保组件已完全渲染
    const timer = setTimeout(getInitialHeight, 100);
    
    // 监听窗口大小变化
    const handleResize = () => {
      if (searchResults.length === 0 && !searchTerm) {
        getInitialHeight();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [searchResults.length, searchTerm]);

  // 使用MusicSourceManager进行搜索
  const searchWithMusicSourceManager = useCallback(async (keyword: string, source?: string) => {
    try {
      const searchOptions: SearchOptions = {
        keyword,
        type: 'track',
        limit: 30,
        offset: 0,
        source: source === 'all' ? undefined : source
      };

      const result = await musicSourceManager.search(searchOptions);
      
      if (result.errors.length > 0) {
        safeLog.warn('Search errors:', result.errors);
      }

      // 转换为组件期望的Track格式
      const tracks: Track[] = result.merged.tracks.map(track => ({
        name: track.name,
        id: parseInt(track.sourceTrackId || track.id.split('_')[1] || '0'),
        ar: [track.artist],
        url: "",
        time: track.duration,
        picUrl: track.cover,
        source: track.source
      }));

      return tracks;
    } catch (error) {
      safeLog.error('MusicSourceManager search failed:', error);
      throw error;
    }
  }, [musicSourceManager]);

  // 获取歌曲的 URL（保持原有逻辑作为后备）
  const getSongsWithUrls = useCallback(async (songList: Track[]): Promise<Track[]> => {
    // 获取所有歌曲的 ID
    const songIds = songList.map((song) => song.id);
    
    try {
      // 调用 getSongUrls 方法获取歌曲数据
      const response = await getSongUrls(songIds);
      
      // 检查返回的数据是否有效
      if (response.code !== 200 || !response.data) {
        throw new Error('Failed to fetch song URLs');
      }
      
      // 将 URL 添加到歌曲对象中
      const updatedSongList = songList.map((song) => {
        const songData = response.data.find((data: any) => data.id === song.id);
      
        // 如果 URL 存在并且有效（非 null 或 404），使用它，否则使用空字符串
        const songUrl = songData && songData.url 
          ? `/api/proxy/music?url=${encodeURIComponent(songData.url)}`
          : ''; 
      
        return {
          ...song,
          url: songUrl,
          time: songData?.time || 0,
        };
      });
      
      return updatedSongList;
    } catch (error) {
      safeLog.error("获取歌曲URL失败:", error);
      setError("获取歌曲URL失败");
      return songList; // 返回原始列表，不含URL
    }
  }, []);

  // 使用 debounce 防止用户快速输入时多次触发搜索
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedHandleSearch = useCallback(
    debounce(async () => {
      // 如果搜索关键词为空，则提示用户输入搜索关键词
      if (!searchTerm.trim()) {
        message.warning("请输入搜索关键词");
        return;
      }

      try {
        // 设置加载状态为 true
        setIsLoading(true);
        setError(null);
        // 清空之前的搜索结果
        setSearchResults([]);

        // 添加搜索记录到历史
        searchHistoryManager.addSearchHistory(searchTerm.trim());
        loadSearchHistory(); // 更新搜索记录状态

        // 优先使用MusicSourceManager搜索
        try {
          const tracks = await searchWithMusicSourceManager(searchTerm, selectedSource);
          
          if (tracks.length > 0) {
            // 获取歌曲详情（封面等）
            const songDetails = await getSongsDetail(tracks.map((track) => track.id));
            if (songDetails?.songs) {
              tracks.forEach((track, index) => {
                if (songDetails.songs[index]?.al?.picUrl) {
                  track.picUrl = songDetails.songs[index].al.picUrl;
                }
              });
            }
            
            // 获取播放URL
            const updateTracks = await getSongsWithUrls(tracks);
            setSearchResults(updateTracks);
            
            if (updateTracks.length === 0) {
              message.info("未找到可播放的歌曲");
            }
            return;
          }
        } catch (managerError) {
          console.warn('MusicSourceManager search failed, falling back to legacy search:', managerError);
        }

        // 后备方案：使用原有的搜索逻辑
        const res: any = await search(searchTerm);

        // 如果搜索结果存在且为数组，则处理搜索结果
        if (res?.result?.songs && Array.isArray(res.result.songs)) {
          // 将搜索结果转换为 Track 类型
          const searchTracks: Track[] = res.result.songs.map((song: any) => ({
            name: song.name,
            id: song.id,
            ar: song.artists.map((artist: any) => artist.name),
            url: "",
            time: 0,
          }));

          // 调用 getSongsDetail 方法获取歌曲的详情
          const songDetails = await getSongsDetail(searchTracks.map((track) => track.id));
          if (songDetails?.songs) {
            searchTracks.forEach((track, index) => {
              track.picUrl = songDetails.songs[index]?.al?.picUrl;
            });
          }
          
          // 调用 getSongsWithUrls 方法获取歌曲的 URL
          const updateTracks = await getSongsWithUrls(searchTracks);

          // 设置搜索结果
          setSearchResults(updateTracks);
        } else {
          // 如果搜索结果不存在，则提示用户未找到结果
          message.error("未找到结果");
          setSearchResults([]);
        }
      } catch (error) {
        // 如果搜索出错，则打印错误信息并提示用户搜索失败
        safeLog.error("搜索错误:", error);
        setError("搜索失败，请稍后重试");
        message.error("搜索失败");
        setSearchResults([]);
      } finally {
        // 设置加载状态为 false
        setIsLoading(false);
      }
    }, 500), // 500ms 延迟
    [searchTerm, selectedSource, searchWithMusicSourceManager, getSongsWithUrls, searchHistoryManager, loadSearchHistory]
  );

  // 处理搜索事件
  const handleSearch = useCallback(() => {
    debouncedHandleSearch();
  }, [debouncedHandleSearch]);

  // 当搜索词改变时，触发搜索历史记录的选择
  useEffect(() => {
    if (searchTerm && searchTerm.trim()) {
      // 添加一个小延迟以确保UI更新完成
      const timer = setTimeout(() => {
        debouncedHandleSearch();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, debouncedHandleSearch]);

  // 点击歌曲的处理函数
  const handleSongClick = useCallback(
    async (track: Track) => {
      // 防止重复处理
      if (processingTrackId === track.id) return;
      
      // 检查歌曲是否已在Redux播放列表中
      const existingTrack = reduxTracksMap.get(track.id);
      if (existingTrack) {
        dispatch(setCurrentTrack(existingTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: existingTrack }));
        message.success(`正在播放: ${track.name}`);
        return;
      }

      try {
        // 设置当前处理的歌曲ID
        setProcessingTrackId(track.id);
        setError(null);
        
        // 调用 checkSong 方法检查歌曲是否可用
        const songAvailableData = await checkSong(track.id);
        
        // 如果歌曲不可用，则提示用户
        if (!songAvailableData.success) {
          message.error("抱歉，由于版权限制，此歌曲不可播放");
          setProcessingTrackId(null);
          return;
        }
        
        // 获取歌曲URL
        const songUrls = await getSongUrls([track.id]);
        const songData = songUrls?.data?.[0];
        const songUrl = songData?.url 
          ? `/api/proxy/music?url=${encodeURIComponent(songData.url)}`
          : '';
        
        // 获取歌词
        const songLyric = await getlyric(track.id);
        
        // 创建清理后的歌曲对象，确保所有数据都是可序列化的
        const updatedTrack = sanitizeTrack({
          ...track,
          url: songUrl,
          time: songData?.time || track.time || 0,
          lyric: songLyric?.lrc?.lyric || "",
        });

        // 将更新后的歌曲对象添加到已存储歌曲中
        setStoredTracks((prevTracks) => [...prevTracks, updatedTrack]);

        // 设置当前歌曲并添加到播放列表
        dispatch(setCurrentTrack(updatedTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: updatedTrack }));
        message.success(`正在播放: ${track.name}`);
        
        // 预缓存音频（如果有URL）
        if (updatedTrack.url && !audioCache.isCached(updatedTrack.id)) {
          audioCache.preCacheAudio(updatedTrack.url, updatedTrack.id);
        }
      } catch (error) {
        // 如果获取歌曲URL出错，则打印错误信息并提示用户
        safeLog.error("获取歌曲失败:", error instanceof Error ? error.message : String(error));
        setError("获取歌曲失败，请重试");
        message.error("获取歌曲失败，请重试");
      } finally {
        // 清除处理状态
        setProcessingTrackId(null);
      }
    },
    [dispatch, storedTracks, processingTrackId, reduxTracksMap]
  );

  // 添加到播放列表的处理函数
  const handleAddToPlaylist = useCallback(
    async (track: Track) => {
      // 检查歌曲是否已在Redux播放列表中
      const existingTrack = reduxTracksMap.get(track.id);
      if (existingTrack) {
        dispatch(addTrackToPlaylist({ from: "add", track: existingTrack }));
        message.success(`已添加 ${track.name} 到播放列表`);
        return;
      }
      
      try {
        // 设置当前处理的歌曲ID
        setProcessingTrackId(track.id);
        setError(null);
        
        // 调用 checkSong 方法检查歌曲是否可用
        const songAvailableData = await checkSong(track.id);
        
        // 如果歌曲不可用，则提示用户
        if (!songAvailableData.success) {
          message.error("抱歉，由于版权限制，此歌曲不可播放");
          setProcessingTrackId(null);
          return;
        }
        
        // 获取歌词
        const songLyric = await getlyric(track.id);
        
        // 创建清理后的歌曲对象，确保所有数据都是可序列化的
        const updatedTrack = sanitizeTrack({
          ...track,
          url: "", // 添加到播放列表时不需要立即获取URL
          time: Number(track.time || 0),
          lyric: songLyric?.lrc?.lyric || "",
        });

        // 将更新后的歌曲对象添加到已存储歌曲中
        setStoredTracks((prevTracks) => [...prevTracks, updatedTrack]);

        // 添加到播放列表
        dispatch(addTrackToPlaylist({ from: "add", track: updatedTrack }));
        message.success(`已添加 ${track.name} 到播放列表`);
        
        // 预缓存音频（如果有URL）
        if (updatedTrack.url && !audioCache.isCached(updatedTrack.id)) {
          audioCache.preCacheAudio(updatedTrack.url, updatedTrack.id);
        }
      } catch (error) {
        // 如果获取歌曲信息出错，则打印错误信息并提示用户
        safeLog.error("获取歌曲失败:", error instanceof Error ? error.message : String(error));
        setError("获取歌曲失败，请重试");
        message.error("获取歌曲失败，请重试");
      } finally {
        // 清除处理状态
        setProcessingTrackId(null);
      }
    },
    [dispatch, processingTrackId, reduxTracksMap]
  );

  return (
    <div className="music-search">
      <div className="search-header">
        <Space.Compact style={{ width: '100%' }}>
          <SearchHistoryDropdown
            searchHistory={searchHistory}
            onSelectHistory={handleSelectHistory}
            onDeleteHistory={handleDeleteHistory}
            onClearHistory={handleClearHistory}
            visible={historyDropdownVisible}
            onVisibleChange={setHistoryDropdownVisible}
          >
            <div className="search-input-with-history" style={{ flex: 1 }}>
              <Input
                placeholder="搜索歌曲、歌手、专辑..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onPressEnter={handleSearch}
                onFocus={() => {
                  if (searchHistory.length > 0) {
                    setHistoryDropdownVisible(true);
                  }
                }}
                style={{ 
                  flex: 1, 
                  backgroundColor: 'transparent',
                  color: 'white',
                  paddingLeft: '12px',
                  paddingRight: '40px'
                }}
              />
              <ClockCircleOutlined 
                className={`history-trigger ${historyDropdownVisible ? 'active' : ''}`}
                onClick={() => setHistoryDropdownVisible(!historyDropdownVisible)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 1,
                  cursor: 'pointer',
                  color: historyDropdownVisible ? '#1890ff' : 'rgba(255, 255, 255, 0.6)'
                }}
              />
            </div>
          </SearchHistoryDropdown>
          
          <Select
            value={selectedSource}
            onChange={setSelectedSource}
            style={{ width: 120 }}
            placeholder="选择音乐源"
          >
            <Option value="all">全部源</Option>
            {availableSources.map(source => (
              <Option key={source.id} value={source.id}>
                {source.icon} {source.name}
              </Option>
            ))}
          </Select>
          <Button onClick={handleSearch} loading={isLoading}>
          <SearchIcon size={16} />
          </Button>
        
          <Tooltip title="音乐源管理">
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => setSourceManagerVisible(true)}
            />
          </Tooltip>
        </Space.Compact>
      </div>

      <div className="search-content" ref={searchContentRef}>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="loading-container">
            <Spin size="large" />
            <div>正在搜索...</div>
          </div>
        ) : searchResults.length === 0 && searchTerm ? (
          <div className="no-results">
            暂无搜索结果
          </div>
        ) : searchResults.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={searchResults}
            locale={{ emptyText: "暂无搜索结果" }}
            style={{
              maxHeight: searchContentHeight > 0 ? `${searchContentHeight}px` : '400px',
              overflowY: 'auto',
              paddingRight: '8px'
            }}
            renderItem={(track) => (
              <List.Item
                key={track.id}
                onClick={() => handleSongClick(track)}
                actions={[
                  processingTrackId === track.id ? (
                    <Spin key="loading" size="small" />
                  ) : (
                    <div key="actions" style={{ display: 'flex', gap: '8px' }}>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToPlaylist(track);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="添加到播放列表"
                      >
                        <LucidePlus size={20} />
                      </motion.button>
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          DownloadAudio(track);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        aria-label="下载歌曲"
                      >
                        <VerticalAlignBottomOutlined style={{ fontSize: '20px' }} />
                      </motion.button>
                    </div>
                  )
                ]}
              >
                <List.Item.Meta
                  title={<span>{track.name}</span>}
                  description={
                    <div>
                      <span>{Array.isArray(track.ar) ? track.ar.join(', ') : track.ar}</span>
                      {track.source && (
                        <span style={{ marginLeft: 8 }}>
                          来源: {availableSources.find(s => s.id === track.source)?.name || track.source}
                        </span>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : null}
      </div>

      {/* 音乐源管理组件 */}
      <MusicSourceManagerComponent
        visible={sourceManagerVisible}
        onClose={() => {
          setSourceManagerVisible(false);
          // 重新加载可用音乐源
          loadSources();
        }}
      />
    </div>
  );
};

export default MusicSearch;
