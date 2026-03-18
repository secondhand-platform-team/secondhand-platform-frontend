import type {
  ChatConversationApiResponse,
  CreateConversationRequest,
  CreateConversationResponse,
} from "@/types/conversation.type";
import type { ChatMessageSocketResponse, MessageHistoryApiResponse } from "@/types/message.type";
import type { UserProfileApiResponseType } from "@/types/user.type";
import http from "@/utils/api";

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

const chatService = new ChatService();
export default chatService;
