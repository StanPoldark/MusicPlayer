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

const MusicSearch: React.FC = () => {
  const dispatch = useAppDispatch();
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storedTracks, setStoredTracks] = useState<Track[]>([]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      message.warning("请输入搜索关键词");
      return;
    }

    try {
      setIsLoading(true);
      const res: any = await search(searchTerm);

      if (res?.result.songs && Array.isArray(res.result.songs)) {
        const searchTracks: Track[] = res.result.songs.map((song: any) => ({
          name: song.name,
          id: song.id,
          ar: song.artists.map((artist: any) => artist.name).join(", "),
          picUrl: song.album?.picUrl || "",
          url: "",
          time: 0,
        }));
        const updateTracks = await getSongsWithUrls(searchTracks);
        setSearchResults(updateTracks);
      } else {
        message.error("未找到结果");
        setSearchResults([]);
      }
    } catch (error) {
      console.error("搜索错误:", error);
      message.error("搜索失败");
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

    const getSongsWithUrls = async (songList: any[]) => {
      // 获取所有歌曲的 ID
      const songIds = songList.map((song) => song.id);
    
      // 获取歌曲的 URL
      const response = await getSongUrls(songIds);  // 调用 getSongUrls 获取歌曲数据
    
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


  const handleSongClick = useCallback(
    async (track: Track) => {
      const existingTrack = storedTracks.find((t) => t.id === track.id);

      if (existingTrack) {
        dispatch(setCurrentTrack(existingTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: existingTrack }));
        return;
      }

      try {
        const songAvailableData = await checkSong(track.id);
        const songLyric = await getlyric(track.id);

        if (!songAvailableData.success) {
          alert("抱歉，由于版权限制，此歌曲不可播放")
          message.error("抱歉，由于版权限制，此歌曲不可播放");
          return;
        }
        const updatedTrack = {
          ...track,
          lyric: songLyric.lrc.lyric,
        };

        setStoredTracks((prevTracks) => [...prevTracks, updatedTrack]);

        dispatch(setCurrentTrack(updatedTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: updatedTrack }));
      } catch (error) {
        console.error("获取歌曲URL错误:", error);
        message.error("加载歌曲失败");
      }
    },
    [dispatch, storedTracks]
  );

  const handleAddToPlaylist = useCallback(
    async (track: Track) => {
      try {
        const songAvailableData = await checkSong(track.id);

        if (!songAvailableData.success) {
          alert("抱歉，由于版权限制，此歌曲不可添加")
          message.error("抱歉，由于版权限制，此歌曲不可添加");
          return;
        }

        const songLyric = await getlyric(track.id);
        const updatedTrack = {
          ...track,
          lyric: songLyric.lrc.lyric,
        };

        dispatch(addTrackToPlaylist({ from: "add", track: updatedTrack }));
        message.success(`已添加 ${track.name} 到播放列表`);
      } catch (error) {
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
