import React, { useEffect } from 'react';

const Live2DViewer: React.FC = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/oh-my-live2d@latest';
    script.async = true;
    script.onload = () => {
      if (window.OML2D) {
        window.OML2D.loadOml2d({
          models: [
            {
              path: 'https://model.oml2d.com/HK416-1-normal/model.json',
              position: [0, 60],
              scale: 0.08,
              stageStyle: {
                height: 450,
              },
            },
          ],
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="live2d-container" style={{ position: 'absolute', width: '100%', height: '450px',right:0 }} />;
};

export default Live2DViewer;
