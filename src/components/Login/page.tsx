"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { loginByQRCode, getQRCode, getLoginState, logout, checkQRCodeState } from '@/app/api/login';
import { message } from 'antd';
import { changeLoginState, setUserInfo, resetLoginState } from '@/redux/modules/login/reducer';
import { useAppSelector, useAppDispatch } from '@/hooks/hooks';
import { UserInfo } from '@/redux/modules/types';

enum LoginStatus {
  INITIAL,
  GENERATING_QR,
  WAITING_SCAN,
  LOGGED_IN
}

const Login = () => {
  const dispatch = useAppDispatch();
  const { userInfo } = useAppSelector(state => state.login);

  const [qrImg, setQrImg] = useState<string>('');
  const [loginStatus, setLoginStatus] = useState<LoginStatus>(LoginStatus.INITIAL);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Flag to manage QR code generation state
  const isQRCodeGenerating = useRef<boolean>(false);

  // Using useRef to store timers, preventing re-renders
  const pollingIntervalRef = useRef<NodeJS.Timer | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check existing login state on component mount
  useEffect(() => {
    const storedCookie = localStorage.getItem('cookie');
    if (storedCookie) {
      checkLoginStatus(storedCookie);
    }
  }, []);

  // Cleanup function for polling
  const cleanupPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current as unknown as number);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current as unknown as number);
      pollingTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupPolling();
    };
  }, [cleanupPolling]);

  const checkLoginStatus = async (cookie: string): Promise<boolean> => {
    try {
      const response = await getLoginState(cookie);
      
      if (response.data.code === 200) {        
        localStorage.setItem('cookie', cookie);
        const user: UserInfo = {
          id: response.data.profile.userId.toString(),
          nickname: response.data.profile.nickname,
          avatarUrl: response.data.profile.avatarUrl
        };
        dispatch(setUserInfo(user));
        dispatch(changeLoginState(true));
        setLoginStatus(LoginStatus.LOGGED_IN);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error details:', error);
      message.error('Error checking login status');
      setErrorMessage('Login verification failed');
      return false;
    }
  };
  
  const startQRCodeLogin = async () => {
    setLoginStatus(LoginStatus.GENERATING_QR);
    setErrorMessage(null);
    cleanupPolling();
  
    try {
      // Get QR code key
      const keyResponse = await loginByQRCode();
      const key = keyResponse?.data?.unikey;
  
      if (!key) {
        throw new Error('Failed to get QR code key');
      }
  
      // Get QR code image
      const qrCodeResponse = await getQRCode(key);
      const qrCodeImg = qrCodeResponse?.data?.qrimg;
  
      if (!qrCodeImg) {
        throw new Error('Failed to generate QR code');
      }
  
      setQrImg(qrCodeImg);
      setLoginStatus(LoginStatus.WAITING_SCAN); // 更改状态为等待扫码
  
      // Set up polling timeout
      const timeout = setTimeout(() => {
        message.error('Login timeout. Please try again.');
        setLoginStatus(LoginStatus.INITIAL);
        cleanupPolling();
      }, 300000); // 5 minutes
      pollingTimeoutRef.current = timeout;
  
      // Set up polling interval
      const interval = setInterval(async () => {
        // 移除 isQRCodeGenerating.current 检查，直接使用 LoginStatus
        try {
          const response = await checkQRCodeState(key);
          
          switch (response.code) {
            case 803: // Authorized
              await checkLoginStatus(response.cookie!);
              cleanupPolling();
              break;
            case 800: // QR code expired
              message.warning('QR code expired');
              setLoginStatus(LoginStatus.INITIAL);
              cleanupPolling();
              break;
            case 801: // Waiting for scan
              // 保持在等待扫码状态
              setLoginStatus(LoginStatus.WAITING_SCAN);
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('Error in polling:', error);
          setErrorMessage('Login polling failed');
          cleanupPolling();
        }
      }, 3000);
      pollingIntervalRef.current = interval;
    } catch (error) {
      console.error('Error during QR code login:', error);
      message.error(error instanceof Error ? error.message : 'Login failed');
      setLoginStatus(LoginStatus.INITIAL);
      setErrorMessage('Failed to start QR code login');
      cleanupPolling();
    }
  };


  const handleLogout = async () => {
    try {
      const response = await logout();
      if (response.code === 200) {
        message.success('Logged out successfully');
        dispatch(resetLoginState());
        setLoginStatus(LoginStatus.INITIAL);
        localStorage.removeItem('cookie');
      } else {
        message.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Logout failed');
    }
  };

const handleBackgroundClick = (event: React.MouseEvent) => {
  // Check if the click is outside the QR code image container
  if (event.target === event.currentTarget) {
    setLoginStatus(LoginStatus.INITIAL); // Reset to initial state
    setQrImg(''); // Clear the QR image
    cleanupPolling(); // Clear the polling intervals and timeouts
    // 移除 isQRCodeGenerating.current = false
  }
};

const renderQRCodeSection = () => {
  // 只有在等待扫码或生成二维码时才显示二维码区域
  if (loginStatus !== LoginStatus.WAITING_SCAN && loginStatus !== LoginStatus.GENERATING_QR) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={handleBackgroundClick} // Detect click on the background
    >
      <div className="mb-6 h-48 flex items-center justify-center bg-white p-4 rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
        {loginStatus === LoginStatus.GENERATING_QR ? (
          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
            Generating QR Code...
          </div>
        ) : (
          <img 
            src={qrImg} 
            alt="QR Code" 
            className="mx-auto w-48 h-48 object-contain" 
          />
        )}
      </div>
    </div>
  );
};

  if (loginStatus === LoginStatus.LOGGED_IN) {
    return (
      <div className="flex flex-col items-center justify-center ">
        <div className="p-8 rounded-lg shadow-md w-80">
          <div className="flex justify-center flex-row gap-4">
            <button 
              disabled 
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              {userInfo?.nickname}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="p-8 rounded-lg shadow-md w-80">
        {renderQRCodeSection()}
        {errorMessage && (
          <div className="text-red-500 text-center mb-4">
            {errorMessage}
          </div>
        )}
        <button
          onClick={startQRCodeLogin}
          disabled={isQRCodeGenerating.current}
          className="px-4 py-2 bg-blue-500 text-white rounded w-full hover:bg-blue-600"
        >
          {loginStatus === LoginStatus.GENERATING_QR ? 'Generating QR...' : 'Start QR Code Login'}
        </button>
      </div>
    </div>
  );
};

export default Login;
