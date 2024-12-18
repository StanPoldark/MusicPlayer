"use client";

import React, { useEffect, useState } from "react";
import "./index.scss"; 
import nprogress from "nprogress";
import "nprogress/nprogress.css"; 
import LoadingProgress from "@/components/Loading/Progress/page"; 

const Loading = () => {
  const [progress, setProgress] = useState<number>(0);
  const [maskClassName, setMaskClassName] = useState<string>("loading_mask");

  useEffect(() => {
    // 初始化 NProgress 配置
    nprogress.configure({ showSpinner: false });
    nprogress.start();

    const progressTimer: NodeJS.Timeout = setInterval(() => {
      setProgress(nprogress.status || 0);
    }, 400);

    return () => {
      clearInterval(progressTimer);
      nprogress.done();
    };
  }, []);

  useEffect(() => {
    if (progress >= 1) {
      const finishLoading = async () => {
        nprogress.done();

        setMaskClassName("loading_mask done");
        await new Promise((resolve) => setTimeout(resolve, 1600));

        setMaskClassName("loading_mask hidden");
      };

      finishLoading();
    }
  }, [progress]);

  return (
    <div className={maskClassName}>
      <div className="title">Welcome To Stan`&apos;`s Music Website</div>
      <LoadingProgress value={progress} />
    </div>
  );
};

export default Loading;
