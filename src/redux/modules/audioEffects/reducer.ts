import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// 定义预设类型
type Preset = "n" | "a" | "s" | "h";

// 定义初始状态
interface PresetState {
  selectedPreset: Preset;
}

const initialState: PresetState = {
  selectedPreset: null,
};

const presetSlice = createSlice({
  name: "preset",
  initialState,
  reducers: {
    setPreset: (state, action: PayloadAction<Preset>) => {
      state.selectedPreset = action.payload;
    },
  },
});

export const { setPreset } = presetSlice.actions;

export default presetSlice.reducer;