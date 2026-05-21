"use client";

import { Button, Input, Upload, message, Badge } from "antd";
import {
  CloseOutlined,
  FileImageOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useRef, useState } from "react";
import { MessageType, ReplyMessage } from "@/types/message.type";
import type { InputRef } from "antd";
import type { UploadFile } from "antd/es/upload/interface";
import http from "@/utils/api";
import Image from "next/image";

type MessageInputProps = {
  onSend: (content: string, options?: { replyTo?: ReplyMessage, type?: MessageType }) => Promise<void> | void;
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
  const [messageText, setMessageText] = useState("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<InputRef>(null);

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Bạn chỉ có thể tải lên file hình ảnh!");
      return Upload.LIST_IGNORE;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error("Hình ảnh phải nhỏ hơn 5MB!");
      return Upload.LIST_IGNORE;
    }
    return false; // Prevent automatic upload
  };

  const handleChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
    // Focus input after selecting images
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeFile = (uid: string) => {
    setFileList(fileList.filter(file => file.uid !== uid));
  };

  const handleSendMessage = async () => {
    const textContent = messageText.trim();
    if ((!textContent && fileList.length === 0) || disabled || isUploading) {
      return;
    }

    setIsUploading(true);
    try {
      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach(file => {
          if (file.originFileObj) {
            formData.append("files", file.originFileObj);
          }
        });

        const uploadResponse = await http.post<{ success: boolean, imageUrls: string[] }>(
          "/core/api/images/upload-multiple",
          formData
        );

        if (uploadResponse.success && uploadResponse.imageUrls && uploadResponse.imageUrls.length > 0) {
          await onSend(uploadResponse.imageUrls.join(","), { type: "IMAGE", replyTo: replyTo || undefined });
        }
        setFileList([]);
      }

      if (textContent) {
        await onSend(textContent, {
          replyTo: replyTo || undefined,
          type: "TEXT"
        });
      }

      setMessageText("");
      if (onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      console.error("Gửi tin nhắn thất bại", error);
      message.error("Không thể gửi tin nhắn");
    } finally {
      setIsUploading(false);
      // Focus input after sending
      setTimeout(() => inputRef.current?.focus(), 0);
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

      {fileList.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
          {fileList.map(file => {
            const previewUrl = file.originFileObj ? URL.createObjectURL(file.originFileObj) : "";
            return (
              <Badge 
                key={file.uid} 
                count={
                  <CloseOutlined 
                    className="cursor-pointer rounded-full bg-white text-gray-500 shadow-sm border border-gray-200 p-1" 
                    onClick={() => removeFile(file.uid)}
                    style={{ fontSize: 10 }}
                  />
                }
              >
                <div className="h-16 w-16 overflow-hidden rounded-lg border border-gray-200">
                  <Image 
                    src={previewUrl} 
                    alt="preview" 
                    width={64} 
                    height={64} 
                    className="h-full w-full object-cover"
                  />
                </div>
              </Badge>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-2xl border border-(--line) bg-slate-50/70 px-2 py-2">
        <Upload
          beforeUpload={beforeUpload}
          onChange={handleChange}
          fileList={fileList}
          multiple
          accept="image/*"
          showUploadList={false}
          disabled={disabled || isUploading}
        >
          <Button type="text" icon={<FileImageOutlined className="text-slate-500" />} />
        </Upload>

        <Input
          ref={inputRef}
          variant="borderless"
          value={messageText}
          onChange={(event) => setMessageText(event.target.value)}
          onPressEnter={handleSendMessage}
          placeholder="Nhập tin nhắn..."
          className="px-1"
          disabled={disabled || isUploading}
        />

        <Button
          type="primary"
          shape="circle"
          className="bg-emerald-500 shadow-none flex items-center justify-center"
          disabled={(!messageText.trim() && fileList.length === 0) || disabled || isUploading}
          onClick={handleSendMessage}
        >
          {isUploading ? <LoadingOutlined /> : "➤"}
        </Button>
      </div>

      <div className="mt-1.5 px-1 text-xs text-slate-400">Nhấn Enter để gửi</div>
    </div>
  );
};

export default MessageInput;
