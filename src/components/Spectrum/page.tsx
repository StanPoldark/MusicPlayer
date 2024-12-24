import React, { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { useSelector } from "react-redux";
import { throttle } from "lodash";

interface AudioVisualizerProps {
  audioContext: AudioContext | null;
  webAudioSourceNode: MediaElementAudioSourceNode | null;
  hasUserInteracted: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioContext,
  webAudioSourceNode,
  hasUserInteracted,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const isInitializedRef = useRef(false);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const selectedPreset = useSelector((state: any) => state.ae.selectedPreset); // 从 Redux 中获取选中的预设

  const [effectsChain, setEffectsChain] = useState<{
    reverb?: Tone.Reverb;
    eq?: Tone.EQ3;
    compressor?: Tone.Compressor;
    gain?: Tone.Gain;
  }>({});

  // Audio effect presets
  const presets = {
    n: {
      reverb: 0.1,
      bass: 0,
      mid: 0,
      treble: 0,
      compression: 0,
    },
    a: {
      reverb: 0.8,
      bass: 3,
      mid: 0,
      treble: 2,
      compression: -30,
    },
    s: {
      reverb: 0.1,
      bass: 2,
      mid: 1,
      treble: 1,
      compression: -15,
    },
    h: {
      reverb: 0.7,
      bass: 1,
      mid: 1,
      treble: 0,
      compression: -20,
    },
  };

  // Initialize audio effects chain
  useEffect(() => {
    const initializeEffects = async () => {
      if (
        audioContext &&
        webAudioSourceNode &&
        hasUserInteracted &&
        !isInitializedRef.current
      ) {
        isInitializedRef.current = true;

        try {
          // Initialize Tone.js effects
          await Tone.start();
          Tone.setContext(audioContext);
          const reverb = new Tone.Reverb({ decay: 3 }).toDestination();
          const eq = new Tone.EQ3().connect(reverb);
          const compressor = new Tone.Compressor().connect(eq);
          const gainNode = new Tone.Gain(1);
          
          // Create and connect analyzer node
          analyserRef.current = audioContext.createAnalyser();
          analyserRef.current.fftSize = 256;
          
          // Connect the audio chain
          webAudioSourceNode.connect(gainNode.input);
          gainNode.connect(compressor);
          gainNode.connect(analyserRef.current);
          
          setEffectsChain({ reverb, eq, compressor, gain: gainNode });
        } catch (error) {
          console.error("Error initializing audio effects:", error);
          isInitializedRef.current = false;
        }
      }
    };

    initializeEffects();

    return () => {
      if (isInitializedRef.current) {
        Object.values(effectsChain).forEach(effect => effect?.dispose());
        if (webAudioSourceNode) webAudioSourceNode.disconnect();
        isInitializedRef.current = false;
      }
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [audioContext, webAudioSourceNode, hasUserInteracted]);

  // Apply audio effect preset based on the selected preset
  useEffect(() => {
    const preset = presets[selectedPreset];
    
    if (effectsChain.reverb) {
      effectsChain.reverb.set({ decay: Math.max(preset.reverb, 0.001) });
    }

    if (effectsChain.eq) {
      effectsChain.eq.low.value = preset.bass;
      effectsChain.eq.mid.value = preset.mid;
      effectsChain.eq.high.value = preset.treble;
    }

    if (effectsChain.compressor) {
      effectsChain.compressor.threshold.value = Math.max(
        Math.min(preset.compression, 0),
        -100
      );
    }

    if (effectsChain.gain) {
      effectsChain.gain.gain.value = selectedPreset === "a" ? 2 : 1;
    }
  }, [selectedPreset]);

  // Spectrum visualization function (same as before)
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
        const hue = (value / 255) * 220; // Blue spectrum
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${value / 255})`;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      });
    },
    16
  );

  const drawStaticSpectrum = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const bars = 64;
    const barWidth = (width / bars) * 0.9;
    let x = 0;

    for (let i = 0; i < bars; i++) {
      const barHeight = 30;
      ctx.fillStyle = "#bce5ef";
      ctx.fillRect(x, height / 2 - barHeight / 8, barWidth, barHeight / 4);
      x += barWidth + 3;
    }
  };

  // Visualization loop
  useEffect(() => {
    if (!canvasRef.current) return;

    if (analyserRef.current) {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationFrameId.current = requestAnimationFrame(draw);
        analyserRef.current!.getByteFrequencyData(dataArray);
        drawSpectrum(canvasRef.current!, dataArray);
      };
      draw();
    } else {
      drawStaticSpectrum(canvasRef.current);
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyserRef.current]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full">
        <canvas 
          ref={canvasRef} 
          className="w-full h-8 rounded-lg bg-black/5"
        />
      </div>
    </div>
  );
};

export default AudioVisualizer;
