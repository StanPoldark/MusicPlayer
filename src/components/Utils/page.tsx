import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, Slider, Divider, Button, Tooltip } from "antd";
import { 
  AudioOutlined, 
  BgColorsOutlined, 
  ThunderboltOutlined,
  PlayCircleOutlined,
  SettingOutlined
} from "@ant-design/icons";
import ChangeBackground from "@/components/ChangeBackground/page";
import AudioEffects from "@/components/AudioEffect/page";
import { useAppDispatch, useAppSelector } from "@/hooks/hooks";
import { setPlaybackRate } from "@/redux/modules/musicPlayer/reducer";
import "./index.scss";

// 播放速度预设
const SPEED_PRESETS = [
  { value: 0.25, label: "0.25x" },
  { value: 0.5, label: "0.5x" },
  { value: 0.75, label: "0.75x" },
  { value: 1.0, label: "1.0x" },
  { value: 1.25, label: "1.25x" },
  { value: 1.5, label: "1.5x" },
  { value: 2.0, label: "2.0x" },
];

// 卡片动画变体
const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  hover: {
    y: -5,
    boxShadow: "0 10px 30px rgba(4, 222, 255, 0.3)",
    transition: {
      duration: 0.3,
      ease: "easeOut"
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

const Utils = () => {
  const dispatch = useAppDispatch();
  const { playbackRate } = useAppSelector((state) => state.musicPlayer);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleSpeedChange = (value: number) => {
    dispatch(setPlaybackRate(value));
  };

  const toggleCard = (cardKey: string) => {
    setExpandedCard(expandedCard === cardKey ? null : cardKey);
  };

  return (
    <motion.div 
      className="utils-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px"
      }}
    >
      {/* 播放速度控制卡片 */}
      <motion.div variants={cardVariants} whileHover="hover">
        <Card
          className="function-card"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(4, 222, 255, 0.2)",
            borderRadius: "16px",
            color: "white"
          }}
          hoverable
          onClick={() => toggleCard("speed")}
        >
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <PlayCircleOutlined style={{ fontSize: "24px", color: "#04deff" }} />
            <div>
              <h3 style={{ margin: 0, color: "white", fontSize: "18px" }}>播放速度</h3>
              <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.7)", fontSize: "14px" }}>
                当前: {playbackRate}x
              </p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <ThunderboltOutlined 
                style={{ 
                  fontSize: "20px", 
                  color: expandedCard === "speed" ? "#04deff" : "rgba(255, 255, 255, 0.5)",
                  transform: expandedCard === "speed" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "all 0.3s ease"
                }} 
              />
            </div>
          </div>

          <AnimatePresence>
            {expandedCard === "speed" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <Divider style={{ borderColor: "rgba(4, 222, 255, 0.3)", margin: "16px 0" }} />
                <div style={{ padding: "0 8px" }}>
                  <div style={{ marginBottom: "20px" }}>
                    <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "14px", marginBottom: "12px" }}>
                      拖动滑块调整播放速度
                    </p>
                    <Slider
                      min={0.25}
                      max={2.0}
                      step={0.25}
                      value={playbackRate}
                      onChange={handleSpeedChange}
                      marks={{
                        0.25: "0.25x",
                        0.5: "0.5x",
                        1.0: "1.0x",
                        1.5: "1.5x",
                        2.0: "2.0x"
                      }}
                      tooltip={{
                        formatter: (value) => `${value}x`
                      }}
                      trackStyle={{ backgroundColor: "#04deff" }}
                      handleStyle={{ borderColor: "#04deff", backgroundColor: "#04deff" }}
                      railStyle={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
                    />
                  </div>
                  
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {SPEED_PRESETS.map((preset) => (
                      <Tooltip key={preset.value} title={`设置为 ${preset.label}`}>
                        <Button
                          size="small"
                          type={playbackRate === preset.value ? "primary" : "default"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSpeedChange(preset.value);
                          }}
                          style={{
                            background: playbackRate === preset.value 
                              ? "#04deff" 
                              : "rgba(255, 255, 255, 0.1)",
                            borderColor: playbackRate === preset.value 
                              ? "#04deff" 
                              : "rgba(255, 255, 255, 0.2)",
                            color: "white",
                            borderRadius: "8px"
                          }}
                        >
                          {preset.label}
                        </Button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* 音效控制卡片 */}
      <motion.div variants={cardVariants} whileHover="hover">
        <Card
          className="function-card"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(4, 222, 255, 0.2)",
            borderRadius: "16px",
            color: "white"
          }}
          hoverable
          onClick={() => toggleCard("audio")}
        >
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AudioOutlined style={{ fontSize: "24px", color: "#04deff" }} />
            <div>
              <h3 style={{ margin: 0, color: "white", fontSize: "18px" }}>音效设置</h3>
              <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.7)", fontSize: "14px" }}>
                调整音频效果预设
              </p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <SettingOutlined 
                style={{ 
                  fontSize: "20px", 
                  color: expandedCard === "audio" ? "#04deff" : "rgba(255, 255, 255, 0.5)",
                  transform: expandedCard === "audio" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "all 0.3s ease"
                }} 
              />
            </div>
          </div>

          <AnimatePresence>
            {expandedCard === "audio" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <Divider style={{ borderColor: "rgba(4, 222, 255, 0.3)", margin: "16px 0" }} />
                <div onClick={(e) => e.stopPropagation()}>
                  <AudioEffects />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>

      {/* 背景设置卡片 */}
      <motion.div variants={cardVariants} whileHover="hover">
        <Card
          className="function-card"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(4, 222, 255, 0.2)",
            borderRadius: "16px",
            color: "white"
          }}
          hoverable
          onClick={() => toggleCard("background")}
        >
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <BgColorsOutlined style={{ fontSize: "24px", color: "#04deff" }} />
            <div>
              <h3 style={{ margin: 0, color: "white", fontSize: "18px" }}>背景设置</h3>
              <p style={{ margin: 0, color: "rgba(255, 255, 255, 0.7)", fontSize: "14px" }}>
                自定义应用背景图片
              </p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <SettingOutlined 
                style={{ 
                  fontSize: "20px", 
                  color: expandedCard === "background" ? "#04deff" : "rgba(255, 255, 255, 0.5)",
                  transform: expandedCard === "background" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "all 0.3s ease"
                }} 
              />
            </div>
          </div>

          <AnimatePresence>
            {expandedCard === "background" && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
              >
                <Divider style={{ borderColor: "rgba(4, 222, 255, 0.3)", margin: "16px 0" }} />
                <div onClick={(e) => e.stopPropagation()}>
                  <ChangeBackground />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Utils;
