import React, { createContext, useContext, useState, ReactNode } from 'react';

// 定义 AudioContext 类型
interface AudioContextType {
  audio: HTMLAudioElement | null;
  setAudio: (audio: HTMLAudioElement | null) => void;
}

// 创建上下文
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// 定义 AudioProviderProps 类型
interface AudioProviderProps {
  children: ReactNode;
}

// 创建提供者
export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  return (
    <AudioContext.Provider value={{ audio, setAudio }}>
      {children}
    </AudioContext.Provider>
  );
};

// 自定义 Hook
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
