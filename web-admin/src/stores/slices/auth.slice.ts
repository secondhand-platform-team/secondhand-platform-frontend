import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import http from "../../utils/api";
import type {
  LoginRequest,
  LoginResponse,
  UpdateProfileRequest,
  UserInfo,
  UserProfile,
  UserProfileInfoResponse,
} from "../../types/user.type";

interface AuthState {
  user: UserInfo | null;
  profile: UserProfile | null;
  isAuth: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  isAuth: false,
  loading: false,
  error: null,
};

// Login admin
export const loginAdmin = createAsyncThunk<
  LoginResponse,
  LoginRequest,
  { rejectValue: string }
>("auth/loginAdmin", async (credentials, { rejectWithValue }) => {
  try {
    const response = await http.post("/login/admin", credentials, {
      headers: { "X-Service": "auth" },
    });
    return response as LoginResponse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Đăng nhập thất bại");
  }
});

// Lấy profile hiện tại
export const fetchProfile = createAsyncThunk<
  UserProfileInfoResponse,
  void,
  { rejectValue: string }
>("auth/fetchProfile", async (_, { rejectWithValue }) => {
  try {
    const response = await http.get("/profile", {
      headers: { "X-Service": "auth" },
    });
    return response as UserProfileInfoResponse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Không thể lấy thông tin");
  }
});

// Logout
export const logoutAdmin = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await http.post("/logout", undefined, {
        headers: { "X-Service": "auth" },
      });
    } catch (error: any) {
      return rejectWithValue(error.message || "Đăng xuất thất bại");
    }
  }
);

// Cập nhật thông tin profile
export const updateProfile = createAsyncThunk<
  UserProfileInfoResponse,
  UpdateProfileRequest,
  { rejectValue: string }
>("auth/updateProfile", async (data, { rejectWithValue }) => {
  try {
    const response = await http.put("/profile", data, {
      headers: { "X-Service": "auth" },
    });
    return response as UserProfileInfoResponse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Cập nhật thất bại");
  }
});

// Upload avatar
export const updateAvatar = createAsyncThunk<
  UserProfileInfoResponse,
  File,
  { rejectValue: string }
>("auth/updateAvatar", async (file, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const response = await http.put("/profile/avatar", formData, {
      headers: { "X-Service": "auth" },
      // No Content-Type — browser sets multipart/form-data with boundary automatically
    });
    return response as UserProfileInfoResponse;
  } catch (error: any) {
    return rejectWithValue(error.message || "Upload avatar thất bại");
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    resetAuth(state) {
      state.user = null;
      state.profile = null;
      state.isAuth = false;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.user = action.payload.user;
        state.profile = action.payload.user_profile;
      })
      .addCase(loginAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Đăng nhập thất bại";
      });

    // Fetch profile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.user = action.payload.user;
        state.profile = action.payload.user_profile;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        // Only clear session if we were NOT already authenticated (page refresh case).
        // If user was actively logged in, a transient fetch failure should not log them out.
        if (!state.isAuth) {
          state.user = null;
          state.profile = null;
        }
        state.error = action.payload || "Lỗi lấy thông tin";
      });

    // Logout
    builder
      .addCase(logoutAdmin.fulfilled, (state) => {
        state.user = null;
        state.profile = null;
        state.isAuth = false;
      })
      .addCase(logoutAdmin.rejected, (state) => {
        state.user = null;
        state.profile = null;
        state.isAuth = false;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.profile = action.payload.user_profile;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Cập nhật thất bại";
      });

    // Update avatar
    builder
      .addCase(updateAvatar.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.profile = action.payload.user_profile;
      })
      .addCase(updateAvatar.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Upload avatar thất bại";
      });
  },
});

export const { clearError, resetAuth } = authSlice.actions;
export default authSlice.reducer;
