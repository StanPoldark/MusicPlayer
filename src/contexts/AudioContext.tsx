import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the context type for Audio
interface AudioContextType {
  audio: HTMLAudioElement | null;
  setAudio: (audio: HTMLAudioElement | null) => void;
}

// Create the context
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Type the props for the AudioProvider
interface AudioProviderProps {
  children: ReactNode;
}

// Create the provider component
export const AudioProvider: React.FC<AudioProviderProps> = ({ children }) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  return (
    <AudioContext.Provider value={{ audio, setAudio }}>
      {children}
    </AudioContext.Provider>
  );
};

// Create a custom hook to use the audio context
export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
