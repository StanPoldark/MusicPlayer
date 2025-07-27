// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import musicPlayerReducer from './modules/musicPlayer/reducer';
import loginSlice from './modules/login/reducer';
import playlistSlice from './modules/playList/reducer'
import tracksSlice from './modules/SongList/reducer';
import bgSlice from './modules/bg/reducer'
import presetReducer from "./modules/audioEffects/reducer";
import searchReducer from './modules/search/reducer';

const rootReducer = {
  musicPlayer: musicPlayerReducer,
  login:loginSlice,
  playlist:playlistSlice,
  tracks: tracksSlice,
  bg:bgSlice,
  ae:presetReducer,
  search: searchReducer
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

// 导入 React Redux hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// 创建 typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;