// src/store/modules/musicPlayer/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types';

// 初始播放列表
const initialTracks: Track[] = [
  {
    id: 1,
    title: "寰宇记书.mp3",
    artist: "Moonlight Band",
    url: "寰宇记书.mp3",
    coverUrl: "/covers/starry-night.jpg"
  },
  {
    id: 2,
    title: "Ocean Waves",
    artist: "Sea Sounds", 
    url: "test.mp3",
    coverUrl: "/covers/ocean-waves.jpg"
  }
];

// 定义初始状态
interface MusicPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  playlist: Track[];
}

const initialState: MusicPlayerState = {
  currentTrack: initialTracks[0],
  isPlaying: false,
  volume: 0.5,
  playlist: initialTracks
};

// 创建 Slice
const musicPlayerSlice = createSlice({
  name: 'musicPlayer',
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<Track>) => {
      state.currentTrack = action.payload;
      state.isPlaying = true;
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
    }
  }
});

// 导出 actions 和 reducer
export const { 
  setCurrentTrack, 
  togglePlay, 
  nextTrack, 
  previousTrack, 
  setVolume 
} = musicPlayerSlice.actions;

export default musicPlayerSlice.reducer;