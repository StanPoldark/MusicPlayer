// src/store/modules/musicPlayer/reducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Track } from '../types';
export type RepeatMode = 'off' | 'track' | 'playlist';
// 初始播放列表
const initialTracks: Track[] = [
  {
    id: 0,
    name: "寰宇记书.mp3",
    ar: ["Moonlight Band"],
    url: "寰宇记书.mp3",
    picUrl: "/covers/starry-night.jpg",
    lyric: "[00:00.000] 作词 : 冉语优\n[00:01.000] 作曲 : TalanTara傅悦\n[00:02.000] 编曲 : JAMES YEO 杨奋郁\n[00:03.000] 制作人 : TalanTara傅悦\n[00:12.694]作词: 冉语优\n[00:15.904]作曲: TalanTara傅悦\n[00:18.873]编曲: JAMES YEO 杨奋郁\n[00:20.976]制作人: TalanTara傅悦\n[00:22.995]吉他：Zeno\n[00:24.849]贝斯：James Yeo\n[00:26.513]笛子：Terry Ang\n[00:28.041]调教：Creuzer\n[00:29.664]演唱：星尘infinity\n[00:30.725]请在万众集群里，落座一隅\n[00:33.971]随我默记 这同谐颂曲\n[00:37.394]强和弱皆当守序，永恒的戒律\n[00:41.260]生与死相系再不分离（同谐）\n[00:44.757]比律知理更独一\n[00:46.589]比奶酒蜜更珍稀\n[00:48.506]诸世解体 永存惟记忆（记忆）\n[00:51.371]离群索居远避，这一番混沌絮语\n[00:54.942]宇宙是未瓦解的，虚无之地（虚无）\n[01:00.070]庸人一般造星壁\n[01:02.359]哲人般筑城基\n[01:04.191]天外银河决堤，火与光吞覆寰宇\n[01:07.502]此际的黎明静谧，坚不可逾\n[01:11.092]守护万纪如一，存世即真理（存护）\n[01:15.714]-M-\n[01:31.283]垂目四方莞然听，信徒低语\n[01:34.999]长生只需 以血肉祝祭\n[01:38.466]怜惜世人皆凡躯，有情皆哀戚\n[01:41.997]丰饶应许你一切所祈（丰饶）\n[01:45.710]拭着血迹开火狱\n[01:47.472]披着丧袍唱安息\n[01:49.410]物质是种文明的恶癖\n[01:52.332]让末日的气息，去宣告众星死期\n[01:55.779]赐万宙满目疮痍，以熵之名（毁灭）\n[02:01.065]彼时箭镞已扬起\n[02:03.125]麾领万军千骑\n[02:05.056]将军万死不惜，开弓万战至捐躯\n[02:08.444]夕阳熔血铸锋镝，光曜万里\n[02:11.991]巡星海猎孽迹，下一个是你！（巡猎）\n[02:14.549]-Bridge-\n[02:16.166]愿你的 坟墓会是欢愉\n[02:19.322]愿你在 大笑当中死去\n[02:22.656]神祇是群诙谐的物体\n[02:26.276]而我不过是它们 其中之一（欢愉）\n[02:31.449]世界不过是一句\n[02:33.690]重构的谜语（神秘）\n[02:35.329]彼此多位一体，万物间势均力敌（均衡）\n[02:38.972]谁迈步走向真理，那一刻起\n[02:42.432]就已占据智者 不败的高地（智识）\n[02:45.645]时空切片了寰宇\n[02:48.107]命途如此瑰丽\n[02:49.909]最远的是过去，最苍白的是恐惧\n[02:53.274]在这无限夜色里，列车穿行\n[02:56.707]此世开拓之旅，终将抵群星！（开拓）\n[03:01.031]-E-\n"
  },

];

interface AddTrackPayload {
  track: Track;
  from: "play" | "add"; // 来源
}

// 定义初始状态
interface MusicPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  playlist: Track[];
  spectrumData: number[];
  isAnalyzing: boolean;
  repeatMode: RepeatMode; // New repeat mode state
  hasUserInteracted:boolean;
}

