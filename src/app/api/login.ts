import axios from 'axios';
import { QRCodeResponse, LoginStateResponse, CheckQRCodeResponse, LogoutResponse } from '@/redux/modules/types'; 

const BASE_URL = 'https://neteasecloudmusicapi-ashen-gamma.vercel.app';

// Function to get login state
export const getLoginState = async (cookie: string): Promise<LoginStateResponse> => {
  try {
    const response = await axios.get<LoginStateResponse>(`${BASE_URL}/login/status?timestamp=${Date.now()}`, {
      params: {
        cookie: cookie,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error checking login state:', error);
    throw new Error('Error checking login state');
  }
};

// Function to request a QR code for login
export const loginByQRCode = async (): Promise<QRCodeResponse> => {
  try {
    const response = await axios.get<QRCodeResponse>(`${BASE_URL}/login/qr/key`);
    return response.data;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Error generating QR code');
  }
};

// Function to get the QR code image
export const getQRCode = async (key: string): Promise<QRCodeResponse> => {
  try {
    const response = await axios.get<QRCodeResponse>(
      `${BASE_URL}/login/qr/create`, {
        params: {
          key,
          qrimg: true,
          timestamp: Date.now()
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching QR code image:', error);
    throw new Error('Error fetching QR code image');
  }
};

// Function to check QR code status
export const checkQRCodeState = async (key: string): Promise<CheckQRCodeResponse> => {
  try {
    const response = await axios.get<CheckQRCodeResponse>(
      `${BASE_URL}/login/qr/check`, {
        params: {
          key,
          timestamp: Date.now()
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error checking QR code status:', error);
    throw new Error('Error checking QR code status');
  }
};

// Function to handle logout
export const logout = async (): Promise<LogoutResponse> => {
  try {
    const response = await axios.post<LogoutResponse>('/api/logout');
    return response.data;
  } catch (error) {
    console.error('Error logging out:', error);
    throw new Error('Error logging out');
  }
};