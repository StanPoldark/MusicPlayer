import React from "react";
import { motion } from "framer-motion";
import { Tooltip } from "antd";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import "@/components/Login/index.scss";
import { setPreset } from "@/redux/modules/audioEffects/reducer";

// 音效预设描述
const PRESET_DESCRIPTIONS = {
  n: { name: "Normal", description: "标准音效", icon: "🎵" },
  a: { name: "Ambient", description: "环境音效", icon: "🌊" },
  s: { name: "Studio", description: "录音室音效", icon: "🎙️" },
  h: { name: "Hall", description: "音乐厅音效", icon: "🏛️" },
};

// 按钮动画变体
const buttonVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.05,
    y: -2,
    boxShadow: "0 8px 25px rgba(4, 222, 255, 0.3)",
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// 定义 AudioEffects 组件
const AudioEffects = () => {
  const dispatch = useAppDispatch();
  const selectedPreset = useAppSelector((state) => state.ae.selectedPreset);

  return (
    <motion.div 
      className="audio-effects-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
        padding: "8px"
      }}
    >
      <motion.h4 
        style={{ 
          color: "rgba(255, 255, 255, 0.9)", 
          fontSize: "16px",
          fontWeight: "500",
          margin: "0 0 8px 0",
          textAlign: "center"
        }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        音效预设
      </motion.h4>
      
      <div 
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "12px",
          width: "100%",
          maxWidth: "280px"
        }}
      >
        {Object.entries(PRESET_DESCRIPTIONS).map(([preset, info]) => (
          <motion.div
            key={preset}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            style={{ width: "100%" }}
          >
            <Tooltip 
              title={`${info.name} - ${info.description}`}
              placement="top"
            >
              <button
                className="audio-effect-button"
                onClick={() => dispatch(setPreset(preset as "n" | "a" | "s" | "h"))}
                style={{
                  width: "100%",
                  height: "60px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  background: selectedPreset === preset 
                    ? "rgba(4, 222, 255, 0.2)" 
                    : "rgba(255, 255, 255, 0.05)",
                  border: selectedPreset === preset 
                    ? "2px solid #04deff" 
                    : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backdropFilter: "blur(10px)",
                  outline: "none"
                }}
              >
                <span style={{ fontSize: "20px", marginBottom: "2px" }}>
                  {info.icon}
                </span>
                <span style={{ fontSize: "11px", opacity: 0.9 }}>
                  {info.name}
                </span>
              </button>
            </Tooltip>
          </motion.div>
        ))}
      </div>
      
      <motion.p 
        style={{ 
          color: "rgba(255, 255, 255, 0.6)", 
          fontSize: "12px",
          textAlign: "center",
          margin: "8px 0 0 0",
          lineHeight: "1.4"
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        选择音效预设以改变音频的听觉体验
      </motion.p>
    </motion.div>
  );
};

export default AudioEffects;
