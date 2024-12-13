"use client";
import React from "react";
import MusicPlayer from "@/components/MusicPlayer/page";
import Login from "@/components/Login/page";
import PlayList from "@/components/PlayList/page"
import { AudioProvider } from "@/contexts/AudioContext";
import TrackList from "@/components/TrackList/page";
import { Row, Col } from "antd";
import LyricsDisplay from "@/components/Lyrics/page";
import "./index.scss";
export default function HomePage() {
  return (
    <AudioProvider>
      <div style={{ margin: "20px", width: "80%", height: "80%" }}>
        <Row gutter={24} style={{ height: "100%" }}>
          <Col span={6}>
            <div className="box" style={{}}>
              <TrackList />
            </div>
          </Col>
          <Col span={12}>
          <div className="box" style={{}}>
              <Login />
              <LyricsDisplay />
              <MusicPlayer />
            </div>
          </Col>
          <Col span={6}>
          <div className="box" style={{}}>
            <PlayList />
            </div>
          </Col>
        </Row>
      </div>
    </AudioProvider>
  );
}
