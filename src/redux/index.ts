// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { musicReducer } from './modules/musicPlayer/reducer';

const store = configureStore({
  reducer: {
    musicPlayer: musicReducer, // Combine your reducers here when you add more slices
  },
});

export default store;

// RootState should reflect the structure of the store
export interface RootState {
  musicPlayer: {
    songIndex: number;
    isPlaying: boolean;
  };
}
