"use client";
import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import { getUserMusicList } from "@/app/api/music";
import simplifySongListResult from "@/utils/SongList/simplifySongList";
import { List, Avatar, Spin, Typography, message, Button } from "antd";
import { setSubscribedList, setCreatedList } from "@/redux/modules/playList/reducer";
import { SimplifiedPlaylist } from "@/redux/modules/types";
import "./index.scss";
import { SwitcherOutlined } from "@ant-design/icons";

const { Title } = Typography;

const TrackList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { subscribedList = [], createdList = [] } = useAppSelector((state) => state.playlist);
  const { userInfo } = useAppSelector((state) => state.login);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [displayList, setDisplayList] = useState<SimplifiedPlaylist[]>([]);
  const [showSubscribed, setShowSubscribed] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserMusicList = async () => {
      if (userInfo?.id) {
        try {
          setIsLoading(true);
          setError(null);
          const res: any = await getUserMusicList(parseInt(userInfo.id));
          
          if (res?.playlist && Array.isArray(res.playlist)) {
            const filterList = [
              "description", "id", "name", "coverImgUrl", 
              "subscribed", "trackCount"
            ];
            const simplifiedList = res.playlist.map((val: any) => 
              simplifySongListResult(val, filterList)
            );
            splitPlayList(simplifiedList);
          } else {
            setError('Invalid playlist data received');
          }
        } catch (err) {
          console.error('Fetch error:', err);
          setError('Failed to load music list. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserMusicList();
  }, [userInfo]);

  const splitPlayList = (FullList: SimplifiedPlaylist[]) => {
    if (!FullList || !Array.isArray(FullList)) {
      console.error('Invalid playlist data');
      return;
    }

    const subscribed: SimplifiedPlaylist[] = [];
    const created: SimplifiedPlaylist[] = [];
    
    FullList.forEach((item) => {
      if (item.subscribed) {
        subscribed.push(item);
      } else {
        created.push(item);
      }
    });

    if (subscribed.length || created.length) {
      dispatch(setSubscribedList(subscribed));
      dispatch(setCreatedList(created));
      setDisplayList(subscribed.length ? subscribed : created);
    }
  };

  const toggleList = () => {

    
    const newShowSubscribed = !showSubscribed;
    setShowSubscribed(newShowSubscribed);

    const targetList = newShowSubscribed ? subscribedList : createdList;
    setDisplayList(targetList.length ? targetList : []);

  };

  const handleItemClick = (id: number) => {
    message.info(`You clicked playlist with ID: ${id}`);
  };

  return (
    <div className="relative w-full" style={{ width: "100%", height: "100%" }}>
      <div className="flex flex-row justify-around mt-4" style={{ textAlign: "center", marginBottom: 20 }}>
        <span className="align-text-center text-2xl font-bold text-white">Your Playlists</span>
        <button><SwitcherOutlined onClick={toggleList} style={{ fontSize: 24, color: "white" }} /></button>
      </div>
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && displayList.length === 0 && (
        <p style={{ textAlign: "center", color: "gray" }}>No playlists found.</p>
      )}
      {!isLoading && !error && displayList.length > 0 && (
        <List
          className="trackList"
          itemLayout="horizontal"
          dataSource={displayList}
          renderItem={(track) => (
            <List.Item onClick={() => handleItemClick(track.id)} style={{ cursor: "pointer", paddingInlineStart: 20 }}>
              <List.Item.Meta
                avatar={<Avatar src={track.coverImgUrl} shape="square" size={64} style={{ borderRadius: 4 }} />}
                title={<span style={{ color: "white" }}>{track.name}</span>}
                description={<span style={{ color: "white" }}>{`Tracks: ${track.trackCount}`}</span>}
              />
            </List.Item>
          )}
          style={{
            maxHeight: "400px",
            overflowY: "auto",
            color: "white",
          }}
        />
      )}
    </div>
  );
};

export default TrackList;
