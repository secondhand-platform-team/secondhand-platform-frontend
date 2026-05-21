import { Avatar, Badge, Typography, Button } from "antd";
import { InfoCircleOutlined, PhoneOutlined, VideoCameraOutlined, ArrowDownOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";
import { ChatConversation } from "@/types/conversation.type";
import { ChatMessage, MessageType, ReplyMessage } from "@/types/message.type";
import { useRef, useState, useEffect, useMemo } from "react";
import Image from "next/image";

type ChatWindowProps = {
  conversation: ChatConversation;
  messages: ChatMessage[];
  currentUserId: string;
  canSendMessage: boolean;
  onSendMessage: (content: string, options?: { replyTo?: ReplyMessage, type?: MessageType }) => Promise<void>;
  replyingTo?: ReplyMessage | null;
  onCancelReply?: () => void;
  onReplyMessage?: (reply: ReplyMessage) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  currentUserName?: string;
  itemContext?: {
    id: string;
    title: string;
    price: number;
    imageUrl: string;
  } | null;
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
  itemContext,
}: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevMessagesLengthRef = useRef(messages.length);

  const isNearBottom = () => {
    if (!containerRef.current) return true;
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setUnreadCount(0);
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollHeight, scrollTop, clientHeight } = containerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceFromBottom < 100;
    setShowScrollButton(!atBottom);
    if (atBottom) {
      setUnreadCount(0);
    }
  };

  const groupedMessages = useMemo(() => {
    const result: ChatMessage[] = [];
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      if (msg.type === "IMAGE" && !msg.replyTo) {
        let j = i + 1;
        const groupUrls = msg.content.split(",");
        while (
          j < messages.length &&
          messages[j].type === "IMAGE" &&
          messages[j].senderId === msg.senderId &&
          !messages[j].replyTo &&
          // Don't group if messages are too far apart (e.g., > 10 minutes)
          (toMinuteValue(messages[j].createdAt) - toMinuteValue(messages[j - 1].createdAt) < 10)
        ) {
          groupUrls.push(...messages[j].content.split(","));
          j++;
        }
        result.push({ ...msg, content: groupUrls.join(",") });
        i = j - 1;
      } else {
        result.push(msg);
      }
    }
    return result;
  }, [messages]);

  // Auto-scroll or increment unread count when new messages arrive
  useEffect(() => {
    const newCount = messages.length - prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (newCount <= 0) return;

    if (isNearBottom()) {
      scrollToBottom();
    } else {
      setUnreadCount((prev) => prev + newCount);
      setShowScrollButton(true);
    }
  }, [messages.length]);

  const shouldShowTime = (index: number) => {
    const currentMessage = groupedMessages[index];
    const nextMessage = groupedMessages[index + 1];

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
    const currentMessage = groupedMessages[index];
    const nextMessage = groupedMessages[index + 1];

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
    <section className="flex h-full min-h-0 flex-1 flex-col bg-[#f5f7fa] relative">
      <header className="flex items-center justify-between border-b border-(--line) bg-white px-4 py-3 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Badge dot={conversation.isOnline} color="#22c55e" offset={[-4, 36]}>
            {conversation.avatar ? (
              <Avatar src={conversation.avatar} size={44} />
            ) : (
              <Avatar size={44} style={{ backgroundColor: '#10b981', fontWeight: 700, fontSize: 16 }}>
                {(() => {
                  const parts = conversation.name?.split(/\s+/).filter(Boolean) || [];
                  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                  return parts[0]?.[0]?.toUpperCase() || "U";
                })()}
              </Avatar>
            )}
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
      </header>

      {itemContext && (
        <div className="bg-white border-b border-(--line) px-4 py-2 flex items-center gap-3 z-10 cursor-pointer hover:bg-gray-50 transition" onClick={() => window.open(`/items/${itemContext.id}`, "_blank")}>
          <div className="h-12 w-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
            {itemContext.imageUrl ? (
              <Image src={itemContext.imageUrl} alt={itemContext.title} width={48} height={48} className="object-cover h-full w-full" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No img</div>
            )}
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <Typography.Text ellipsis strong className="text-sm">
              {itemContext.title}
            </Typography.Text>
            <Typography.Text className="text-emerald-600 font-semibold text-sm">
              {itemContext.price?.toLocaleString("vi-VN")} VND
            </Typography.Text>
          </div>
        </div>
      )}

      <div 
        className="hide-scrollbar flex-1 overflow-y-auto px-5 py-4" 
        ref={containerRef} 
        onScroll={handleScroll}
      >
        <div className="flex flex-col gap-3">
          {groupedMessages.map((message, index) => (
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Scroll to bottom button — outside scrollable area, floats above MessageInput */}
      <div
        className="absolute left-1/2 z-50 transition-all duration-300 ease-out"
        style={{
          bottom: replyingTo ? "140px" : "88px",
          transform: `translateX(-50%) translateY(${showScrollButton ? "0px" : "10px"})`,
          opacity: showScrollButton ? 1 : 0,
          pointerEvents: showScrollButton ? "auto" : "none",
        }}
      >
        <button
          onClick={scrollToBottom}
          className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-200 shadow-lg text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 hover:scale-110 active:scale-95 transition-all duration-150 cursor-pointer"
          aria-label="Cuộn xuống cuối"
        >
          <ArrowDownOutlined style={{ fontSize: 16 }} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
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
