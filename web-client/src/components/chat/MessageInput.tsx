"use client";

import { Button, Input } from "antd";
import {
  CloseOutlined,
  FileImageOutlined,
  PlusCircleOutlined,
  SmileOutlined,
  VerticalAlignTopOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import { ReplyMessage } from "@/types/message.type";

type MessageInputProps = {
  onSend: (content: string, options?: { replyTo?: ReplyMessage }) => Promise<void> | void;
  disabled?: boolean;
  replyTo?: ReplyMessage | null;
  onCancelReply?: () => void;
};

const MessageInput = ({
  onSend,
  disabled,
  replyTo,
  onCancelReply,
}: MessageInputProps) => {
  const [message, setMessage] = useState("");

  const handleSendMessage = async () => {
    const nextMessage = message.trim();

    if (!nextMessage || disabled) {
      return;
    }

    try {
      await onSend(nextMessage, {
        replyTo: replyTo || undefined,
      });
      setMessage("");
    } catch {
    }
  };

  return (
    <div className="border-t border-(--line) bg-white px-4 py-3">
      {replyTo ? (
        <div className="mb-2 flex items-start gap-2 rounded-xl border border-(--line) bg-slate-100/90 px-3 py-2">
          <div className="h-10">
            <div className="pt-0.5 h-full">
              <div className="w-[2px] h-full bg-green-500"></div>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-700">
             {replyTo.senderName || "Người dùng"}
            </div>
            <div className="truncate text-[13px] text-slate-500">{replyTo.content}</div>
          </div>

          <div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onCancelReply}
              className="!h-7 !w-7 !rounded-full !p-0 text-slate-400"
            />
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 rounded-2xl border border-(--line) bg-slate-50/70 px-2 py-2">
        <Button type="text" icon={<PlusCircleOutlined className="text-slate-500" />} />
        <Button type="text" icon={<FileImageOutlined className="text-slate-500" />} />
        <Button type="text" icon={<SmileOutlined className="text-slate-500" />} />

        <Input
          variant="borderless"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onPressEnter={handleSendMessage}
          placeholder="Nhập tin nhắn..."
          className="px-1"
          disabled={disabled}
        />

        <Button
          type="primary"
          shape="circle"
          className="bg-emerald-500 shadow-none"
          disabled={!message.trim() || disabled}
          onClick={handleSendMessage}
        >
          ➤
        </Button>
      </div>

      <div className="mt-1.5 px-1 text-xs text-slate-400">Nhấn Enter để gửi</div>
    </div>
  );
};

export default MessageInput;
