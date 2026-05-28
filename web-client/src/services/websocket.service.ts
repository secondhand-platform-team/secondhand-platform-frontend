import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { Notification } from "@/types/notification.type";
import type { ChatMessageSocketResponse, SendChatMessagePayload } from "@/types/message.type";
import envConfig from "@/config";

interface WebSocketCallback {
  onNotification?: (notification: Notification) => void;
  onError?: (error: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

class WebSocketService {
  private client: Client | null = null;
  private callbacks: WebSocketCallback = {};
  private userId: string | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor() {
    this.client = null;
  }

  /**
   * Kết nối WebSocket
   * Endpoint: http://localhost:8000/core/ws-notification (SockJS)
   * Topic: /topic/notifications/{userId}
   */
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client && this.client.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Đang kết nối, chờ một lúc rồi retry
        setTimeout(() => this.connect(userId).then(resolve).catch(reject), 500);
        return;
      }

      this.isConnecting = true;
      this.userId = userId;

      try {
        const baseUrl = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/+$/, "");
        const socketUrl = `${baseUrl}/core/ws-notification`;

        this.client = new Client({
          webSocketFactory: () => new SockJS(socketUrl),
          reconnectDelay: this.reconnectDelay,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        this.client.onConnect = (frame) => {
          console.log("[WebSocket] Connected:", frame);
          this.reconnectAttempts = 0;
          this.isConnecting = false;

          // Subscribe vào topic notifications của user
          this.client!.subscribe(
            `/topic/notifications/${userId}`,
            (message: IMessage) => {
              try {
                const notification: Notification = JSON.parse(message.body);
                console.log("[WebSocket] Received notification:", notification);
                this.callbacks.onNotification?.(notification);
              } catch (error) {
                console.error("[WebSocket] Error parsing notification:", error);
              }
            }
          );

          this.callbacks.onConnect?.();
        };

        this.client.onStompError = (frame) => {
          console.error("[WebSocket] STOMP error:", frame);
          this.isConnecting = false;
          this.callbacks.onError?.(frame);
        };

        this.client.onWebSocketError = (error) => {
          console.error("[WebSocket] WebSocket error:", error);
          this.isConnecting = false;
          this.callbacks.onError?.(error);
        };

        this.client.onWebSocketClose = () => {
          this.isConnecting = false;
          this.callbacks.onDisconnect?.();
        };

        this.client.activate();
        resolve();
      } catch (error) {
        console.error("[WebSocket] Connection error:", error);
        this.isConnecting = false;
        this.callbacks.onError?.(error);
        reject(error);
      }
    });
  }

  /**
   * Ngắt kết nối WebSocket
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.client) {
        this.client.deactivate();
        this.client = null;
        this.userId = null;
      }
      this.callbacks.onDisconnect?.();
      resolve();
    });
  }

  /**
   * Đăng ký callback khi nhận thông báo
   */
  onNotification(callback: (notification: Notification) => void): void {
    this.callbacks.onNotification = callback;
  }

  /**
   * Đăng ký callback khi có lỗi
   */
  onError(callback: (error: unknown) => void): void {
    this.callbacks.onError = callback;
  }

  /**
   * Đăng ký callback khi kết nối thành công
   */
  onConnect(callback: () => void): void {
    this.callbacks.onConnect = callback;
  }

  /**
   * Đăng ký callback khi ngắt kết nối
   */
  onDisconnect(callback: () => void): void {
    this.callbacks.onDisconnect = callback;
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export const webSocketService = new WebSocketService();

type MessageHandler = (message: ChatMessageSocketResponse) => void;
type ConversationEventHandler = (event: unknown) => void;
type PresenceHandler = (event: { userId: string; isOnline: boolean }) => void;

class ChatSocketService {
  private client: Client | null = null;
  private subscriptions = new Map<string, () => void>();
  private currentUserId: string | null = null;

  private resolveSockJsUrl() {
    const normalized = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/+$/, "");
    return `${normalized}/chat/ws-chat`;
  }

  connect(onConnected?: () => void, onError?: (error: string) => void) {
    if (this.client?.connected) {
      onConnected?.();
      return;
    }

    if (this.client?.active) {
      return;
    }

    const sockJsUrl = this.resolveSockJsUrl();

    this.client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl),
      connectHeaders: this.currentUserId ? { userId: this.currentUserId } : undefined,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        onConnected?.();
      },
      onStompError: (frame) => {
        onError?.(frame.headers.message || "Không thể kết nối websocket chat");
      },
      onWebSocketError: () => {
        onError?.("Kết nối websocket chat bị lỗi");
      },
      onWebSocketClose: () => {
        this.subscriptions.clear();
      },
    });

    this.client.activate();
  }

  setCurrentUserId(userId: string | null) {
    this.currentUserId = userId;
  }

  async ensureConnected(timeoutMs = 5000) {
    if (this.client?.connected) {
      return;
    }

    if (!this.client?.active) {
      this.connect();
    }

    const start = Date.now();

    while (!this.client?.connected) {
      if (Date.now() - start >= timeoutMs) {
        throw new Error("Websocket chat chưa kết nối");
      }

      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  disconnect() {
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions.clear();

    if (this.client?.active) {
      this.client.deactivate();
    }

    this.client = null;
  }

  isConnected() {
    return this.client?.connected ?? false;
  }

  subscribeConversation(conversationId: string, handler: MessageHandler) {
    if (!this.client?.connected) {
      return () => undefined;
    }

    const destination = `/topic/conversations/${conversationId}`;

    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination)?.();
    }

    const subscription = this.client.subscribe(destination, (frame) => {
      const payload = JSON.parse(frame.body) as ChatMessageSocketResponse;
      handler(payload);
    });

    const unsubscribe = () => {
      try {
        if (this.client?.connected) {
          subscription.unsubscribe();
        }
      } catch {
      }
      this.subscriptions.delete(destination);
    };

    this.subscriptions.set(destination, unsubscribe);
    return unsubscribe;
  }

  subscribeUserConversations(userId: string, handler: ConversationEventHandler) {
    if (!this.client?.connected) {
      return () => undefined;
    }

    const destination = `/topic/users/${userId}/conversations`;

    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination)?.();
    }

    const subscription = this.client.subscribe(destination, (frame) => {
      try {
        handler(JSON.parse(frame.body) as unknown);
      } catch {
        handler(frame.body);
      }
    });

    const unsubscribe = () => {
      try {
        if (this.client?.connected) {
          subscription.unsubscribe();
        }
      } catch {
      }
      this.subscriptions.delete(destination);
    };

    this.subscriptions.set(destination, unsubscribe);
    return unsubscribe;
  }

  subscribePresence(handler: PresenceHandler) {
    if (!this.client?.connected) {
      return () => undefined;
    }

    const destination = "/topic/presence";

    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination)?.();
    }

    const subscription = this.client.subscribe(destination, (frame) => {
      try {
        handler(JSON.parse(frame.body) as { userId: string; isOnline: boolean });
      } catch {
      }
    });

    const unsubscribe = () => {
      try {
        if (this.client?.connected) {
          subscription.unsubscribe();
        }
      } catch {
      }
      this.subscriptions.delete(destination);
    };

    this.subscriptions.set(destination, unsubscribe);
    return unsubscribe;
  }

  sendMessage(payload: SendChatMessagePayload) {
    if (!this.client?.connected) {
      throw new Error("Websocket chat chưa kết nối");
    }

    this.client.publish({
      destination: "/app/chat.send",
      body: JSON.stringify({
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        receiverId: payload.receiverId,
        content: payload.content,
        type: payload.type || "TEXT",
        replyToMessageId: payload.replyToMessageId,
      }),
    });
  }
}

export const chatSocketService = new ChatSocketService();
