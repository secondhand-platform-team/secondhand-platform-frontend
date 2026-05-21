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
        {!isMine && showAvatar ? (
          avatar ? <Avatar src={avatar} size={30} /> : (
            <Avatar size={30} style={{ backgroundColor: '#10b981', fontWeight: 700, fontSize: 12 }}>
              {(() => {
                const parts = participantName?.split(/\s+/).filter(Boolean) || [];
                if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                return parts[0]?.[0]?.toUpperCase() || "U";
              })()}
            </Avatar>
          )
        ) : <div className="w-7.5" />}

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
            className={`rounded-2xl ${message.type === "IMAGE" ? "" : "px-4 py-2.5"} ${
              message.type === "IMAGE" 
                ? "" 
                : isMine
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

            {message.type === "IMAGE" ? (() => {
              const urls = message.content.split(",").filter(Boolean);
              const count = urls.length;
              const shown = urls.slice(0, 4);
              const extra = count - 4;

              const imgClass = "w-full h-full object-cover";

              const renderImg = (url: string, index: number, overlaySrc?: string) => (
                <div key={`${message.id}-${index}`} className="relative overflow-hidden">
                  <Image
                    src={url}
                    alt={`Ảnh ${index + 1}`}
                    preview={{ src: url }}
                    className={`${imgClass} !rounded-none`}
                    style={{ display: "block", width: "100%", height: "100%", objectFit: "cover" }}
                    styles={{ root: { width: "100%", height: "100%", display: "block" } }}
                  />
                  {overlaySrc && extra > 0 && (
                    <div
                      className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xl font-bold cursor-pointer select-none"
                      style={{ borderRadius: 0 }}
                    >
                      +{extra + 1}
                    </div>
                  )}
                </div>
              );

              return (
                <div className="mt-1 overflow-hidden rounded-xl" style={{ maxWidth: 260 }}>
                  {count > 1 && (
                    <div className={`mb-1 text-[11px] font-medium ${isMine ? "text-white/80 text-right" : "text-slate-400 text-left"}`}>
                      {isMine ? `Bạn đã gửi ${count} ảnh` : `${count} ảnh`}
                    </div>
                  )}

                  {/* 1 image */}
                  {count === 1 && (
                    <div style={{ width: 220, height: 220 }} className="rounded-xl overflow-hidden">
                      {renderImg(urls[0], 0)}
                    </div>
                  )}

                  {/* 2 images: side by side */}
                  {count === 2 && (
                    <div style={{ width: 260, height: 130, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                      {shown.map((url, i) => renderImg(url, i))}
                    </div>
                  )}

                  {/* 3 images: 1 large left + 2 stacked right */}
                  {count === 3 && (
                    <div style={{ width: 260, height: 180, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2 }}>
                      <div style={{ gridRow: "1 / 3" }}>{renderImg(urls[0], 0)}</div>
                      <div>{renderImg(urls[1], 1)}</div>
                      <div>{renderImg(urls[2], 2)}</div>
                    </div>
                  )}

                  {/* 4+ images: 2x2 grid, last cell shows overlay if extra */}
                  {count >= 4 && (
                    <div style={{ width: 260, height: 260, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 2 }}>
                      {renderImg(shown[0], 0)}
                      {renderImg(shown[1], 1)}
                      {renderImg(shown[2], 2)}
                      {extra > 0 ? renderImg(shown[3], 3, shown[3]) : renderImg(shown[3], 3)}
                    </div>
                  )}
                </div>
              );
            })() : null}
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
              {statusLabel === "Đã xem" ? (
                statusAvatar ? <Avatar src={statusAvatar} size={14} /> : <Avatar size={14} style={{ backgroundColor: '#10b981', fontWeight: 700, fontSize: 8 }}>{participantName?.[0]?.toUpperCase() || "U"}</Avatar>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
