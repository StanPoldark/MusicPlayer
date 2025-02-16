import axios from "axios"; // 引入 Axios
function DownloadAudio(audioInfo: any) {
  const url = audioInfo.url;
  axios({
    url,
    method: "GET",
    responseType: "blob", // 指定响应为二进制文件类型
    withCredentials: false, // 不需要携带 cookies
  })
    .then((res) => {
      const blob = new Blob([res.data]); // 创建 Blob 对象
      const downloadUrl = window.URL.createObjectURL(blob); // 创建 Blob 的 URL
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${audioInfo.name}.mp3`; // 文件名格式
      a.click(); // 自动触发下载
      window.URL.revokeObjectURL(downloadUrl); // 释放 URL 对象
    })
    .catch((err) => {
      console.error("Error downloading audio:", err);
    });
}

export default DownloadAudio;
