"use client";
import http from "@/utils/api";
import type {
  ChatConversationApiResponse,
  CreateConversationRequest,
  CreateConversationResponse,
} from "@/types/conversation.type";
import type { ChatMessageSocketResponse, MessageHistoryApiResponse } from "@/types/message.type";
import type { UserProfileApiResponseType } from "@/types/user.type";
class ChatService {
  async createConversation(payload: CreateConversationRequest) {
    return http.post<CreateConversationResponse>("/auth/api/chat/conversations", payload);
  }

  async getMyConversations() {
    return http.get<ChatConversationApiResponse[]>("/chat/api/conversations/me");
  }

  async getConversationMessages(conversationId: string) {
    return http.get<MessageHistoryApiResponse[]>(`/chat/api/conversations/${conversationId}/messages`);
  }

  async reactToMessage(messageId: string, emoji: string) {
    return http.post<ChatMessageSocketResponse>(`/chat/api/messages/${messageId}/reactions`, { emoji });
  }

  async getUserProfileByUserId(userId: string) {
    return http.get<UserProfileApiResponseType>(`/auth/api/users/${userId}/profile`);
  }
}

export const chatService = new ChatService();

import { chatSocketService } from "@/services/websocket.service";

import type { RootState } from "@/stores/store";
import type {
  ChatConversation,
} from "@/types/conversation.type";
import type {
  ChatMessage,
  MessageType,
  ReplyMessage,
  SendChatMessagePayload,
} from "@/types/message.type";
import {
  createAsyncThunk,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import dayjs from "dayjs";

type CreateConversationPayload = {
  participantId: string;
  participantName?: string;
  participantAvatar?: string;
};

type SendMessagePayload = {
  conversationId: string;
  receiverId: string;
  content: string;
  type?: MessageType;
  replyTo?: ReplyMessage;
};

type ReactToMessagePayload = {
  messageId: string;
  emoji: string;
};

type ChatState = {
  loading: boolean;
  connecting: boolean;
  connected: boolean;
  sending: boolean;
  error: string | null;
  conversations: ChatConversation[];
  activeConversationId: string | null;
  messagesByConversation: Record<string, ChatMessage[]>;
};

const initialState: ChatState = {
  loading: false,
  connecting: false,
  connected: false,
  sending: false,
  error: null,
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const formatConversationTime = (dateTime?: string | null) => {
  if (!dateTime) {
    return "";
  }

  return dayjs(dateTime).format("HH:mm");
};

const buildParticipantName = (participantId: string) =>
  `Người dùng ${participantId.slice(0, 8)}`;
const buildParticipantAvatar = (_participantId: string) => "";

const mapConversationApiToView = (
  conversation: ChatConversationApiResponse,
): ChatConversation => ({
  id: conversation.conversationId,
  participantId: conversation.participantUserId,
  name:
    conversation.participantName?.trim() ||
    buildParticipantName(conversation.participantUserId),
  avatar:
    conversation.participantAvatarUrl ||
    conversation.participantAvatar ||
    buildParticipantAvatar(conversation.participantUserId),
  isOnline: Boolean(conversation.isOnline),
  time: formatConversationTime(
    conversation.lastMessageAt ||
    conversation.updatedAt ||
    conversation.createdAt,
  ),
  lastMessage: conversation.lastMessage || "Bắt đầu cuộc trò chuyện",
  unreadCount: 0,
  updatedAt: conversation.updatedAt,
});

const mapConversationWithParticipantProfile = (
  conversation: ChatConversation,
  profile?: { fullName?: string; avatarUrl?: string },
): ChatConversation => {
  if (!profile) {
    return conversation;
  }

  return {
    ...conversation,
    name: profile.fullName?.trim() || conversation.name,
    avatar: profile.avatarUrl || conversation.avatar,
  };
};

const mapApiMessageToChatMessage = (
  payload: MessageHistoryApiResponse,
): ChatMessage => ({
  id: payload.messageId,
  conversationId: payload.conversationId,
  senderId: payload.senderId,
  receiverId: payload.receiverId,
  content: payload.content,
  type: payload.type,
  status: payload.status,
  createdAt: payload.createdAt,
  replyTo: payload.replyTo,
  reactions: payload.reactions,
});

const mapSocketMessageToChatMessage = (
  payload: ChatMessageSocketResponse,
): ChatMessage => ({
  id: payload.messageId,
  conversationId: payload.conversationId,
  senderId: payload.senderId,
  receiverId: payload.receiverId,
  content: payload.content,
  type: payload.type,
  status: payload.status,
  createdAt: payload.createdAt,
  replyTo: payload.replyTo,
  reactions: payload.reactions,
});

const mergeMessages = (current: ChatMessage[], incoming: ChatMessage[]) => {
  const merged = new Map<string, ChatMessage>();

  [...current, ...incoming].forEach((message) => {
    merged.set(message.id, message);
  });

  return [...merged.values()].sort(
    (left, right) =>
      dayjs(left.createdAt).valueOf() - dayjs(right.createdAt).valueOf(),
  );
};

export const fetchMyConversations = createAsyncThunk<
  ChatConversation[],
  void,
  { rejectValue: string }
>("chat/fetchMyConversations", async (_, { rejectWithValue }) => {
  try {
    const conversations = await chatService.getMyConversations();
    const mappedConversations = conversations.map(mapConversationApiToView);
    const participantIds = Array.from(
      new Set(
        mappedConversations
          .map((conversation) => conversation.participantId)
          .filter(Boolean),
      ),
    );

    const profileEntries = await Promise.all(
      participantIds.map(async (participantId) => {
        try {
          const profileResponse =
            await chatService.getUserProfileByUserId(participantId);
          return [
            participantId,
            {
              fullName: profileResponse.user_profile?.fullName,
              avatarUrl: profileResponse.user_profile?.avatarUrl,
            },
          ] as const;
        } catch {
          return [participantId, undefined] as const;
        }
      }),
    );

    const participantProfileMap = new Map(profileEntries);

    return mappedConversations.map((conversation) =>
      mapConversationWithParticipantProfile(
        conversation,
        participantProfileMap.get(conversation.participantId),
      ),
    );
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Không thể tải danh sách cuộc trò chuyện"),
    );
  }
});

export const fetchConversationMessages = createAsyncThunk<
  { conversationId: string; messages: ChatMessage[] },
  string,
  { rejectValue: string }
>(
  "chat/fetchConversationMessages",
  async (conversationId, { rejectWithValue }) => {
    try {
      const messages =
        await chatService.getConversationMessages(conversationId);
      return {
        conversationId,
        messages: messages.map(mapApiMessageToChatMessage),
      };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Không thể tải lịch sử tin nhắn"),
      );
    }
  },
);

