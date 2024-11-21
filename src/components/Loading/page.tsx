"use client"; // 必须添加此指令，确保组件在客户端渲染

import React, { useState, useEffect } from "react";
import "./index.scss"; // 样式文件
import nprogress from 'nprogress';

import LoadingProgress from "./Progress/page"; 

interface LoadingProps {
  initState: boolean; 
}

const Loading: React.FC<LoadingProps> = ({ initState }) => {
  const [progress, setProgress] = useState<number | null>(0); // 当前进度
  const [maskClassName, setMaskClassName] = useState<string>("loading_mask"); // 蒙版类名
  const [removeMask, setRemoveMask] = useState<boolean>(false); // 是否移除蒙版

  useEffect(() => {
    let progressTimer: NodeJS.Timeout | null = null;

    // 初始化 NProgress 配置
    nprogress.configure({ showSpinner: false });
    nprogress.start();

    // 更新进度条状态
    progressTimer = setInterval(() => {
      setProgress(nprogress.status || 0);
    }, 400);

    // 清理定时器
    return () => {
      if (progressTimer) clearInterval(progressTimer);
    };
  }, []);

  useEffect(() => {
    if (progress === 1 || !initState) return;

    if (initState) {
      // 模拟异步完成进度条
      const finishLoading = async () => {
        nprogress.done();
        setProgress(1);

        // 更新蒙版状态
        setMaskClassName("loading_mask done");
        await new Promise((resolve) => setTimeout(resolve, 1600)); // 等待动画完成

        setMaskClassName("loading_mask hidden");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待隐藏动画

        setRemoveMask(true);
      };

      finishLoading();
    }
  }, [progress, initState]);

  return removeMask ? null : (
    <div className={maskClassName}>
      <div className="title">Welcome To Stan's Music Website</div>
      <LoadingProgress value={progress} />
    </div>
  );
};

export default Loading;
