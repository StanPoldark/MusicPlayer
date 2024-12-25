"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import {
  getUserMusicList,
  getDetailList,
  getSongUrls,
  checkSong,
  getlyric,
} from "@/app/api/music";
import simplifyResult from "@/utils/SongList/simplifyResult";
import { List, Spin, message } from "antd";
import { LucidePlus } from "lucide-react";
import {
  setCurrentTrack,
  addTrackToPlaylist,
} from "@/redux/modules/musicPlayer/reducer";
import {
  setSubscribedList,
  setCreatedList,
} from "@/redux/modules/playList/reducer";
import { addTrackList } from "@/redux/modules/SongList/reducer";
import {
  SimplifiedPlaylist,
  Track,
  TrackResponse,
} from "@/redux/modules/types";
import {
  SwitcherOutlined,
  UnorderedListOutlined,
  VerticalAlignBottomOutlined,
  RedoOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import "./index.scss";
import DownloadAudio from "@/utils/SongList/downloadAudio";

// 定义显示模式类型
type DisplayMode = "playlist" | "tracks";
// 定义获取数据失败的错误类型
type FetchError = {
  message: string;
  code?: number;
};

const TrackList: React.FC = () => {
  const dispatch = useAppDispatch();
  // 从 Redux 中获取订阅的歌单和创建的歌单
  const { subscribedList = [], createdList = [] } = useAppSelector(
    (state) => state.playlist
  );
  // 从 Redux 中获取用户信息
  const { userInfo } = useAppSelector((state) => state.login);
  // 从 Redux 中获取歌曲列表
  const { trackLists } = useAppSelector((state) => state.tracks);

  // 定义加载状态
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // 定义加载歌曲状态
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  // 定义加载歌单 ID
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<number | null>(
    null
  );
  // 定义显示的歌单列表
  const [displayList, setDisplayList] = useState<SimplifiedPlaylist[]>([]);
  // 定义显示模式
  const [displayMode, setDisplayMode] = useState<DisplayMode>("playlist");
  // 定义当前歌单 ID
  const [currentPlaylistId, setCurrentPlaylistId] = useState<number | null>(
    null
  );
  // 定义是否显示订阅的歌单
  const [showSubscribed, setShowSubscribed] = useState<boolean>(true);
  // 定义错误信息
  const [error, setError] = useState<FetchError | null>(null);
  // 定义存储的歌曲列表
  const [storedTracks, setStoredTracks] = useState<Track[]>([]);
  // 定义是否显示歌单名称
  const [ListName, setListName] = useState<boolean>(true);
  // 定义是否处于返回模式
  const [isBackMode, setIsBackMode] = useState<boolean>(false); // State to track if in back mode

  // 获取用户歌单列表
  const fetchUserMusicList = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const res: any = await getUserMusicList(parseInt(userId));

      if (res?.playlist && Array.isArray(res.playlist)) {
        const filterList = [
          "description",
          "id",
          "name",
          "subscribed",
          "trackCount",
        ];

        const simplifiedList = res.playlist.map((val: any) =>
          simplifyResult(val, filterList)
        );

        return simplifiedList;
      } else {
        throw new Error("Invalid playlist data received");
      }
    } catch (err: any) {
      const fetchError: FetchError = {
        message: err.message || "Failed to load music list",
        code: err.code,
      };
      setError(fetchError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 分割歌单列表
  const splitPlayList = useCallback(
    (fullList: SimplifiedPlaylist[]) => {
      if (!fullList?.length) {
        console.error("Invalid playlist data");
        return;
      }

      const subscribed: SimplifiedPlaylist[] = fullList.filter(
        (item) => item.subscribed
      );
      const created: SimplifiedPlaylist[] = fullList.filter(
        (item) => !item.subscribed
      );

      dispatch(setSubscribedList(subscribed));
      dispatch(setCreatedList(created));
      setDisplayList(subscribed.length ? subscribed : created);
    },
    [dispatch]
  );

  // 获取歌曲的 URL
  const getSongsWithUrls = async (songList: any[]) => {
    // 获取所有歌曲的 ID
    const songIds = songList.map((song) => song.id);

    // 获取歌曲的 URL
    const response = await getSongUrls(songIds); // 调用 getSongUrls 获取歌曲数据

    // 检查返回的数据是否有效
    if (response.code !== 200 || !response.data) {
      throw new Error("Failed to fetch song URLs");
    }

    // 将 URL 添加到歌曲对象中
    const updatedSongList = songList.map((song) => {
      const songData = response.data.find((data: any) => data.id === song.id);

      // 如果 URL 存在并且有效（非 null 或 404），使用它，否则使用空字符串
      const songUrl =
        songData && songData.url
          ? `/api/proxy/music?url=${encodeURIComponent(songData.url)}`
          : "";

      return {
        ...song,
        url: songUrl,
        time: songData?.time || 0,
      };
    });

    return updatedSongList;
  };

  // 处理歌单点击事件
  const handleItemClick = useCallback(
    async (id: number) => {
      if (loadingPlaylistId) return;

      // Check if the track list already exists for the current playlist
      if (trackLists.find((list) => list.playlistId === id)) {
        setDisplayMode("tracks");
        setCurrentPlaylistId(id);
        return;
      }

      try {
        setIsLoadingTracks(true);
        setLoadingPlaylistId(id);

        const res: TrackResponse = await getDetailList(id);
        let songList: Track[] = await Promise.all(
          res.songs.map(async (song: any): Promise<Track> => {
            return {
              name: song.name,
              id: song.id,
              ar: song.ar.map((ar: any) => ar.name).join(", "),
              picUrl: song.al.picUrl,
              url: "",
              time: 0,
            };
          })
        );

        songList = await getSongsWithUrls(songList);

        dispatch(
          addTrackList({
            playlistId: id,
            tracks: songList,
          })
        );
        setDisplayMode("tracks");
        setCurrentPlaylistId(id);
      } catch (error) {
        console.error("Error fetching track data:", error);
        message.error("Failed to load track details");
      } finally {
        setIsLoadingTracks(false);
        setLoadingPlaylistId(null);
      }
    },
    [dispatch, trackLists, loadingPlaylistId]
  );

  // 处理歌曲点击事件
  const handleSongClick = useCallback(
    async (track: Track) => {
      // Prevent fetching if loading tracks
      if (isLoadingTracks) return;

      // Check if the track is already in the storedTracks array
      const existingTrack = storedTracks.find((t) => t.id === track.id);

      if (existingTrack) {
        // Track already exists, dispatch it without re-fetching
        dispatch(setCurrentTrack(existingTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: existingTrack }));
        return;
      }

      try {
        // Set loading state
        setIsLoadingTracks(true);

        // Check song availability
        const songAvailableData = await checkSong(track.id);
        const songLyric = await getlyric(track.id);

        if (!songAvailableData.success) {
          alert(
            "Sorry, this song is not available due to copyright restrictions."
          );
          return;
        }
        const updatedTrack = {
          ...track,
          lyric: songLyric.lrc.lyric,
        };

        // Store the updated track in the state
        setStoredTracks((prevTracks) => [...prevTracks, updatedTrack]);

        // Dispatch the updated track
        dispatch(setCurrentTrack(updatedTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: updatedTrack }));
      } catch (error) {
        console.error("Error fetching song URL:", error);
        message.error("Failed to load song");
      } finally {
        setIsLoadingTracks(false);
      }
    },
    [dispatch, isLoadingTracks, storedTracks] // Add storedTracks as a dependency
  );

  // 组件挂载时获取用户歌单列表
  useEffect(() => {
    const loadUserPlaylists = async () => {
      if (userInfo?.id) {
        const simplifiedList = await fetchUserMusicList(userInfo.id);
        if (simplifiedList) {
          splitPlayList(simplifiedList);
        }
      }
    };

    loadUserPlaylists();
  }, [userInfo, fetchUserMusicList, splitPlayList]);

  // 切换歌单列表
  const toggleList = useCallback(() => {
    const newShowSubscribed = !showSubscribed;
    setShowSubscribed(newShowSubscribed);
    setListName(!ListName);
    const targetList = newShowSubscribed ? subscribedList : createdList;
    setDisplayList(targetList.length ? targetList : []);
  }, [showSubscribed, subscribedList, createdList]);

  // 切换显示模式
  const toggleDisplayMode = useCallback(() => {
    setDisplayMode((prev) => (prev === "playlist" ? "tracks" : "playlist"));
    setIsBackMode(!isBackMode); // Toggle back mode when switching modes
  }, [isBackMode]);

  // 获取当前歌单的歌曲列表
  const currentTrackList = useMemo(() => {
    if (displayMode === "tracks" && currentPlaylistId) {
      const trackListItem = trackLists.find(
        (list) => list.playlistId === currentPlaylistId
      );
      return trackListItem ? trackListItem.tracks : [];
    }
    return [];
  }, [displayMode, currentPlaylistId, trackLists]);

  // 添加歌曲到歌单
  const handleAddToPlaylist = useCallback(
    async (track: Track) => {
      try {
        // Check song availability
        const songAvailableData = await checkSong(track.id);

        if (!songAvailableData.success) {
          alert(
            "Sorry, this song is not available due to copyright restrictions."
          );
          return;
        }

        const songLyric = await getlyric(track.id);

        const updatedTrack = {
          ...track,
          lyric: songLyric.lrc.lyric,
        };

        // Dispatch action to add track to playlist
        dispatch(addTrackToPlaylist({ from: "add", track: updatedTrack }));
        alert(`Added ${track.name} to playlist`);
      } catch (error) {
        console.error("Error adding track to playlist:", error);
        alert("Failed to add track to playlist");
      }
    },
    [dispatch]
  );

  // 刷新歌单列表
  const refreshPlaylists = useCallback(() => {
    if (userInfo?.id) {
      fetchUserMusicList(userInfo.id).then((simplifiedList) => {
        if (simplifiedList) {
          splitPlayList(simplifiedList);
        }
      });
    }
  }, [userInfo, fetchUserMusicList, splitPlayList]);

  // 渲染列表内容
  const listContent = useMemo(() => {
    if (!localStorage.getItem("cookie")) {
      return (
        <div className="flex justify-center items-center h-40">
          <span>Please Login First</span>
        </div>
      );
    } else if (isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return <p className="text-red-500">{error.message}</p>;
    }

    // 歌曲列表视图
    if (displayMode === "tracks") {
      const currentTrackList =
        trackLists.find((list) => list.playlistId === currentPlaylistId)
          ?.tracks || [];

      if (!currentTrackList.length) {
        return (
          <p style={{ textAlign: "center", color: "gray" }}>No tracks found.</p>
        );
      }

      return (
        <div className="relative">
          {isLoadingTracks && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <Spin size="large" />
            </div>
          )}
          <List
            className="trackList"
            itemLayout="horizontal"
            dataSource={currentTrackList}
            renderItem={(track) => (
              <List.Item
                style={{
                  paddingInlineStart: 20,
                  opacity: isLoadingTracks ? 0.5 : 1,
                  pointerEvents: isLoadingTracks ? "none" : "auto",
                }}
                onClick={() => handleSongClick(track)}
              >
                <List.Item.Meta
                  title={<span style={{ color: "white" }}>{track.name}</span>}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToPlaylist(track);
                  }}
                  className="text-white hover:text-green-500"
                >
                  <LucidePlus size={20} />
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
                  <VerticalAlignBottomOutlined size={20} className="mr-2" />
                </button>
              </List.Item>
            )}
            style={{
              maxHeight: "24rem",
              overflowY: "auto",
              color: "white",
            }}
          />
        </div>
      );
    }

    // 歌单列表视图
    if (!displayList.length) {
      return (
        <p style={{ textAlign: "center", color: "gray" }}>
          No playlists found.
        </p>
      );
    }

    return (
      <div className="relative">
        {loadingPlaylistId && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <Spin size="large" />
          </div>
        )}
        <List
          className="trackList"
          itemLayout="horizontal"
          dataSource={displayList}
          renderItem={(track) => (
            <List.Item
              className="trackitem"
              onClick={() => handleItemClick(track.id)}
              style={{
                cursor: "pointer",
                paddingInlineStart: 20,
                opacity: loadingPlaylistId ? 0.5 : 1,
                pointerEvents: loadingPlaylistId ? "none" : "auto",
              }}
            >
              <List.Item.Meta
                title={<span style={{ color: "white" }}>{track.name}</span>}
              />
            </List.Item>
          )}
          style={{
            maxHeight: "24rem",
            overflowY: "auto",
            color: "white",
          }}
        />
      </div>
    );
  }, [
    isLoading,
    error,
    displayList,
    displayMode,
    currentTrackList,
    handleItemClick,
    isLoadingTracks,
    loadingPlaylistId,
  ]);

  return (
    <div className="relative w-full" style={{ width: "100%", height: "100%" }}>
      <div
        className="flex flex-row justify-around mt-4"
        style={{ textAlign: "center", marginBottom: 20 }}
      >
        <span className="align-text-center text-xl font-bold text-white">
          {displayMode === "playlist"
            ? ListName
              ? "订阅的歌单"
              : "创建的歌单"
            : "歌单详情"}
        </span>
        <div style={{ display: "flex" }}>
          {displayMode === "playlist" && (
            <button>
              <SwitcherOutlined
                onClick={toggleList}
                style={{ fontSize: 24, color: "white" }}
              />
            </button>
          )}
          {displayMode === "tracks" ? (
            <button onClick={toggleDisplayMode}>
              <ArrowLeftOutlined style={{ fontSize: 24, marginLeft: 20 }} />
            </button>
          ) : (
            <button onClick={toggleDisplayMode}>
              <UnorderedListOutlined style={{ fontSize: 24, marginLeft: 20 }} />
            </button>
          )}
          <button
            onClick={refreshPlaylists}
            style={{ fontSize: 24, color: "white", marginLeft: 20 }}
          >
            <RedoOutlined />
          </button>
        </div>
      </div>
      {listContent}
    </div>
  );
};

export default TrackList;
