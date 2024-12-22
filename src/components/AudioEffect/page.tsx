import React, { useEffect, useState } from "react";
import * as Tone from "tone";
import { useAudio } from "@/contexts/AudioContext";
import { useAppSelector } from "@/hooks/hooks";

// 定义 AudioEffects 组件
const AudioEffects = () => {
  // 定义 effectsChain 状态，用于存储音效处理链
  const [effectsChain, setEffectsChain] = useState<{
    reverb?: Tone.Reverb;
    eq?: Tone.EQ3;
    compressor?: Tone.Compressor;
  }>({});

  // 从 AudioContext 中获取 audioContext、audioRef 和 webAudioSourceNode
  const { audioContext, webAudioSourceNode } = useAudio();

  // 定义 selectedPreset 状态，用于存储当前选中的音效预设
  const [selectedPreset, setSelectedPreset] = useState("normal");

  // 从 Redux 中获取 hasUserInteracted 状态
  const { hasUserInteracted } = useAppSelector((state) => state.musicPlayer);

  // 定义音效预设
  const presets = {
    normal: {
      reverb: 0,
      bass: 0,
      mid: 0,
      treble: 0,
      compression: 0,
    },
    concert: {
      reverb: 0.3,
      bass: 3,
      mid: 0,
      treble: 2,
      compression: -10,
    },
    studio: {
      reverb: 0.1,
      bass: 2,
      mid: 1,
      treble: 1,
      compression: -15,
    },
    ambient: {
      reverb: 0.8, // 强烈的混响，营造深远空间感
      bass: 2,
      mid: 0,
      treble: 2,
      compression: -30, // 更大的动态范围
    },
    hall: {
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
      if (audioContext && webAudioSourceNode && hasUserInteracted) {
        // 确保用户交互后启动 Tone.js 上下文
        await Tone.start();
        Tone.setContext(audioContext);

        // 创建 Tone.js 的音效处理链
        const reverb = new Tone.Reverb({ decay: 3 }).toDestination();
        const eq = new Tone.EQ3().connect(reverb);
        const compressor = new Tone.Compressor().connect(eq);

        // 使用 Tone.js 的 Gain 节点桥接
        const gainNode = new Tone.Gain();
        webAudioSourceNode.connect(gainNode.input); // 将原生节点连接到 Tone.js 节点
        gainNode.connect(compressor); // 再接入 Tone.js 音效链
        setEffectsChain({ reverb, eq, compressor });
      }
    };

    initializeEffects();

    return () => {
      if (effectsChain.reverb) effectsChain.reverb.dispose();
      if (effectsChain.eq) effectsChain.eq.dispose();
      if (effectsChain.compressor) effectsChain.compressor.dispose();
      if (webAudioSourceNode) webAudioSourceNode.disconnect();
    };
  }, [audioContext, webAudioSourceNode, effectsChain, hasUserInteracted]);

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
    setSelectedPreset(presetName);
  };

  // 返回组件 JSX
  return (
    <div className="flex flex-col items-center my-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-lg">
        {Object.keys(presets).map((preset) => (
          <button
            key={preset}
            className={`w-full px-4 py-2 text-sm md:text-base rounded transition-all duration-300 ${
              selectedPreset === preset ? "bg-blue-500 text-white" : "bg-gray-500 text-gray-200"
            } hover:bg-blue-600 hover:scale-105`}
            onClick={() => applyPreset(preset as keyof typeof presets)}
          >
            {preset.charAt(0).toUpperCase() + preset.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AudioEffects;
