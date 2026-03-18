import envConfig from "@/config";
import type {
  ChatMessageSocketResponse,
  SendChatMessagePayload,
} from "@/types/message.type";
import { Client } from "@stomp/stompjs";

type MessageHandler = (message: ChatMessageSocketResponse) => void;
type ConversationEventHandler = (event: unknown) => void;
type PresenceHandler = (event: { userId: string; isOnline: boolean }) => void;

class ChatSocketService {
  private client: Client | null = null;
  private subscriptions = new Map<string, () => void>();
  private currentUserId: string | null = null;

  private resolveWebSocketUrl() {
    const normalized = envConfig.NEXT_PUBLIC_API_ENDPOINT.replace(/\/+$/, "");

    if (normalized.startsWith("https://")) {
      return `${normalized.replace("https://", "wss://")}/chat/ws-chat`;
    }

    if (normalized.startsWith("http://")) {
      return `${normalized.replace("http://", "ws://")}/chat/ws-chat`;
    }

    return `${normalized}/auth/chat/ws-chat`;
  }

  connect(onConnected?: () => void, onError?: (error: string) => void) {
    if (this.client?.connected) {
      onConnected?.();
      return;
    }

    if (this.client?.active) {
      return;
    }

    this.client = new Client({
      brokerURL: this.resolveWebSocketUrl(),
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

const chatSocketService = new ChatSocketService();
export default chatSocketService;