const initialState: MusicPlayerState = {
  currentTrack: initialTracks[0],
  isPlaying: false,
  volume: 0.2,
  playlist: initialTracks,
  spectrumData: new Array(64).fill(0),
  isAnalyzing: false,
  repeatMode: 'off',
  hasUserInteracted:false
};

// 创建 Slice
const musicPlayerSlice = createSlice({
  name: 'musicPlayer',
  initialState,
  reducers: {
    setCurrentTrack: (state, action: PayloadAction<Track>) => {
      state.currentTrack = action.payload;
    },
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying;
    },
    toggleRepeatMode: (state) => {
      const repeatModes: RepeatMode[] = ['off', 'track', 'playlist'];
      const currentIndex = repeatModes.indexOf(state.repeatMode);
      const nextIndex = (currentIndex + 1) % repeatModes.length;
      state.repeatMode = repeatModes[nextIndex];
    },
    Interacted: (state) => {
      state.hasUserInteracted = true;
    },
    // Update nextTrack to respect repeat modes
    nextTrack: (state) => {
      const currentIndex = state.playlist.findIndex(
        track => track.id === state.currentTrack?.id
      );

      if (state.repeatMode === 'track' && state.currentTrack) {
        // If in track repeat mode, just restart the current track
        state.isPlaying = true;
        return;
      }

      // Default playlist navigation
      const nextIndex = (currentIndex + 1) % state.playlist.length;
      state.currentTrack = state.playlist[nextIndex];
      state.isPlaying = true;
    },

    // Similar modification for previous track if needed
    previousTrack: (state) => {
      const currentIndex = state.playlist.findIndex(
        track => track.id === state.currentTrack?.id
      );

      if (state.repeatMode === 'track' && state.currentTrack) {
        // If in track repeat mode, just restart the current track
        state.isPlaying = true;
        return;
      }

      const prevIndex = currentIndex > 0 
        ? currentIndex - 1 
        : state.playlist.length - 1;
      state.currentTrack = state.playlist[prevIndex];
      state.isPlaying = true;
    },

    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
    },
    updateSpectrumData: (state, action: PayloadAction<number[]>) => {
      state.spectrumData = action.payload;
    },
    setAnalyzing: (state, action: PayloadAction<boolean>) => {
      state.isAnalyzing = action.payload;
    },
    addTrackToPlaylist: (state, action: PayloadAction<AddTrackPayload>) => {
      const { track, from } = action.payload;
    
      // Prevent duplicates
      const isTrackExists = state.playlist.some((item) => item.id === track.id);
    
      if (!isTrackExists) {
        if (from === "play") {
          state.playlist.unshift(track); // 添加到头部
        } else if (from === "add") {
          state.playlist.push(track); // 添加到尾部
        }
      }
    },
    removeTrackFromPlaylist: (state, action: PayloadAction<number>) => {
      state.playlist = state.playlist.filter(track => track.id !== action.payload);
      
      // If the removed track was the current track, select the first track in the playlist
      if (state.currentTrack?.id === action.payload) {
        state.currentTrack = state.playlist.length > 0 ? state.playlist[0] : null;
        state.isPlaying = false;
      }
    },
    reorderPlaylist: (state, action: PayloadAction<{ sourceIndex: number; destinationIndex: number }>) => {
      const { sourceIndex, destinationIndex } = action.payload;
      const [removed] = state.playlist.splice(sourceIndex, 1);
      state.playlist.splice(destinationIndex, 0, removed);

      // Update current track if necessary
      if (state.currentTrack) {
        const newCurrentTrackIndex = state.playlist.findIndex(track => track.id === state.currentTrack!.id);
        if (newCurrentTrackIndex !== -1) {
          state.currentTrack = state.playlist[newCurrentTrackIndex];
        }
      }
    }
  }
});

// 导出 actions 和 reducer
export const { 
  setCurrentTrack, 
  togglePlay, 
  nextTrack, 
  previousTrack, 
  setVolume,
  updateSpectrumData,
  setAnalyzing,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylist,
  toggleRepeatMode ,
  Interacted
} = musicPlayerSlice.actions;

export default musicPlayerSlice.reducer;