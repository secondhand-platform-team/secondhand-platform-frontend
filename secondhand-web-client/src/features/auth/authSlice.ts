/**
 * Auth Slice
 * Redux Toolkit slice for authentication state management
 */

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import type { AuthState, LoginPayload, RegisterPayload, LoginResponse } from './authTypes';
import  type { User } from '@/types/user';

const initialState: AuthState = {
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  token: localStorage.getItem('access_token'),
  loading: false,
  error: null,
  isAuthenticated: !!localStorage.getItem('access_token'),
};

/**
 * Async Thunk - Login
 */
export const login = createAsyncThunk<
  LoginResponse,
  LoginPayload,
  { rejectValue: string }
>('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authApi.login(credentials);

    const token = response.accessToken;

    if (!token) {
      return rejectWithValue('Token missing');
    }

    localStorage.setItem('access_token', token);

    // Return immediately with token, user will be fetched on-demand
    return { token, user: null };

  } catch (error: unknown) {
    let message = 'Login failed';
    if (error instanceof Error) {
      message = error.message;
    }
    return rejectWithValue(message);
  }
});
/**
 * Async Thunk - Register
 */
export const register = createAsyncThunk<
  LoginResponse,
  RegisterPayload,
  {
    rejectValue: string;
  }
>('auth/register', async (data, { rejectWithValue }) => {
  try {
    const response = await authApi.register(data);
    const token = response.token;
    
    if (!token) {
      return rejectWithValue('Invalid response format: missing token');
    }
    
    localStorage.setItem('access_token', token);
    
    // Return immediately with token, user will be fetched on-demand
    return { user: null, token };
  } catch (error: unknown) {
    let message = 'Registration failed. Please try again.';
    if (error instanceof Error) {
      message = error.message;
    }
    return rejectWithValue(message);
  }
});

/**
 * Async Thunk - Get Current User
 */
export const getCurrentUser = createAsyncThunk<
  User,
  void,
  {
    rejectValue: string;
  }
>('auth/getCurrentUser', async (_, { rejectWithValue }) => {
  try {
    const response = await authApi.getCurrentUser();
    if (response) {
      localStorage.setItem('user', JSON.stringify(response));
      return response;
    }
    return rejectWithValue('Failed to fetch user profile.');
  } catch (error: unknown) {
    let message = 'Failed to fetch user profile.';
    if (error instanceof Error) {
      message = error.message;
    }
    return rejectWithValue(message);
  }
});

/**
 * Async Thunk - Logout
 */
export const logout = createAsyncThunk<
  void,
  void,
  {
    rejectValue: string;
  }
>('auth/logout', async (_, { rejectWithValue }) => {
  try {
    // await authApi.logout();
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  } catch (error: unknown) {
    let message = 'Logout failed.';
    if (error instanceof Error) {
      message = error.message;
    }
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Clear error message
     */
    clearError: (state) => {
      state.error = null;
    },

    /**
     * Set user manually (useful for token refresh)
     */
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },

    /**
     * Set token manually
     */
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', action.payload);
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed';
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed';
        state.isAuthenticated = false;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch user';
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.loading = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.error = action.payload || 'Logout failed';
      });
  },
});

export const { clearError, setUser, setToken } = authSlice.actions;
export default authSlice.reducer;
