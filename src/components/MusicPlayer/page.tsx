"use client";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Volume1,
  VolumeX,
  Repeat,
  Repeat1,
} from "lucide-react";
import {
  togglePlay,
  nextTrack,
  previousTrack,
  setVolume,
  toggleRepeatMode,
  Interacted,
} from "@/redux/modules/musicPlayer/reducer";
import { useAudio } from "@/contexts/AudioContext";
import "./index.scss";
import AudioSpectrum from "@/components/Spectrum/page";
import { Slider } from "antd";
import { ArrowsAltOutlined, ShrinkOutlined } from "@ant-design/icons";
import mediaQuery from "@/utils/mediaQuery";

// Create a fullscreen context
const FullscreenContext = React.createContext<{
  isFullscreen: boolean;
  toggleFullscreen: () => void;
}>({
  isFullscreen: false,
  toggleFullscreen: () => {},
});

// Export the context for use in other components
export const useFullscreen = () => React.useContext(FullscreenContext);

// Export the provider component
export const FullscreenProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    // Add fullscreen-active class to body when fullscreen is active
    if (!isFullscreen) {
      document.body.classList.add("fullscreen-active");
    } else {
      document.body.classList.remove("fullscreen-active");
    }
  }, [isFullscreen]);

  return (
    <FullscreenContext.Provider value={{ isFullscreen, toggleFullscreen }}>
      {children}
    </FullscreenContext.Provider>
  );
};

