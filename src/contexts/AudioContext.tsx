import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useAppSelector } from "@/hooks/hooks";

// Define the AudioContextType interface
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

// Create the Context
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Provider component
export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [webAudioSourceNode, setWebAudioSourceNode] = useState<MediaElementAudioSourceNode | null>(null);
  const { hasUserInteracted } = useAppSelector(
      (state) => state.musicPlayer
    );

  // Initialize the audio context only once
  useEffect(() => {
    if (!audioContext && hasUserInteracted) {
      const context = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(context);
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioContext,hasUserInteracted]);

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

// Custom Hook to access the AudioContext
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
};
