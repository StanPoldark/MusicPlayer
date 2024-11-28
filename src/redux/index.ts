// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import musicPlayerReducer from './modules/musicPlayer/reducer';
import loginSlice from './modules/login/reducer';
import playlistSlice from './modules/playList/reducer'
const rootReducer = {
  musicPlayer: musicPlayerReducer,
  login:loginSlice,
  playlist:playlistSlice
};

const store = configureStore({
  reducer: rootReducer,
});

// 定义 RootState 和 Dispatch 类型
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;