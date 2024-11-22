// src/types/music.ts
export interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  coverUrl: string;
}

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  playlist: Track[];
}

export type PlayerAction = 
  | { type: 'SET_CURRENT_TRACK', payload: Track }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'NEXT_TRACK' }
  | { type: 'PREVIOUS_TRACK' }
  | { type: 'SET_VOLUME', payload: number };