export const createConversation = createAsyncThunk<
  ChatConversation,
  CreateConversationPayload,
  { rejectValue: string }
>("chat/createConversation", async (payload, { rejectWithValue }) => {
  try {
    const response = await chatService.createConversation({
      userId: payload.participantId,
    });
    const conversations = await chatService.getMyConversations();
    const createdConversation = conversations.find(
      (conversation) => conversation.conversationId === response.conversationId,
    );

    if (createdConversation) {
      const mappedConversation = mapConversationApiToView(createdConversation);
      return {
        ...mappedConversation,
        name: payload.participantName || mappedConversation.name,
        avatar: payload.participantAvatar || mappedConversation.avatar,
      };
    }

    const now = new Date().toISOString();
    return {
      id: response.conversationId,
      participantId: payload.participantId,
      name:
        payload.participantName || buildParticipantName(payload.participantId),
      avatar:
        payload.participantAvatar ||
        buildParticipantAvatar(payload.participantId),
      isOnline: false,
      time: formatConversationTime(now),
      lastMessage: "Bắt đầu cuộc trò chuyện",
      unreadCount: 0,
      updatedAt: now,
    };
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Không thể tạo cuộc trò chuyện"),
    );
  }
});

export const connectChatSocket = createAsyncThunk<
  void,
  void,
  { state: RootState; rejectValue: string }
