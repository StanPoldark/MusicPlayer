import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAppSelector } from "@/hooks/hooks";

// 定义AudioContextType接口
interface AudioContextType {
  audio: HTMLAudioElement | null;
  setAudio: (audio: HTMLAudioElement | null) => void;
  audioContext: AudioContext | null;
  setAudioContext: (context: AudioContext | null) => void;
  webAudioSourceNode: MediaElementAudioSourceNode | null;
  setWebAudioSourceNode: (node: MediaElementAudioSourceNode | null) => void;
}

interface AudioProviderProps {
  children: ReactNode;
}

// 创建Context
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Provider组件
export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [webAudioSourceNode, setWebAudioSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  const { hasUserInteracted } = useAppSelector((state) => state.musicPlayer);

  // 初始化AudioContext
  const initializeAudioContext = () => {
    if (!audioContext) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);
    } else if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  };

  useEffect(() => {
    if (hasUserInteracted) {
      initializeAudioContext();
    }
    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [hasUserInteracted, audioContext]);

  return (
    <AudioContext.Provider
      value={{
        audio,
        setAudio,
        audioContext,
        setAudioContext,
        webAudioSourceNode,
        setWebAudioSourceNode,
      }}
    >
    {children}
    </AudioContext.Provider>
  );
};

// 自定义Hook，用于访问AudioContext
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
