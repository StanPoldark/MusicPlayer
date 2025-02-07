import React, { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/hooks/hooks";
import mediaQuery from "@/utils/mediaQuery";

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

const LyricsDisplay: React.FC = () => {
  const isMobile = mediaQuery("(max-width: 768px)");
  const { currentTrack, isPlaying } = useAppSelector(
    (state) => state.musicPlayer
  );
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [currentPosition, setCurrentPosition] = useState<{
    lineIndex: number;
    charIndex: number;
  }>({ lineIndex: -1, charIndex: -1 });
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

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

  // 更新当前歌词位置
  useEffect(() => {
    const audio = document.getElementById("audio-element") as HTMLAudioElement;
    if (!audio || !isPlaying) return;

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
          return setCurrentPosition({ lineIndex: -1, charIndex: -1 });
        }
      }

      // 计算当前字符
      const line = parsedLyrics[lineIndex];
      const charIndex = Math.floor(
        ((currentTime - line.startTime) / (line.endTime - line.startTime)) * line.words.length
      );
      const clampedIndex = Math.min(charIndex, line.words.length - 1);

      setCurrentPosition((prev) => {
        if (prev.lineIndex === lineIndex && prev.charIndex === clampedIndex) return prev;
        return { lineIndex, charIndex: clampedIndex };
      });

      // 滚动到当前行
      if (lyricsContainerRef.current) {
        const lineElement = lyricsContainerRef.current.children[lineIndex] as HTMLElement;
        lineElement?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };

    const interval = setInterval(updatePosition, 100);
    return () => clearInterval(interval);
  }, [parsedLyrics, isPlaying]);


  // 没有歌词或没有曲目
  if (!currentTrack?.lyric) {
    return (
      <div>
        <div
          className="flex flex-row justify-around mt-4"
          style={{ textAlign: "center", marginBottom: 20 }}
        >
          <span className="align-text-center text-xl font-bold text-white">
            {currentTrack.name}
          </span>
        </div>
        <div
          className="text-center text-gray-500 p-4 flex flex-col items-center justify-center"
          style={{
            height: isMobile ? "26rem" : "26rem",
          }}
        >
          No lyrics available
        </div>
      </div>
    );
  }
 return (
    <div className="relative w-full h-full">
      <div
        ref={lyricsContainerRef}
        className="overflow-y-auto text-center p-4"
        style={{
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          scrollBehavior: "smooth",
        }}
      >
        <div className="text-xl font-bold text-white mb-6">
          {currentTrack.name}
        </div>
        
        {parsedLyrics.map((line, lineIndex) => (
          <div
            key={lineIndex}
            className={`mb-4 transition-opacity duration-300 ${
              lineIndex === currentPosition.lineIndex ? "opacity-100" : "opacity-50"
            }`}
            style={{ fontSize: isMobile ? "1rem" : "1.25rem" }}
          >
            {line.words.map((word, wordIndex) => (
              <span
                key={wordIndex}
                className={`transition-colors duration-300 ${
                  lineIndex === currentPosition.lineIndex &&
                  wordIndex <= currentPosition.charIndex
                    ? "text-white font-bold"
                    : "text-gray-400"
                }`}
              >
                {word.text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LyricsDisplay;