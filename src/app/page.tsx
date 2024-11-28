"use client";
import React from "react";
import MusicPlayer from "@/components/MusicPlayer/page";
import Login from "@/components/Login/page";

import { AudioProvider } from "@/contexts/AudioContext";
import TrackList from "@/components/TrackList/page";
import { Row, Col } from "antd";
import "./index.scss";
export default function HomePage() {
  return (
    <AudioProvider>
      <div style={{ margin: "20px", width: "80%", height: "100%" }}>
        {/* 上面一行：2个 Col */}
        <Row gutter={16} style={{}}>
          <Col span={8}  >
          <div className="box" style={{  }}>
              <Login />
              <MusicPlayer />
            </div>
          </Col>
        </Row>

        <Row gutter={24} style={{ height: "66%" }}>
          <Col span={8}>
            <div className="box" style={{ }}>
            <TrackList />
            </div>
          
          </Col>
          <Col span={8}>

          </Col>
        </Row>
      </div>
    </AudioProvider>
  );
}
