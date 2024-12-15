"use client"
import './index.scss';
import React, { useState, useEffect } from 'react';
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
  const [cardEle, setCardEle] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (cardEle && openVT) {
      VT.init(cardEle, {
        max: 1,
        speed: 1000,
        glare: true,
        'max-glare': 0.2,
      });
    }
  }, [openVT]);

  return (
    <div
      className={`transparent_box ${addclass || ''}`}
      ref={setCardEle}
    >
      <div className="content">
        {title ? <div className="title">{title}</div> : null}
        <div className="real_content">{children}</div>
      </div>
    </div>
  );
};

export default TransparentBox;
