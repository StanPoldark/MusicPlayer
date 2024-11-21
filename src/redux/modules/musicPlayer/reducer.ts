import { SET_SONG, TOGGLE_PLAY } from '@/redux/modules/musicPlayer/actions';

// Define the shape of our state
interface MusicState {
  songIndex: number;
  isPlaying: boolean;
}

const initialState: MusicState = {
  songIndex: 0,
  isPlaying: false,
};

// Reducer to handle music state
export const musicReducer = (state = initialState, action: any): MusicState => {
  switch (action.type) {
    case SET_SONG:
      return { ...state, songIndex: action.payload };
    case TOGGLE_PLAY:
      return { ...state, isPlaying: !state.isPlaying };
    default:
      return state;
  }
};
