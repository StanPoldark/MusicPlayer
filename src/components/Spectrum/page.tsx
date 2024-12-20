"use client";
import React, { useEffect, useRef } from "react";
import { throttle } from "lodash";
interface AudioSpectrumProps {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;

}

const AudioSpectrum: React.FC<AudioSpectrumProps> = ({ audioContext, analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);

  const drawSpectrum = throttle(
    (canvas: HTMLCanvasElement, arr: Uint8Array) => {
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
    },
    16
  );

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
    
    if (audioContext && analyser) {
      visualize();
    } else {
      if (canvasRef.current) drawStaticSpectrum(canvasRef.current, 128); // Show static spectrum
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyser, audioContext]);

  return (
    <div className="relative w-full">
      <canvas ref={canvasRef} className="w-full h-8 rounded-lg bg-black/5" />
    </div>
  );
};

export default AudioSpectrum;
