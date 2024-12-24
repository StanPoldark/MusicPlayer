import React, { useEffect, useState, useRef } from "react";
import * as Tone from "tone";
import { useAudio } from "@/contexts/AudioContext";
import { useAppSelector } from "@/hooks/hooks";
import "./index.scss";

// 定义 AudioEffects 组件
const AudioEffects = () => {
  // 定义 effectsChain 状态，用于存储音效处理链
  const [effectsChain, setEffectsChain] = useState<{
    reverb?: Tone.Reverb;
    eq?: Tone.EQ3;
    compressor?: Tone.Compressor;
    gain?: Tone.Gain;
  }>({});

  // 从 AudioContext 中获取 audioContext、audioRef 和 webAudioSourceNode
  const { audioContext, webAudioSourceNode } = useAudio();

  const isInitializedRef = useRef(false);
  // 定义 selectedPreset 状态，用于存储当前选中的音效预设
  const [selectedPreset, setSelectedPreset] = useState("normal");

  // 从 Redux 中获取 hasUserInteracted 状态
  const { hasUserInteracted } = useAppSelector((state) => state.musicPlayer);

  // 定义音效预设
  const presets = {
    n: {
      reverb: 0.1, // 轻微的混响
      bass: 0,
      mid: 0,
      treble: 0,
      compression: 0,
    },
    a: {
      reverb: 0.8, // 强烈的混响
      bass: 3,
      mid: 0,
      treble: 2,
      compression: -30,
    },
    s: {
      reverb: 0.1, // 轻微的混响
      bass: 2,
      mid: 1,
      treble: 1,
      compression: -15,
    },
    h: {
      reverb: 0.7, // 大厅混响效果
      bass: 1,
      mid: 1,
      treble: 0,
      compression: -20,
    },
  };

  // useEffect 钩子，用于初始化音效处理链

  useEffect(() => {
    const initializeEffects = async () => {
      // 检查是否已初始化和必要条件
      if (
        audioContext &&
        webAudioSourceNode &&
        hasUserInteracted &&
        !isInitializedRef.current
      ) {
        isInitializedRef.current = true;

        try {
          await Tone.start();
          Tone.setContext(audioContext);

          const reverb = new Tone.Reverb({ decay: 3 }).toDestination();
          const eq = new Tone.EQ3().connect(reverb);
          const compressor = new Tone.Compressor().connect(eq);
          const gainNode = new Tone.Gain(1);

          webAudioSourceNode.connect(gainNode.input);
          gainNode.connect(compressor);

          setEffectsChain({ reverb, eq, compressor, gain: gainNode });

          // 初始化完成后打印一次状态
          console.log("Audio Chain Initialized:", {
            gainConnected: gainNode.numberOfOutputs > 0,
            compressorConnected: compressor.numberOfOutputs > 0,
            eqConnected: eq.numberOfOutputs > 0,
            reverbConnected: reverb.numberOfOutputs > 0,
          });
        } catch (error) {
          console.error("Error initializing audio effects:", error);
          isInitializedRef.current = false; // 如果初始化失败，重置标志
        }
      }
    };

    initializeEffects();

    // 清理函数
    return () => {
      if (isInitializedRef.current) {
        if (effectsChain.reverb) effectsChain.reverb.dispose();
        if (effectsChain.eq) effectsChain.eq.dispose();
        if (effectsChain.compressor) effectsChain.compressor.dispose();
        if (effectsChain.gain) effectsChain.gain.dispose();
        if (webAudioSourceNode) webAudioSourceNode.disconnect();
        isInitializedRef.current = false;
      }
    };
  }, [audioContext, webAudioSourceNode, hasUserInteracted]); // 移除 effectsChain

  // 定义 applyPreset 函数，用于应用音效预设
  const applyPreset = (presetName: keyof typeof presets) => {
    const preset = presets[presetName];

    // Ensure valid ranges for Tone.js properties
    const validReverb = Math.max(preset.reverb, 0.001); // Minimum reverb decay
    const validCompression = Math.max(Math.min(preset.compression, 0), -100); // Ensure compression is between -100 and 0

    // Apply the preset values with validation
    if (effectsChain.reverb) {
      effectsChain.reverb.set({ decay: validReverb });
    }

    if (effectsChain.eq) {
      effectsChain.eq.low.value = preset.bass;
      effectsChain.eq.mid.value = preset.mid;
      effectsChain.eq.high.value = preset.treble;
    }

    if (effectsChain.compressor) {
      effectsChain.compressor.threshold.value = validCompression;
    }

    // Apply a gain change to make the effect more noticeable (you can modify this value)
    if (effectsChain.gain) {
      effectsChain.gain.gain.value = presetName === "a" ? 2 : 1; // Increase gain for ambient to make it more noticeable
    }
    setSelectedPreset(presetName);
  };

  // 返回组件 JSX
  return (
    <div className="flex flex-col items-center my-4">
      <span>Audio Effects</span>
      <div className="flex  gap-4 px-4">
        {Object.keys(presets).map((preset) => (
          <div key={preset} className="shrink-0">
            <button
              className={`button h-12 flex items-center justify-center transition-all duration-300 hover:scale-105`}
              onClick={() => applyPreset(preset as keyof typeof presets)}
            >
              <span>{preset.charAt(0).toUpperCase() + preset.slice(1)}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AudioEffects;
