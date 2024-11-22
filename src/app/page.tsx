"use client";
import React from "react";
import MusicPlayer from "@/components/musicPlayer/page";
import AudioSpectrum from "@/components/Spectrum/page";
import { AudioProvider } from "@/contexts/AudioContext";
export default function HomePage() {
  return (
    <div className="box">
      <AudioProvider>
        <MusicPlayer />
        <AudioSpectrum />
      </AudioProvider>
    </div>
  );
}
