"use client";
import React from "react";
import MusicPlayer from "@/components/musicPlayer/page";
import Login from "@/components/Login/page";
import AudioSpectrum from "@/components/Spectrum/page";
import { AudioProvider } from "@/contexts/AudioContext";
import { Row, Col } from "antd";
import './index.scss';
export default function HomePage() {
  return (
    <AudioProvider>
      <div style={{ margin: '20px', width:'100%', height:'100%'}}>
      {/* 上面一行：2个 Col */}
      <Row gutter={16}>
        <Col span={12} className="gridbox"> 
        <div className="box" style={{height:'10vh',width:'20vw'}}>
              <AudioSpectrum />
            </div>
        </Col>
        <Col span={12}>
          <div >Column 2</div>
        </Col>
      </Row>

      {/* 下面一行：3个 Col */}
      <Row gutter={16}>
        <Col span={8}>
          <div >Column 1</div>
        </Col>
        <Col span={8}>
      
             <div className="box" style={{height:'60vh'}}>
              <Login />
              <MusicPlayer />
            </div>
        </Col>
        <Col span={8}>
          <div >Column 3</div>
        </Col>
      </Row>
    </div>
    </AudioProvider>
  );
}
