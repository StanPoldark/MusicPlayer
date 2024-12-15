"use client"
import React, { useEffect, useState } from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';
import './index.scss';
import './globals.css';
import Loading from "@/components/loading/page";
import { Provider } from 'react-redux';
import store from '@/redux/index';
import 'antd/dist/reset.css';
import mediaQuery from "@/utils/mediaQuery"

// Functional component layout
const Layout = ({ children }: any) => {
  const [initState, setInitState] = useState(false);
  const isMobile = mediaQuery("(max-width: 768px)");
  
  // Simulate asynchronous loading logic
  useEffect(() => {
    setTimeout(() => setInitState(true), 1000); // Simulating data load
  }, []);


  return (
    <Provider store={store}>

    <html>
      <body>
      {/* Loading spinner */}
      <Loading initState={initState} />
      
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
            <div className= {isMobile ? "" : "footer"}>
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
