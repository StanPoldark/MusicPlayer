"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import {
  getUserMusicList,
  getDetailList,
  getSongUrls,
  checkSong,
  getlyric,
  cloud,
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
  CloudResponse,
  TrackResponse,
} from "@/redux/modules/types";
import {
  SwitcherOutlined,
  UnorderedListOutlined,
  VerticalAlignBottomOutlined,
  RedoOutlined,
  ArrowLeftOutlined,
  CloudOutlined,
} from "@ant-design/icons";
import "./index.scss";
import DownloadAudio from "@/utils/SongList/downloadAudio";

// 定义显示模式类型
type View = 'cloud' | 'subscribed' | 'created' | 'tracks';

// Define error type
type FetchError = {
  message: string;
  code?: number;
};

const TrackList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { subscribedList = [], createdList = [] } = useAppSelector(
    (state) => state.playlist
  );
  const { userInfo } = useAppSelector((state) => state.login);
  const { trackLists } = useAppSelector((state) => state.tracks);

  // State declarations
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<number | null>(null);
  const [displayList, setDisplayList] = useState<SimplifiedPlaylist[]>([]);
  const [currentView, setCurrentView] = useState<View>('subscribed');
  const [currentPlaylistId, setCurrentPlaylistId] = useState<number | null>(null);
  const [error, setError] = useState<FetchError | null>(null);
  const [storedTracks, setStoredTracks] = useState<Track[]>([]);

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

    // Handle cloud view
    const handleCloudView = useCallback(async () => {
      if (loadingPlaylistId || isLoadingTracks) return;
  
      const existingCloudList = trackLists.find((list) => list.playlistId === 0);
      if (existingCloudList) {
        setCurrentView('cloud');
        setCurrentPlaylistId(0);
        return;
      }
  
      try {
        setIsLoadingTracks(true);
        setLoadingPlaylistId(null);
  
        const res: CloudResponse = await cloud();
        
        if (!res.data || !Array.isArray(res.data)) {
          throw new Error("Invalid cloud data received");
        }
  
        let songList: Track[] = await Promise.all(
          res.data.map(async (song: any): Promise<Track> => ({
            name: song.simpleSong.name,
            id: song.simpleSong.id,
            ar: song.simpleSong.ar?.map((ar: any) => ar.name).join(", ") || "",
            picUrl: song.simpleSong.al?.picUrl || "",
            url: "",
            time: 0,
          }))
        );
  
        songList = await getSongsWithUrls(songList);
  
        dispatch(addTrackList({
          playlistId: 0,
          tracks: songList,
        }));
        
        setCurrentView('cloud');
        setCurrentPlaylistId(0);
      } catch (error) {
        console.error("Error fetching cloud data:", error);
        message.error("Failed to load cloud music");
      } finally {
        setIsLoadingTracks(false);
        setLoadingPlaylistId(null);
      }
    }, [dispatch, trackLists, loadingPlaylistId, isLoadingTracks]);

    
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

      if (trackLists.find((list) => list.playlistId === id)) {
        setCurrentView('tracks');
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
        setCurrentView('tracks');
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
          lyric: songLyric.uncollected ?  "" : songLyric.lrc.lyric,
        };

        // Store the updated track in the state
        setStoredTracks((prevTracks) => [...prevTracks, updatedTrack]);

        // Dispatch the updated track
        dispatch(setCurrentTrack(updatedTrack));
        dispatch(addTrackToPlaylist({ from: "play", track: updatedTrack }));
      } catch (error) {
        console.error("Error fetching song URL:", error);
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

 // Handle view changes
 const handleSubscribedView = useCallback(() => {
  setDisplayList(subscribedList);
  setCurrentView('subscribed');
}, [subscribedList]);

const handleCreatedView = useCallback(() => {
  setDisplayList(createdList);
  setCurrentView('created');
}, [createdList]);

const handleBackToList = useCallback(() => {
  if (currentView === 'tracks') {
    const previousView = displayList === subscribedList ? 'subscribed' : 'created';
    setCurrentView(previousView);
  }
}, [currentView, displayList, subscribedList]);

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

 // Render header
 const renderHeader = () => {
  const viewTitles = {
    cloud: "云歌单",
    subscribed: "订阅的歌单",
    created: "创建的歌单",
    tracks: "歌单详情"
  };

  return (
    <div className="flex flex-row justify-between items-center mt-4 px-4 mb-5">
      <span className="text-xl font-bold text-white">
        {viewTitles[currentView]}
      </span>
      <div className="flex space-x-4">
        <button
          onClick={handleCloudView}
          className="text-white hover:text-blue-400"
          title="Cloud Music"
        >
          <CloudOutlined style={{ fontSize: 24 }} />
        </button>
        <button
          onClick={handleSubscribedView}
          className="text-white hover:text-blue-400"
          title="Subscribed Playlists"
        >
          <UnorderedListOutlined style={{ fontSize: 24 }} />
        </button>
        <button
          onClick={handleCreatedView}
          className="text-white hover:text-blue-400"
          title="Created Playlists"
        >
          <SwitcherOutlined style={{ fontSize: 24 }} />
        </button>
        <button
          onClick={refreshPlaylists}
          className="text-white hover:text-blue-400"
          title="Refresh"
        >
          <RedoOutlined style={{ fontSize: 24 }} />
        </button>
        {currentView === 'tracks' && (
          <button
            onClick={handleBackToList}
            className="text-white hover:text-blue-400"
            title="Back"
          >
            <ArrowLeftOutlined style={{ fontSize: 24 }} />
          </button>
        )}
      </div>
    </div>
  );
};
const listContent = useMemo(() => {
  if (!localStorage.getItem("cookie")) {
    return (
      <div className="flex justify-center items-center h-40">
        <span>Please Login First</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error.message}</p>;
  }

  if (currentView === 'cloud' || currentView === 'tracks') {
    const currentTrackList = currentView === 'cloud'
      ? trackLists.find((list) => list.playlistId === 0)?.tracks || []
      : trackLists.find((list) => list.playlistId === currentPlaylistId)?.tracks || [];

    if (!currentTrackList.length) {
      return <p className="text-center text-gray-500">No tracks found.</p>;
    }

    return (
      <div className="relative w-full h-full">
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
              className="px-5 hover:bg-gray-700"
              onClick={() => handleSongClick(track)}
              style={{
                cursor: "pointer",
                paddingInlineStart: 20,
                opacity: loadingPlaylistId ? 0.5 : 1,
                pointerEvents: loadingPlaylistId ? "none" : "auto",
                scrollBehavior: "smooth",
              }}
            >
              <List.Item.Meta
                title={<span className="text-white">{track.name}</span>}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToPlaylist(track);
                }}
                className="text-white hover:text-green-500 mx-2"
              >
                <LucidePlus size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  DownloadAudio(track);
                }}
                className="text-white hover:text-blue-500"
                aria-label="Download track"
              >
                <VerticalAlignBottomOutlined size={20} />
              </button>
            </List.Item>
          )}
          style={{
            overflowY: "auto",
            color: "white",
          }}
        />
      </div>
    );
  }

  // Playlist view (subscribed or created)
  if (!displayList.length) {
    return <p className="text-center text-gray-500">No playlists found.</p>;
  }

  return (
    <div className="relative w-full h-full">
      {loadingPlaylistId && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <Spin size="large" />
        </div>
      )}
      <List
        className="trackList"
        itemLayout="horizontal"
        dataSource={displayList}
        renderItem={(playlist) => (
          <List.Item
            className="trackitem px-5 hover:bg-gray-700"
            onClick={() => {
              handleItemClick(playlist.id);
              setCurrentView('tracks');
            }}
            style={{
              cursor: "pointer",
              paddingInlineStart: 20,
              opacity: loadingPlaylistId ? 0.5 : 1,
              pointerEvents: loadingPlaylistId ? "none" : "auto",
            }}
          >
            <List.Item.Meta
              title={<span className="text-white">{playlist.name}</span>}
            />
          </List.Item>
        )}
        style={{
          overflowY: "auto",
          color: "white",
        }}
      />
    </div>
  );
}, [
  currentView,
  isLoading,
  error,
  displayList,
  trackLists,
  currentPlaylistId,
  isLoadingTracks,
  loadingPlaylistId,
  handleSongClick,
  handleAddToPlaylist,
  handleItemClick
]);

// Main component render
return (
  <div className="relative w-full h-full">
    {renderHeader()}
    {listContent}
  </div>
);
};

export default TrackList;