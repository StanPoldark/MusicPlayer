import React, { useState } from 'react';
import { LucideTrash, LucideGripVertical } from 'lucide-react';
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import { 
  removeTrackFromPlaylist, 
  reorderPlaylist, 
  setCurrentTrack 
} from '@/redux/modules/musicPlayer/reducer';
import { Track } from '@/redux/modules/types';

const PlaylistManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { playlist, currentTrack } = useAppSelector(state => state.musicPlayer);
  const [draggedItem, setDraggedItem] = useState<Track | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, track: Track) => {
    setDraggedItem(track);
    e.dataTransfer?.setData('text/plain', track.id.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetTrack: Track) => {
    e.preventDefault();
    if (!draggedItem) return;

    const updatedPlaylist = [...playlist];
    const draggedIndex = updatedPlaylist.findIndex(t => t.id === draggedItem.id);
    const targetIndex = updatedPlaylist.findIndex(t => t.id === targetTrack.id);

    // Remove dragged item
    updatedPlaylist.splice(draggedIndex, 1);
    // Insert at new position
    updatedPlaylist.splice(targetIndex, 0, draggedItem);

    dispatch(reorderPlaylist({
      sourceIndex: draggedIndex,
      destinationIndex: targetIndex
    }));
  };

  const handleRemoveTrack = (trackId: number) => {
    dispatch(removeTrackFromPlaylist(trackId));
  };

  const handlePlayTrack = (track: Track) => {
    dispatch(setCurrentTrack(track));
  };

  return (
    <div 
      className="flex-1 playlist-manager p-4 bg-transparent rounded-lg"
      style={{ maxHeight: '400px', overflowY: 'auto' }}
    >
      <h2 className="text-white text-xl mb-4">Playlist</h2>
      
      {playlist.length === 0 ? (
        <p className="text-neutral-500 text-center">Your playlist is empty</p>
      ) : (
        <div className="space-y-2">
          {playlist.map((track) => (
            <div 
              key={track.id}
              draggable
              onDragStart={(e) => handleDragStart(e, track)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, track)}
              className={`
                flex items-center justify-between p-2 rounded 
                ${currentTrack?.id === track.id ? 'bg-neutral-700' : 'hover:bg-neutral-800'}
                transition-colors duration-200 cursor-move
              `}
            >
              {/* Track Info */}
              <div 
                className="flex items-center space-x-4 flex-grow"
                onClick={() => handlePlayTrack(track)}
              >
                <img 
                  src={track.picUrl || '/placeholder-image.png'} 
                  alt={track.name} 
                  className="w-12 h-12 rounded object-cover"
                />
                <div>
                  <p className="text-white text-sm">{track.name}</p>
                  <p className="text-neutral-400 text-xs">{track.ar}</p>
                </div>
              </div>

              {/* Remove Button */}
              <button 
                onClick={() => handleRemoveTrack(track.id)}
                className="text-neutral-400 hover:text-red-500 p-2"
                aria-label="Remove from playlist"
              >
                <LucideTrash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaylistManager;