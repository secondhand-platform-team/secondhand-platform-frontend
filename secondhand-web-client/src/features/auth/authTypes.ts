/**
 * Auth Types
 * Auth feature specific types
 */

import type { User } from '@/types/user';

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User | null;
  token: string;
}

export interface TokenResponse {
  token: string;
  tokenType: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}
