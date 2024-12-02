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
} from "lucide-react";
import {
  togglePlay,
  nextTrack,
  previousTrack,
  setVolume,
} from "@/redux/modules/musicPlayer/reducer";
import { useAudio } from "@/contexts/AudioContext";
import "./index.scss";
import AudioSpectrum from "@/components/Spectrum/page"
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

  // Progressive download handler
  const fetchAudioProgressively = useCallback(async (trackUrl: string) => {
    if (!trackUrl) return null;

    try {
      const decodedUrl = decodeURIComponent(trackUrl);
      const response = await fetch(`${decodedUrl}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audio');
      }

      const reader = response.body?.getReader();
      const contentType = response.headers.get('Content-Type') || 'audio/mp3';
      const blob = await new Response(
        new ReadableStream({
          start(controller) {
            function push() {
              reader?.read().then(({ done, value }) => {
                if (done) {
                  controller.close();
                  return;
                }
                controller.enqueue(value);
                
                // Update download progress
                const totalLength = parseInt(
                  response.headers.get('Content-Length') || '0', 
                  10
                );
                const progress = value ? 
                  (controller.desiredSize || 0) / totalLength * 100 : 0;
                setDownloadProgress(progress);
                
                push();
              }).catch(error => {
                console.error('Streaming error', error);
                controller.error(error);
              });
            }
            push();
          }
        }),
        { headers: { 'Content-Type': contentType } }
      ).blob();

      const audioUrl = URL.createObjectURL(blob);
      return audioUrl;
    } catch (error) {
      console.error('Progressive download error:', error);
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
    const audioElement = audioRef.current;
    if (!audioElement || !currentTrack) return;

    const setupAudioSource = async () => {
      try {
        // Special handling for specific track
        if (currentTrack.url === "寰宇记书.mp3") {
          audioElement.src = "寰宇记书.mp3";
        } else {
          // Progressive download for other tracks
          const audioUrl = await fetchAudioProgressively(currentTrack.url);
          if (audioUrl) {
            audioElement.src = audioUrl;
          } else {
            throw new Error('Failed to download audio');
          }
        }

        audioElement.volume = volume;
        setAudio(audioElement);

        // Metadata and duration detection
        const metadataHandler = () => {
          setDuration(audioElement.duration || 0);
          if (hasUserInteracted && isPlaying) {
            audioElement.play().catch(console.error);
          }
        };

        audioElement.addEventListener('loadedmetadata', metadataHandler);

        // Cleanup
        return () => {
          audioElement.removeEventListener('loadedmetadata', metadataHandler);
        };
      } catch (error) {
        console.error('Audio setup error:', error);
      }
    };

    setupAudioSource();
  }, [currentTrack?.url, volume, hasUserInteracted, fetchAudioProgressively]);

  // Progress and playback tracking
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

  // Volume and other event handlers remain similar to previous implementation
  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value);
      const safeVolume = Math.min(Math.max(newVolume, 0), 1);
      dispatch(setVolume(safeVolume));
    },
    [dispatch]
  );

  const handleProgressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!audioRef.current) return;

      const newProgress = parseFloat(e.target.value);
      setIsDragging(true);
      setProgress(newProgress);
    },
    []
  );

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

  <AudioSpectrum hasUserInteracted={hasUserInteracted} />
    <div >
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
        {/* Volume control remains the same */}
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

        {/* Playback control buttons */}
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
            max={duration || 0}
            step="0.1"
            value={progress}
            onChange={handleProgressChange}
            onMouseUp={(e) => handleDragEnd(parseFloat(e.currentTarget.value))}
            onTouchEnd={(e) => handleDragEnd(parseFloat(e.currentTarget.value))}
            className="w-full"
          />
          <span className="pl-2">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
    </div>
  );
};

export default MusicPlayer;