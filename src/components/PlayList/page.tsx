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
import { motion, AnimatePresence } from "framer-motion";

// 定义动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.07 
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  },
  exit: { 
    opacity: 0, 
    x: -20,
    transition: { 
      duration: 0.2 
    } 
  },
  hover: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    transition: { duration: 0.2 }
  },
  drag: {
    scale: 1.05,
    backgroundColor: "rgba(4, 222, 255, 0.1)",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2 }
  }
};

// 定义PlaylistManager组件
const PlaylistManager: React.FC = () => {
  // 获取dispatch函数
  const dispatch = useAppDispatch();
  // 从redux中获取playlist
  const { playlist } = useAppSelector(state => state.musicPlayer);
  // 定义拖拽的track
  const [draggedItem, setDraggedItem] = useState<Track | null>(null);
  // 跟踪当前拖拽的索引
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);

  // 拖拽开始时设置拖拽的track
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, track: Track) => {
    setDraggedItem(track);
    e.dataTransfer?.setData('text/plain', track.id.toString());
  };

  // 拖拽时阻止默认行为
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    setDraggedOverIndex(index);
  };

  // 拖拽离开时重置状态
  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };

  // 拖拽结束时更新playlist
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

    // 重置拖拽状态
    setDraggedItem(null);
    setDraggedOverIndex(null);
  };

  // 移除track
  const handleRemoveTrack = (trackId: number) => {
    dispatch(removeTrackFromPlaylist(trackId));
  };

  return (
    <motion.div 
      className="flex-1 playlist-manager p-4 bg-transparent rounded-lg " 
      style={{ width: '100%', height: '100%'}}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h2 
        className="text-white text-xl mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Playlist
      </motion.h2>
      
      {playlist.length === 0 ? (
        <motion.p 
          className="text-neutral-500 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Your playlist is empty
        </motion.p>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            <List
              itemLayout="horizontal"
              dataSource={playlist}
              renderItem={(track, index) => (
                <motion.div
                  key={track.id}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover="hover"
                  layoutId={`track-${track.id}`}
                  custom={index}
                  style={{
                    backgroundColor: draggedOverIndex === index 
                      ? "rgba(4, 222, 255, 0.1)" 
                      : undefined
                  }}
                >
                  <List.Item
                    draggable
                    onDragStart={(e) => handleDragStart(e, track)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, track)}
                    className={`transition-colors duration-200 ${
                      draggedItem?.id === track.id ? "opacity-50" : ""
                    }`}
                    style={{
                      cursor: "move",
                      paddingInlineStart: 20,
                      borderRadius: "8px"
                    }}
                  >
                    <List.Item.Meta
                      title={<p className="text-white" style={{marginBottom:0,fontSize:"1rem"}}>{track.name}</p>}
                    />
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        type="link" 
                        onClick={() => handleRemoveTrack(track.id)} 
                        icon={<LucideTrash size={16} />} 
                        className="text-neutral-400 hover:text-red-500"
                        aria-label="Remove from playlist"
                      />
                    </motion.div>
                  </List.Item>
                </motion.div>
              )}
            />
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PlaylistManager;
