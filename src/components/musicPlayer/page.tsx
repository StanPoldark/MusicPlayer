// MusicPlayer.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSong, togglePlay } from '@/redux/modules/musicPlayer/actions';
import AudioManager from '@/utils/audioManager';
import { RootState } from '@/redux/index'; // Import RootState

const MusicPlayer: React.FC = () => {
  const dispatch = useDispatch();

  // Use RootState to type the selector
  const { songIndex, isPlaying } = useSelector((state: RootState) => state.musicPlayer);

  const songs = ['寰宇记书.mp3'];
  const currentSongUrl = songs[songIndex];

  useEffect(() => {
    const audioManager = AudioManager.getInstance();
    audioManager.init(currentSongUrl);

    if (isPlaying) {
      audioManager.play();
    } else {
      audioManager.pause();
    }

    return () => {
      audioManager.stop();
    };
  }, [songIndex, isPlaying]);

  const handlePlayPause = () => {
    dispatch(togglePlay());
  };

  const handleNextSong = () => {
    const nextSongIndex = (songIndex + 1) % songs.length;
    dispatch(setSong(nextSongIndex));
  };

  const handlePrevSong = () => {
    const prevSongIndex = (songIndex - 1 + songs.length) % songs.length;
    dispatch(setSong(prevSongIndex));
  };

  return (
    <div>
      <h1>Music Player</h1>
      <p>Playing: {songs[songIndex]}</p>
      <button onClick={handlePrevSong}>Prev</button>
      <button onClick={handlePlayPause}>{isPlaying ? 'Pause' : 'Play'}</button>
      <button onClick={handleNextSong}>Next</button>
    </div>
  );
};

export default MusicPlayer;
