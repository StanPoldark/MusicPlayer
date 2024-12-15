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
} from "@/redux/modules/musicPlayer/reducer";
import { useAudio } from "@/contexts/audioContext";
import "./index.scss";
import AudioSpectrum from "@/components/spectrum/page";
import { Slider } from "antd";


const MusicPlayer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentTrack, isPlaying, volume, repeatMode  } = useAppSelector(
    (state) => state.musicPlayer
  );
  const { setAudio } = useAudio();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isVolumeVisible, setIsVolumeVisible] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
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

  const RepeatIcon = useMemo(() => {
    switch(repeatMode) {
      case 'track':
        return Repeat1;
      case 'playlist':
        return Repeat;
      default:
        return Repeat; // Default icon for 'off' mode, but grayed out
    }
  }, [repeatMode]);

  
  // Progressive download handler
  const fetchAudioProgressively = useCallback(async (trackUrl: string) => {
    if (!trackUrl) return null;

    try {
      const decodedUrl = decodeURIComponent(trackUrl);
      const response = await fetch(`${decodedUrl}`);

      if (!response.ok) {
        throw new Error("Failed to fetch audio");
      }

      const reader = response.body?.getReader();
      const contentType = response.headers.get("Content-Type") || "audio/mp3";
      const blob = await new Response(
        new ReadableStream({
          start(controller) {
            function push() {
              reader
                ?.read()
                .then(({ done, value }) => {
                  if (done) {
                    controller.close();
                    return;
                  }
                  controller.enqueue(value);

                  // Update download progress
                  const totalLength = parseInt(
                    response.headers.get("Content-Length") || "0",
                    10
                  );
                  const progress = value
                    ? ((controller.desiredSize || 0) / totalLength) * 100
                    : 0;
                  setDownloadProgress(progress);

                  push();
                })
                .catch((error) => {
                  console.error("Streaming error", error);
                  controller.error(error);
                });
            }
            push();
          },
        }),
        { headers: { "Content-Type": contentType } }
      ).blob();

      const audioUrl = URL.createObjectURL(blob);
      return audioUrl;
    } catch (error) {
      console.error("Progressive download error:", error);
      return null;
    }
  }, []);

  // Consolidated play click handler
  const handlePlayClick = useCallback(() => {
    if (!audioRef.current) return;

    setHasUserInteracted(true);

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }

    dispatch(togglePlay());
  }, [dispatch, isPlaying]);

  // Audio source and playback management
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const setupAudioSource = async () => {
      try {
        // Special handling for specific track
        if (currentTrack.url === "寰宇记书.mp3") {
          audioRef.current.src = "寰宇记书.mp3";
        } else {
          // Progressive download for other tracks
          const audioUrl = await fetchAudioProgressively(currentTrack.url);
          if (audioUrl) {
            audioRef.current.src = audioUrl;
          } else {
            throw new Error("Failed to download audio");
          }
        }

        audioRef.current.volume = volume;
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
      } catch (error) {
        console.error("Audio setup error:", error);
      }
    };

    setupAudioSource();
  }, [currentTrack?.url, volume, hasUserInteracted, fetchAudioProgressively]);

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
        case 'track':

          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          }
          break;
        case 'playlist':
   
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
  }, [hasUserInteracted, isDragging, dispatch]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      const safeVolume = Math.min(Math.max(newVolume, 0), 1);
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
  }, []);

  if (!currentTrack) return null;

  return (
    <div className="w-[80%] rounded-lg mx-auto">
      <AudioSpectrum hasUserInteracted={hasUserInteracted} />
      <div>
        <audio ref={audioRef} id="audio-element" />

        {/* Download Progress Bar */}
        {downloadProgress > 0 && downloadProgress < 100 && (
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
            <div
              className="bg-blue-600 h-1.5 rounded-full"
              style={{ width: `${downloadProgress}%` }}
            ></div>
          </div>
        )}

        <div
          className="flex justify-between items-center mt-6 w-full relative"
          ref={volumeContainerRef}
        >
          {/* Volume control */}
          <div className="relative">
            <button
              onClick={() => setIsVolumeVisible(!isVolumeVisible)}
              className="text-white hover:text-blue-500 transition-colors relative"
            >
              <VolumeIcon size={32} />
            </button>

            {isVolumeVisible && (
              <div
                className="absolute left-1/2 bottom-full mb-2 transform -translate-x-1/2 transition-opacity duration-200 ease-in-out white_slider"
                style={{ opacity: isVolumeVisible ? 1 : 0, height:"3rem",marginBottom:"1rem" }}
              >
                  <Slider
                    min={0}
                    max={1}
                    value={volume}
                    vertical
                    onChange={handleVolumeChange}
                    step={0.01}
                    tooltip={{
                      open: false,  
                      formatter: () => null,
                    }}
                  ></Slider>
            
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

          {/* New Repeat Button */}
          <button 
            onClick={() => dispatch(toggleRepeatMode())}
            className={`playButton ${repeatMode === 'off' ? 'text-gray-400' : 'text-blue-500'}`}
            title={`Repeat Mode: ${repeatMode}`}
          >
            <RepeatIcon size={32} />
          </button>
        </div>

        <div className="mt-1 mb-1">
          <div className="flex items-center justify-between text-gray-400 text-sm pb-3 white_slider" >
            <span className="pr-2" style={{marginRight:"0.5rem"}}>{formatTime(progress) }</span>
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
