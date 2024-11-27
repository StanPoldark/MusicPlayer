"use client";
import React, { useEffect, useState } from "react";
import { useAppSelector } from "@/hooks/hooks";
import { getUserMusicList } from "@/app/api/music";
import simplifySongListResult from "@/utils/SongList/simplifySongList";
import { List, Avatar, Spin, Typography, message } from "antd";

const { Title } = Typography;

interface SimplifiedPlaylist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  [key: string]: any; // 可扩展字段
}

const TrackList: React.FC = () => {
  const { userInfo } = useAppSelector((state) => state.login);
  const [trackList, setTrackList] = useState<SimplifiedPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserMusicList = async () => {
      if (userInfo?.id) {
        try {
          setIsLoading(true);
          setError(null);
          const res: any = await getUserMusicList(parseInt(userInfo.id));
          if (res.playlist) {
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
            setTrackList(simplifiedList);
          }
        } catch (err) {
          setError("Failed to load music list. Please try again later.");
          message.error("Error loading playlists");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserMusicList();
  }, [userInfo]);

  const handleItemClick = (id: number) => {
    message.info(`You clicked playlist with ID: ${id}`);
    // 在此处添加导航或其他逻辑
  };

  return (
    <div className="relative w-full" style={{ width: "100%", height: "100%" }}>
      <Title level={2} style={{ marginBottom: 20, textAlign: "center" }}>
        Your Playlists
      </Title>
      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <Spin size="large" />
        </div>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && !error && trackList.length === 0 && (
        <p style={{ textAlign: "center", color: "gray" }}>No playlists found.</p>
      )}
      {!isLoading && !error && trackList.length > 0 && (
        <List
          itemLayout="horizontal"
          dataSource={trackList}
          renderItem={(track) => (
            <List.Item
              onClick={() => handleItemClick(track.id)}
              style={{ cursor: "pointer", paddingInlineStart: 20 }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={track.coverImgUrl}
                    shape="square"
                    size={64}
                    style={{ borderRadius: 4 }}
                  />
                }
                title={<span style={{ color: "white" }}>{track.name}</span>}  
                description={<span style={{ color: "white" }}>{`Tracks: ${track.trackCount}`}</span>}  
              />
            </List.Item>
          )}
          style={{
            maxHeight: "400px", // 设置最大高度
            overflowY: "auto", // 启用垂直滚动
            color: 'white'
          }}
        />
      )}
    </div>
  );
};

export default TrackList;
