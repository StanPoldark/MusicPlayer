// src/redux/modules/search/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types';

// 搜索历史项接口
export interface SearchHistoryItem {
  id: string;
  keyword: string;
  timestamp: number;
  searchCount: number;
}

// 搜索状态接口
export interface SearchState {
  searchResults: Track[];
  searchTerm: string;
  isLoading: boolean;
  processingTrackId: string | null;
  storedTracks: Track[];
  error: string | null;
  selectedSource: string;
  availableSources: any[];
  sourceManagerVisible: boolean;
  searchContentHeight: number;
  historyDropdownVisible: boolean;
  searchHistory: SearchHistoryItem[];
}

// 初始状态
const initialState: SearchState = {
  searchResults: [],
  searchTerm: '',
  isLoading: false,
  processingTrackId: null,
  storedTracks: [],
  error: null,
  selectedSource: 'all',
  availableSources: [],
  sourceManagerVisible: false,
  searchContentHeight: 0,
  historyDropdownVisible: false,
  searchHistory: [],
};

// 创建搜索slice
const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchResults: (state, action: PayloadAction<Track[]>) => {
      state.searchResults = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setProcessingTrack: (state, action: PayloadAction<string | null>) => {
      state.processingTrackId = action.payload;
    },
    setStoredTracks: (state, action: PayloadAction<Track[]>) => {
      state.storedTracks = action.payload;
    },
    addStoredTrack: (state, action: PayloadAction<Track>) => {
      state.storedTracks.push(action.payload);
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setSelectedSource: (state, action: PayloadAction<string>) => {
      state.selectedSource = action.payload;
    },
    setAvailableSources: (state, action: PayloadAction<any[]>) => {
      state.availableSources = action.payload;
    },
    setSourceManagerVisible: (state, action: PayloadAction<boolean>) => {
      state.sourceManagerVisible = action.payload;
    },
    setSearchHistory: (state, action: PayloadAction<SearchHistoryItem[]>) => {
      state.searchHistory = action.payload;
    },
    setSearchContentHeight: (state, action: PayloadAction<number>) => {
      state.searchContentHeight = action.payload;
    },
    setHistoryDropdownVisible: (state, action: PayloadAction<boolean>) => {
      state.historyDropdownVisible = action.payload;
    },
    resetSearch: (state) => {
      state.searchResults = [];
      state.searchTerm = '';
      state.isLoading = false;
      state.error = null;
      state.historyDropdownVisible = false;
    },
  },
});

// 导出actions
export const {
  setSearchResults,
  setSearchTerm,
  setLoading,
  setProcessingTrack,
  setStoredTracks,
  addStoredTrack,
  setError,
  setSelectedSource,
  setAvailableSources,
  setSourceManagerVisible,
  setSearchHistory,
  setSearchContentHeight,
  setHistoryDropdownVisible,
  resetSearch,
} = searchSlice.actions;

// 导出reducer
export default searchSlice.reducer;