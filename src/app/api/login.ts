// loginApi.ts
import { apiClient, handleApiCall } from './axiosConfig';
import { 
  QRCodeResponse, 
  LoginStateResponse, 
  CheckQRCodeResponse, 
  LogoutResponse,
} from '@/redux/modules/types';

export const getLoginState = async (cookie: string): Promise<LoginStateResponse> => {
  return handleApiCall(() => 
    apiClient.get('/login/status', { params: { cookie } })
  );
};

export const loginByQRCode = async (): Promise<QRCodeResponse> => {
  return handleApiCall(() => apiClient.get('/login/qr/key'));
};

export const getQRCode = async (key: string): Promise<QRCodeResponse> => {
  return handleApiCall(() => 
    apiClient.get('/login/qr/create', { params: { key, qrimg: true } })
  );
};

export const checkQRCodeState = async (key: string): Promise<CheckQRCodeResponse> => {
  return handleApiCall(() => 
    apiClient.get('/login/qr/check', { params: { key } })
  );
};

export const logout = async (): Promise<LogoutResponse> => {
  return handleApiCall(() => apiClient.post('/logout'));
};

export const loginByCaptcha = async (data: { phone: number, captcha: string }): Promise<any> => {
  return handleApiCall(() => 
    apiClient.post('/login/cellphone', null, {
      params: { phone: data.phone, captcha: data.captcha }
    })
  );
};

export const getCaptchaCode = async (phone: number) => {
  return handleApiCall(() => 
    apiClient.get('/captcha/sent', { params: { phone } })
  );
};