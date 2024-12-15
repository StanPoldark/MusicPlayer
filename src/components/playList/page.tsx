import React, { useState } from 'react';
import { List, Button } from 'antd';
import { LucideTrash } from 'lucide-react';
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import { 
  removeTrackFromPlaylist, 
  reorderPlaylist, 
} from '@/redux/modules/musicPlayer/reducer';
import { Track } from '@/redux/modules/types';
import "./index.scss";

const PlaylistManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { playlist } = useAppSelector(state => state.musicPlayer);
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

  return (
    <div className="flex-1 playlist-manager p-4 bg-transparent rounded-lg " style={{ width: '100%', height: '100%'}}>
      <h2 className="text-white text-xl mb-4">Playlist</h2>
      
      {playlist.length === 0 ? (
        <p className="text-neutral-500 text-center">Your playlist is empty</p>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={playlist}
          renderItem={(track) => (
            <List.Item
              key={track.id}
              draggable
              onDragStart={(e) => handleDragStart(e, track)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, track)}
              className={`transition-colors duration-200 cursor-move p-2`}
              style={{
                cursor: "pointer",
                paddingInlineStart: 20,
              }}
            >
              <List.Item.Meta
                title={<p className="text-white" style={{marginBottom:0,fontSize:"1.25rem"}}>{track.name}</p>}
              />
              <Button 
                type="link" 
                onClick={() => handleRemoveTrack(track.id)} 
                icon={<LucideTrash size={16} />} 
                className="text-neutral-400 hover:text-red-500"
                aria-label="Remove from playlist"
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default PlaylistManager;