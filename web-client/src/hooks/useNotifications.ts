import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  prependNotification,
  fetchNotifications as fetchNotificationsThunk,
  fetchUnreadCount as fetchUnreadCountThunk,
  markAsRead as markAsReadThunk,
  markAllAsRead as markAllAsReadThunk,
  deleteNotificationThunk,
} from "@/stores/slices/notification.slice";
import type { Notification } from "@/types/notification.type";

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notification.notifications);
  const unreadCount = useAppSelector((state) => state.notification.unreadCount);
  const loading = useAppSelector((state) => state.notification.loading);
  const error = useAppSelector((state) => state.notification.error);

  /**
   * Fetch danh sách thông báo
   */
  const fetchNotifications = useCallback(
    async (page: number = 0, size: number = 20) => {
      try {
        await dispatch(fetchNotificationsThunk({ page, size })).unwrap();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Lỗi khi tải thông báo";
        console.error("[useNotifications] Fetch error:", err);
        throw new Error(errorMsg);
      }
    },
    [dispatch],
  );

  /**
   * Fetch số lượng chưa đọc
   */
  const fetchUnreadCount = useCallback(async () => {
    try {
      await dispatch(fetchUnreadCountThunk()).unwrap();
    } catch (err) {
      console.error("[useNotifications] Fetch unread count error:", err);
    }
  }, [dispatch]);

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  const markAsRead = useCallback(
    async (id: string) => {
      try {
        await dispatch(markAsReadThunk(id)).unwrap();
      } catch (err) {
        console.error("[useNotifications] Mark as read error:", err);
      }
    },
    [dispatch],
  );

  /**
   * Đánh dấu tất cả là đã đọc
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await dispatch(markAllAsReadThunk()).unwrap();
    } catch (err) {
      console.error("[useNotifications] Mark all as read error:", err);
    }
  }, [dispatch]);

  /**
   * Thêm thông báo mới (từ WebSocket)
   */
  const addNotification = useCallback(
    (notification: Notification) => {
      dispatch(prependNotification(notification));
    },
    [dispatch],
  );

  /**
   * Xóa thông báo
   */
  const deleteNotification = useCallback(
    async (id: string) => {
      try {
        await dispatch(deleteNotificationThunk(id)).unwrap();
      } catch (err) {
        console.error("[useNotifications] Delete notification error:", err);
      }
    },
    [dispatch],
  );

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    deleteNotification,
  };
};
