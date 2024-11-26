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
      setLoginStatus(LoginStatus.WAITING_SCAN);

      // Set up polling timeout
      const timeout = setTimeout(() => {
        message.error('Login timeout. Please try again.');
        setLoginStatus(LoginStatus.INITIAL);
        cleanupPolling();
      }, 300000); // 5 minutes
      pollingTimeoutRef.current = timeout;

      // Set up polling interval
      const interval = setInterval(async () => {
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

  // 仅在未登录时显示 Login via QR Code
  const renderLoginButton = () => {
    switch (loginStatus) {
      case LoginStatus.INITIAL:
        return (
          <button
            onClick={startQRCodeLogin}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Login via QR Code
          </button>
        );
      
      case LoginStatus.GENERATING_QR:
        return (
          <button 
            disabled 
            className="px-4 py-2 bg-gray-400 text-white rounded"
          >
            Generating QR Code...
          </button>
        );
      
      case LoginStatus.WAITING_SCAN:
        return (
          <button 
            disabled 
            className="px-4 py-2 bg-yellow-500 text-white rounded"
          >
            Waiting for Scan
          </button>
        );
      
      default:
        return null; // 登录成功后不显示按钮
    }
  };

  // 仅在未登录时显示 QR 码
  const renderQRCodeSection = () => {
    if (loginStatus === LoginStatus.LOGGED_IN) {
      return null;
    }

    return (
      <div className="mb-6 h-48 flex items-center justify-center">
        {loginStatus === LoginStatus.WAITING_SCAN && qrImg ? (
          <img 
            src={qrImg} 
            alt="QR Code" 
            className="mx-auto w-48 h-48 object-contain" 
          />
        ) : (
          <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
            {loginStatus === LoginStatus.INITIAL 
              ? '' 
              : 'Generating QR Code...'}
          </div>
        )}
      </div>
    );
  };

  // 如果已登录，只显示用户信息和登出按钮
  if (loginStatus === LoginStatus.LOGGED_IN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md w-80">
          <h2 className="text-2xl font-bold mb-6 text-center">Welcome, {userInfo?.nickname}</h2>
          <div className="flex flex-col gap-4">
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

  // 未登录时的默认渲染
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-80">
        
        {renderQRCodeSection()}

        {errorMessage && (
          <div className="text-red-500 text-center mb-4">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {renderLoginButton()}
        </div>
      </div>
    </div>
  );
};

export default Login;