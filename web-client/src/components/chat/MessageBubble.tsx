import { Avatar, Button, Dropdown, Image, Typography } from "antd";
import { MessageReaction, ReplyMessage } from "@/types/message.type";
import { EllipsisOutlined, RollbackOutlined, SmileOutlined } from "@ant-design/icons";
import ReplyPreview from "./ReplyPreview";
import { ChatMessage } from "@/types/message.type";

type MessageBubbleProps = {
  message: ChatMessage;
  avatar?: string;
  showTime?: boolean;
  showAvatar?: boolean;
  isMine: boolean;
  timeLabel: string;
  onReply?: (reply: ReplyMessage) => void;
  onReact?: (emoji: string) => void;
  reactionSummary?: MessageReaction[];
  currentUserId: string;
  currentUserName?: string;
  participantName?: string;
  statusLabel?: string;
  statusAvatar?: string;
};

const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "👏"];

const MessageBubble = ({
  message,
  avatar,
  showTime = false,
  showAvatar = true,
  isMine,
  timeLabel,
  onReply,
  onReact,
  reactionSummary = [],
  currentUserId,
  currentUserName,
  participantName,
  statusLabel,
  statusAvatar,
}: MessageBubbleProps) => {
  const resolveSenderName = (senderId?: string, fallbackName?: string) => {
    const normalizedFallbackName = fallbackName?.trim();
    if (normalizedFallbackName) {
      return normalizedFallbackName;
    }

    if (!senderId) {
      return "Người dùng";
    }

    if (senderId === currentUserId) {
      return currentUserName?.trim() || "Bạn";
    }

    return participantName?.trim() || "Người dùng";
  };

  const toReply = (): ReplyMessage => ({
    messageId: message.id,
    senderId: message.senderId,
    senderName: resolveSenderName(message.senderId, message.senderName),
    content: message.content,
    messageType: message.type,
  });

  const reactionMenuItems = REACTION_EMOJIS.map((emoji) => ({
    key: emoji,
    label: <span className="text-lg">{emoji}</span>,
  }));

  const reactionCountMap = reactionSummary.reduce<Record<string, number>>((acc, reaction) => {
    acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
    return acc;
  }, {});
  const reactionBadgeText = Object.entries(reactionCountMap)
    .map(([emoji, count]) => `${emoji}${count > 1 ? ` ${count}` : ""}`)
    .join(" ");

  return (
    <div className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`group flex max-w-[72%] items-end gap-2 ${isMine ? "flex-row-reverse" : ""}`}>
        {!isMine && showAvatar ? <Avatar src={avatar} size={30} /> : <div className="w-7.5" />}

        <div className={`min-w-0 ${isMine ? "items-end" : "items-start"} relative`}>
          <div
            className={`absolute top-1 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 ${
              isMine ? "-left-28" : "-right-28"
            }`}
          >
            <Button
              type="text"
              size="small"
              icon={<RollbackOutlined />}
              className="!h-7 !w-7 !rounded-full !bg-white !p-0 text-slate-500 shadow-sm"
              onClick={() => onReply?.(toReply())}
            />
            <Dropdown
              menu={{
                items: reactionMenuItems,
                onClick: (event) => onReact?.(event.key),
              }}
              trigger={["click"]}
              placement={isMine ? "bottomRight" : "bottomLeft"}
            >
              <Button
                type="text"
                size="small"
                icon={<SmileOutlined />}
                className="!h-7 !w-7 !rounded-full !bg-white !p-0 text-slate-500 shadow-sm"
              />
            </Dropdown>
            <Button
              type="text"
              size="small"
              icon={<EllipsisOutlined />}
              className="!h-7 !w-7 !rounded-full !bg-white !p-0 text-slate-500 shadow-sm"
            />
          </div>

          <div
            className={`rounded-2xl px-4 py-2.5 ${
              isMine
                ? "rounded-br-md bg-emerald-500 text-white"
                : "rounded-bl-md border border-(--line) bg-white text-slate-700"
            }`}
          >
            {message.replyTo ? (
              <ReplyPreview
                reply={message.replyTo}
                isMe={isMine}
                senderName={resolveSenderName(message.replyTo.senderId, message.replyTo.senderName)}
              />
            ) : null}

            {message.type !== "IMAGE" ? (
              <Typography.Text style={{ color: "inherit" }}>{message.content}</Typography.Text>
            ) : null}

            {message.type === "IMAGE" ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {[message.content].map((image, index) => (
                  <Image
                    key={`${message.id}-${index}`}
                    src={image}
                    alt="Ảnh người bán gửi"
                    preview
                    className="h-52 w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            ) : null}
            {showTime && (
              <div className={`mt-1 ${isMine ? "text-right" : "text-left"}`}>
                <span className={`text-[10px] ${isMine ? "text-white/70" : "text-slate-400"}`}>
                  {timeLabel}
                </span>
              </div>
            )}
          </div>


          {reactionBadgeText ? (
            <div
              className={`absolute -bottom-3 z-10 ${
                isMine ? "-left-2" : "-right-2"
              } rounded-full border border-(--line) bg-white px-2 py-0.5 text-xs text-slate-600 shadow-sm`}
            >
              {reactionBadgeText}
            </div>
          ) : null}

          {statusLabel ? (
            <div className="mt-0.5 flex items-center justify-end gap-1 px-1">
              <Typography.Text className="text-[11px] text-slate-400">{statusLabel}</Typography.Text>
              {statusLabel === "Đã xem" ? <Avatar src={statusAvatar} size={14} /> : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
