"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import {
  getUserMusicList,
  getDetailList,
  getSongUrl,
  checkSong,
  getlyric,
} from "@/app/api/music";
import simplifySongListResult from "@/utils/SongList/simplifySongList";
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
import { SwitcherOutlined, UnorderedListOutlined } from "@ant-design/icons";
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
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<number | null>(
    null
  );
  const [displayList, setDisplayList] = useState<SimplifiedPlaylist[]>([]);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("playlist");
  const [currentPlaylistId, setCurrentPlaylistId] = useState<number | null>(
    null
  );
  const [showSubscribed, setShowSubscribed] = useState<boolean>(true);
  const [error, setError] = useState<FetchError | null>(null);
  const [storedTracks, setStoredTracks] = useState<Track[]>([]);

  
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
        const songList: Track[] = await Promise.all(
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

        const songData = await getSongUrl(track.id);
        const updatedTrack = {
          ...track,
          url: `/api/proxy/music?url=${encodeURIComponent(
            songData.data[0].url
          )}`,
          lyric: songLyric.lrc.lyric,
          time: songData.data[0].time,
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

        const songData = await getSongUrl(track.id);
        const songLyric = await getlyric(track.id);

        const updatedTrack = {
          ...track,
          url: `/api/proxy/music?url=${encodeURIComponent(
            songData.data[0].url
          )}`,
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
                  <LucidePlus size={20} className="mr-2" />
                </button>
              </List.Item>
            )}
            style={{
              maxHeight: "18rem",
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
            maxHeight: "18rem",
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
        <span className="align-text-center text-2xl font-bold text-white">
          {displayMode === "playlist" ? "Your Playlists" : "Playlist Tracks"}
        </span>
        <div style={{display: "flex"}}>
          {displayMode === "playlist" && (
            <button>
              <SwitcherOutlined
                onClick={toggleList}
                style={{ fontSize: 24, color: "white"}}
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
            <UnorderedListOutlined />
          </button>
        </div>
      </div>
      {listContent}
    </div>
  );
};

export default TrackList;
