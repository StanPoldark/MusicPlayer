"use client";
import React, { useEffect, useRef, useState } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { throttle } from "lodash";

const AudioSpectrum: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const animationFrameId = useRef<number>();
  const intervalId = useRef<number | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const { audio } = useAudio(); // Audio context

  const initializeAudioContext = () => {
    if (!audio || sourceNodeRef.current) return;
    const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(newAudioContext);

    const newAnalyser = newAudioContext.createAnalyser();
    newAnalyser.fftSize = 256;
    newAnalyser.smoothingTimeConstant = 0.8;
    setAnalyser(newAnalyser);

    const newSourceNode = newAudioContext.createMediaElementSource(audio);
    newSourceNode.connect(newAnalyser);
    newAnalyser.connect(newAudioContext.destination);
    sourceNodeRef.current = newSourceNode;
  };

  const drawStaticSpectrum = (canvas: HTMLCanvasElement, alt: number) => {
    const canvasCtx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const barWidth = (w / alt) * 0.9; // 计算每个频谱条的宽度
    let x = 0;
  
    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, w, h); // 清除画布
  
      for (let i = 0; i < alt; i++) {
        const barHeight =  30; 
        canvasCtx.fillStyle = "#bce5ef";
        canvasCtx.fillRect(x, h / 2 - barHeight / 8, barWidth, barHeight / 4); // 绘制频谱条
        x += barWidth + 3; 
      }
    } else {
      throw Error("Canvas context is null");
    }
  };

  const drawSpectrum = throttle((canvas: HTMLCanvasElement, arr: Uint8Array) => {
    const canvasCtx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const alt = arr.length;
    
    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, w, h);
      
      // 找出数据的最大值，用于归一化
      const maxValue = Math.max(...arr);
      
      let barW = (w / alt) * 0.9;
      let x = 0;
  
      for (let i = 0; i < alt; i++) {
        // 归一化并缩放频谱条高度
        const normalizedHeight = (arr[i] / maxValue) * (h / 2);
        
        // 使用渐变颜色，低频和高频使用不同颜色
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#bce5ef');
        gradient.addColorStop(1, '#3498db');
        
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, h / 2 - normalizedHeight / 2, barW, normalizedHeight);
        
        x += barW + 3;
      }
    } else {
      throw Error("Canvas context is null");
    }
  }, 16);
  

  const fakeVisualize = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;

    if (intervalId.current) clearInterval(intervalId.current);

    drawStaticSpectrum(canvas,128); 
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
      fakeVisualize(); // 没有音频时启动静态点阵
      return;
    }

    try {
      initializeAudioContext();
    } catch (error) {
      console.error("Error initializing audio context:", error);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
      if (audioContext) {
        sourceNodeRef.current?.disconnect();
        analyser?.disconnect();
        audioContext.close();
      }
    };
  }, [audio]);

  useEffect(() => {
    if (analyser) {
      visualize(); // 动态音谱
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyser]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-8 rounded-lg bg-black/5 backdrop-blur-sm"
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      />
    </div>
  );
};

export default AudioSpectrum;
