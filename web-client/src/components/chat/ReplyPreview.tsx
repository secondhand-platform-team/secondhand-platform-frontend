"use client";

import { ReplyMessage } from "@/types/message.type";

const ReplyPreview = ({
  reply,
  isMe,
  senderName,
}: {
  reply: ReplyMessage;
  isMe: boolean;
  senderName: string;
}) => {
  const typeLabel =
    reply.messageType === "IMAGE"
      ? "📷 Hình ảnh"
      : reply.messageType === "FILE"
      ? "📎 Tệp đính kèm"
      : reply.messageType === "VIDEO"
      ? "🎥 Video"
      : reply.content;

  const content = reply.isDeleted ? "Tin nhắn đã bị xóa" : typeLabel;

  return (
    <div className="mb-2 flex">
  {/* 🌿 Thanh xanh */}
  <div
    className={`w-[3px] ${
      isMe ? "bg-emerald-100/50" : "bg-slate-400"
    }`}
  />

  {/* 📦 Nội dung */}
  <div
    className={`flex-1 px-2.5 py-2 ${
      isMe
        ? "bg-emerald-100/70 text-slate-700"
        : "bg-slate-100 text-slate-600"
    }`}
  >
    <div className="truncate text-[13px] font-semibold leading-tight text-slate-700">
      {senderName}
    </div>

    <div
      className="line-clamp-2 text-[13px] leading-[1.35]"
      style={{
        fontStyle: reply.isDeleted ? "italic" : "normal",
      }}
    >
      {content}
    </div>
  </div>
</div>
  );
};

export default ReplyPreview;