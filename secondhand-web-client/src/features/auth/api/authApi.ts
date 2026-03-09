/**
 * Auth API
 * API calls for authentication
 */

import axiosClient from '@/api/axiosClient';
import type { LoginPayload, RegisterPayload, TokenResponse } from '../authTypes';
import type { ApiResponse } from '@/types/apiResponse';
import type { User } from '@/types/user';

export const authApi = {
  /**
   * Login with email and password
   */
  login: async (credentials: LoginPayload): Promise<TokenResponse> => {
    const response = await axiosClient.post('/auth/api/auth/login', credentials);
    console.log('Axios full response:', response);
    console.log('Axios response.data:', response.data);
    console.log('Axios response.data type:', typeof response.data);
    console.log('Axios response.data keys:', Object.keys(response.data || {}));
    return response.data;
  },

  /**
   * Register a new user
   */
  register: async (data: RegisterPayload): Promise<TokenResponse> => {
    const response = await axiosClient.post('/auth/api/auth/register', data);
    return response.data;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    await axiosClient.post('/auth/logout');
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await axiosClient.get('/auth/api/auth/me');
    return response.data;
  },

  /**
   * Refresh access token
   */
  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ token: string }>> => {
    const response = await axiosClient.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await axiosClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password
   */
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse> => {
    const response = await axiosClient.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};
