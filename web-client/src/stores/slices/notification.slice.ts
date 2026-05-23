import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import http from "@/utils/api";
import type { Notification } from "@/types/notification.type";
import type { NotificationResponse } from "@/types/notification.type";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  totalElements: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  currentPage: 0,
  pageSize: 20,
  totalElements: 0,
};

export const fetchNotifications = createAsyncThunk<
  NotificationResponse,
  { page: number; size: number },
  { rejectValue: string }
>("notification/fetchNotifications", async ({ page, size }, { rejectWithValue }) => {
  try {
    const response = await http.get<NotificationResponse>(
      `/core/api/notifications?page=${page}&size=${size}`,
    );
    return response;
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Lỗi khi tải thông báo",
    );
  }
});

export const fetchUnreadCount = createAsyncThunk<
  number,
  void,
  { rejectValue: string }
>("notification/fetchUnreadCount", async (_, { rejectWithValue }) => {
  try {
    return await http.get<number>("/core/api/notifications/unread-count");
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Lỗi khi lấy số lượng chưa đọc",
    );
  }
});

export const markAsRead = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notification/markAsRead", async (id, { rejectWithValue }) => {
  try {
    await http.put(`/core/api/notifications/${id}/read`);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Không thể đánh dấu đã đọc",
    );
  }
});

export const markAllAsRead = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("notification/markAllAsRead", async (_, { rejectWithValue }) => {
  try {
    await http.put("/core/api/notifications/read-all");
    } catch (error: unknown) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Không thể đánh dấu tất cả đã đọc",
      );
    }
  });

export const deleteNotificationThunk = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("notification/deleteNotification", async (id, { rejectWithValue }) => {
  try {
    await http.delete(`/core/api/notifications/${id}`);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Không thể xóa thông báo",
    );
  }
});

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    // Đặt danh sách thông báo
    setNotifications: (
      state,
      action: PayloadAction<{
        notifications: Notification[];
        totalElements: number;
        page: number;
      }>
    ) => {
      state.notifications = action.payload.notifications;
      state.totalElements = action.payload.totalElements;
      state.currentPage = action.payload.page;
    },

    // Thêm thông báo mới vào đầu (từ WebSocket)
    prependNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload);
      state.totalElements += 1;
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },

    // Cập nhật tổng số chưa đọc
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = action.payload;
    },

    // Tăng số lượng chưa đọc (khi có thông báo mới)
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },

    // Giảm số lượng chưa đọc
    decrementUnreadCount: (state) => {
      if (state.unreadCount > 0) {
        state.unreadCount -= 1;
      }
    },

    // Đánh dấu thông báo là đã đọc
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        if (state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
      }
    },

    // Đánh dấu tất cả là đã đọc
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach((n) => {
        n.isRead = true;
      });
      state.unreadCount = 0;
    },

    // Đặt trạng thái loading
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Đặt lỗi
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Reset notifications
    resetNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.currentPage = 0;
      state.totalElements = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.content;
        state.totalElements = action.payload.totalElements;
        state.currentPage = action.payload.pageable.pageNumber;
        state.pageSize = action.payload.pageable.pageSize;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Lỗi";
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find((n) => n.id === action.payload);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          if (state.unreadCount > 0) state.unreadCount -= 1;
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        const deletedId = action.payload;
        const notification = state.notifications.find((n) => n.id === deletedId);
        if (notification && !notification.isRead && state.unreadCount > 0) {
          state.unreadCount -= 1;
        }
        state.notifications = state.notifications.filter((n) => n.id !== deletedId);
        state.totalElements = Math.max(0, state.totalElements - 1);
      });
  },
});

export const {
  setNotifications,
  prependNotification,
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  setLoading,
  setError,
  resetNotifications,
} = notificationSlice.actions;

export default notificationSlice.reducer;
