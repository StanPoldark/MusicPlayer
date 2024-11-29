import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types';

interface TrackListState {
  trackLists: {
    playlistId: number;
    tracks: Track[];
  }[];
}

const initialState: TrackListState = {
  trackLists: []
};

const trackListSlice = createSlice({
  name: 'tracks',
  initialState,
  reducers: {
    addTrackList: (state, action: PayloadAction<{playlistId: number, tracks: Track[]}>) => {
      // 检查是否已存在相同歌单ID的歌曲列表
      const existingListIndex = state.trackLists.findIndex(
        list => list.playlistId === action.payload.playlistId
      );

      if (existingListIndex === -1) {
        // 如果不存在，直接添加
        state.trackLists.push(action.payload);
      }
    },
    clearTrackList: (state) => {
      state.trackLists = [];
    }
  }
});

export const { addTrackList, clearTrackList } = trackListSlice.actions;
export default trackListSlice.reducer;