'use client';

import { useEffect, useState } from 'react';

type Snowflake = {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export default function SnowfallBackground() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    const initialSnowflakes = Array.from({ length: 50 }, (_, index) => ({
      id: index,
      x: Math.random() * windowSize.width,
      y: Math.random() * windowSize.height,
      size: Math.random() * 4 + 2,
      speed: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.4
    }));

    setSnowflakes(initialSnowflakes);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (snowflakes.length === 0) return;

    const animationFrame = requestAnimationFrame(() => {
      setSnowflakes(prevSnowflakes =>
        prevSnowflakes.map(snowflake => ({
          ...snowflake,
          y: snowflake.y + snowflake.speed,
          x: snowflake.x + Math.sin(snowflake.y * 0.02) * 0.5,
          ...(snowflake.y > windowSize.height && {
            y: -10,
            x: Math.random() * windowSize.width
          })
        }))
      );
    });

    return () => cancelAnimationFrame(animationFrame);
  }, [snowflakes, windowSize.height]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {snowflakes.map((snowflake) => (
        <div
          key={snowflake.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${snowflake.x}px`,
            top: `${snowflake.y}px`,
            width: `${snowflake.size}px`,
            height: `${snowflake.size}px`,
            opacity: snowflake.opacity,
            transform: `translateZ(0)`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  );
}