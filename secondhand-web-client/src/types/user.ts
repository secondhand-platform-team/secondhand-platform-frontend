/**
 * User Types
 * User entity and auth related types
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}
