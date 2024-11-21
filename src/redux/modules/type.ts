// types.ts

// Type for a single song, including its ID, URL, and any additional metadata like the image
export interface singleSongStructure {
    id: number | string;
    url: string;
    title: string;
    artist: string;
    album: string;
    img?: string; // Optional image or album art for the song
    lyrics?: string; // Optional lyrics for the song
  }
  
  // Type for the overall song structure, including the state and audio-related data
  export interface songStructure {
    isPlay: boolean;
    isMuted: boolean;
    isLoading: boolean;
    volume: number;
    totalTime: number;
    currentTime: number;
    currentPrecent: number;
    currentSong: singleSongStructure | null;
    currentSongIndex: number;
    playQueue: singleSongStructure[];
    playMode: number;
    audioEle: HTMLAudioElement;
    canPlay: boolean;
    showLyrics: boolean;
    rightStateShow: boolean;
    bg?: string; // Optional background image URL
    lyrics?: string; // Optional lyrics for the current song
  }
  