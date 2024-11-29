"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import AudioSpectrum from "@/components/Spectrum/page";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Volume1,
  VolumeX,
} from "lucide-react";
import {
  togglePlay,
  nextTrack,
  previousTrack,
  setVolume,
} from "@/redux/modules/musicPlayer/reducer";
import { useAudio } from "@/contexts/AudioContext";
import "./index.scss";

const MusicPlayer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentTrack, isPlaying, volume } = useAppSelector(
    (state) => state.musicPlayer
  );
  const { setAudio } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const volumeContainerRef = useRef<HTMLDivElement>(null);

  // Memoized time formatting function
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  // Memoized volume icon selection
  const VolumeIcon = useMemo(() => {
    if (volume === 0) return VolumeX;
    return volume < 0.5 ? Volume1 : Volume2;
  }, [volume]);

  // Consolidated play click handler
  const handlePlayClick = useCallback(() => {
    setHasUserInteracted(true);
    dispatch(togglePlay());
  }, [dispatch]);

  // Audio metadata and progress handling
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !hasUserInteracted) return;

    setAudio(audioElement);

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration || 0);
    };

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setProgress(audioElement.currentTime || 0);
      }
    };

    const handleEnded = () => {
      dispatch(nextTrack());
    };

    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [hasUserInteracted, isDragging, dispatch, setAudio]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeContainerRef.current &&
        !volumeContainerRef.current.contains(event.target as Node)
      ) {
        setIsVolumeVisible(false);
      }
    };

    // 在文档上添加点击事件监听器
    document.addEventListener("mousedown", handleClickOutside);

    // 清理函数
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Audio playback control
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !hasUserInteracted || !currentTrack) return;

    const needUpdateSource = audioElement.src !== currentTrack.url;

    if (needUpdateSource) {
      try {
        audioElement.src = currentTrack.url;
        audioElement.crossOrigin = "anonymous";
        setProgress(0);
      } catch (error) {
        console.error("Failed to set audio source:", error);
        return;
      }
    }

    audioElement.volume = volume;

    const playAction = isPlaying ? audioElement.play() : audioElement.pause();

    if (playAction instanceof Promise) {
      playAction.catch((error) => {
        console.error("Playback control error:", error);
      });
    }
  }, [currentTrack?.url, isPlaying, volume, hasUserInteracted]);

  // Progress change handler with performance optimization
  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!audioRef.current) return;

      const newProgress = parseFloat(e.target.value);
      setIsDragging(true);
      setProgress(newProgress);

      const timeoutId = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.currentTime = newProgress;
          setIsDragging(false);
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    },
    []
  );

  // Volume change handler with safety checks
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      const safeVolume = Math.min(Math.max(newVolume, 0), 1);
      dispatch(setVolume(safeVolume));
    },
    [dispatch]
  );

  // Early return if no track is selected
  if (!currentTrack) return null;

  return (
    <div className="w-[80%] rounded-lg mx-auto">
      <div className="flex text-center">
        <span className="text-white w-[30%] flex items-center justify-center">
          {currentTrack.name}
        </span>
        <AudioSpectrum />
      </div>

      <audio ref={audioRef} id="audio-element" />

      <div
        className="flex justify-between items-center mt-6 w-full"
        ref={volumeContainerRef}
      >
        <div className="relative">
          {/* 音量按钮 */}
          <button
            onClick={() => setIsVolumeVisible(!isVolumeVisible)}
            className="text-white hover:text-blue-500 transition-colors relative"
          >
            <VolumeIcon size={32} />
          </button>

          {/* 滑块 */}
          {isVolumeVisible && (
            <div
              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 transition-opacity duration-200 ease-in-out"
              style={{ opacity: isVolumeVisible ? 1 : 0 }}
            >
              <div className="bg-gray-800 p-2 rounded-md shadow-lg">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer transform origin-bottom-left w-32"
                  style={{
                    background: `linear-gradient(to right, 
                #3B82F6 0%, 
                #3B82F6 ${volume * 100}%, 
                #E5E7EB ${volume * 100}%, 
                #E5E7EB 100%)`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => dispatch(previousTrack())}
          className="playButton"
        >
          <SkipBack size={32} />
        </button>

        <button onClick={handlePlayClick} className="playButton">
          {isPlaying ? <Pause /> : <Play />}
        </button>

        <button onClick={() => dispatch(nextTrack())} className="playButton">
          <SkipForward size={32} />
        </button>

        <button
          onClick={() => setIsVolumeVisible(!isVolumeVisible)}
          className="text-white hover:text-blue-500 transition-colors"
        >
          <VolumeIcon size={32} />
        </button>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-gray-400 text-sm pb-3">
          <span className="pr-2">{formatTime(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration.toString()}
            step="0.1"
            value={progress}
            onChange={handleProgressChange}
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
          <span className="pl-2">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
