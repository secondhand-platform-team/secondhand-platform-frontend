"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "@/stores/hooks";
import { useNotifications } from "@/hooks/useNotifications";
import { webSocketService, chatSocketService } from "@/services/websocket.service";
import { fetchMyConversations, setConnected } from "@/stores/slices/chat.slice";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const { fetchUnreadCount, addNotification } = useNotifications();
  const chatConversationUnsubRef = useRef<(() => void) | null>(null);

  // Kết nối chat socket toàn cục để nhận thông báo tin nhắn mới
  const connectChatSocketGlobally = useCallback(
    (userId: string) => {
      chatSocketService.setCurrentUserId(userId);
      chatSocketService.connect(
        () => {
          console.log("[NotificationProvider] Chat socket connected globally");
          dispatch(setConnected(true));

          // Subscribe vào topic user conversations để nhận event tin nhắn mới
          if (chatConversationUnsubRef.current) {
            chatConversationUnsubRef.current();
          }
          chatConversationUnsubRef.current =
            chatSocketService.subscribeUserConversations(userId, () => {
              // Khi có tin nhắn mới, refresh danh sách hội thoại (cập nhật unread count)
              dispatch(fetchMyConversations());
            });
        },
        (error) => {
          console.warn(
            "[NotificationProvider] Chat socket connection error:",
            error,
          );
          dispatch(setConnected(false));
        },
      );
    },
    [dispatch],
  );

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

        // Kết nối WebSocket notification
        await webSocketService.connect(userId);

        // Kết nối WebSocket chat toàn cục
        connectChatSocketGlobally(userId);
      } catch (error) {
        console.warn("[NotificationProvider] Initialization retry:", error);
      }
    };

    void initializeNotifications();

    // Cleanup
    return () => {
      void webSocketService.disconnect();
      if (chatConversationUnsubRef.current) {
        chatConversationUnsubRef.current();
        chatConversationUnsubRef.current = null;
      }
      chatSocketService.disconnect();
      dispatch(setConnected(false));
    };
  }, [user?.userId, fetchUnreadCount, addNotification, connectChatSocketGlobally]);

  return <>{children}</>;
}

