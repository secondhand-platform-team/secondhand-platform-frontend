"use client";

import { useState, useEffect, useRef } from "react";
import { Badge, Empty, Spin } from "antd";
import { Bell, ShieldCheck } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/types/notification.type";

export function NotificationBell() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "read">(
    "all",
  );
  const notifRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    if (notifOpen) {
      void fetchNotifications(0, 20);
    }
  }, [notifOpen, fetchNotifications]);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifOpen]);

  /**
   * Filter notifications theo tab
   */
  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === "all") return true;
    if (notifFilter === "unread") return !n.isRead;
    if (notifFilter === "read") return n.isRead;
    return true;
  });

  /**
   * Map notification type to icon color
   */
  const getTypeColor = (type: string) => {
    switch (type) {
      case "ITEM_FAVORITED":
      case "WALLET_DEPOSIT_SUCCESS":
        return { bg: "bg-emerald-100", text: "text-emerald-600" };
      case "ITEM_REPORTED":
      case "SYSTEM":
        return { bg: "bg-amber-100", text: "text-amber-600" };
      case "WALLET_DEDUCTION":
        return { bg: "bg-red-100", text: "text-red-600" };
      default:
        return { bg: "bg-slate-100", text: "text-slate-600" };
    }
  };

  /**
   * Format notification content dựa trên type
   */
  const getNotificationContent = (notif: Notification) => {
    const typeLabels: Record<string, string> = {
      ITEM_FAVORITED: "Tin yêu thích",
      ITEM_COMMENTED: "Bình luận mới",
      ITEM_REPORTED: "Bài viết bị báo cáo",
      GIVEAWAY_REQUEST: "Yêu cầu tặng",
      SYSTEM: "Thông báo hệ thống",
      WALLET_DEPOSIT_SUCCESS: "Nạp tiền thành công",
      WALLET_DEDUCTION: "Trừ tiền",
    };

    return {
      title: typeLabels[notif.type] || "Thông báo",
      desc: notif.content,
    };
  };

  const handleNotificationClick = async (id: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(id);
    }
  };

  return (
    <div className="relative" ref={notifRef}>
      <button
        onClick={() => setNotifOpen(!notifOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600"
        title="Thông báo"
      >
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <Bell size={18} />
        </Badge>
      </button>

      {notifOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => void markAllAsRead()}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  Đánh dấu đã đọc tất cả
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-slate-50 rounded-xl">
              <button
                onClick={() => {
                  setNotifFilter("all");
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  notifFilter === "all"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => {
                  setNotifFilter("unread");
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  notifFilter === "unread"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Chưa đọc ({unreadCount})
              </button>
              <button
                onClick={() => {
                  setNotifFilter("read");
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                  notifFilter === "read"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Đã đọc
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Spin />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-8">
                <Empty
                  description="Không có thông báo"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const { bg, text } = getTypeColor(notif.type);
                const { title, desc } = getNotificationContent(notif);
                const time = new Date(notif.createdAt).toLocaleString("vi-VN");

                return (
                  <div
                    key={notif.id}
                    onClick={() =>
                      void handleNotificationClick(notif.id, notif.isRead)
                    }
                    className={`px-5 py-4 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0 ${
                      !notif.isRead ? "bg-emerald-50/30" : ""
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${bg} ${text}`}
                    >
                      <ShieldCheck size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm ${notif.isRead ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}
                        >
                          {title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {desc}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        {time}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 text-center bg-slate-50/50">
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
              Xem tất cả
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
