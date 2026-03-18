"use client";

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
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
	authProvider: AuthProvider;
	error: string | null;
};

type RegisterSuccessPayload = {
	message: string;
};

const initialState: AuthState = {
	loading: false,
	isAuth: false,
	user: null,
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
	UserType,
	LoginPayload,
	{ rejectValue: string }
>("auth/loginUser", async (credentials, { rejectWithValue }) => {
	try {
		await http.post<UserProfileApiResponseType>("/auth/api/login/user", credentials);
		const profileResponse = await http.get<UserProfileApiResponseType>("/auth/api/profile");
		return mapProfileResponseToUser(profileResponse);
	} catch (error) {
		return rejectWithValue(getErrorMessage(error, "Đăng nhập thất bại"));
	}
});

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
	"auth/logoutUser",
	async (_, { rejectWithValue }) => {
		try {
			await http.post<{ message?: string }>("/auth/api/logout");
		} catch (error) {
			return rejectWithValue(getErrorMessage(error, "Đăng xuất thất bại"));
		}
	}
);

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
		logoutLocal: (state) => {
			state.loading = false;
			state.isAuth = false;
			state.user = null;
			state.authProvider = null;
			state.error = null;
		},
		clearAuthError: (state) => {
			state.error = null;
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
				state.user = action.payload;
				state.authProvider = "email";
				state.error = null;
			})
			.addCase(loginUser.rejected, (state, action) => {
				state.loading = false;
				state.isAuth = false;
				state.user = null;
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
				state.authProvider = "email";
				state.error = null;
			})
			.addCase(fetchCurrentUser.rejected, (state, action) => {
				state.loading = false;
				state.isAuth = false;
				state.user = null;
				state.authProvider = null;
				state.error = null;
			})
			.addCase(logoutUser.fulfilled, (state) => {
				state.loading = false;
				state.isAuth = false;
				state.user = null;
				state.authProvider = null;
				state.error = null;
			})
			.addCase(logoutUser.rejected, (state, action) => {
				state.error = action.payload || "Đăng xuất thất bại";
			});
	},
});

export const { logoutLocal, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
