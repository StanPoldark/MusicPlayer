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
import "./index.scss"

enum LoginStatus {
  INITIAL,
  GENERATING_QR,
  WAITING_SCAN,
  LOGGED_IN,
  CAPTCHA_LOGIN,
}

// 登录组件
const Login = () => {
  // 获取dispatch和userInfo
  const dispatch = useAppDispatch();
  const { userInfo } = useAppSelector((state) => state.login);

  // 设置二维码图片、登录状态和错误信息
  const [qrImg, setQrImg] = useState<string>(""); // 二维码图片
  const [loginStatus, setLoginStatus] = useState<LoginStatus>(
    LoginStatus.INITIAL
  ); // 登录状态
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // 错误信息

  // Captcha登录状态
  const [phone, setPhone] = useState<string>(""); // 手机号
  const [captchaCode, setCaptchaCode] = useState<string>(""); // 验证码
  const [confirmLoading, setConfirmLoading] = useState<boolean>(false); // 确认按钮加载状态
  const [sendCaptchaLoading, setSendCaptchaLoading] = useState<boolean>(false); // 发送验证码按钮加载状态
  const [sendCaptchaDisabled, setSendCaptchaDisabled] =
    useState<boolean>(false); // 发送验证码按钮禁用状态
  const [sendCaptchaText, setSendCaptchaText] = useState<string>("获取验证码"); // 发送验证码按钮文本

  // 使用useRef存储定时器，防止重新渲染
  const pollingIntervalRef = useRef<NodeJS.Timer | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // 清理轮询函数
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

  // 组件卸载时清理轮询
  useEffect(() => {
    if(localStorage.getItem("cookie"))     checkLoginStatus(localStorage.getItem("cookie") as string);

    return () => {
      cleanupPolling();
    };
  }, [cleanupPolling]);

  // 检查登录状态
  const checkLoginStatus = useCallback(async (cookie: string): Promise<boolean> => {
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
      message.error("Error checking login status", error);
      setErrorMessage("Login verification failed");
      return false;
    }
  }, [dispatch]);
  
  // Captcha登录方法
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
      // 首先检查是否已登录
      const loginStateRes = await getLoginState(localStorage.getItem("cookie"));
      if (loginStateRes.data.account) {
        message.error("错误：账号已登录");
        setConfirmLoading(false);
        return;
      }

      // 进行登录
      const res = await loginByCaptcha({
        phone: parseInt(phone),
        captcha: captchaCode,
      });

      if (res) {
        message.success("登录成功！");
        dispatch(changeLoginState(true));
        setLoginStatus(LoginStatus.LOGGED_IN);

        // 获取并设置用户信息
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
      message.error("登录失败",error);
    } finally {
      setConfirmLoading(false);
    }
  };

  // 开始二维码登录
  const startQRCodeLogin = async () => {
    setLoginStatus(LoginStatus.GENERATING_QR);
    setErrorMessage(null);
    cleanupPolling();

    try {
      // 获取二维码key
      const keyResponse = await loginByQRCode();
      const key = keyResponse?.data?.unikey;

      if (!key) {
        throw new Error("Failed to get QR code key");
      }

      // 获取二维码图片
      const qrCodeResponse = await getQRCode(key);
      const qrCodeImg = qrCodeResponse?.data?.qrimg;

      if (!qrCodeImg) {
        throw new Error("Failed to generate QR code");
      }

      setQrImg(qrCodeImg);
      setLoginStatus(LoginStatus.WAITING_SCAN);

      // 设置轮询超时
      const timeout = setTimeout(() => {
        message.error("Login timeout. Please try again.");
        setLoginStatus(LoginStatus.INITIAL);
        cleanupPolling();
      }, 300000); // 5 minutes
      pollingTimeoutRef.current = timeout;

      // 设置轮询间隔
      const interval = setInterval(async () => {
        try {
          const response = await checkQRCodeState(key);
          switch (response.code) {
            case 803: // 授权
              await checkLoginStatus(response.cookie!);
              cleanupPolling();
              break;
            case 800: // 二维码过期
              message.warning("QR code expired");
              setLoginStatus(LoginStatus.INITIAL);
              cleanupPolling();
              break;
            case 801: // 等待扫描
              setLoginStatus(LoginStatus.WAITING_SCAN);
              break;
            default:
              break;
          }
        } catch (error) {
          setErrorMessage(error);
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

  // 退出登录
  const handleLogout = async () => {
    try {
      const response = await logout();
  
      if (response.code === 200) {  // 注意这里用 === 而不是 ==
        localStorage.removeItem("cookie");
        dispatch(resetLoginState());
        setLoginStatus(LoginStatus.INITIAL);
      } 
    } catch (error) {
      // 修改这里的错误处理
      const errorMessage = error instanceof Error ? error.message : "Logout failed";
      message.error(errorMessage);
    }
  };
  // 渲染二维码登录部分
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

  // 渲染Captcha登录
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
              addonAfter={(
                <Button
                  onClick={handleSendCaptcha}
                  loading={sendCaptchaLoading}
                  disabled={sendCaptchaDisabled}
                  type="text"
                >
                  {sendCaptchaText}
                </Button>
              )}
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

  // 如果已登录，渲染用户信息
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

  // 渲染登录按钮
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="">
        {renderQRCodeSection()}
        {renderCaptchaLogin()}
        {errorMessage && (
          <div className="text-red-500 text-center mb-4">{errorMessage}</div>
        )}
        <div className="space-y-4 text-center">
          <button
            onClick={startQRCodeLogin}
            className="Lbutton"  style={{width: '14rem',marginBottom: '0',padding:'20px'}}
          >
            {loginStatus === LoginStatus.GENERATING_QR
              ? <span>正在生成二维码...</span>
              : <span>扫码登录</span>}
          </button>
          {/*<button
            onClick={() => setLoginStatus(LoginStatus.CAPTCHA_LOGIN)}
            className="button"  style={{width: '15rem', marginBottom: '20px',padding:'20px',height:'2rem'}}
          >
            <span>手机号验证码登录</span>
            
          </button>*/}
        </div>
      </div>
    </div>
  );
};

export default Login;
