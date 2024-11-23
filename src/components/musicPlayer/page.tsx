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
  const { setAudio } = useAudio();  // Audio context
  const audioRef = useRef<HTMLAudioElement>(null);  // Ref for the audio element
  const [hasUserInteracted, setHasUserInteracted] = useState(false);  // Track user interaction
  const [progress, setProgress] = useState(0); // Current progress (seconds)
  const [duration, setDuration] = useState(0); // Audio duration (seconds)
  const [isDragging, setIsDragging] = useState(false); // Whether the user is dragging the progress bar

  const handlePlayClick = () => {
    setHasUserInteracted(true);
    dispatch(togglePlay());  // Toggle play/pause on click
  };

  useEffect(() => {
    if (hasUserInteracted && currentTrack && audioRef.current) {
      // Set audio to context after user interaction
      setAudio(audioRef.current);

      // Set the audio source and volume
      audioRef.current.src = currentTrack.url;
      audioRef.current.volume = volume;

      // Play or pause based on isPlaying
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }

      return () => {
        audioRef.current?.pause();
      };
    }
  }, [currentTrack, isPlaying, volume, setAudio, hasUserInteracted]);

  useEffect(() => {
    if (audioRef.current && hasUserInteracted) {
      setAudio(audioRef.current);
  
      // 设置元数据加载时的音频时长
      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0);
      };
  
      // 更新播放进度
      audioRef.current.ontimeupdate = () => {
        if (!isDragging) {
          setProgress(audioRef.current?.currentTime || 0);
        }
      };
  
      // 检查播放结束时重置进度
      audioRef.current.onended = () => {
        dispatch(togglePlay()); // 切换到暂停状态
        setProgress(0); // 进度条归零
      };
    }
  }, [audioRef.current, setAudio, hasUserInteracted, isDragging, dispatch]);

  if (!currentTrack) return null;

  // Format time in mm:ss
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

      {/* Audio element */}
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
            setProgress(newProgress); // 更新进度条的视觉效果
          }}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={(e: React.MouseEvent<HTMLInputElement>) => {
            const newProgress = parseFloat(e.currentTarget.value);
            if (audioRef.current) {
              audioRef.current.currentTime = newProgress; // 拖动完成后更新音频播放位置
            }
            setIsDragging(false);
          }}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={(e: React.TouchEvent<HTMLInputElement>) => {
            const newProgress = parseFloat(e.currentTarget.value);
            if (audioRef.current) {
              audioRef.current.currentTime = newProgress; // 拖动完成后更新音频播放位置
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
