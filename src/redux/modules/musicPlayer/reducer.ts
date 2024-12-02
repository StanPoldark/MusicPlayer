// src/store/modules/musicPlayer/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types';

// 初始播放列表
const initialTracks: Track[] = [
  {
    id: 0,
    name: "寰宇记书.mp3",
    ar: ["Moonlight Band"],
    url: "寰宇记书.mp3",
    picUrl: "/covers/starry-night.jpg"
  },

];

interface AddTrackPayload {
  track: Track;
  from: "play" | "add"; // 来源
}

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
    },
    addTrackToPlaylist: (state, action: PayloadAction<AddTrackPayload>) => {
      const { track, from } = action.payload;
    
      // Prevent duplicates
      const isTrackExists = state.playlist.some((item) => item.id === track.id);
    
      if (!isTrackExists) {
        if (from === "play") {
          state.playlist.unshift(track); // 添加到头部
        } else if (from === "add") {
          state.playlist.push(track); // 添加到尾部
        }
      }
    },
    removeTrackFromPlaylist: (state, action: PayloadAction<number>) => {
      state.playlist = state.playlist.filter(track => track.id !== action.payload);
      
      // If the removed track was the current track, select the first track in the playlist
      if (state.currentTrack?.id === action.payload) {
        state.currentTrack = state.playlist.length > 0 ? state.playlist[0] : null;
        state.isPlaying = false;
      }
    },
    reorderPlaylist: (state, action: PayloadAction<{ sourceIndex: number; destinationIndex: number }>) => {
      const { sourceIndex, destinationIndex } = action.payload;
      const [removed] = state.playlist.splice(sourceIndex, 1);
      state.playlist.splice(destinationIndex, 0, removed);

      // Update current track if necessary
      if (state.currentTrack) {
        const newCurrentTrackIndex = state.playlist.findIndex(track => track.id === state.currentTrack!.id);
        if (newCurrentTrackIndex !== -1) {
          state.currentTrack = state.playlist[newCurrentTrackIndex];
        }
      }
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
  setAnalyzing,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylist
} = musicPlayerSlice.actions;

export default musicPlayerSlice.reducer;