import React, { useState, useEffect, useRef } from "react";
import { useAppSelector } from "@/hooks/hooks";
import mediaQuery from "@/utils/mediaQuery"

interface LyricLine {
  time: number;
  text: string;
}

const LyricsDisplay: React.FC = () => {
  const isMobile = mediaQuery("(max-width: 768px)");
  const { currentTrack, isPlaying } = useAppSelector(
    (state) => state.musicPlayer
  );
  const [parsedLyrics, setParsedLyrics] = useState<LyricLine[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(-1);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Parse lyrics from string to timed lyrics array
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

    // Sort lyrics by time
    lyrics.sort((a, b) => a.time - b.time);
    setParsedLyrics(lyrics);
  }, [currentTrack?.lyric]);

  // Synchronize lyrics with current playback time
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

        // Scroll to current lyric
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

  // No lyrics or no track
  if (!currentTrack?.lyric) {
    return (
      <div className="text-center text-gray-500 p-4">No lyrics available</div>
    );
  }

  return (
    <div className="relative w-full" style={{ width: "100%", height: "100%" }}>
      <div
        className="flex flex-row justify-around mt-4"
        style={{ textAlign: "center", marginBottom: 20 }}
      >
        <span className="align-text-center text-xl font-bold text-white">
          {currentTrack.name}
        </span>
      </div>
      <div
        ref={lyricsContainerRef}
        className="lyrics-container overflow-y-auto text-center p-4 text-white"
        style={{
          scrollBehavior: "smooth",
          maxHeight: isMobile ? "26rem" :"40rem",

        }}
      >
        {parsedLyrics.map((lyric, index) => (
          <div
            key={index}
            className={`
            mb-2 transition-all duration-300 ease-in-out
            ${
              index === currentLyricIndex
                ? "text-white-500 font-bold text-xl"
                : "text-gray-300 text-base"
            }
          `}
          style={{fontSize: isMobile? "1rem": "1.5rem"}}
          >
            {lyric.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LyricsDisplay;
