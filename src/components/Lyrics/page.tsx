import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppSelector } from "@/hooks/hooks";
import mediaQuery from "@/utils/mediaQuery";
import "./index.scss";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "antd";
import { VerticalAlignTopOutlined } from "@ant-design/icons";

// 定义歌词行和字符接口
interface LyricWord {
  text: string;
  start: number;
  end: number;
}

interface LyricLine {
  startTime: number;
  endTime: number;
  words: LyricWord[];
}

// 定义动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.5,
      staggerChildren: 0.1 
    }
  }
};

const lineVariants = {
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
  active: {
    scale: 1.01,
    filter: "drop-shadow(0 0 5px rgba(4, 222, 255, 0.3))",
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const LyricsDisplay: React.FC<{isFullscreen:boolean}> = ({isFullscreen}) => {
  const isMobile = mediaQuery("(max-width: 768px)");
  const { currentTrack } = useAppSelector(
    (state) => state.musicPlayer
  );
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{
    lineIndex: number;
    charIndex: number;
    progress: number; // 添加当前字符的进度百分比
  }>({ lineIndex: -1, charIndex: -1, progress: 0 });
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // 重新设计的滚动控制状态
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showBackToCurrentButton, setShowBackToCurrentButton] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTop = useRef<number>(0);
  const autoScrollTargetRef = useRef<number>(0);

  useEffect(() => {
    if (currentTrack?.picUrl) {
      const img = new Image();
      img.src = currentTrack.picUrl;
    }
  }, [currentTrack?.picUrl]);

  // 解析歌词
  useEffect(() => {
    if (!currentTrack?.lyric) {
      setParsedLyrics([]);
      return;
    }

    const lines: LyricLine[] = [];
    const rawLines = currentTrack.lyric.split("\n");
    const timeRegex = /\[(\d+):(\d+\.\d+)\](.*)/;

    // 解析基础时间戳和文本
    const parsedLines = rawLines
      .map((line) => {
        const match = line.match(timeRegex);
        if (!match) return null;
        
        const minutes = parseInt(match[1]);
        const seconds = parseFloat(match[2]);
        return {
          time: minutes * 60 + seconds,
          text: match[3].trim(),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.time - b!.time) as { time: number; text: string }[];

    // 构建逐字时间数据
    for (let i = 0; i < parsedLines.length; i++) {
      const current = parsedLines[i];
      const next = parsedLines[i + 1];
      const startTime = current.time;
      const endTime = next ? next.time : startTime + 10; // 最后一行默认10秒

      const characters = current.text.split("");
      const duration = endTime - startTime;
      const charDuration = duration / characters.length;

      lines.push({
        startTime,
        endTime,
        words: characters.map((char, index) => ({
          text: char,
          start: startTime + index * charDuration,
          end: startTime + (index + 1) * charDuration,
        })),
      });
    }

    setParsedLyrics(lines);
  }, [currentTrack?.lyric]);

  // 执行自动滚动
  const performAutoScroll = useCallback((lineElement: HTMLElement) => {
    if (!lyricsContainerRef.current || isUserScrolling) return;
    
    setIsAutoScrolling(true);
    
    // 清除之前的自动滚动定时器
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    
    // 记录目标滚动位置
    const container = lyricsContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const lineRect = lineElement.getBoundingClientRect();
    const targetScrollTop = container.scrollTop + lineRect.top - containerRect.top - containerRect.height / 2 + lineRect.height / 2;
    
    autoScrollTargetRef.current = targetScrollTop;
    
    // 执行滚动
    lineElement.scrollIntoView({ behavior: "smooth", block: "center" });
    
    // 800ms后清除自动滚动标志（给足够时间完成滚动动画）
    autoScrollTimeoutRef.current = setTimeout(() => {
      setIsAutoScrolling(false);
    }, 800);
  }, [isUserScrolling]);

  // 改进的用户滚动检测
  const handleUserScroll = useCallback(() => {
    // 如果正在自动滚动，忽略这次滚动事件
    if (isAutoScrolling) {
      return;
    }

    const container = lyricsContainerRef.current;
    if (!container) return;

    const currentScrollTop = container.scrollTop;
    const scrollDiff = Math.abs(currentScrollTop - lastScrollTop.current);
    
    // 只有滚动距离超过阈值才认为是用户滚动
    if (scrollDiff > 10) {
      setIsUserScrolling(true);
      setShowBackToCurrentButton(true);
      
      // 清除之前的定时器
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      
      // 5秒后恢复自动滚动（增加时间）
      userScrollTimeoutRef.current = setTimeout(() => {
        setIsUserScrolling(false);
        setShowBackToCurrentButton(false);
      }, 5000);
    }
    
    lastScrollTop.current = currentScrollTop;
  }, [isAutoScrolling]);

  // 回到当前歌词位置
  const scrollToCurrentLyric = useCallback(() => {
    if (lyricsContainerRef.current && currentPosition.lineIndex >= 0) {
      const lineElement = lyricsContainerRef.current.children[currentPosition.lineIndex] as HTMLElement;
      if (lineElement) {
        setIsUserScrolling(false);
        setShowBackToCurrentButton(false);
        performAutoScroll(lineElement);
      }
    }
  }, [currentPosition.lineIndex, performAutoScroll]);

  // 更新当前歌词位置
  useEffect(() => {
    const audio = document.getElementById("audio-element") as HTMLAudioElement;
    if (!audio) return;

    const updatePosition = () => {
      const currentTime = audio.currentTime;
      
      // 查找当前行
      let lineIndex = parsedLyrics.findIndex(
        (line) => currentTime >= line.startTime && currentTime < line.endTime
      );
      
      if (lineIndex === -1) {
        if (parsedLyrics.length > 0 && currentTime >= parsedLyrics[parsedLyrics.length - 1].endTime) {
          lineIndex = parsedLyrics.length - 1;
        } else {
          return setCurrentPosition({ lineIndex: -1, charIndex: -1, progress: 0 });
        }
      }

      // 计算当前字符和进度
      const line = parsedLyrics[lineIndex];
      const lineProgress = (currentTime - line.startTime) / (line.endTime - line.startTime);
      const exactCharPosition = lineProgress * line.words.length;
      const charIndex = Math.floor(exactCharPosition);
      const clampedIndex = Math.min(charIndex, line.words.length - 1);

      // 计算当前字符内的进度（0-1之间）
      const charProgress = exactCharPosition - charIndex;
      const finalProgress = Math.max(0, Math.min(1, charProgress));

      setCurrentPosition({ 
        lineIndex, 
        charIndex: clampedIndex, 
        progress: finalProgress 
      });

      // 只有在用户没有手动滚动时才自动滚动
      if (!isUserScrolling && !isAutoScrolling && lyricsContainerRef.current) {
        const lineElement = lyricsContainerRef.current.children[lineIndex] as HTMLElement;
        if (lineElement) {
          performAutoScroll(lineElement);
        }
      }
    };

    const interval = setInterval(updatePosition, 50); // 提高更新频率以获得更平滑的效果
    
    // 添加进度条拖动事件监听
    const handleTimeUpdate = () => {
      updatePosition();
    };
    
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("seeking", handleTimeUpdate);
    audio.addEventListener("seeked", handleTimeUpdate);
    
    return () => {
      clearInterval(interval);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("seeking", handleTimeUpdate);
      audio.removeEventListener("seeked", handleTimeUpdate);
    };
  }, [parsedLyrics, isUserScrolling, isAutoScrolling, performAutoScroll]);

  // 添加滚动事件监听
  useEffect(() => {
    const container = lyricsContainerRef.current;
    if (container) {
      // 初始化滚动位置
      lastScrollTop.current = container.scrollTop;
      
      container.addEventListener('scroll', handleUserScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleUserScroll);
      };
    }
  }, [handleUserScroll]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (userScrollTimeoutRef.current) {
        clearTimeout(userScrollTimeoutRef.current);
      }
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, []);

  // 获取字符的颜色和样式
  const getCharacterStyle = (lineIndex: number, wordIndex: number) => {
    if (lineIndex !== currentPosition.lineIndex) {
      return {
        color: "#9CA3AF",
        textShadow: "none",
        transform: "scale(1)"
      };
    }

    if (wordIndex < currentPosition.charIndex) {
      // 已经唱过的字符 - 完全高亮
      return {
        color: "#04DEFF",
        textShadow: "0 0 8px rgba(4, 222, 255, 0.6)",
        transform: "scale(1.05)"
      };
    } else if (wordIndex === currentPosition.charIndex) {
      // 当前正在唱的字符 - 渐变高亮
      const progress = currentPosition.progress;
      
      return {
        color: `rgb(${Math.round(156 + (4 - 156) * progress)}, ${Math.round(163 + (222 - 163) * progress)}, ${Math.round(175 + (255 - 175) * progress)})`,
        textShadow: `0 0 ${4 + progress * 8}px rgba(4, 222, 255, ${0.2 + progress * 0.6})`,
        transform: `scale(${1 + progress * 0.1})`,
        transition: "all 0.1s ease-out"
      };
    } else {
      // 还没唱到的字符 - 默认颜色
      return {
        color: "#9CA3AF",
        textShadow: "none",
        transform: "scale(1)"
      };
    }
  };

  // 没有歌词或没有曲目
  if (!currentTrack?.lyric) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* 固定的歌名标题 */}
        <motion.div
          className="sticky-song-title"
          style={{ textAlign: "center", padding: "20px 0" }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.span 
            className={`song-title-text align-text-center font-bold ${isFullscreen ? 'text-3xl' : 'text-xl'}`}
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          >
            {currentTrack?.name || "No Track Selected"}
          </motion.span>
        </motion.div>
        
        <motion.div
          className="text-center text-gray-500 p-4 flex flex-col items-center justify-center"
          style={{
            height: isMobile ? "20rem" : "20rem",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          No lyrics available
        </motion.div>
      </motion.div>
    );
  }

 return (
    <motion.div 
      className="lyr-container flex"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
    {isFullscreen && 
        <motion.div 
          className="lyr-container-picUrl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.img 
            src={currentTrack.picUrl || "pic.jpg" } 
            className="max-w-md" 
            alt=""
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              duration: 0.7 
            }}
          />
        </motion.div>
    }
      
    <div className="relative w-full h-full">
        {/* 固定的歌名标题 */}
        <motion.div 
          className={`sticky-song-title ${
            isFullscreen ? 'text-3xl' : 'text-xl'
          } font-bold text-center`}
          style={{ padding: isFullscreen ? "30px 0" : "20px 0" }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="song-title-text">
          {currentTrack.name}
          </span>
        </motion.div>
        
        {/* 回到当前歌词按钮 */}
        <AnimatePresence>
          {showBackToCurrentButton && (
            <motion.div
              className="back-to-current-btn fixed bottom-20 right-4 z-20"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                type="primary"
                shape="circle"
                icon={<VerticalAlignTopOutlined />}
                onClick={scrollToCurrentLyric}
                className="shadow-lg"
                title="回到当前歌词"
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* 歌词容器 */}
        <motion.div
        ref={lyricsContainerRef}
        className="lyrics-container overflow-y-auto text-center p-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        style={{
            height: isFullscreen ? 'calc(100% - 120px)' : 'calc(100% - 80px)',
            paddingTop: '20px'
        }}
      >
        {parsedLyrics.map((line, lineIndex) => (
            <motion.div
            key={lineIndex}
              variants={lineVariants}
              animate={lineIndex === currentPosition.lineIndex ? "active" : "visible"}
              className={`lyric-line mb-4 transition-opacity duration-300 ${
                lineIndex === currentPosition.lineIndex 
                  ? "opacity-100 current-lyric-line" 
                  : "opacity-50"
            }`}
              style={{ 
                fontSize: isMobile ? "1rem" : "1.5rem", 
                paddingTop: isFullscreen ? "1rem" : "0rem",
                minHeight: "2rem", // 确保每行有最小高度，便于滚动定位
                lineHeight: "1.6"
              }}
          >
              {line.words.map((word, wordIndex) => {
                const charStyle = getCharacterStyle(lineIndex, wordIndex);
                return (
              <span
                key={wordIndex}
                    style={{
                      ...charStyle,
                      display: "inline-block",
                      fontWeight: lineIndex === currentPosition.lineIndex && wordIndex <= currentPosition.charIndex ? "bold" : "normal"
                    }}
              >
                {word.text}
              </span>
                );
              })}
            </motion.div>
        ))}
          
          {/* 底部留白，确保最后一行歌词可以滚动到中心 */}
          <div style={{ height: '50vh' }}></div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LyricsDisplay;