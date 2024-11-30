"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import { getUserMusicList, getDetailList, getSongUrl,checkSong,getlyric } from "@/app/api/music";
import simplifySongListResult from "@/utils/SongList/simplifySongList";
import { List, Avatar, Spin, message } from "antd";
import Image from "next/image";
import { setCurrentTrack } from "@/redux/modules/musicPlayer/reducer";
import {
  setSubscribedList,
  setCreatedList,
} from "@/redux/modules/playList/reducer";
import { addTrackList, clearTrackList } from "@/redux/modules/SongList/reducer";
import {
  SimplifiedPlaylist,
  Track,
  TrackResponse,
} from "@/redux/modules/types";
import {
  SwitcherOutlined,
  UnorderedListOutlined,
  AudioOutlined,
} from "@ant-design/icons";
import "./index.scss";

type DisplayMode = "playlist" | "tracks";
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

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<number | null>(null);
  const [displayList, setDisplayList] = useState<SimplifiedPlaylist[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("playlist");
  const [currentPlaylistId, setCurrentPlaylistId] = useState<number | null>(
    null
  );
  const [showSubscribed, setShowSubscribed] = useState<boolean>(true);
  const [error, setError] = useState<FetchError | null>(null);

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
          "coverImgUrl",
          "subscribed",
          "trackCount",
        ];

        const simplifiedList = res.playlist.map((val: any) =>
          simplifySongListResult(val, filterList)
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

  const fetchTrackData = useCallback(
    async (id: number) => {
      // Prevent multiple simultaneous loading
      if (loadingPlaylistId) return;

      try {
        // Check if track list already exists
        const existingTrackList = trackLists.find(
          (list) => list.playlistId === id
        );

        if (existingTrackList) {
          // If exists, switch to track list view
          setDisplayMode("tracks");
          setCurrentPlaylistId(id);
          return;
        }

        // Set loading state
        setIsLoadingTracks(true);
        setLoadingPlaylistId(id);

        const res: TrackResponse = await getDetailList(id);
        // Wait for all async operations to complete
        const songList: Track[] = await Promise.all(
          res.songs.map(async (song: any): Promise<Track> => {
            return {
              name: song.name,
              id: song.id,
              ar: song.ar.map((ar: any) => ar.name).join(", "),
              picUrl: song.al.picUrl,
              url: "", 
            };
          })
        );

        // Save track list to Redux with playlist ID
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

  const handleItemClick = useCallback(
    async (id: number) => {
      
      fetchTrackData(id);
    },
    [fetchTrackData]
  );

  const handleSongClick = useCallback(
    async (track: Track) => {
      // 防止重复加载
      if (isLoadingTracks) return;
  
      try {
        // 设置加载状态为 true
        setIsLoadingTracks(true);
  
        // 检查歌曲可用性
        const songAvailableData = await checkSong(track.id);
        const songLyric = await getlyric(track.id);
        
        if(!songAvailableData.success){
          alert("很抱歉，该歌曲因版权限制无法播放。");
          return false;
        }
        
        const songData = await getSongUrl(track.id);
        const updatedTrack = {
          ...track,
          url: `/api/proxy/music?url=${encodeURIComponent(songData.data[0].url)}`,
          lyric: songLyric.lrc.lyric        
        };
        
        // 分发当前音轨
        dispatch(setCurrentTrack(updatedTrack));
      } catch (error) {
        console.error("Error fetching song URL:", error);
        message.error("Failed to load song");
      } finally {
        // 无论成功或失败，都要确保关闭加载状态
        setIsLoadingTracks(false);
      }
    },
    [dispatch, isLoadingTracks]  // 添加 isLoadingTracks 作为依赖
  );

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

  const toggleList = useCallback(() => {
    const newShowSubscribed = !showSubscribed;
    setShowSubscribed(newShowSubscribed);

    const targetList = newShowSubscribed ? subscribedList : createdList;
    setDisplayList(targetList.length ? targetList : []);
  }, [showSubscribed, subscribedList, createdList]);

  const toggleDisplayMode = useCallback(() => {
    setDisplayMode((prev) => (prev === "playlist" ? "tracks" : "playlist"));
  }, []);

  const currentTrackList = useMemo(() => {
    if (displayMode === "tracks" && currentPlaylistId) {
      const trackListItem = trackLists.find(
        (list) => list.playlistId === currentPlaylistId
      );
      return trackListItem ? trackListItem.tracks : [];
    }
    return [];
  }, [displayMode, currentPlaylistId, trackLists]);

  const listContent = useMemo(() => {
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

    // 歌曲列表视图
    if (displayMode === "tracks") {
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
                  pointerEvents: isLoadingTracks ? 'none' : 'auto'
                }}
                onClick={() => handleSongClick(track)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={track.picUrl}
                      shape="square"
                      size={64}
                      style={{ borderRadius: 4 }}
                    />
                  }
                  title={<span style={{ color: "white" }}>{track.name}</span>}
                  description={<span style={{ color: "white" }}>{track.ar}</span>}
                />
              </List.Item>
            )}
            style={{
              maxHeight: "400px",
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
              onClick={() => handleItemClick(track.id)}
              style={{ 
                cursor: "pointer", 
                paddingInlineStart: 20,
                opacity: loadingPlaylistId ? 0.5 : 1,
                pointerEvents: loadingPlaylistId ? 'none' : 'auto'
              }}
            >
              <List.Item.Meta
                avatar={
                  <div className="relative w-16 h-16">
                    <Image
                      src={track.coverImgUrl || "/placeholder-image.png"}
                      alt={`Cover for ${track.name}`}
                      fill
                      style={{
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                     />
                  </div>
                }
                title={<span style={{ color: "white" }}>{track.name}</span>}
                description={
                  <span
                    style={{ color: "white" }}
                  >{`Tracks: ${track.trackCount}`}</span>
                }
              />
            </List.Item>
          )}
          style={{
            maxHeight: "400px",
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
    loadingPlaylistId
  ]);

  return (
    <div className="relative w-full" style={{ width: "100%", height: "100%" }}>
      <div
        className="flex flex-row justify-around mt-4"
        style={{ textAlign: "center", marginBottom: 20 }}
      >
        <span className="align-text-center text-2xl font-bold text-white">
          {displayMode === "playlist" ? "Your Playlists" : "Playlist Tracks"}
        </span>
        <div>
          {displayMode === "playlist" && (
            <button>
              <SwitcherOutlined
                onClick={toggleList}
                style={{ fontSize: 24, color: "white", marginRight: 10 }}
              />
            </button>
          )}
          <button
            onClick={
              displayMode === "tracks"
                ? () => setDisplayMode("playlist")
                : toggleDisplayMode
            }
            style={{
              color: "white",
              marginLeft: 10,
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            aria-label={
              displayMode === "tracks"
                ? "Switch to playlist mode"
                : "Switch to tracks mode"
            }
          >
            {displayMode === "playlist" ? (
              <AudioOutlined />
            ) : (
              <UnorderedListOutlined />
            )}
          </button>
        </div>
      </div>
      {listContent}
    </div>
  );
};

export default TrackList;