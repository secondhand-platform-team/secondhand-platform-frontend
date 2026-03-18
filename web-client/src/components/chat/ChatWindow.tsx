import { Avatar, Badge, Typography } from "antd";
import { InfoCircleOutlined, PhoneOutlined, VideoCameraOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { ChatConversation } from "@/types/conversation.type";
import { ChatMessage, ReplyMessage } from "@/types/message.type";

type ChatWindowProps = {
  conversation: ChatConversation;
  messages: ChatMessage[];
  currentUserId: string;
  canSendMessage: boolean;
  onSendMessage: (content: string, options?: { replyTo?: ReplyMessage }) => Promise<void>;
  replyingTo?: ReplyMessage | null;
  onCancelReply?: () => void;
  onReplyMessage?: (reply: ReplyMessage) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  currentUserName?: string;
};

const toMinuteValue = (time: string) => dayjs(time).valueOf() / 60000;

const ChatWindow = ({
  conversation,
  messages,
  currentUserId,
  canSendMessage,
  onSendMessage,
  replyingTo,
  onCancelReply,
  onReplyMessage,
  onReactMessage,
  currentUserName,
}: ChatWindowProps) => {
  const shouldShowTime = (index: number) => {
    const currentMessage = messages[index];
    const nextMessage = messages[index + 1];

    if (!currentMessage) {
      return false;
    }

    if (!nextMessage || nextMessage.senderId !== currentMessage.senderId) {
      return true;
    }

    const currentMinuteValue = toMinuteValue(currentMessage.createdAt);
    const nextMinuteValue = toMinuteValue(nextMessage.createdAt);

    if (!Number.isFinite(currentMinuteValue) || !Number.isFinite(nextMinuteValue)) {
      return true;
    }

    return nextMinuteValue - currentMinuteValue >= 15;
  };

  const shouldShowAvatar = (index: number) => {
    const currentMessage = messages[index];
    const nextMessage = messages[index + 1];

    if (!currentMessage || currentMessage.senderId === currentUserId) {
      return false;
    }

    if (!nextMessage) {
      return true;
    }

    return nextMessage.senderId !== currentMessage.senderId;
  };

  const lastSentMessage = [...messages].reverse().find((message) => message.senderId === currentUserId);
  const statusLabelByCode: Record<ChatMessage["status"], string> = {
    SENT: "Đã gửi",
    DELIVERED: "Đã nhận",
    READ: "Đã xem",
  };

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-[#f5f7fa]">
      <header className="flex items-center justify-between border-b border-(--line) bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <Badge dot={conversation.isOnline} color="#22c55e" offset={[-4, 36]}>
            <Avatar src={conversation.avatar} size={44} />
          </Badge>
          <div>
            <Typography.Text strong className="block text-base">
              {conversation.name}
            </Typography.Text>
            <Typography.Text
              className={`text-xs ${conversation.isOnline ? "text-emerald-500" : "text-slate-400"}`}
            >
              {conversation.isOnline ? "Đang hoạt động" : "Offline"}
            </Typography.Text>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <PhoneOutlined className="cursor-pointer text-[18px]" />
          <VideoCameraOutlined className="cursor-pointer text-[18px]" />
          <InfoCircleOutlined className="cursor-pointer text-[18px]" />
        </div>
      </header>

      <div className="hide-scrollbar flex-1 overflow-y-auto px-5 py-4">
        <div className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              avatar={conversation.avatar}
              showTime={shouldShowTime(index)}
              showAvatar={shouldShowAvatar(index)}
              isMine={message.senderId === currentUserId}
              timeLabel={dayjs(message.createdAt).format("HH:mm")}
              onReply={onReplyMessage}
              onReact={(emoji) => onReactMessage?.(message.id, emoji)}
              reactionSummary={message.reactions || []}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              participantName={conversation.name}
              statusLabel={
                lastSentMessage?.id === message.id ? statusLabelByCode[lastSentMessage.status] : undefined
              }
              statusAvatar={conversation.avatar}
            />
          ))}
        </div>
      </div>

      <MessageInput
        onSend={onSendMessage}
        disabled={!canSendMessage}
        replyTo={replyingTo}
        onCancelReply={onCancelReply}
      />
    </section>
  );
};

export default ChatWindow;
