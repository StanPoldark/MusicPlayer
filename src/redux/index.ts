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
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // 忽略这些 action types 的序列化检查
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/PAUSE',
          'persist/PURGE',
          'persist/REGISTER',
          'musicPlayer/setCurrentTrack',
          'musicPlayer/addTrackToPlaylist',
        ],
        // 忽略这些字段的序列化检查
        ignoredActionPaths: ['meta.arg', 'payload.timestamp', 'payload.track'],
        ignoredPaths: ['items.dates', 'musicPlayer.currentTrack', 'musicPlayer.playlist'],
      },
      // 禁用不可变性检查以提高性能
      immutableCheck: false,
    }),
  // 完全禁用 Redux DevTools 以避免 reactRender 错误
  devTools: false,
});

// 定义 RootState 和 Dispatch 类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;