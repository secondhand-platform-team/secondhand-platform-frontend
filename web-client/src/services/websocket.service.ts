import { Client, IMessage } from "@stomp/stompjs";
import type { Notification } from "@/types/notification.type";
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
    * Endpoint: ws://localhost:8000/core/ws-notification
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
        const socketUrl = `${baseUrl.replace(/^http/, "ws")}/core/ws-notification`;

        this.client = new Client({
          brokerURL: socketUrl,
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
          resolve();
        };

        this.client.onStompError = (frame) => {
          console.error("[WebSocket] STOMP error:", frame);
          this.isConnecting = false;
          this.callbacks.onError?.(frame);
          reject(frame);
        };

        this.client.onWebSocketError = (error) => {
          console.error("[WebSocket] WebSocket error:", error);
          this.isConnecting = false;
          this.callbacks.onError?.(error);
          reject(error);
        };

        this.client.activate();
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
