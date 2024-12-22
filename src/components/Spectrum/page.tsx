"use client";
import React, { useEffect, useRef } from "react";
import { throttle } from "lodash";
interface AudioSpectrumProps {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;

}

const AudioSpectrum: React.FC<AudioSpectrumProps> = ({ audioContext, analyser }) => {
  // 创建一个canvas引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 创建一个动画帧ID引用
  const animationFrameId = useRef<number | null>(null);

  // 使用lodash的throttle函数，限制drawSpectrum函数的调用频率
  const drawSpectrum = throttle(
    (canvas: HTMLCanvasElement, arr: Uint8Array) => {
      // 获取canvas的2D上下文
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 获取canvas的宽度和高度
      const { width, height } = canvas;
      // 清空canvas
      ctx.clearRect(0, 0, width, height);

      // 计算每个频谱条的宽度
      const barWidth = width / arr.length;
      let x = 0;
      // 遍历频谱数据
      arr.forEach((value) => {
        // 计算每个频谱条的高度
        const barHeight = (value / 255) * height;
        // 设置频谱条的颜色
        ctx.fillStyle = `rgba(52, 152, 219, ${value / 255})`;
        // 绘制频谱条
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      });
    },
    16
  );

  // 绘制静态频谱
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


  // 可视化频谱
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

  // 组件挂载和卸载时执行的操作
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
