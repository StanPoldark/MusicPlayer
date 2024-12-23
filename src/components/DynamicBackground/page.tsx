import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/index';

const DynamicBackground: React.FC = () => {
  const [backgroundUrl, setBackgroundUrl] = useState<string>('');
  const backgroundUrlFromRedux = useSelector((state: RootState) => state.bg.backgroundUrl);

  useEffect(() => {
    // This will only run on the client side
    if (typeof window !== 'undefined') {
      const storedBackgroundUrl = localStorage.getItem('BACKGROUND');
      setBackgroundUrl(storedBackgroundUrl || backgroundUrlFromRedux);
    }
  }, [backgroundUrlFromRedux]); // Re-run if the redux state changes

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `url(${backgroundUrl})`,
        backgroundPosition: '60% 47.96%',
        backgroundSize: 'cover',
        zIndex: -1
      }}
    />
  );
};

export default DynamicBackground;
