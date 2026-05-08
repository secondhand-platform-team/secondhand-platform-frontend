"use client";

import { Avatar, Badge, Button, Input, Segmented, Typography } from "antd";
import { EditOutlined, SearchOutlined } from "@ant-design/icons";
import Link from "next/link";
import { ChatConversation } from "@/types/conversation.type";

type ChatSidebarProps = {
  conversations: ChatConversation[];
  activeConversationId?: string;
  onConversationSelect?: (conversationId: string) => void;
};

const filterItems = [
  { key: "all", label: "Tất cả" },
  { key: "unread", label: "Chưa đọc" },
  { key: "seller", label: "Người bán" },
];

const ChatSidebar = ({
  conversations,
  activeConversationId,
  onConversationSelect,
}: ChatSidebarProps) => {
  return (
    <aside className="flex h-full w-full flex-col border-r border-(--line) bg-white">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
        <Typography.Title level={4} className="!m-0 !text-[22px] !font-semibold">
          Tin nhắn
        </Typography.Title>
        <Button type="text" icon={<EditOutlined className="!text-[18px] !text-emerald-600" />} />
      </div>

      <div className="px-4 pt-3">
        <Input
          placeholder="Tìm đoạn chat..."
          prefix={<SearchOutlined className="text-slate-400" />}
          className="!h-10 !rounded-full !border-[var(--line)]"
        />
      </div>

      <div className="px-4 pt-3">
        <Segmented
          block
          options={filterItems.map((item) => ({ value: item.key, label: item.label }))}
          defaultValue="all"
        />
      </div>

      <div className="hide-scrollbar flex-1 overflow-y-auto pb-3">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;

          return (
            <Link
              href={`/chat/${conversation.id}`}
              key={conversation.id}
              onClick={() => onConversationSelect?.(conversation.id)}
              className={`relative mx-2 mb-1 flex items-start gap-3 px-3 py-3 transition-all ${
                isActive
                  ? "bg-emerald-50"
                  : "hover:bg-slate-50"
              }`}
            >
              <span
                className={`absolute inset-y-0 left-0 w-[3px] ${
                  isActive ? "bg-emerald-500" : "bg-transparent"
                }`}
              />

              <Badge dot={conversation.isOnline} offset={[-3, 35]} color="#22c55e">
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

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Typography.Text strong className="!text-[15px]">
                    {conversation.name}
                  </Typography.Text>
                  <Typography.Text className="!text-xs !text-slate-400">
                    {conversation.time}
                  </Typography.Text>
                </div>

                <div className="mt-0.5 flex items-center gap-2">
                  <Typography.Text
                    className={`!m-0 !truncate !text-sm ${
                      conversation.unreadCount > 0
                        ? "!font-semibold !text-slate-700"
                        : "!text-slate-500"
                    }`}
                  >
                    {conversation.lastMessage}
                  </Typography.Text>
                  {conversation.unreadCount > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[11px] font-semibold text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </aside>
  );
};

export default ChatSidebar;