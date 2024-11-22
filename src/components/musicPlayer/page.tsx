// src/components/MusicPlayer.tsx
import React, { useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks/hooks';
import { 
  togglePlay, 
  nextTrack, 
  previousTrack, 
  setVolume 
} from '@/redux/modules/musicPlayer/reducer';

const MusicPlayer: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const dispatch = useAppDispatch();
  const { currentTrack, isPlaying, volume } = useAppSelector(state => state.musicPlayer);

  useEffect(() => {
    if (audioRef.current) {
      isPlaying 
        ? audioRef.current.play() 
        : audioRef.current.pause();
      audioRef.current.volume = volume;
    }
  }, [isPlaying, volume]);

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

      <audio 
        ref={audioRef} 
        src={currentTrack.url}
      />

      <div className="flex justify-between items-center mt-6">
        <button 
          onClick={() => dispatch(previousTrack())} 
          className="text-white"
        >
          <SkipBack size={32} />
        </button>

        <button 
          onClick={() => dispatch(togglePlay())} 
          className="bg-blue-500 rounded-full p-4"
        >
          {isPlaying ? <Pause /> : <Play />}
        </button>

        <button 
          onClick={() => dispatch(nextTrack())} 
          className="text-white"
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
          onChange={(e) => 
            dispatch(setVolume(parseFloat(e.target.value)))
          }
          className="w-full"
        />
      </div>
    </div>
  );
};

export default MusicPlayer;