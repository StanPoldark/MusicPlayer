// src/store/modules/musicPlayer/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types';
export type RepeatMode = 'off' | 'track' | 'playlist';
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
  repeatMode: RepeatMode; // New repeat mode state
}

const initialState: MusicPlayerState = {
  currentTrack: initialTracks[0],
  isPlaying: false,
  volume: 0.5,
  playlist: initialTracks,
  spectrumData: new Array(64).fill(0),
  isAnalyzing: false,
  repeatMode: 'off'
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
    toggleRepeatMode: (state) => {
      const repeatModes: RepeatMode[] = ['off', 'track', 'playlist'];
      const currentIndex = repeatModes.indexOf(state.repeatMode);
      const nextIndex = (currentIndex + 1) % repeatModes.length;
      state.repeatMode = repeatModes[nextIndex];
    },

    // Update nextTrack to respect repeat modes
    nextTrack: (state) => {
      const currentIndex = state.playlist.findIndex(
        track => track.id === state.currentTrack?.id
      );

      if (state.repeatMode === 'track' && state.currentTrack) {
        // If in track repeat mode, just restart the current track
        state.isPlaying = true;
        return;
      }

      // Default playlist navigation
      const nextIndex = (currentIndex + 1) % state.playlist.length;
      state.currentTrack = state.playlist[nextIndex];
      state.isPlaying = true;
    },

    // Similar modification for previous track if needed
    previousTrack: (state) => {
      const currentIndex = state.playlist.findIndex(
        track => track.id === state.currentTrack?.id
      );

      if (state.repeatMode === 'track' && state.currentTrack) {
        // If in track repeat mode, just restart the current track
        state.isPlaying = true;
        return;
      }

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
  reorderPlaylist,
  toggleRepeatMode 
} = musicPlayerSlice.actions;

export default musicPlayerSlice.reducer;