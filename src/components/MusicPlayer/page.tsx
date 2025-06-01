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
  setCurrentTime,
  setTrackDuration,
  setLoading,
} from "@/redux/modules/musicPlayer/reducer";
import { useAudio } from "@/contexts/AudioContext";
import "./index.scss";
import AudioSpectrum from "@/components/Spectrum/page";
import { Slider } from "antd";
import { ArrowsAltOutlined, ShrinkOutlined } from "@ant-design/icons";
import mediaQuery from "@/utils/mediaQuery";
import { motion, AnimatePresence } from "framer-motion";
import { message } from "antd";

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

// 动画变体定义
const buttonVariants = {
  hover: { scale: 1.1, transition: { duration: 0.2 } },
  tap: { scale: 0.9, transition: { duration: 0.2 } }
};

const sliderContainerVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0, 
    y: 5, 
    transition: { duration: 0.2 } 
  }
};

const MusicPlayer: React.FC<{ fullScreen: () => void }> = ({ fullScreen }) => {
  const dispatch = useAppDispatch();
  // 从redux中获取当前播放的曲目、是否播放、音量、重复模式、用户是否交互
  const { 
    currentTrack, 
    isPlaying, 
    volume, 
    repeatMode, 
    hasUserInteracted,
    currentTime: reduxCurrentTime,
    duration: reduxDuration,
    isLoading: reduxIsLoading
  } = useAppSelector((state) => state.musicPlayer);
  const { setAudio } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioContext, setLocalAudioContext] = useState<AudioContext | null>(null);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const volumeContainerRef = useRef<HTMLDivElement>(null);
  const [node, setNode] = useState<MediaElementAudioSourceNode | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [lastTrackId, setLastTrackId] = useState<number | null>(null);
  const [actuallyPlaying, setActuallyPlaying] = useState(false); // 跟踪实际音频播放状态
  const isMobile = mediaQuery("(max-width: 768px)");

  // Fullscreen toggle function
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    fullScreen();
    
    // 简单的全屏切换
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

  // 初始化AudioContext（只执行一次）
  const initializeAudioContext = useCallback(async () => {
    if (!audioContext && hasUserInteracted) {
      try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        setLocalAudioContext(context);
        
        if (audioRef.current && !node) {
          const audioNode = context.createMediaElementSource(audioRef.current);
          setNode(audioNode);
        }
      } catch (error) {
        console.error("Failed to initialize AudioContext:", error);
      }
    } else if (audioContext && audioContext.state === "suspended") {
      try {
        await audioContext.resume();
      } catch (error) {
        console.error("Failed to resume AudioContext:", error);
      }
    }
  }, [audioContext, hasUserInteracted, node]);

  // 同步Redux状态到本地状态
  useEffect(() => {
    if (!isDragging) {
      setProgress(reduxCurrentTime);
    }
  }, [reduxCurrentTime, isDragging]);

  // 优化的播放控制函数
  const handlePlayClick = useCallback(async () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (!hasUserInteracted) {
      dispatch(Interacted());
      return; // 等待下次点击，此时AudioContext会被初始化
    }

    try {
      // 确保AudioContext已初始化
      await initializeAudioContext();

    if (isPlaying) {
        // 暂停播放 - 不需要手动dispatch，handlePause事件会处理
      audioRef.current.pause();
    } else {
        // 检查音频源是否有效
        if (!audioRef.current.src || audioRef.current.src === window.location.href) {
          console.error("Audio source is invalid, cannot play");
          message.error("获取歌曲失败，请重试");
          return;
        }

        // 检查音频是否准备就绪
        if (!isAudioReady) {
          message.info("音频加载中，请稍候...");
          return;
        }

        try {
          // 开始播放 - 不需要手动dispatch，handlePlay事件会处理
          await audioRef.current.play();
        } catch (playError) {
          console.error("Error playing audio:", playError);
          message.error("播放失败，请重试");
        }
      }
    } catch (error) {
      console.error("Audio playback error:", error);
      message.error("播放出错，请重试");
    }
  }, [audioContext, isPlaying, dispatch, hasUserInteracted, currentTrack, isAudioReady, initializeAudioContext]);

  // 音频源管理 - 只在歌曲真正切换时设置新源
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    // 检查是否是新歌曲
    const isNewTrack = currentTrack.id !== lastTrackId;
    
    if (isNewTrack && currentTrack.url) {
      setIsAudioReady(false);
      setProgress(0);
      
      // 设置新的音频源
    audioRef.current.src = currentTrack.url;
    setAudio(audioRef.current);
      setLastTrackId(currentTrack.id);
      
      // 如果当前正在播放，暂停Redux状态（音频会在准备就绪后自动播放）
      if (isPlaying) {
        dispatch(togglePlay());
      }
    } else if (!currentTrack.url) {
      console.error("Track URL is missing");
      message.error("获取歌曲失败，请重试");
      if (isPlaying) {
        dispatch(togglePlay());
      }
    }
  }, [currentTrack?.id, currentTrack?.url, lastTrackId, setAudio, dispatch, isPlaying]);

  // 音频事件处理
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    // 元数据加载完成
    const handleLoadedMetadata = () => {
      const audioDuration = audio.duration || 0;
      dispatch(setTrackDuration(audioDuration));
      setIsAudioReady(true);
      dispatch(setLoading(false));
      
      // 恢复播放位置
      if (reduxCurrentTime > 0 && reduxCurrentTime < audioDuration) {
        audio.currentTime = reduxCurrentTime;
        setProgress(reduxCurrentTime);
      }
    };

    // 音频可以播放
    const handleCanPlay = () => {
      setIsAudioReady(true);
      dispatch(setLoading(false));
      
      // 如果Redux状态显示应该播放，则自动开始播放
      if (hasUserInteracted && isPlaying && audio.paused) {
        audio.play().catch((error) => {
          console.error("Failed to auto-play after loading:", error);
          dispatch(togglePlay()); // 重置播放状态
        });
      }
    };

    // 播放错误处理
    const handleError = (e: Event) => {
      console.error("Audio loading error:", e);
      message.error("音频加载失败，请重试");
      setIsAudioReady(false);
      setActuallyPlaying(false); // 错误时重置播放状态
      dispatch(setLoading(false));
      if (isPlaying) {
        dispatch(togglePlay());
      }
    };

    // 加载开始
    const handleLoadStart = () => {
      dispatch(setLoading(true));
      setIsAudioReady(false);
      setActuallyPlaying(false); // 加载时重置播放状态
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("loadstart", handleLoadStart);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("loadstart", handleLoadStart);
    };
  }, [hasUserInteracted, isPlaying, dispatch, reduxCurrentTime]);

  // 播放进度和状态同步
  useEffect(() => {
    if (!audioRef.current || !hasUserInteracted) return;
    
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (!isDragging) {
        const currentTime = audio.currentTime || 0;
        setProgress(currentTime);
        dispatch(setCurrentTime(currentTime));
      }
    };

    const handlePlay = () => {
      // 更新实际播放状态
      setActuallyPlaying(true);
      // 确保Redux状态与实际播放状态同步
      if (!isPlaying) {
        dispatch(togglePlay());
      }
    };

    const handlePause = () => {
      // 更新实际播放状态
      setActuallyPlaying(false);
      // 确保Redux状态与实际播放状态同步
      if (isPlaying) {
        dispatch(togglePlay());
      }
    };

    const handleEnded = () => {
      // 播放结束时重置状态
      setActuallyPlaying(false);
      
      switch (repeatMode) {
        case "track":
          audio.currentTime = 0;
          dispatch(setCurrentTime(0));
          audio.play().catch(console.error);
          break;
        case "playlist":
          dispatch(nextTrack());
          break;
        default:
          dispatch(nextTrack());
          break;
      }
    };

    // 添加更多音频状态事件监听
    const handleWaiting = () => {
      // 音频缓冲时
      dispatch(setLoading(true));
    };

    const handleCanPlayThrough = () => {
      // 音频可以流畅播放时
      dispatch(setLoading(false));
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
    };
  }, [hasUserInteracted, isDragging, dispatch, repeatMode, isPlaying]);

  // 同步actuallyPlaying状态与音频元素的实际状态
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    const updatePlayingState = () => {
      setActuallyPlaying(!audio.paused && !audio.ended);
    };

    // 定期检查音频状态
    const interval = setInterval(updatePlayingState, 100);
    
    return () => clearInterval(interval);
  }, [currentTrack]);

  // AudioContext和音频节点连接
  useEffect(() => {
    if (!node || !audioContext) return;
    
    try {
      const analyser = audioContext.createAnalyser();
      node.connect(analyser);
      analyser.connect(audioContext.destination);
    } catch (error) {
      console.error("Failed to connect audio nodes:", error);
    }
  }, [node, audioContext]);

  // 音量控制
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const safeVolume = Math.min(Math.max(newVolume, 0), 1);
      if (audioRef.current) {
      audioRef.current.volume = safeVolume;
      }
      dispatch(setVolume(safeVolume));
    },
    [dispatch]
  );

  // 优化的进度条控制
  const handleProgressChange = useCallback((newProgress: number) => {
    if (audioRef.current && isAudioReady) {
      setIsDragging(true);
      setProgress(newProgress);
    }
  }, [isAudioReady]);

  const handleProgressDragEnd = useCallback((newValue: number) => {
    if (audioRef.current && isAudioReady) {
      const clampedValue = Math.min(Math.max(newValue, 0), reduxDuration);
      audioRef.current.currentTime = clampedValue;
      setProgress(clampedValue);
      dispatch(setCurrentTime(clampedValue));
    }
    setIsDragging(false);
  }, [reduxDuration, isAudioReady, dispatch]);

  // 调试：监控播放状态变化
  useEffect(() => {
    console.log('播放状态变化:', {
      isPlaying,
      actuallyPlaying,
      reduxIsLoading,
      isAudioReady,
      audioPaused: audioRef.current?.paused,
      audioEnded: audioRef.current?.ended
    });
  }, [isPlaying, actuallyPlaying, reduxIsLoading, isAudioReady]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // 防止在输入框中触发快捷键
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          handlePlayClick();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          dispatch(previousTrack());
          break;
        case 'ArrowRight':
          event.preventDefault();
          dispatch(nextTrack());
          break;
        case 'ArrowUp':
          event.preventDefault();
          handleVolumeChange(Math.min(volume + 0.1, 1));
          break;
        case 'ArrowDown':
          event.preventDefault();
          handleVolumeChange(Math.max(volume - 0.1, 0));
          break;
        case 'KeyF':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            toggleFullscreen();
          }
          break;
        case 'Escape':
          if (isFullscreen) {
            event.preventDefault();
            toggleFullscreen();
          }
          break;
        case 'KeyR':
          event.preventDefault();
          dispatch(toggleRepeatMode());
          break;
      }
    };

    if (hasUserInteracted) {
      document.addEventListener('keydown', handleKeyPress);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [hasUserInteracted, handlePlayClick, dispatch, volume, handleVolumeChange, isFullscreen, toggleFullscreen]);

  // 全屏模式下显示快捷键提示
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (isFullscreen) {
      const timer = setTimeout(() => {
        setShowShortcuts(true);
        setTimeout(() => setShowShortcuts(false), 3000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  if (!currentTrack) return null;

  return (
    <div className="w-[80%] rounded-lg mx-auto">
      <AudioSpectrum
        audioContext={audioContext}
        webAudioSourceNode={node}
        hasUserInteracted={hasUserInteracted}
      />
      <div>
        <audio ref={audioRef} id="audio-element" preload="metadata" />
        <div
          className="flex justify-between items-center mt-6 w-full relative"
          ref={volumeContainerRef}
        >
          {/* Volume control */}
          <div className="relative h-8">
            <motion.button
              onClick={() => setIsVolumeVisible(!isVolumeVisible)}
              className="text-white hover:text-blue-500 transition-colors relative"
              whileHover={buttonVariants.hover}
              whileTap={buttonVariants.tap}
            >
              <VolumeIcon size={32} />
            </motion.button>

            <AnimatePresence>
            {isVolumeVisible && (
                <motion.div
                  className="absolute bottom-full transition-opacity duration-200 ease-in-out white_slider"
                  variants={sliderContainerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
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
                </motion.div>
            )}
            </AnimatePresence>
          </div>

          {/* Main control buttons */}
          <motion.button
            onClick={() => dispatch(previousTrack())}
            className="playButton"
            whileHover={buttonVariants.hover}
            whileTap={buttonVariants.tap}
          >
            <SkipBack size={32} />
          </motion.button>

          <motion.button
            onClick={handlePlayClick}
            className="playButton"
            whileHover={buttonVariants.hover}
            whileTap={buttonVariants.tap}
            disabled={reduxIsLoading}
            style={{ opacity: reduxIsLoading ? 0.6 : 1 }}
          >
            {reduxIsLoading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            ) : actuallyPlaying ? (
              <Pause size={32} />
            ) : (
              <Play size={32} />
            )}
          </motion.button>

          <motion.button
            onClick={() => dispatch(nextTrack())}
            className="playButton"
            whileHover={buttonVariants.hover}
            whileTap={buttonVariants.tap}
          >
            <SkipForward size={32} />
          </motion.button>

          <div className="button-container">
            <div className="button-group">
              <motion.button
                onClick={() => dispatch(toggleRepeatMode())}
                className={`playButton ${
                  repeatMode === "off" ? "text-gray-400" : "text-blue-500"
                }`}
                title={`Repeat Mode: ${repeatMode}`}
                whileHover={buttonVariants.hover}
                whileTap={buttonVariants.tap}
              >
                <RepeatIcon size={32} />
              </motion.button>
              {!isMobile && <div className="divider">/</div>}
              <motion.button
                onClick={toggleFullscreen}
                className="playButton"
                title={isFullscreen ? "Exit Full Screen" : "Full Screen Mode"}
                whileHover={buttonVariants.hover}
                whileTap={buttonVariants.tap}
              >
                {isMobile ? (
                  isFullscreen ? (
                    <ShrinkOutlined className="text-[32px] text-blue-500" />
                  ) : null 
                ) : (
                  isFullscreen ? (
                    <ShrinkOutlined className="text-[32px] text-blue-500" />
                ) : (
                  <ArrowsAltOutlined className="text-[32px]" />
                  )
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-1 mb-1">
          <div className="flex items-center justify-between text-gray-400 text-sm pb-3 white_slider">
            <span className="pr-2" style={{ marginRight: "0.5rem" }}>
              {formatTime(progress)}
            </span>
            <motion.div 
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
            <Slider
              min={0}
                max={reduxDuration || 0}
              step={0.1}
              value={progress}
              onChange={handleProgressChange}
                onChangeComplete={handleProgressDragEnd}
                onAfterChange={handleProgressDragEnd}
              className="w-full"
                disabled={!isAudioReady || reduxIsLoading}
              tooltip={{
                  open: isDragging,
                  formatter: (value) => formatTime(value || 0),
              }}
            />
            </motion.div>
            <span className="pl-2">{formatTime(reduxDuration)}</span>
          </div>
        </div>

        {/* 全屏模式下的简单快捷键提示 */}
        <AnimatePresence>
          {isFullscreen && showShortcuts && (
            <motion.div
              className="fixed top-4 right-4 bg-black bg-opacity-70 text-white p-3 rounded text-xs"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-1">快捷键:</div>
              <div>空格: 播放/暂停 | F: 全屏 | ESC: 退出</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MusicPlayer;
