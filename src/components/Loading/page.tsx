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
        nprogress.done();
        setProgress(1);

        setMaskClassName("loading_mask done");
        await new Promise((resolve) => setTimeout(resolve, 1600));

        setMaskClassName("loading_mask hidden");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setRemoveMask(true);
      };

      finishLoading();
    }
  }, [progress, initState]);

  return removeMask ? null : (
    <div className={maskClassName}>
      <div className="title">Welcome To Stan&#39;s Music Website</div>
      <LoadingProgress value={progress} />
    </div>
  );
};

export default Loading;
