export type CreateConversationRequest = {
	userId: string;
};

export type CreateConversationResponse = {
	conversationId: string;
};

export type ChatConversationApiResponse = {
	conversationId: string;
	participants: string[];
	participantUserId: string;
	participantName?: string | null;
	participantAvatar?: string | null;
	participantAvatarUrl?: string | null;
	isOnline?: boolean | null;
	lastMessage?: string | null;
	lastMessageAt?: string | null;
	createdAt: string;
	updatedAt: string;
};

export type ChatConversation = {
	id: string;
	participantId: string;
	name: string;
	avatar: string;
	isOnline: boolean;
	time: string;
	lastMessage: string;
	unreadCount: number;
	updatedAt: string;
};