>("chat/connectSocket", async (_, { rejectWithValue, getState }) => {
  try {
    const userId = getState().auth.user?.userId;

    if (!userId) {
      return rejectWithValue("Bạn cần đăng nhập để kết nối chat realtime");
    }

    chatSocketService.setCurrentUserId(userId);
    await chatSocketService.ensureConnected();
  } catch (error) {
    return rejectWithValue(
      getErrorMessage(error, "Không thể kết nối realtime chat"),
    );
  }
});

export const sendChatMessage = createAsyncThunk<
  SendChatMessagePayload,
  SendMessagePayload,
  { state: RootState; rejectValue: string }
>("chat/sendMessage", async (payload, { getState, rejectWithValue }) => {
  try {
    const senderId = getState().auth.user?.userId;

    if (!senderId) {
      return rejectWithValue("Bạn cần đăng nhập để gửi tin nhắn");
    }

    const socketPayload: SendChatMessagePayload = {
      conversationId: payload.conversationId,
      senderId,
      receiverId: payload.receiverId,
      content: payload.content,
      type: payload.type || "TEXT",
      replyToMessageId: payload.replyTo?.messageId,
    };

    await chatSocketService.ensureConnected();
    chatSocketService.sendMessage(socketPayload);
    return socketPayload;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể gửi tin nhắn"));
  }
});

export const disconnectChatSocket = createAsyncThunk(
  "chat/disconnectSocket",
  async () => {
    chatSocketService.setCurrentUserId(null);
    chatSocketService.disconnect();
  },
);

export const reactToChatMessage = createAsyncThunk<
  ChatMessageSocketResponse,
  ReactToMessagePayload,
  { rejectValue: string }
