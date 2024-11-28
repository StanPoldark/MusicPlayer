import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SimplifiedPlaylist } from "../types";

interface PlaylistState {
  createdList: SimplifiedPlaylist[];
  subscribedList: SimplifiedPlaylist[];
}

const initialState: PlaylistState = {
  createdList: [],
  subscribedList: [],
};

const playlistSlice = createSlice({
  name: "playlist",
  initialState,
  reducers: {
    setCreatedList(state, action: PayloadAction<SimplifiedPlaylist[]>) {
      state.createdList = action.payload;
    },
    setSubscribedList(state, action: PayloadAction<SimplifiedPlaylist[]>) {
      state.subscribedList = action.payload;
    },
  },
});

export const { setCreatedList, setSubscribedList } = playlistSlice.actions;
export default playlistSlice.reducer;
