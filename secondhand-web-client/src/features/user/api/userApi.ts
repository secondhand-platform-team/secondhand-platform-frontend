/**
 * User API
 * API calls for user operations
 */

import axiosClient from '@/api/axiosClient';
import type { User } from '@/types/user';
import type { UpdateProfilePayload } from '../userTypes';
import type { ApiResponse } from '@/types/apiResponse';

export const userApi = {
  /**
   * Get user profile by ID
   */
  getUserProfile: async (userId: string): Promise<ApiResponse<User>> => {
    const response = await axiosClient.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfilePayload): Promise<ApiResponse<User>> => {
    const response = await axiosClient.put('/users/profile', data);
    return response.data;
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    const response = await axiosClient.post('/users/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Upload avatar
   */
  uploadAvatar: async (file: File): Promise<ApiResponse<{ url: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get user by username
   */
  getUserByUsername: async (username: string): Promise<ApiResponse<User>> => {
    const response = await axiosClient.get(`/users/username/${username}`);
    return response.data;
  },
};
