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
import { VerticalAlignBottomOutlined, SettingOutlined } from "@ant-design/icons";
import { debounce } from 'lodash';
import { motion } from "framer-motion";
import { MusicSourceManager } from "@/services/MusicSourceManager";
import { SearchOptions } from "@/types/music";
import MusicSourceManagerComponent from "@/components/MusicSourceManager";

const { Option } = Select;

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
  
  // 添加ref来获取search-content的高度
  const searchContentRef = useRef<HTMLDivElement>(null);
  const [searchContentHeight, setSearchContentHeight] = useState<number>(0);

  const musicSourceManager = MusicSourceManager.getInstance();

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

  useEffect(() => {
    loadSources();
  }, [loadSources]);

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
        console.warn('Search errors:', result.errors);
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
      console.error('MusicSourceManager search failed:', error);
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
      console.error("获取歌曲URL失败:", error);
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
        console.error("搜索错误:", error);
        setError("搜索失败，请稍后重试");
        message.error("搜索失败");
        setSearchResults([]);
      } finally {
        // 设置加载状态为 false
        setIsLoading(false);
      }
    }, 500), // 500ms 延迟
    [searchTerm, selectedSource, searchWithMusicSourceManager, getSongsWithUrls]
  );

  // 处理搜索事件
  const handleSearch = () => {
    debouncedHandleSearch();
  };

  // 处理歌曲点击事件
  const handleSongClick = useCallback(
    async (track: Track) => {
      if (processingTrackId === track.id) {
        return; // 如果当前歌曲正在处理中，不再重复处理
      }

      // 检查Redux中是否存在当前歌曲
      const trackInReduxPlaylist = reduxTracksMap.get(track.id);
      if (trackInReduxPlaylist) {
        // 如果歌曲已经存在于Redux中，直接使用它
        dispatch(setCurrentTrack(trackInReduxPlaylist));
        dispatch(addTrackToPlaylist({ from: "play", track: trackInReduxPlaylist }));
        return;
      }

      // 检查已存储歌曲中是否存在当前歌曲
      const existingTrack = storedTracks.find((t) => t.id === track.id);

      // 如果存在，则设置当前歌曲并添加到播放列表
      if (existingTrack) {
        dispatch(setCurrentTrack(existingTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: existingTrack }));
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
        
        // 更新歌曲对象
        const updatedTrack = {
          ...track,
          lyric: songLyric?.lrc?.lyric || "",
        };

        // 将更新后的歌曲对象添加到已存储歌曲中
        setStoredTracks((prevTracks) => [...prevTracks, updatedTrack]);

        try {
        // 设置当前歌曲并添加到播放列表
        dispatch(setCurrentTrack(updatedTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: updatedTrack }));
        message.success(`正在播放: ${track.name}`);
        } catch (dispatchError) {
          console.error("Redux dispatch error:", dispatchError);
          message.error("播放设置失败，请重试");
        }
      } catch (error) {
        // 如果获取歌曲URL出错，则打印错误信息并提示用户
        console.error("获取歌曲失败:", error instanceof Error ? error.message : String(error));
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
        
        // 更新歌曲对象
        const updatedTrack = {
          ...track,
          lyric: songLyric?.lrc?.lyric || "",
        };

        // 将更新后的歌曲对象添加到已存储歌曲中
        setStoredTracks((prevTracks) => [...prevTracks, updatedTrack]);

        // 添加到播放列表
        dispatch(addTrackToPlaylist({ from: "add", track: updatedTrack }));
        message.success(`已添加 ${track.name} 到播放列表`);
      } catch (error) {
        // 如果获取歌曲信息出错，则打印错误信息并提示用户
        console.error("获取歌曲失败:", error instanceof Error ? error.message : String(error));
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
          <Input
            placeholder="搜索歌曲、歌手、专辑..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={handleSearch}
            style={{ 
              flex: 1, 
              backgroundColor: 'transparent',
              color: 'white',
              paddingLeft: '12px'
            }}
          />
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
