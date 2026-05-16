"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/stores/hooks";
import { useNotifications } from "@/hooks/useNotifications";
import { webSocketService } from "@/services/websocket.service";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const { fetchUnreadCount, addNotification } = useNotifications();

  useEffect(() => {
    const userId = user?.userId;
    if (!userId) return;

    const initializeNotifications = async () => {
      try {
        // Lắng nghe thông báo mới trước khi connect để tránh mất message sớm
        webSocketService.onNotification((notification) => {
          console.log(
            "[NotificationProvider] Received notification:",
            notification,
          );

          // Thêm vào Redux store
          addNotification(notification);

          // Hiển thị Toast notification
          // antdMessage.success({
          //   content: notification.content,
          //   duration: 3,
          // });
        });

        webSocketService.onError((error) => {
          console.warn("[NotificationProvider] WebSocket reconnecting:", error);
        });

        webSocketService.onConnect(() => {
          console.log("[NotificationProvider] WebSocket connected");
        });

        webSocketService.onDisconnect(() => {
          console.log("[NotificationProvider] WebSocket disconnected");
        });

        // Fetch unread count khi load app
        await fetchUnreadCount();

        // Kết nối WebSocket
        await webSocketService.connect(userId);
      } catch (error) {
        console.warn("[NotificationProvider] Initialization retry:", error);
      }
    };

    void initializeNotifications();

    // Cleanup
    return () => {
      void webSocketService.disconnect();
    };
  }, [user?.userId, fetchUnreadCount, addNotification]);

  return <>{children}</>;
}
