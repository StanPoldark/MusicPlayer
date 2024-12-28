// musicApi.ts
import { apiClient, handleApiCall } from './axiosConfig';

export const getUserMusicList = async (uid: number): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/user/playlist', {
      params: { uid, limit: 100 }
    })
  );
};

export const getDetailList = async (
  id: number | string,
  offset?: number,
  limit: number = 20
): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/playlist/track/all', {
      params: { id, offset, limit }
    })
  );
};

export const getSongUrls = async (ids: number[]): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/song/url', {
      params: { id: ids.join(',') }
    })
  );
};

export const checkSong = async (id: number): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/check/music', {
      params: { id }
    })
  );
};

export const getlyric = async (id: number): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/lyric', {
      params: { id }
    })
  );
};

export const search = async (keywords: string): Promise<any> => {
  return handleApiCall(() => 
    apiClient.get('/search', {
      params: { keywords }
    })
  );
};