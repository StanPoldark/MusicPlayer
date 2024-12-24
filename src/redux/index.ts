// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import musicPlayerReducer from './modules/musicPlayer/reducer';
import loginSlice from './modules/login/reducer';
import playlistSlice from './modules/playList/reducer'
import tracksSlice from './modules/SongList/reducer';
import bgSlice from './modules/bg/reducer'
import presetReducer from "./modules/audioEffects/reducer";

const rootReducer = {
  musicPlayer: musicPlayerReducer,
  login:loginSlice,
  playlist:playlistSlice,
  tracks: tracksSlice,
  bg:bgSlice,
  ae:presetReducer
};

const store = configureStore({
  reducer: rootReducer,
});

// 定义 RootState 和 Dispatch 类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;