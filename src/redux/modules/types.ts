// src/types/music.ts
// 定义单个音乐条目的类型
export interface Track {
  name: string;
  id: number;
  ar: string[]; // 艺术家名字数组
  picUrl: string; // 专辑封面图片 URL
  url: string; // 音乐文件的 URL
  [key: string]: any; // 可扩展字段
}

// 定义 API 返回的数据结构
export interface TrackResponse {
  songs: Track[];
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

  
  interface BaseResponse {
    code: number;
    message?: string;
  }
  
  export interface UserInfo {
    id?: string;
    nickname?: string;
    avatarUrl?: string; // Example additional fields
  }
  
  export interface LoginState {
    showLoginModal: boolean;
    isLogin: boolean;
    userInfo: UserInfo | null;
    showLogoutModal: boolean;
  }

  

  export interface LoginStateResponse extends BaseResponse {
    data: {
      code: number;
      account: {
        id: string;
        userName: string;
        type: number;
        status: number;
        whitelistAuthority: number;
        createTime: number;
        tokenVersion: number;
        ban: number;
        baoyueVersion: number;
        donateVersion: number;
        vipType: number;
        anonimousUser: boolean;
        paidFee: boolean;
      };
      profile: {
        userId: number;
        userType: number;
        nickname: string;
        avatarUrl: string;
        // Add other profile fields as needed
      };
    };
  }
  
  export interface QRCodeResponse extends BaseResponse {
    data: {
      code: number;
      unikey?: string;
      qrimg?: string;
      key?: string;
    };
  }
  
  export interface CheckQRCodeResponse extends BaseResponse {
    code: number;
    message: string;
    cookie?: string;
  }
  
  export interface LogoutResponse extends BaseResponse {
    code: number;
    message: string;
  }
  

  export interface SimplifiedPlaylist {
    id: number;
    name: string;
    trackCount: number;
    subscribed:boolean;
    description:string;
    [key: string]: any; // 可扩展字段
  }
  
  export interface SimplifiedSearchList {
    id: number;
    name: string;
    artists: [string];
    duration:number;
    [key: string]: any; // 可扩展字段
  }
  
