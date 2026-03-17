"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";
import http from "@/utils/api";
import type {
	LoginPayload,
	RegisterPayload,
	UserProfileApiResponseType,
	UserType,
} from "@/types/user.type";

type AuthProvider = "email" | null;

type AuthState = {
	loading: boolean;
	isAuth: boolean;
	user: UserType | null;
	accessToken: string | null;
	authProvider: AuthProvider;
	error: string | null;
};

type AuthResponse = {
	accessToken: string;
	tokenType: string;
};

type AuthSuccessPayload = {
	accessToken: string;
	user: UserType;
};

type RegisterSuccessPayload = {
	message: string;
};

const initialState: AuthState = {
	loading: false,
	isAuth: false,
	user: null,
	accessToken: null,
	authProvider: null,
	error: null,
};

const getErrorMessage = (error: unknown, fallback: string) => {
	if (error instanceof Error && error.message) {
		return error.message;
	}

	return fallback;
};

const mapProfileResponseToUser = (profileResponse: UserProfileApiResponseType): UserType => ({
	userId: profileResponse.user.userId,
	email: profileResponse.user.email,
	phoneNumber: profileResponse.user.phoneNumber,
	role: profileResponse.user.role,
	status: profileResponse.user.status,
	fullName: profileResponse.user_profile?.fullName,
	avatarUrl: profileResponse.user_profile?.avatarUrl,
});

export const fetchCurrentUser = createAsyncThunk<
	UserType,
	void,
	{ rejectValue: string }
>("auth/fetchCurrentUser", async (_, { rejectWithValue }) => {
	try {
		const profileResponse = await http.get<UserProfileApiResponseType>("/auth/api/profile");
		return mapProfileResponseToUser(profileResponse);
	} catch (error) {
		return rejectWithValue(getErrorMessage(error, "Không thể tải thông tin người dùng"));
	}
});

export const loginUser = createAsyncThunk<
	AuthSuccessPayload,
	LoginPayload,
	{ rejectValue: string }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
	try {
		const response = await http.post<AuthResponse>("/auth/api/login/user", credentials);
		http.setAccessToken(response.accessToken);
		const profileResponse = await http.get<UserProfileApiResponseType>("/auth/api/profile");
		const user = mapProfileResponseToUser(profileResponse);

		return {
			accessToken: response.accessToken,
			user,
		};
	} catch (error) {
		http.setAccessToken(null);
		return rejectWithValue(getErrorMessage(error, "Đăng nhập thất bại"));
	}
});

export const registerUser = createAsyncThunk<
	RegisterSuccessPayload,
	RegisterPayload,
	{ rejectValue: string }
>("auth/registerUser", async (payload, { rejectWithValue }) => {
	try {
		const response = await http.post<{ message?: string }>("/auth/api/register/user", payload, {
			timeoutMs: 60000,
		});

		return {
			message: response?.message || "Đăng ký thành công",
		};
	} catch (error) {
		return rejectWithValue(getErrorMessage(error, "Đăng ký thất bại"));
	}
});

export const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		logout: (state) => {
			state.loading = false;
			state.isAuth = false;
			state.user = null;
			state.accessToken = null;
			state.authProvider = null;
			state.error = null;
			http.setAccessToken(null);
			Cookies.remove("authProvider");
		},
		clearAuthError: (state) => {
			state.error = null;
		},
		hydrateAccessToken: (state, action: { payload: string | null }) => {
			state.accessToken = action.payload;
			state.isAuth = Boolean(action.payload);
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(loginUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(loginUser.fulfilled, (state, action) => {
				state.loading = false;
				state.isAuth = true;
				state.accessToken = action.payload.accessToken;
				state.user = action.payload.user;
				state.authProvider = "email";
				state.error = null;
				Cookies.set("authProvider", "email", { expires: 7 });
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.loading = false;
				state.isAuth = false;
				state.user = null;
				state.accessToken = null;
				state.authProvider = null;
				state.error = action.payload || "Đăng nhập thất bại";
			})
			.addCase(registerUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(registerUser.fulfilled, (state, action) => {
				state.loading = false;
				state.error = null;
			})
			.addCase(registerUser.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload || "Đăng ký thất bại";
			})
			.addCase(fetchCurrentUser.pending, (state) => {
				state.loading = true;
				state.error = null;
			})
			.addCase(fetchCurrentUser.fulfilled, (state, action) => {
				state.loading = false;
				state.isAuth = true;
				state.user = action.payload;
				state.error = null;
			})
			.addCase(fetchCurrentUser.rejected, (state, action) => {
				state.loading = false;
				state.isAuth = false;
				state.user = null;
				state.accessToken = null;
				state.authProvider = null;
				state.error = action.payload || "Phiên đăng nhập đã hết hạn";
				http.setAccessToken(null);
				Cookies.remove("authProvider");
			});
	},
});

export const { logout, clearAuthError, hydrateAccessToken } = authSlice.actions;
export default authSlice.reducer;
