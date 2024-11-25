"use client";
import React from "react";
import MusicPlayer from "@/components/musicPlayer/page";
import Login from "@/components/Login/page";
import AudioSpectrum from "@/components/Spectrum/page";
import { AudioProvider } from "@/contexts/AudioContext";
export default function HomePage() {
  return (
    <div className="box">
      <AudioProvider>
        <Login />
        <MusicPlayer />
        <AudioSpectrum />
      </AudioProvider>
    </div>
  );
}
