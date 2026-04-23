// Types liên quan đến người dùng và xác thực

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  userId: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: boolean;
  freeSellUse: number;
}

export interface UserProfile {
  fullName: string;
  avatarUrl: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  bio: string | null;
}

export interface UserProfileInfoResponse {
  user: UserInfo;
  user_profile: UserProfile;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface LoginResponse {
  user: UserInfo;
  user_profile: UserProfile;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phoneNumber?: string;
  bio?: string;
  gender?: "MALE" | "FEMALE" | "OTHER";
  dateOfBirth?: string; // yyyy-MM-dd
}
