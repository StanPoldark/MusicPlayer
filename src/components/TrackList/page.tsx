"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import { getUserMusicList, getDetailList } from "@/app/api/music";
import simplifySongListResult from "@/utils/SongList/simplifySongList";
import { List, Avatar, Spin, message, Button } from "antd";
import Image from "next/image";
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
      try {
        // 检查是否已经存在这个歌单的歌曲列表
        const existingTrackList = trackLists.find(
          (list) => list.playlistId === id
        );

        if (existingTrackList) {
          // 如果已存在，直接切换到歌曲列表视图
          setDisplayMode("tracks");
          setCurrentPlaylistId(id);
          return;
        }

        setIsLoading(true);
        const res: TrackResponse = await getDetailList(id);
        const songList: Track[] = res.songs.map((song: any) => ({
          name: song.name,
          id: song.id,
          ar: song.ar.map((ar: any) => ar.name).join(", "),
          picUrl: song.al.picUrl,
        }));

        // 保存歌曲列表到 Redux，并携带歌单ID
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
        setIsLoading(false);
      }
    },
    [dispatch, trackLists]
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

  const handleItemClick = useCallback(
    (id: number) => {
      fetchTrackData(id);
    },
    [fetchTrackData]
  );

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
        <List
          className="trackList"
          itemLayout="horizontal"
          dataSource={currentTrackList}
          renderItem={(track) => (
            <List.Item style={{ paddingInlineStart: 20 }}>
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
      <List
      className="trackList"
      itemLayout="horizontal"
      dataSource={displayList}
      renderItem={(track) => (
        <List.Item
          onClick={() => handleItemClick(track.id)}
          style={{ cursor: "pointer", paddingInlineStart: 20 }}
        >
          <List.Item.Meta
            avatar={
              <div className="relative w-16 h-16">
                <Image
                  src={track.coverImgUrl || '/placeholder-image.png'}
                  alt={`Cover for ${track.name}`}
                  fill
                  style={{ 
                    objectFit: 'cover', 
                    borderRadius: '4px' 
                  }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
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
  );
}, [
  isLoading,
  error,
  displayList,
  displayMode,
  currentTrackList,
  handleItemClick,
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
