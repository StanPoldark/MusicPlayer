"use client"
import React, { useEffect, useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './index.scss';
import Loading from "@/components/Loading/page";
import { Provider } from 'react-redux';
import store from '@/redux/index';
// Functional component layout
const Layout = ({ children }: any) => {
  const [initState, setInitState] = useState(false);

  // Simulate asynchronous loading logic
  useEffect(() => {
    setTimeout(() => setInitState(true), 2000); // Simulating data load
  }, []);

  return (
    <Provider store={store}>
    <html>
      <body>
      {/* Loading spinner */}
      <Loading initState={initState} />
      
      {/* Mobile mask */}
      <div className="phone_mask">
        <p>:(</p>
        <span>很抱歉，本站并不支持手机移动端访问，推荐使用 PC 端进行页面访问</span>
        <span>We're sorry but the website doesn't support mobile phone, please change your device like PC to visit it.</span>
      </div>
      
      <TransitionGroup className='main-wrapper animate__animated animate__fadeIn'  id="bg">
        <CSSTransition
          timeout={3000}
          classNames="page-transition" // Using classNames for transitions
        >
          <div className='layout'>
            {/* Header */}
            <div className="header">
              {/* Add Header content here */}
            </div>
            
            {/* Main Content Area with route transitions */}
            <TransitionGroup
              className='middle_content'
              childFactory={(child: any) => React.cloneElement(child, { classNames: 'page' })}
            >
              <CSSTransition
                timeout={800}
                classNames="page" // Define your CSS classes for transitions
              >
                
                {children}
              </CSSTransition>
            </TransitionGroup>
            
            {/* Footer */}
            <div className="footer">
              {/* Add Footer content here */}
            </div>
          </div>
        </CSSTransition>
      </TransitionGroup>
      </body>
    </html>
    </Provider>
  );
};

export default Layout;
