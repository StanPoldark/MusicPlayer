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
  const initializeAudioContext = async () => {
    if (!hasUserInteracted) {
      return; // 如果用户还没有交互，不要创建AudioContext
    }

    try {
      if (!audioContext) {
        // 检查浏览器支持
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          console.warn('AudioContext not supported in this browser');
          return;
        }

        const context = new AudioContextClass();
        setAudioContext(context);
        console.log('AudioContext created successfully');
      } else if (audioContext.state === "suspended") {
        await audioContext.resume();
        console.log('AudioContext resumed successfully');
      }
    } catch (error) {
      console.error("Failed to initialize AudioContext:", error);
      // 不要设置audioContext为null，保持之前的状态
    }
  };

  useEffect(() => {
    if (hasUserInteracted && typeof window !== 'undefined') {
      initializeAudioContext();
    }
    
    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(console.error);
      }
    };
  }, [hasUserInteracted]); // 移除audioContext依赖，避免无限循环

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
