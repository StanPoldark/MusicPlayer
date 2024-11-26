"use client";
import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks/hooks';
import {
  togglePlay,
  nextTrack,
  previousTrack,
  setVolume
} from '@/redux/modules/musicPlayer/reducer';
import { useAudio } from '@/contexts/AudioContext';

const MusicPlayer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentTrack, isPlaying, volume } = useAppSelector(state => state.musicPlayer);
  const { setAudio } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handlePlayClick = () => {
    setHasUserInteracted(true);
    dispatch(togglePlay());
  };

  // 音频元数据和进度处理
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !hasUserInteracted) return;

    // 设置音频上下文
    setAudio(audioElement);

    // 加载元数据
    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration || 0);
    };

    // 进度更新
    const handleTimeUpdate = () => {
      if (!isDragging) {
        setProgress(audioElement.currentTime || 0);
      }
    };

    // 播放结束处理
    const handleEnded = () => {
      dispatch(nextTrack()); // 自动播放下一首
    };

    // 添加事件监听
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('ended', handleEnded);

    // 清理函数
    return () => {
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [hasUserInteracted, isDragging, dispatch, setAudio]);

  // 音频播放控制
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !hasUserInteracted || !currentTrack) return;

    let srcPath = decodeURIComponent(audioElement.src.replace(window.location.origin, ''));
    srcPath = decodeURIComponent(srcPath.replace(/^\//, '')); 
    if (srcPath !== currentTrack.url) {
      console.log(srcPath); // 解码后的路径
      console.log(currentTrack.url); // 未编码的路径
      audioElement.src = currentTrack.url;
      setProgress(0);
    }
    // 设置音量
    audioElement.volume = volume;

    // 精确控制播放状态
    if (isPlaying) {
      // 确保只在暂停时才播放
      if (audioElement.paused) {
        audioElement.play().catch(error => {
          console.error('播放失败:', error);
        });
      }
    } else {
      // 确保只在播放时才暂停
      if (!audioElement.paused) {
        audioElement.pause();
      }
    }
  }, [currentTrack?.url, isPlaying, volume, hasUserInteracted]);
  if (!currentTrack) return null;

  // 格式化时间
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg max-w-md mx-auto">
      <div className="mb-4 text-center">
        <img
          src={currentTrack.coverUrl}
          alt="Album Cover"
          className="w-64 h-64 object-cover rounded-lg mx-auto"
        />
        <h2 className="text-white text-xl mt-4">
          {currentTrack.title}
        </h2>
        <p className="text-gray-400">
          {currentTrack.artist}
        </p>
      </div>

      <audio ref={audioRef} id="audio-element" />

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => dispatch(previousTrack())}
          className="text-white hover:text-blue-500 transition-colors"
        >
          <SkipBack size={32} />
        </button>

        <button
          onClick={handlePlayClick}
          className="bg-blue-500 hover:bg-blue-600 rounded-full p-4 transition-colors"
        >
          {isPlaying ? <Pause /> : <Play />}
        </button>

        <button
          onClick={() => dispatch(nextTrack())}
          className="text-white hover:text-blue-500 transition-colors"
        >
          <SkipForward size={32} />
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-gray-400 text-sm">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration.toString()}
          step="0.1"
          value={progress}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const newProgress = parseFloat(e.target.value);
            setProgress(newProgress);
          }}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={(e: React.MouseEvent<HTMLInputElement>) => {
            const newProgress = parseFloat(e.currentTarget.value);
            if (audioRef.current) {
              audioRef.current.currentTime = newProgress;
            }
            setIsDragging(false);
          }}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={(e: React.TouchEvent<HTMLInputElement>) => {
            const newProgress = parseFloat(e.currentTarget.value);
            if (audioRef.current) {
              audioRef.current.currentTime = newProgress;
            }
            setIsDragging(false);
          }}
          className="w-full"
        />
      </div>

      <div className="mt-4">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => dispatch(setVolume(parseFloat(e.target.value)))}
          className="w-full"
        />
      </div>
    </div>
  );
};
export default MusicPlayer;