const MusicPlayer: React.FC<{ fullScreen: () => void }> = ({ fullScreen }) => {
  const dispatch = useAppDispatch();
  // 从redux中获取当前播放的曲目、是否播放、音量、重复模式、用户是否交互
  const { currentTrack, isPlaying, volume, repeatMode, hasUserInteracted } =
    useAppSelector((state) => state.musicPlayer);
  const { setAudio } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioContext, setLocalAudioContext] = useState<AudioContext | null>(
    null
  );
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const [node, setNode] = useState<MediaElementAudioSourceNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = mediaQuery("(max-width: 768px)");

  // Fullscreen toggle function
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    fullScreen();
    // Add or remove the fullscreen-active class to the body
    if (!isFullscreen) {
      document.body.classList.add("fullscreen-active");
    } else {
      document.body.classList.remove("fullscreen-active");
    }
  };

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

  const RepeatIcon = useMemo(() => {
    switch (repeatMode) {
      case "track":
        return Repeat1;
      case "playlist":
        return Repeat;
      default:
        return Repeat; // Default icon for 'off' mode, but grayed out
    }
  }, [repeatMode]);

  const handlePlayClick = useCallback(() => {
    if (!audioRef.current) return;
    if (!hasUserInteracted) {
      dispatch(Interacted());
    }
    if (!audioContext) {
      // Initialize AudioContext
      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      setLocalAudioContext(context);
      const node = context.createMediaElementSource(audioRef.current);
      setNode(node);
    } else if (audioContext.state === "suspended") {
      // Resume suspended AudioContext
      audioContext.resume().catch(console.error);
    }

    // Toggle play/pause
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }

    dispatch(togglePlay());
  }, [audioContext, isPlaying, dispatch]);

  // Audio source and playback management
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    // Set the audio source directly using currentTrack.url
    audioRef.current.src = currentTrack.url;
    setAudio(audioRef.current);

    // Metadata and duration detection
    const metadataHandler = () => {
      setDuration(audioRef.current?.duration || 0);
      if (hasUserInteracted && isPlaying) {
        audioRef.current?.play().catch(console.error);
      }
    };

    audioRef.current.addEventListener("loadedmetadata", metadataHandler);

    // Cleanup
    return () => {
      audioRef.current?.removeEventListener("loadedmetadata", metadataHandler);
    };
  }, [currentTrack?.url, hasUserInteracted, setAudio]);

  // Progress and playback tracking
  useEffect(() => {
    if (!audioRef.current || !hasUserInteracted) return;
    const handleTimeUpdate = () => {
      if (!isDragging) {
        setProgress(audioRef.current?.currentTime || 0);
      }
    };

    const handleEnded = () => {
      switch (repeatMode) {
        case "track":
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          }
          break;
        case "playlist":
          dispatch(nextTrack());
          break;
        default:
          dispatch(nextTrack());
          break;
      }
    };

    audioRef.current?.addEventListener("timeupdate", handleTimeUpdate);
    audioRef.current?.addEventListener("ended", handleEnded);

    return () => {
      audioRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
      audioRef.current?.removeEventListener("ended", handleEnded);
    };
  }, [hasUserInteracted, isDragging, dispatch, repeatMode]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const safeVolume = Math.min(Math.max(newVolume, 0), 1);
      audioRef.current.volume = safeVolume;
      dispatch(setVolume(safeVolume));
    },
    [dispatch]
  );

  const handleProgressChange = useCallback((newProgress: number) => {
    if (audioRef.current) {
      setIsDragging(true);
      setProgress(newProgress);
    }
  }, []);

  const handleDragEnd = useCallback((newValue: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newValue;
    }
    setIsDragging(false);
    return true;
  }, []);

  if (!currentTrack) return null;

  return (
    <div className="w-[80%] rounded-lg mx-auto">
      <AudioSpectrum
        audioContext={audioContext}
        webAudioSourceNode={node}
        hasUserInteracted={hasUserInteracted}
      />
      <div>
        <audio ref={audioRef} id="audio-element" />
        <div
          className="flex justify-between items-center mt-6 w-full relative"
          ref={volumeContainerRef}
        >
          {/* Volume control */}
          <div className="relative h-8">
            <button
              onClick={() => setIsVolumeVisible(!isVolumeVisible)}
              className="text-white hover:text-blue-500 transition-colors relative"
            >
              <VolumeIcon size={32} />
            </button>

            {isVolumeVisible && (
              <div
                className="absolute  bottom-full transition-opacity duration-200 ease-in-out white_slider"
                style={{
                  opacity: isVolumeVisible ? 1 : 0,
                  height: "3rem",
                  marginBottom: "1rem",
                }}
              >
                <Slider
                  min={0}
                  max={1}
                  value={volume}
                  vertical
                  className="h-full"
                  onChange={handleVolumeChange}
                  step={0.01}
                />
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
            {isPlaying ? <Pause size={32} /> : <Play size={32} />}
          </button>

          <button onClick={() => dispatch(nextTrack())} className="playButton">
            <SkipForward size={32} />
          </button>

          <div className="button-container">
            <div className="button-group">
              <button
                onClick={() => dispatch(toggleRepeatMode())}
                className={`playButton ${
                  repeatMode === "off" ? "text-gray-400" : "text-blue-500"
                }`}
                title={`Repeat Mode: ${repeatMode}`}
              >
                <RepeatIcon size={32} />
              </button>
              {!isMobile && <div className="divider">/</div>}
              <button
                onClick={toggleFullscreen}
                className="playButton"
                title={isFullscreen ? "Exit Full Screen" : "Full Screen Mode"}
              >
                {isMobile ? (
                  isFullscreen ? (
                    <ShrinkOutlined className="text-[32px] text-blue-500" />
                  ) : null 
                ) : (
                  <ArrowsAltOutlined className="text-[32px]" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-1 mb-1">
          <div className="flex items-center justify-between text-gray-400 text-sm pb-3 white_slider">
            <span className="pr-2" style={{ marginRight: "0.5rem" }}>
              {formatTime(progress)}
            </span>
            <Slider
              min={0}
              max={duration || 0}
              step={0.1}
              value={progress}
              onChange={handleProgressChange}
              onChangeComplete={(value) => handleDragEnd(value)}
              className="w-full"
              tooltip={{
                open: false,
                formatter: () => null,
              }}
            />
            <span className="pl-2">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
