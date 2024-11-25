"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { loginByQRCode, getQRCode, getLoginState, logout, checkQRCodeState } from '@/app/api/login';
import { message } from 'antd';
import { toggleLoginModal, changeLoginState, setUserInfo, toggleLogoutModal, resetLoginState } from '@/redux/modules/login/reducer'
import { useAppSelector, useAppDispatch } from '@/hooks/hooks';
import { UserInfo } from '@/redux/modules/types';

const Login = () => {
    const [qrImg, setQrImg] = useState<string>('');
    const dispatch = useAppDispatch();
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
    const { isLogin, userInfo, showLogoutModal, } = useAppSelector(state => state.login);
    // Using useRef to store timers, preventing re-renders
    const pollingIntervalRef = useRef<NodeJS.Timer | null>(null);
    const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup function for polling
    const cleanupPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current as unknown as number); // Cast to `number`
            pollingIntervalRef.current = null;
        }
        if (pollingTimeoutRef.current) {
            clearTimeout(pollingTimeoutRef.current as unknown as number); // Cast to `number`
            pollingTimeoutRef.current = null;
        }
    }, []);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            cleanupPolling();
        };
    }, [cleanupPolling]);


    useEffect(() => {
        if (userInfo?.id) {

        }
    }, [userInfo]);


    const checkLoginStatus = async (cookie: string): Promise<boolean> => {
        try {
            const response = await getLoginState(cookie);
            
            if (response.data.code == 200) {

                localStorage.setItem('cookie', cookie);
                const user: UserInfo = {
                    id: response.data.profile.userId.toString(),
                    nickname: response.data.profile.nickname,
                    avatarUrl: response.data.profile.avatarUrl
                }
                dispatch(setUserInfo(user));
                dispatch(toggleLogoutModal(true))
                return true;
            }
    
            return false;
        } catch (error) {
            console.error('Error details:', error);
            message.error('Error checking login status');
            return false;
        }
    };
    
    const startQRCodeLogin = async () => {
        setIsLoggingIn(true);
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

            // Set up polling timeout
            const timeout = setTimeout(() => {
                message.error('Login timeout. Please try again.');
                setIsLoggingIn(false);
                cleanupPolling();
            }, 300000); // 5 minutes
            pollingTimeoutRef.current = timeout;

            // Set up polling interval
            const interval = setInterval(async () => {
                try {
                    const response = await checkQRCodeState(key);
                    if (response.code === 803) {
                        checkLoginStatus(response.cookie!);
                        cleanupPolling();

                    }

                } catch (error) {
                    console.error('Error in polling:', error);
                }
            }, 3000);
            pollingIntervalRef.current = interval;

        } catch (error) {
            console.error('Error during QR code login:', error);
            message.error(error instanceof Error ? error.message : 'Login failed');
            setIsLoggingIn(false);
            cleanupPolling();
        }
    };

    const handleLogout = async () => {
        try {
            const response = await logout();
            if (response.code === 200) {
                message.success('Logged out successfully');
            } else {
                message.error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
            message.error('Logout failed');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Login via QR Code</h2>
                <div className="mb-6">
                    {qrImg ? (
                        <img src={qrImg} alt="QR Code" className="mx-auto w-48 h-48" />
                    ) : (
                        <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
                            Waiting for QR code...
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-4">
                    {!showLogoutModal ? (
                            <button
                                onClick={startQRCodeLogin}
                                disabled={isLoggingIn}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                            >
                                {isLoggingIn ? 'Generating QR Code...' : 'Login via QR Code'}
                            </button>
                    ):(
                        <button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
                            >
                                {userInfo?.nickname}
                            </button>
                    )
                    }

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
};

export default Login;
