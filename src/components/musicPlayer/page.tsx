"use client"
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

  // Update the context audio instance with the audioRef when it changes
  useEffect(() => {
    if (audioRef.current && hasUserInteracted) {
      setAudio(audioRef.current);
    }
  }, [audioRef.current, setAudio, hasUserInteracted]);

  if (!currentTrack) return null;

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
          onClick={handlePlayClick}  // Set audio after user clicks play
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
