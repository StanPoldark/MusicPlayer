"use client"; // 必须添加此指令，确保组件在客户端渲染

import React, { useState, useEffect } from "react";
import "./index.scss"; // 样式文件
import nprogress from "nprogress";

import LoadingProgress from "./Progress/page";

interface LoadingProps {
  initState: boolean;
}

const Loading: React.FC<LoadingProps> = ({ initState }) => {
  const [progress, setProgress] = useState<number | null>(0);
  const [maskClassName, setMaskClassName] = useState<string>("loading_mask");
  const [removeMask, setRemoveMask] = useState<boolean>(false);

  useEffect(() => {
    let progressTimer: NodeJS.Timeout | null = null;

    // 初始化 NProgress 配置
    nprogress.configure({ showSpinner: false });
    nprogress.start();

    progressTimer = setInterval(() => {
      setProgress(nprogress.status || 0);
    }, 400);

    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, []);

  useEffect(() => {
    if (progress === 1 || !initState) return;
  
    if (initState) {
      const finishLoading = async () => {
        // 确保进度条平滑完成
        nprogress.done();
        setProgress(1);
  
        // 给足够的时间让进度条完成动画
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // 标记为完成状态，隐藏进度条但保持背景
        setMaskClassName("loading_mask done");
        await new Promise((resolve) => setTimeout(resolve, 800));
  
        // 开始淡出整个加载遮罩
        setMaskClassName("loading_mask done hidden");
        
        // 延长过渡时间，确保动画完全结束后再移除DOM
        await new Promise((resolve) => setTimeout(resolve, 1000)); 
        
        // 确保所有动画完成后再彻底移除组件
        setRemoveMask(true);
      };
  
      finishLoading();
    }
  }, [progress, initState]);

  // 使用绝对定位和z-index确保加载遮罩始终在顶层
  return removeMask ? null : (
    <div className={maskClassName} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <div className="title">Welcome To Stan&#39;s Music Website</div>
      <LoadingProgress value={progress} />
    </div>
  );
};

export default Loading;
