import React, { useEffect, useState } from "react";
import * as Tone from "tone";
import { useAppSelector } from "@/hooks/hooks";

interface AudioEffectsProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  audioContext: AudioContext | null;
  sourceNode: AudioBufferSourceNode | null;
}

const AudioEffects = ({ audioRef, audioContext ,sourceNode}: AudioEffectsProps) => {
  const [effectsChain, setEffectsChain] = useState<{
    reverb?: Tone.Reverb;
    eq?: Tone.EQ3;
    compressor?: Tone.Compressor;
  }>({});
  const [selectedPreset, setSelectedPreset] = useState("normal");
    const { hasUserInteracted } = useAppSelector(
      (state) => state.musicPlayer
    );

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
  };

  useEffect(() => {
    const initializeEffects = async () => {
      if (!audioRef.current || !audioContext ) return;

      // 确保 Tone.js 的上下文启动
      await Tone.start();
      Tone.setContext(audioContext);

      // 创建 Tone.js 的音效处理链
      const reverb = new Tone.Reverb({ decay: 3 }).toDestination();
      const eq = new Tone.EQ3().connect(reverb);
      const compressor = new Tone.Compressor().connect(eq);

      // 使用 Tone.js 的 Gain 节点桥接
      const gainNode = new Tone.Gain();
      sourceNode.connect(gainNode.input); // 将原生节点连接到 Tone.js 节点
      gainNode.connect(compressor); // 再接入 Tone.js 音效链
      setEffectsChain({ reverb, eq, compressor });

      return () => {
        reverb.dispose();
        eq.dispose();
        compressor.dispose();
        gainNode.dispose();
        sourceNode.disconnect();
      };
    };

    initializeEffects().catch((error) =>
      console.error("Error initializing audio effects:", error)
    );
  }, [audioRef, audioContext]);

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
  
  return (
    <div className="flex gap-4 my-4">
      {Object.keys(presets).map((preset) => (
        <button
          key={preset}
          className={`px-4 py-2 rounded ${
            selectedPreset === preset ? "bg-blue-500" : "bg-gray-500"
          }`}
          onClick={() => applyPreset(preset as keyof typeof presets)}
        >
          {preset.charAt(0).toUpperCase() + preset.slice(1)}
        </button>
      ))}
    </div>
  );
};

export default AudioEffects;
