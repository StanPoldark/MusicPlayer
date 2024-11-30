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
    if (!audioRef.current || !currentTrack) return;

    const onCanPlayThrough = () => {
      if (!audioRef.current || !currentTrack) return;
      setHasUserInteracted(true);
      dispatch(togglePlay());
      audioRef.current.removeEventListener('canplaythrough', onCanPlayThrough);
    };

    const handleLoadedMetadata = () => {
      if (!audioRef.current || !currentTrack) return;
      setDuration(audioRef.current.duration || 0);
    };

    audioRef.current.addEventListener('canplaythrough', onCanPlayThrough);

    if (audioRef.current.readyState >= 3) {
      onCanPlayThrough();
      handleLoadedMetadata();
    }
  }, [dispatch, currentTrack]);

  // Audio metadata and progress handling
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !hasUserInteracted) return;


    const handleTimeUpdate = () => {      
      if (!isDragging) {
        setProgress(audioElement.currentTime || 0);
      }
    };

    const handleEnded = () => {
      dispatch(nextTrack());
    };

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [hasUserInteracted, isDragging, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeContainerRef.current &&
        !volumeContainerRef.current.contains(event.target as Node)
      ) {
        setIsVolumeVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement || !currentTrack) return;

    if (audioElement.src !== "http://localhost:3000" + decodeURIComponent(currentTrack.url)) {
      try {
        audioElement.src = decodeURIComponent(currentTrack.url);
        audioElement.crossOrigin = "anonymous";
        setProgress(0);
        audioElement.load();

        audioElement.oncanplaythrough = () => {
          if (isPlaying) {
            audioElement.play().catch((error) => {
              console.error("Playback control error:", error);
            });
          } else {
            audioElement.pause();
          }
        };
      } catch (error) {
        console.error("Failed to set audio source:", error);
        return;
      }
    }

    audioElement.volume = volume;
    setAudio(audioElement);
    if (audioElement.readyState >= 3) {
      const playAction = isPlaying ? audioElement.play() : audioElement.pause();
      if (playAction instanceof Promise) {
        playAction.catch((error) => {
          console.error("Playback control error:", error);
        });
      }
    }

    return () => {
      if (audioElement) {
        audioElement.oncanplaythrough = null;
      }
    };
  }, [currentTrack?.url, isPlaying, volume, hasUserInteracted]);

  // Progress change handler with performance optimization
  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!audioRef.current) return;

      const newProgress = parseFloat(e.target.value);
      setIsDragging(true);
      setProgress(newProgress);
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

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
  }, []);
  
  const handleDragEnd = useCallback(
    (newValue: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = newValue;
      }
      setIsDragging(false);
    },
    []
  );

  
  if (!currentTrack) return null;

  return (
    <div className="w-[80%] rounded-lg mx-auto">
      <div className="flex text-center">
        <AudioSpectrum />
      </div>

      <audio ref={audioRef} id="audio-element" />

      <div
        className="flex justify-between items-center mt-6 w-full relative"
        ref={volumeContainerRef}
      >
        <div className="relative">
          <button
            onClick={() => setIsVolumeVisible(!isVolumeVisible)}
            className="text-white hover:text-blue-500 transition-colors relative"
          >
            <VolumeIcon size={32} />
          </button>

          {isVolumeVisible && (
            <div
              className="absolute left-1/2 bottom-full mb-2 transform -translate-x-1/2 transition-opacity duration-200 ease-in-out"
              style={{ opacity: isVolumeVisible ? 1 : 0 }}
            >
              <div className="bg-gray-800 p-2 rounded-md shadow-lg flex flex-col items-center">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="h-32 w-2 bg-gray-200 rounded-lg appearance-none cursor-pointer transform rotate-180"
                  style={{
                    background: `linear-gradient(to top, 
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

        <button onClick={() => dispatch(previousTrack())} className="playButton">
          <SkipBack size={32} />
        </button>

        <button onClick={handlePlayClick} className="playButton">
          {isPlaying ? <Pause /> : <Play />}
        </button>

        <button onClick={() => dispatch(nextTrack())} className="playButton">
          <SkipForward size={32} />
        </button>
      </div>

      <div className="mt-1 mb-1">
        <div className="flex items-center justify-between text-gray-400 text-sm pb-3">
          <span className="pr-2">{formatTime(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={progress}
            onChange={handleProgressChange}
            onMouseDown={handleDragStart}
            onMouseUp={(e) => handleDragEnd(parseFloat(e.currentTarget.value))}
            onTouchStart={handleDragStart}
            onTouchEnd={(e) => handleDragEnd(parseFloat(e.currentTarget.value))}
            className="w-full"
          />
          <span className="pl-2">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
