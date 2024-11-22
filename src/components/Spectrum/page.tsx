"use client";
import React, { useEffect, useRef, useState } from "react";
import { throttle } from "lodash";

interface AudioSpectrumProps {
  audioElement: HTMLAudioElement;
}

const AudioSpectrum: React.FC<AudioSpectrumProps> = ({ audioElement }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const animationFrameId = useRef<number>();
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  const initializeAudioContext = () => {
    if (!audioElement || sourceNodeRef.current) return; // Avoid creating multiple instances
    if (!audioContext) {
      const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioContext(newAudioContext);

      const newAnalyser = newAudioContext.createAnalyser();
      newAnalyser.fftSize = 256;
      newAnalyser.smoothingTimeConstant = 0.8;
      setAnalyser(newAnalyser);

      const newSourceNode = newAudioContext.createMediaElementSource(audioElement);
      newSourceNode.connect(newAnalyser);
      newAnalyser.connect(newAudioContext.destination);
      sourceNodeRef.current = newSourceNode;
    }
  };

  // Extracted drawToDom logic
  const drawToDom = (canvas: HTMLCanvasElement, arr: Uint8Array) => {
    let canvasCtx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const alt = arr.length;
    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, w, h);
      // 计算每个条的宽度
      let barW = (w / alt) * 0.9;
      let barH = 0;
      let x = 0;

      for (let i = 0; i < alt; i++) {
        barH = arr[i] + 30;
        canvasCtx.fillStyle = "#bce5ef";
        canvasCtx.fillRect(x, h / 2 - barH / 8, barW, barH / 4);
        x += barW + 3;
      }
    } else {
      throw Error("canvas 元素为空");
    }
  };

  const visualize = () => {
    if (!canvasRef.current || !analyser) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationFrameId.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      drawToDom(canvas, dataArray);
    };

    draw();
  };

  useEffect(() => {
    if (!audioElement) return;

    const handleCanPlay = () => {
      try {
        initializeAudioContext();
      } catch (error) {
        console.error("Error initializing audio context:", error);
      }
    };

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    }

    audioElement.addEventListener("canplay", handleCanPlay);

    if (audioElement.readyState >= 3) {
      handleCanPlay();
    }

    return () => {
      audioElement.removeEventListener("canplay", handleCanPlay);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (audioContext) {
        sourceNodeRef.current?.disconnect();
        analyser?.disconnect();
        audioContext.close();
      }
    };
  }, [audioElement]);

  useEffect(() => {
    if (analyser) {
      visualize();
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
        className="w-full h-32 rounded-lg bg-black/5 backdrop-blur-sm"
        style={{
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      />
    </div>
  );
};

export default AudioSpectrum;
