import React, { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/hooks/hooks";
import mediaQuery from "@/utils/mediaQuery";

// 定义歌词行接口
interface LyricLine {
  time: number;
  text: string;
}

// 歌词显示组件
const LyricsDisplay: React.FC = () => {
  // 判断是否为移动设备
  const isMobile = mediaQuery("(max-width: 768px)");
  // 从redux中获取当前播放的曲目和播放状态
  const { currentTrack, isPlaying } = useAppSelector(
    (state) => state.musicPlayer
  );
  // 定义歌词状态
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  // 定义当前歌词索引状态
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
  // 定义歌词容器引用
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // 解析歌词字符串为带时间的歌词数组
  useEffect(() => {
    if (!currentTrack?.lyric) {
      setParsedLyrics([]);
      return;
    }

    const lyrics: LyricLine[] = [];
    const lyricLines = currentTrack.lyric.split("\n");

    lyricLines.forEach((line: any) => {
      const timeMatch = line.match(/\[(\d+):(\d+\.\d+)\](.*)/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[1]);
        const seconds = parseFloat(timeMatch[2]);
        const text = timeMatch[3].trim();

        const totalSeconds = minutes * 60 + seconds;

        if (text) {
          lyrics.push({
            time: totalSeconds,
            text: text,
          });
        }
      }
    });

    // 按时间排序歌词
    lyrics.sort((a, b) => a.time - b.time);
    setParsedLyrics(lyrics);
  }, [currentTrack?.lyric]);

  // 同步歌词与当前播放时间
  useEffect(() => {
    const audioElement = document.getElementById(
      "audio-element"
    ) as HTMLAudioElement;

    if (!audioElement || !isPlaying) return;

    const updateCurrentLyric = () => {
      const currentTime = audioElement.currentTime;
      const index = parsedLyrics.findLastIndex(
        (lyric) => lyric.time <= currentTime
      );

      if (index !== currentLyricIndex) {
        setCurrentLyricIndex(index);

        // 滚动到当前歌词
        if (lyricsContainerRef.current && index !== -1) {
          const lyricElement = lyricsContainerRef.current.children[
            index
          ] as HTMLElement;
          if (lyricElement) {
            lyricElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      }
    };

    const intervalId = setInterval(updateCurrentLyric, 100);
    return () => clearInterval(intervalId);
  }, [parsedLyrics, currentLyricIndex, isPlaying]);

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
    <div className="relative w-full" style={{ width: "100%", height: "100%" }}>
      <div
        ref={lyricsContainerRef}
        className="overflow-y-auto text-center p-4 text-white"
        style={{
          scrollBehavior: "smooth",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <div
          className="flex flex-row justify-around mt-4"
          style={{ textAlign: "center", marginBottom: 20 }}
        >
          <span className="align-text-center text-xl font-bold text-white">
            {currentTrack.name}
          </span>
        </div>
        {parsedLyrics.map((lyric, index) => (
          <div
            key={index}
            className={`
            mb-4 transition-all duration-300 ease-in-out
            ${
              index === currentLyricIndex
                ? "text-white-500 font-bold text-xl"
                : "text-gray-300 text-base"
            }
          `}
            style={{ fontSize: isMobile ? "1rem" : "1.5rem" }}
          >
            {lyric.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LyricsDisplay;
