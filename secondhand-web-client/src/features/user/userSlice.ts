/**
 * User Slice
 * Redux Toolkit slice for user state management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userApi } from './api/userApi';
import type { UserState, UpdateProfilePayload } from './userTypes';
import type { User } from '@/types/user';

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
  updateSuccess: false,
};

/**
 * Async Thunk - Get User Profile
 */
export const getUserProfile = createAsyncThunk<
  User,
  string,
  {
    rejectValue: string;
  }
>('user/getProfile', async (userId, { rejectWithValue }) => {
  try {
    const response = await userApi.getUserProfile(userId);
    if (response.data) {
      return response.data;
    }
    return rejectWithValue(response.message);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Failed to fetch user profile.'
    );
  }
});

/**
 * Async Thunk - Update User Profile
 */
export const updateUserProfile = createAsyncThunk<
  User,
  UpdateProfilePayload,
  {
    rejectValue: string;
  }
>('user/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const response = await userApi.updateProfile(data);
    if (response.data) {
      return response.data;
    }
    return rejectWithValue(response.message);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || 'Failed to update profile.'
    );
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetUpdateSuccess: (state) => {
      state.updateSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Get Profile
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load profile';
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.updateSuccess = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.error = null;
        state.updateSuccess = true;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update profile';
        state.updateSuccess = false;
      });
  },
});

export const { clearError, resetUpdateSuccess } = userSlice.actions;
export default userSlice.reducer;
