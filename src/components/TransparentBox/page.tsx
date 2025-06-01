"use client"
import './index.scss';
import React, { useRef, useEffect } from 'react';
import VT from 'vanilla-tilt';

interface TransparentBoxProps {
  title?: string | undefined;
  children?: any;
  openVT?: boolean | undefined;
  addclass?: string;
}

const TransparentBox = ({
  title,
  children,
  openVT,
  addclass,
}: TransparentBoxProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentCard = cardRef.current;
    
    if (currentCard && openVT) {
      VT.init(currentCard, {
        max: 1,
        speed: 1000,
        glare: true,
        'max-glare': 0.2,
      });
    }

    // 清理函数
    return () => {
      if (currentCard && openVT) {
        // VanillaTilt 清理
        const element = currentCard as any;
        if (element.vanillaTilt) {
          element.vanillaTilt.destroy();
        }
      }
    };
  }, [openVT]);

  return (
    <div
      className={`transparent_box ${addclass || ''}`}
      ref={cardRef}
    >
      <div className="content">
        {title ? <div className="title">{title}</div> : null}
        <div className="real_content">{children}</div>
      </div>
    </div>
  );
};

export default TransparentBox;
