"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  loginByQRCode,
  getQRCode,
  getLoginState,
  logout,
  checkQRCodeState,
  getCaptchaCode,
  loginByCaptcha,
} from "@/app/api/login";
import { message, Input, Button, Modal } from "antd";
import { EnterOutlined } from "@ant-design/icons";
import {
  changeLoginState,
  setUserInfo,
  resetLoginState,
} from "@/redux/modules/login/reducer";
import { useAppSelector, useAppDispatch } from "@/hooks/hooks";
import { UserInfo } from "@/redux/modules/types";
import Image from "next/image";

enum LoginStatus {
  INITIAL,
  GENERATING_QR,
  WAITING_SCAN,
  LOGGED_IN,
  CAPTCHA_LOGIN,
}

const Login = () => {
  const dispatch = useAppDispatch();
  const { userInfo } = useAppSelector((state) => state.login);

  const [qrImg, setQrImg] = useState<string>("");
  const [loginStatus, setLoginStatus] = useState<LoginStatus>(
    LoginStatus.INITIAL
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Captcha login state
  const [phone, setPhone] = useState<string>("");
  const [captchaCode, setCaptchaCode] = useState<string>("");
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);
  const [sendCaptchaLoading, setSendCaptchaLoading] = useState<boolean>(false);
  const [sendCaptchaDisabled, setSendCaptchaDisabled] =
    useState<boolean>(false);
  const [sendCaptchaText, setSendCaptchaText] = useState<string>("获取验证码");

  // Using useRef to store timers, preventing re-renders
  const pollingIntervalRef = useRef<NodeJS.Timer | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check existing login state on component mount
  useEffect(() => {
    const storedCookie = localStorage.getItem("cookie");
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
        localStorage.setItem("cookie", cookie);
        const user: UserInfo = {
          id: response.data.profile.userId.toString(),
          nickname: response.data.profile.nickname,
          avatarUrl: response.data.profile.avatarUrl,
        };
        dispatch(setUserInfo(user));
        dispatch(changeLoginState(true));
        setLoginStatus(LoginStatus.LOGGED_IN);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error details:", error);
      message.error("Error checking login status");
      setErrorMessage("Login verification failed");
      return false;
    }
  };

  // Captcha login methods
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/[^\d]/g, ""));
  };

  const handleCaptchaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCaptchaCode(e.target.value);
  };

  const oneMinuteDisabled = () => {
    setSendCaptchaDisabled(true);
    setSendCaptchaText("获取验证码(60)");

    const timer = setTimeout(() => {
      setSendCaptchaDisabled(false);
      setSendCaptchaText("获取验证码");
      clearTimeout(timer);
    }, 60000);
  };

  const handleSendCaptcha = async () => {
    if (phone) {
      setSendCaptchaLoading(true);
      try {
        const res = await getCaptchaCode(parseInt(phone));

        if (res && res.data) {
          message.success("验证码已发送！，请注意查收");
          oneMinuteDisabled();
        }
      } catch (error) {
        message.error("发送验证码失败", error);
      } finally {
        setSendCaptchaLoading(false);
      }
    } else {
      message.error("请输入完整信息");
    }
  };

  const handleCaptchaLogin = async () => {
    if (!phone || !captchaCode) {
      message.error("请输入完整信息");
      return;
    }

    setConfirmLoading(true);

    try {
      // First, check if already logged in
      const loginStateRes = await getLoginState(localStorage.getItem("cookie"));
      if (loginStateRes.data.account) {
        message.error("错误：账号已登录");
        setConfirmLoading(false);
        return;
      }

      // Proceed with login
      const res = await loginByCaptcha({
        phone: parseInt(phone),
        captcha: captchaCode,
      });

      if (res) {
        message.success("登录成功！");
        dispatch(changeLoginState(true));
        setLoginStatus(LoginStatus.LOGGED_IN);

        // Fetch and set user info
        const userInfoRes = await getLoginState(localStorage.getItem("cookie"));
        if (userInfoRes.data.profile) {
          const user: UserInfo = {
            id: userInfoRes.data.profile.userId.toString(),
            nickname: userInfoRes.data.profile.nickname,
            avatarUrl: userInfoRes.data.profile.avatarUrl,
          };
          dispatch(setUserInfo(user));
        }
      }
    } catch (error) {
      message.error("登录失败");
      console.error(error);
    } finally {
      setConfirmLoading(false);
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
        throw new Error("Failed to get QR code key");
      }

      // Get QR code image
      const qrCodeResponse = await getQRCode(key);
      const qrCodeImg = qrCodeResponse?.data?.qrimg;

      if (!qrCodeImg) {
        throw new Error("Failed to generate QR code");
      }

      setQrImg(qrCodeImg);
      setLoginStatus(LoginStatus.WAITING_SCAN);

      // Set up polling timeout
      const timeout = setTimeout(() => {
        message.error("Login timeout. Please try again.");
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
              message.warning("QR code expired");
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
          console.error("Error in polling:", error);
          setErrorMessage("Login polling failed");
          cleanupPolling();
        }
      }, 3000);
      pollingIntervalRef.current = interval;
    } catch (error) {
      console.error("Error during QR code login:", error);
      message.error(error instanceof Error ? error.message : "Login failed");
      setLoginStatus(LoginStatus.INITIAL);
      setErrorMessage("Failed to start QR code login");
      cleanupPolling();
    }
  };

  const handleLogout = async () => {
    try {
      const response = await logout();

      if (response.code == 200) {
        message.success("Logged out successfully");
        dispatch(resetLoginState());
        setLoginStatus(LoginStatus.INITIAL);
        localStorage.removeItem("cookie");
      } else {
        message.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
      message.error("Logout failed");
    }
  };

  const renderQRCodeSection = () => {
    if (
      loginStatus !== LoginStatus.WAITING_SCAN &&
      loginStatus !== LoginStatus.GENERATING_QR
    ) {
      return null;
    }

    return (
      <Modal
        open={true}
        onCancel={() => {
          setLoginStatus(LoginStatus.INITIAL);
          setQrImg("");
          cleanupPolling();
        }}
        footer={null}
        centered
      >
        <div className="flex flex-col items-center justify-center">
          {loginStatus === LoginStatus.GENERATING_QR ? (
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
              正在生成二维码...
            </div>
          ) : (
            <img
              src={qrImg}
              alt="QR Code"
              className="mx-auto w-48 h-48 object-contain"
            />
          )}
          <p className="mt-4 text-center">
            {loginStatus === LoginStatus.GENERATING_QR
              ? "正在生成二维码..."
              : "请使用网易云音乐扫描二维码登录"}
          </p>
        </div>
      </Modal>
    );
  };

  const renderCaptchaLogin = () => {
    return (
      <Modal
        title="手机号验证码登录"
        open={loginStatus === LoginStatus.CAPTCHA_LOGIN}
        onCancel={() => setLoginStatus(LoginStatus.INITIAL)}
        footer={null}
        centered
      >
        <div className="w-full space-y-4">
          <Input
            placeholder="手机号"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={11}
            className="w-full"
          />
          <div className="flex">
            <Input
              placeholder="验证码"
              value={captchaCode}
              onChange={handleCaptchaChange}
              maxLength={4}
              type="password"
              className="flex-grow mr-2"
              addonAfter={
                <Button
                  onClick={handleSendCaptcha}
                  loading={sendCaptchaLoading}
                  disabled={sendCaptchaDisabled}
                  type="text"
                >
                  {sendCaptchaText}
                </Button>
              }
            />
          </div>
          <Button
            onClick={handleCaptchaLogin}
            loading={confirmLoading}
            className="w-full"
            type="primary"
          >
            登录
          </Button>
        </div>
      </Modal>
    );
  };

  if (loginStatus === LoginStatus.LOGGED_IN) {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="p-8 rounded-lg shadow-md w-80">
          <div className="flex justify-center flex-row gap-4">
            <Image
              src={userInfo?.avatarUrl}
              alt="Avatar"
              width={50}
              height={50}
            />
            <button disabled>{userInfo?.nickname}</button>
            <button onClick={handleLogout}>
              <EnterOutlined />
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
        {renderCaptchaLogin()}
        {errorMessage && (
          <div className="text-red-500 text-center mb-4">{errorMessage}</div>
        )}
        <div className="space-y-4">
          <button
            onClick={startQRCodeLogin}
            className="w-full px-4 py-2 rounded bg-gradient-to-r from-blue-500 via-gray-800 to-purple-700 text-white hover:from-blue-600 hover:to-purple-800 disabled:bg-gray-400"
          >
            {loginStatus === LoginStatus.GENERATING_QR
              ? "正在生成二维码..."
              : "扫码登录"}
          </button>
          <button
            onClick={() => setLoginStatus(LoginStatus.CAPTCHA_LOGIN)}
            className="w-full px-4 py-2 rounded bg-gradient-to-r from-green-500 via-gray-800 to-green-700 text-white hover:from-green-600 hover:to-green-800"
          >
            手机号验证码登录
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
