import { createSlice } from '@reduxjs/toolkit';
import { BACKGROUND } from '@/redux/constant';

const initialState = {
  backgroundUrl: 'bg.jpg', // 服务端默认背景
};

// 只有在客户端时，才去读取 localStorage
if (typeof window !== 'undefined') {
  const storedBackgroundUrl = localStorage.getItem(BACKGROUND);
  if (storedBackgroundUrl) {
    initialState.backgroundUrl = storedBackgroundUrl;
  }
}

const bgSlice = createSlice({
  name: 'background',
  initialState,
  reducers: {
    updateBackground: (state) => {
      if (typeof window !== 'undefined') {
        const storedBackgroundUrl = localStorage.getItem(BACKGROUND);
        state.backgroundUrl = storedBackgroundUrl || state.backgroundUrl;
      }
    }
  }
});

export const { updateBackground } = bgSlice.actions;
export default bgSlice.reducer;
