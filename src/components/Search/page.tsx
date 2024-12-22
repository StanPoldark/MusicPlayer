"use client";
import React, { useState, useCallback } from "react";
import { useAppDispatch } from "@/hooks/hooks";
import { search, getSongUrls, checkSong, getlyric } from "@/app/api/music";
import { List, Input, Spin, message } from "antd";
import { LucidePlus, Search as SearchIcon } from "lucide-react";
import {
  setCurrentTrack,
  addTrackToPlaylist,
} from "@/redux/modules/musicPlayer/reducer";
import { Track } from "@/redux/modules/types";
import "./index.scss";
import DownloadAudio from "@/utils/SongList/downloadAudio"
import { VerticalAlignBottomOutlined } from "@ant-design/icons";

// 定义音乐搜索组件
const MusicSearch: React.FC = () => {
  // 使用 Redux 的 dispatch 方法
  const dispatch = useAppDispatch();
  // 定义搜索结果的状态
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  // 定义搜索关键词的状态
  const [searchTerm, setSearchTerm] = useState<string>("");
  // 定义加载状态的状态
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 定义已存储歌曲的状态
  const [storedTracks, setStoredTracks] = useState<Track[]>([]);

  // 处理搜索事件
  const handleSearch = async () => {
    // 如果搜索关键词为空，则提示用户输入搜索关键词
    if (!searchTerm.trim()) {
      message.warning("请输入搜索关键词");
      return;
    }

    try {
      // 设置加载状态为 true
      setIsLoading(true);
      // 调用 search 方法获取搜索结果
      const res: any = await search(searchTerm);

      // 如果搜索结果存在且为数组，则处理搜索结果
      if (res?.result.songs && Array.isArray(res.result.songs)) {
        // 将搜索结果转换为 Track 类型
        const searchTracks: Track[] = res.result.songs.map((song: any) => ({
          name: song.name,
          id: song.id,
          ar: song.artists.map((artist: any) => artist.name).join(", "),
          picUrl: song.album?.picUrl || "",
          url: "",
          time: 0,
        }));
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
      message.error("搜索失败");
      setSearchResults([]);
    } finally {
      // 设置加载状态为 false
      setIsLoading(false);
    }
  };

  // 获取歌曲的 URL
  const getSongsWithUrls = async (songList: any[]) => {
    // 获取所有歌曲的 ID
    const songIds = songList.map((song) => song.id);
    
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
  };

  // 处理歌曲点击事件
  const handleSongClick = useCallback(
    async (track: Track) => {
      // 检查已存储歌曲中是否存在当前歌曲
      const existingTrack = storedTracks.find((t) => t.id === track.id);

      // 如果存在，则设置当前歌曲并添加到播放列表
      if (existingTrack) {
        dispatch(setCurrentTrack(existingTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: existingTrack }));
        return;
      }

      try {
        // 调用 checkSong 方法检查歌曲是否可用
        const songAvailableData = await checkSong(track.id);
        // 调用 getlyric 方法获取歌曲的歌词
        const songLyric = await getlyric(track.id);

        // 如果歌曲不可用，则提示用户
        if (!songAvailableData.success) {
          alert("抱歉，由于版权限制，此歌曲不可播放")
          message.error("抱歉，由于版权限制，此歌曲不可播放");
          return;
        }
        // 更新歌曲对象
        const updatedTrack = {
          ...track,
          lyric: songLyric.lrc.lyric,
        };

        // 将更新后的歌曲对象添加到已存储歌曲中
        setStoredTracks((prevTracks) => [...prevTracks, updatedTrack]);

        // 设置当前歌曲并添加到播放列表
        dispatch(setCurrentTrack(updatedTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: updatedTrack }));
      } catch (error) {
        // 如果获取歌曲URL出错，则打印错误信息并提示用户
        console.error("获取歌曲URL错误:", error);
        message.error("加载歌曲失败");
      }
    },
    [dispatch, storedTracks]
  );

  // 处理添加到播放列表事件
  const handleAddToPlaylist = useCallback(
    async (track: Track) => {
      try {
        // 调用 checkSong 方法检查歌曲是否可用
        const songAvailableData = await checkSong(track.id);

        // 如果歌曲不可用，则提示用户
        if (!songAvailableData.success) {
          alert("抱歉，由于版权限制，此歌曲不可添加")
          message.error("抱歉，由于版权限制，此歌曲不可添加");
          return;
        }

        // 调用 getlyric 方法获取歌曲的歌词
        const songLyric = await getlyric(track.id);
        // 更新歌曲对象
        const updatedTrack = {
          ...track,
          lyric: songLyric.lrc.lyric,
        };

        // 添加歌曲到播放列表
        dispatch(addTrackToPlaylist({ from: "add", track: updatedTrack }));
        message.success(`已添加 ${track.name} 到播放列表`);
      } catch (error) {
        // 如果添加歌曲到播放列表出错，则打印错误信息并提示用户
        console.error("添加歌曲到播放列表错误:", error);
        message.error("添加歌曲失败");
      }
    },
    [dispatch]
  );

  return (
    <div className="w-full" style={{ height: "100%" }}>
      <div className="p-4 flex">
        <div className="relative flex-grow m-4">
          <Input
            placeholder="搜索歌曲"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onPressEnter={handleSearch}
            className="w-full pr-10 searchBar" // 加宽以容纳按钮
          />
          <button
            onClick={handleSearch}
            className="absolute top-1/2 right-2 -translate-y-1/2 p-1 rounded bg-transparent"
          >
            <SearchIcon size={20} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      ) : (
        <List
          className="trackList"
          itemLayout="horizontal"
          dataSource={searchResults}
          locale={{ emptyText: "暂无搜索结果" }}
          renderItem={(track) => (
            <List.Item
              style={{
                paddingInlineStart: 20,
                cursor: "pointer",
              }}
              onClick={() => handleSongClick(track)}
            >
              <List.Item.Meta
                title={<span className="font-bold" style={{ color: "white" }}>{track.name}</span>}
                description={<span style={{ color: "#04deff" }}>{track.ar}</span>}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToPlaylist(track);
                }}
                className="text-white hover:text-green-500"
              >
                <LucidePlus size={20} className="mr-2" />
              </button>
              <button
                  onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    DownloadAudio(track);
                  }}
                  className="text-white hover:text-blue-500"
                  style={{ marginLeft: 10 }}
                  aria-label="Download track"
                >
                  <VerticalAlignBottomOutlined size={20} className="mr-2"  />
                </button>
            </List.Item>
          )}
          style={{
            maxHeight: "16rem",
            overflowY: "auto",
            color: "white",
          }}
        />
      )}
    </div>
  );
};

export default MusicSearch;
