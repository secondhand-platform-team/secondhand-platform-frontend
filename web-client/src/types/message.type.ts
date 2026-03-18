export type MessageType = "TEXT" | "IMAGE" | "VIDEO" | "FILE";

export type MessageStatus = "SENT" | "DELIVERED" | "READ";

export type ReplyMessage = {
	messageId: string;
	senderId: string;
	senderName: string;
	content: string;
	messageType: MessageType;
	isDeleted?: boolean;
};

export type MessageReaction = {
	emoji: string;
	userId?: string;
	userName?: string;
};

export type ChatMessage = {
	id: string;
	conversationId: string;
	senderId: string;
	receiverId: string;
	senderName?: string;
	content: string;
	type: MessageType;
	status: MessageStatus;
	createdAt: string;
	replyTo?: ReplyMessage;
	reactions?: MessageReaction[];
};

export type SendChatMessagePayload = {
	conversationId: string;
	senderId: string;
	receiverId: string;
	content: string;
	type?: MessageType;
	replyToMessageId?: string;
};

export type ChatMessageSocketResponse = {
	messageId: string;
	conversationId: string;
	senderId: string;
	receiverId: string;
	content: string;
	type: MessageType;
	status: MessageStatus;
	createdAt: string;
	replyTo?: ReplyMessage;
	reactions?: MessageReaction[];
};

export type MessageHistoryApiResponse = ChatMessageSocketResponse;
