import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
  prependNotification,
  fetchNotifications as fetchNotificationsThunk,
  fetchUnreadCount as fetchUnreadCountThunk,
  markAsRead as markAsReadThunk,
  markAllAsRead as markAllAsReadThunk,
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
  const fetchNotifications = async (page: number = 0, size: number = 20) => {
    try {
      await dispatch(fetchNotificationsThunk({ page, size })).unwrap();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Lỗi khi tải thông báo";
      console.error("[useNotifications] Fetch error:", err);
      throw new Error(errorMsg);
    }
  };

  /**
   * Fetch số lượng chưa đọc
   */
  const fetchUnreadCount = async () => {
    try {
      await dispatch(fetchUnreadCountThunk()).unwrap();
    } catch (err) {
      console.error("[useNotifications] Fetch unread count error:", err);
    }
  };

  /**
   * Đánh dấu 1 thông báo là đã đọc
   */
  const markAsRead = async (id: string) => {
    try {
      await dispatch(markAsReadThunk(id)).unwrap();
    } catch (err) {
      console.error("[useNotifications] Mark as read error:", err);
    }
  };

  /**
   * Đánh dấu tất cả là đã đọc
   */
  const markAllAsRead = async () => {
    try {
      await dispatch(markAllAsReadThunk()).unwrap();
    } catch (err) {
      console.error("[useNotifications] Mark all as read error:", err);
    }
  };

  /**
   * Thêm thông báo mới (từ WebSocket)
   */
  const addNotification = (notification: Notification) => {
    dispatch(prependNotification(notification));
  };

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
  };
};
