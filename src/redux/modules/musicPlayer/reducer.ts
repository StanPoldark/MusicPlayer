// src/store/modules/musicPlayer/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types';

// 初始播放列表
const initialTracks: Track[] = [
  {
    id: 1,
    name: "寰宇记书.mp3",
    ar: ["Moonlight Band"],
    url: "寰宇记书.mp3",
    picUrl: "/covers/starry-night.jpg"
  },

];

// 定义初始状态
interface MusicPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  playlist: Track[];
  spectrumData: number[];
  isAnalyzing: boolean;
}

const initialState: MusicPlayerState = {
  currentTrack: initialTracks[0],
  isPlaying: false,
  volume: 0.5,
  playlist: initialTracks,
  spectrumData: new Array(64).fill(0),
  isAnalyzing: false
};

// 创建 Slice
const musicPlayerSlice = createSlice({
  name: 'musicPlayer',
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<Track>) => {
      state.currentTrack = action.payload;
    },
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    nextTrack: (state) => {
      const currentIndex = state.playlist.findIndex(
        track => track.id === state.currentTrack?.id
      );
      const nextIndex = (currentIndex + 1) % state.playlist.length;
      state.currentTrack = state.playlist[nextIndex];
      state.isPlaying = true;
    },
    previousTrack: (state) => {
      const currentIndex = state.playlist.findIndex(
        track => track.id === state.currentTrack?.id
      );
      const prevIndex = currentIndex > 0 
        ? currentIndex - 1 
        : state.playlist.length - 1;
      state.currentTrack = state.playlist[prevIndex];
      state.isPlaying = true;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    updateSpectrumData: (state, action: PayloadAction<number[]>) => {
      state.spectrumData = action.payload;
    },
    setAnalyzing: (state, action: PayloadAction<boolean>) => {
      state.isAnalyzing = action.payload;
    }
  }
});

// 导出 actions 和 reducer
export const { 
  setCurrentTrack, 
  togglePlay, 
  nextTrack, 
  previousTrack, 
  setVolume,
  updateSpectrumData,
  setAnalyzing 
} = musicPlayerSlice.actions;

export default musicPlayerSlice.reducer;