>("chat/reactToMessage", async (payload, { rejectWithValue }) => {
  try {
    return await chatService.reactToMessage(payload.messageId, payload.emoji);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, "Không thể thả cảm xúc"));
  }
});

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    clearChatError: (state) => {
      state.error = null;
    },
    setActiveConversation: (state, action: PayloadAction<string | null>) => {
      state.activeConversationId = action.payload;

      if (!action.payload) {
        return;
      }

      const targetConversation = state.conversations.find(
        (conversation) => conversation.id === action.payload,
      );

      if (targetConversation) {
        targetConversation.unreadCount = 0;
      }
    },
    upsertConversation: (state, action: PayloadAction<ChatConversation>) => {
      const index = state.conversations.findIndex(
        (conversation) => conversation.id === action.payload.id,
      );

      if (index === -1) {
        state.conversations.unshift(action.payload);
        return;
      }

      state.conversations[index] = {
        ...state.conversations[index],
        ...action.payload,
      };
    },
    setParticipantOnlineStatus: (
      state,
      action: PayloadAction<{
        participantId: string;
        isOnline: boolean;
      }>,
    ) => {
      state.conversations.forEach((conversation) => {
        if (conversation.participantId !== action.payload.participantId) {
          return;
        }

        conversation.isOnline = action.payload.isOnline;
      });
    },
    receiveSocketMessage: (
      state,
      action: PayloadAction<{
        payload: ChatMessageSocketResponse;
        currentUserId: string;
      }>,
    ) => {
      const { payload, currentUserId } = action.payload;
      const mappedMessage = mapSocketMessageToChatMessage(payload);
      const currentList =
        state.messagesByConversation[payload.conversationId] || [];

      state.messagesByConversation[payload.conversationId] = mergeMessages(
        currentList,
        [mappedMessage],
      );

      const conversationIndex = state.conversations.findIndex(
        (conversation) => conversation.id === payload.conversationId,
      );

      if (conversationIndex === -1) {
        const participantId =
          payload.senderId === currentUserId
            ? payload.receiverId
            : payload.senderId;
        state.conversations.unshift({
          id: payload.conversationId,
          participantId,
          name: buildParticipantName(participantId),
          avatar: buildParticipantAvatar(participantId),
          isOnline: false,
          time: formatConversationTime(payload.createdAt),
          lastMessage: payload.content,
          unreadCount: payload.senderId === currentUserId ? 0 : 1,
          updatedAt: payload.createdAt,
        });
        return;
      }

      const currentConversation = state.conversations[conversationIndex];
      const sentByMe = payload.senderId === currentUserId;
      const isActive = state.activeConversationId === payload.conversationId;

      currentConversation.lastMessage = payload.content;
      currentConversation.updatedAt = payload.createdAt;
      currentConversation.time = formatConversationTime(payload.createdAt);

      if (!sentByMe && !isActive) {
        currentConversation.unreadCount += 1;
      }

      state.conversations.splice(conversationIndex, 1);
      state.conversations.unshift(currentConversation);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload.map((conversation) => {
          const existingConversation = state.conversations.find(
            (currentConversation) => currentConversation.id === conversation.id,
          );

          if (!existingConversation) {
            return conversation;
          }

          return {
            ...conversation,
            name: conversation.name || existingConversation.name,
            avatar: conversation.avatar || existingConversation.avatar,
            isOnline: conversation.isOnline,
            unreadCount: existingConversation.unreadCount,
          };
        });

        if (
          state.activeConversationId &&
          !state.conversations.some(
            (conversation) => conversation.id === state.activeConversationId,
          )
        ) {
          state.activeConversationId = null;
        }
      })
      .addCase(fetchMyConversations.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Không thể tải danh sách cuộc trò chuyện";
      })
      .addCase(fetchConversationMessages.fulfilled, (state, action) => {
        const currentMessages =
          state.messagesByConversation[action.payload.conversationId] || [];
        state.messagesByConversation[action.payload.conversationId] =
          mergeMessages(currentMessages, action.payload.messages);
      })
      .addCase(fetchConversationMessages.rejected, (state, action) => {
        state.error = action.payload || "Không thể tải lịch sử tin nhắn";
      })
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        state.loading = false;
        const exists = state.conversations.some(
          (conversation) => conversation.id === action.payload.id,
        );

        if (!exists) {
          state.conversations.unshift(action.payload);
        }

        state.activeConversationId = action.payload.id;
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không thể tạo cuộc trò chuyện";
      })
      .addCase(connectChatSocket.pending, (state) => {
        state.connecting = true;
        state.error = null;
      })
      .addCase(connectChatSocket.fulfilled, (state) => {
        state.connecting = false;
        state.connected = true;
      })
      .addCase(connectChatSocket.rejected, (state, action) => {
        state.connecting = false;
        state.connected = false;
        state.error = action.payload || "Không thể kết nối realtime chat";
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.sending = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state) => {
        state.sending = false;
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload || "Không thể gửi tin nhắn";
      })
      .addCase(disconnectChatSocket.fulfilled, (state) => {
        state.connected = false;
        state.connecting = false;
      })
      .addCase(reactToChatMessage.fulfilled, (state, action) => {
        const mappedMessage = mapSocketMessageToChatMessage(action.payload);
        const currentMessages =
          state.messagesByConversation[action.payload.conversationId] || [];

        state.messagesByConversation[action.payload.conversationId] =
          mergeMessages(currentMessages, [mappedMessage]);
      })
      .addCase(reactToChatMessage.rejected, (state, action) => {
        state.error = action.payload || "Không thể thả cảm xúc";
      });
  },
});

export const {
  setConnected,
  clearChatError,
  setActiveConversation,
  upsertConversation,
  setParticipantOnlineStatus,
  receiveSocketMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
