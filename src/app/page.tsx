"use client";
import React from "react";
import { Row, Col, Collapse } from "antd";
import MusicPlayer from "@/components/MusicPlayer/page";
import Login from "@/components/Login/page";
import PlayList from "@/components/PlayList/page";
import { AudioProvider } from "@/contexts/AudioContext";
import TrackList from "@/components/TrackList/page";
import LyricsDisplay from "@/components/Lyrics/page";
import "./index.scss";
import MusicSearch from "@/components/Search/page"

export default function HomePage() {
  const collapseItems = [
    {
      key: 'tracklist',
      label: 'Track List',
      children: (
        <div className="box" style={{ height: "100%",width: "100%"}}>
          <TrackList />
        </div>
      ),
      style: { height: "100%",Color: "white"}
    },
    {
      key: 'playlist',
      label: 'Play List',
      children: (
        <div className="box" style={{ height: "100%" ,width: "100%"}}>
          <PlayList />
        </div>
      ),
      style: { height: "100%",Color: "white" }
    }
  ];

  return (
    <AudioProvider>
      <div style={{ margin: "20px", width: "80%", height: "80%" }}>
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
              accordion  // This ensures only one panel can be open at a time
              items={collapseItems} 
              defaultActiveKey={[]} 
            />
          </Col>
        </Row>
      </div>
    </AudioProvider>
  );
}