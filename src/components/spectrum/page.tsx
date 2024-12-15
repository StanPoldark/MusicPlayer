"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAudio } from "@/contexts/audioContext";
import { throttle } from "lodash";
import { useAppSelector } from "@/hooks/hooks";

interface AudioSpectrumProps {
  hasUserInteracted: boolean; // 从父组件传入的用户交互状态
}

const AudioSpectrum: React.FC<AudioSpectrumProps> = ({ hasUserInteracted })  => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const { audio } = useAudio(); // 获取音频上下文
  const { isPlaying } = useAppSelector((state) => state.musicPlayer);

  const drawSpectrum = throttle((canvas: HTMLCanvasElement, arr: Uint8Array) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const barWidth = width / arr.length;
    let x = 0;
    arr.forEach((value) => {
      const barHeight = (value / 255) * height;
      ctx.fillStyle = `rgba(52, 152, 219, ${value / 255})`;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    });
  }, 16);

  const cleanupAudioContext = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch (error) {
        console.warn("Error disconnecting source node:", error);
      }
      sourceNodeRef.current = null;
    }
    if (analyser) {
      try {
        analyser.disconnect();
      } catch (error) {
        console.warn("Error disconnecting analyser:", error);
      }
      setAnalyser(null);
    }
    if (audioContext) {
      try {
        audioContext.close();
      } catch (error) {
        console.warn("Error closing audio context:", error);
      }
      setAudioContext(null);
    }
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  };
  const drawStaticSpectrum = (canvas: HTMLCanvasElement, alt: number) => {
    const canvasCtx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const barWidth = (w / alt) * 0.9;
    let x = 0;
  
    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, w, h);
  
      for (let i = 0; i < alt; i++) {
        const barHeight = 30; 
        canvasCtx.fillStyle = "#bce5ef";
        canvasCtx.fillRect(x, h / 2 - barHeight / 8, barWidth, barHeight / 4);
        x += barWidth + 3; 
      }
    } else {
      throw Error("Canvas context is null");
    }
  };


  const initializeAudioContext = () => {
    cleanupAudioContext();

    if (!audio) return;

    try {
      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(newAudioContext);

      const newAnalyser = newAudioContext.createAnalyser();
      newAnalyser.fftSize = 256;
      newAnalyser.smoothingTimeConstant = 0.8;
      setAnalyser(newAnalyser);
      
      if (!sourceNodeRef.current) {
        const newSourceNode = newAudioContext.createMediaElementSource(audio);
        sourceNodeRef.current = newSourceNode;
      }

      sourceNodeRef.current.connect(newAnalyser);
      newAnalyser.connect(newAudioContext.destination);
    } catch (error) {
      console.error("Error initializing audio context:", error);
    }
  };

  const visualize = () => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameId.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      drawSpectrum(canvas, dataArray);
    };
    draw();
  };

  useEffect(() => {
    if (!audio) {
      cleanupAudioContext();
      return;
    }

    if (hasUserInteracted) {
      initializeAudioContext();
    }

    return () => {
      cleanupAudioContext();
    };
  }, [audio, hasUserInteracted]);

  useEffect(() => {
    if (analyser) {
      visualize();
    } else {
      if (canvasRef.current) drawStaticSpectrum(canvasRef.current, 128); // 显示静态图
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyser, isPlaying]);

  return (
    <div className="relative w-full">
      <canvas ref={canvasRef} className="w-full h-8 rounded-lg bg-black/5" />
    </div>
  );
};

export default AudioSpectrum;
