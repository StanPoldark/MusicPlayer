// Action types
export const SET_SONG = 'SET_SONG';
export const TOGGLE_PLAY = 'TOGGLE_PLAY';

// Action creators
export const setSong = (songIndex: number) => ({
  type: SET_SONG,
  payload: songIndex,
});

export const togglePlay = () => ({
  type: TOGGLE_PLAY,
});
