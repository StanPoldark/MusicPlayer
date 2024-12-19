import axios from 'axios'; // 引入 Axios
import { getSongUrls } from '@/app/api/music';

function DownloadAudio(audioInfo: any) {
  const audioId = audioInfo.id;

  // 检查 audioId 的有效性
  if (typeof audioId === 'number' && audioId > 0) {
    getSongUrls([audioId]).then(({ data }) => {
      const url = data[0].url;

      axios({
        url,
        method: 'GET',
        responseType: 'blob', // 指定响应为二进制文件类型
        withCredentials: false, // 不需要携带 cookies
      })
        .then((res) => {
          const blob = new Blob([res.data]); // 创建 Blob 对象
          const downloadUrl = window.URL.createObjectURL(blob); // 创建 Blob 的 URL
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `${audioInfo.name} - ${audioInfo.ar
            .map((val: string) => val)
            .join(', ')}.mp3`; // 文件名格式
          a.click(); // 自动触发下载
          window.URL.revokeObjectURL(downloadUrl); // 释放 URL 对象
        })
        .catch((err) => {
          console.error('Error downloading audio:', err);
        });
    });
  } else {
    console.error('Invalid audioId provided:', audioId);
  }
}

export default DownloadAudio;
