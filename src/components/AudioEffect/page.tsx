import React from "react";
import { useAppDispatch } from "@/hooks/hooks";
import "./index.scss";
import { setPreset } from "@/redux/modules/audioEffects/reducer";

// 定义 AudioEffects 组件
const AudioEffects = () => {
  const dispatch = useAppDispatch();
  const presets = {
    n: "Normal",
    a: "Ambient",
    s: "Studio",
    h: "Hall",
  };

  return (
    <div className="flex flex-col items-center my-4">
      <span>Audio Effects</span>
      <div className="flex  px-8">
        {Object.keys(presets).map((preset) => (
          <div key={preset} className="shrink-0">
            <button
              className={`button h-12 flex items-center justify-center transition-all duration-300 hover:scale-105`}
              onClick={() => dispatch(setPreset(preset as "n" | "a" | "s" | "h"))}
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
