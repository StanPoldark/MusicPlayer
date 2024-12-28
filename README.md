# Simple Music Player  

A simple music player built with **Next.js 15** and **React 18**.  [Demo](https://music-player-six-gamma.vercel.app/)

### Frontend Design Inspiration  

The frontend styling is inspired by Bilibili content creator **青夏家的Ela**. Check out their project here: [React-Small-Music-Player](https://github.com/QingXia-Ela/React-Small-Music-Player).  

### Backend API  

The backend uses the [NeteaseCloudMusicApi](https://github.com/Binaryify/NeteaseCloudMusicApi) to fetch music data.  

### Third-party Lib  

Live2d component use [oh-my-live2d](the https://github.com/oh-my-live2d/oh-my-live2d) 

---  

## Getting Started  

To start the development server:  

```bash  
cd music-player  
npm install  
npm run dev  
```
Then open [localhost](http://localhost:3000/) in your browser to use it locally.
Replace baseURL with your own server URL in `src/app/api/axiosConfig.js`.

## Tips:
Currently, only QR code login is supported. The button for captcha login is hidden due to recent changes in the NetEase Cloud Music API, which enforces additional security checks for non-secure login methods.

## Future Enhancements:

Expanding functionalities based on the API.
Creating a PC client using Electron to support local music playback.
Developing a mobile version for better accessibility.
