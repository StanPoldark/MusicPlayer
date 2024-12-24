"use client";
import React, { useState } from "react";
import { Row, Col, Drawer, Collapse } from "antd";
import { AudioProvider } from "@/contexts/AudioContext";
import MusicPlayer from "@/components/MusicPlayer/page";
import Login from "@/components/Login/page";
import PlayList from "@/components/PlayList/page";
import TrackList from "@/components/TrackList/page";
import LyricsDisplay from "@/components/Lyrics/page";
import MusicSearch from "@/components/Search/page";
import mediaQuery from "@/utils/mediaQuery";
import BottomNavigation from "@/components/BottomNavigation/page";
import SnowfallBackground from "@/components/Snow/page";

import Live2DViewer from "@/components/Live2DViewer/page";
import Utils from "@/components/Utils/page";
import {
  UserOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  UnorderedListOutlined,
  ControlOutlined,
} from "@ant-design/icons";
import "./index.scss";

export default function HomePage() {
  const isMobile = mediaQuery("(max-width: 768px)");
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);

  // Bottom navigation items for mobile
  const mobileNavItems = [
    {
      key: "login",
      icon: <UserOutlined />,
      label: "Login",
      component: <Login />,
    },
    {
      key: "search",
      icon: <SearchOutlined />,
      label: "Search",
      component: <MusicSearch />,
    },
    {
      key: "tracklist",
      icon: <UnorderedListOutlined />,
      label: "Track List",
      component: <TrackList />,
    },
    {
      key: "playlist",
      icon: <PlayCircleOutlined />,
      label: "Play List",
      component: <PlayList />,
    },
    {
      key: "audioeffect",
      icon: <ControlOutlined />,
      label: "Function",
      component: <Utils />,
    },
  ];

  const collapseItems = [
    {
      key: "tracklist",
      label: "Track List",
      children: (
        <div className="box" style={{ height: "100%", width: "100%" }}>
          <TrackList />
        </div>
      ),
      style: { height: "100%", color: "white" },
    },
    {
      key: "playlist",
      label: "Play List",
      children: (
        <div className="box" style={{ height: "100%", width: "100%" }}>
          <PlayList />
        </div>
      ),
      style: { height: "100%", color: "white" },
    },
    ...(!isMobile
      ? [
          {
            key: "utils",
            label: "Utils",
            children: (
              <div className="box" style={{ height: "100%", width: "100%" }}>
                <Utils />
              </div>
            ),
            style: { height: "100%", color: "white" },
          },
        ]
      : []),
  ];

  // Close the drawer
  const onClose = () => {
    setActiveDrawer(null);
  };

  // Open a specific drawer
  const openDrawer = (key: string) => {
    setActiveDrawer(key);
  };

  return (
    <AudioProvider>
      <SnowfallBackground />
      {!isMobile && <Live2DViewer />}
      <div
        style={{
          margin: "20px",
          width: "80%",
          height: isMobile ? "90%" : "80%",
        }}
      >
        {isMobile ? (
          <>
            <Row
              gutter={0}
              style={{ height: "100%", paddingBottom: isMobile ? "5rem" : "0" }}
            >
              <Col span={24}>
                <div className="box" style={{ height: "100%", width: "100%" }}>
                  <LyricsDisplay />
                  <MusicPlayer />
                </div>
              </Col>
            </Row>

            {/* Replace the previous bottom nav with the new component */}
            <BottomNavigation
              navItems={mobileNavItems}
              onItemClick={openDrawer}
            />

            {/* Drawers remain the same */}
            {mobileNavItems.map((item) => (
              <Drawer
                key={item.key}
                placement="bottom"
                closable={true}
                onClose={onClose}
                open={activeDrawer === item.key}
                height="70%"
                title={item.label}
                style={{
                  borderTopLeftRadius: "20px",
                  borderTopRightRadius: "20px",
                }}
              >
                <div className="box" style={{ height: "100%", width: "100%" }}>
                  {item.component}
                </div>
              </Drawer>
            ))}
          </>
        ) : (
          <Row gutter={0} style={{ height: "100%" }}>
            <Col span={6}>
              <Row style={{ height: "20%", marginBottom: "1%" }}>
                <div className="box" style={{ height: "100%" }}>
                  <Login />
                </div>
              </Row>
              <Row style={{ height: "79%" }}>
                <div className="box" style={{ height: "100%" }}>
                  <MusicSearch />
                </div>
              </Row>
            </Col>
            <Col span={12}>
              <div className="box" style={{ height: "100%" }}>
                <LyricsDisplay />
                <MusicPlayer />
              </div>
            </Col>
            <Col span={6} style={{ height: "100%" }}>
              <Collapse
                accordion // This ensures only one panel can be open at a time
                items={collapseItems}
                defaultActiveKey={[]}
              />
            </Col>
          </Row>
        )}
      </div>
    </AudioProvider>
  );
}
