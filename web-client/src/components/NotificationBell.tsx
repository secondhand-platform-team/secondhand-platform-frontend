"use client";

import { useState, useEffect, useRef } from "react";
import { Badge, Empty, Spin } from "antd";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/types/notification.type";
import { Bell, Heart, MessageSquare, AlertTriangle, Gift, Info, ArrowDownToLine, ArrowUpFromLine, X, Package, Truck, CheckCircle2, XCircle, ShieldCheck, Lock, RefreshCcw, DollarSign } from "lucide-react";

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
    deleteNotification,
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
   * Map notification type to icon and color
   */
  const getTypeInfo = (type: string) => {
    switch (type) {
      case "ITEM_FAVORITED":
        return { bg: "bg-pink-50", text: "text-pink-400", Icon: Heart };
      case "ITEM_COMMENTED":
        return { bg: "bg-blue-50", text: "text-blue-400", Icon: MessageSquare };
      case "GIVEAWAY_REQUEST":
        return { bg: "bg-teal-50", text: "text-teal-400", Icon: Gift };
      case "WALLET_DEPOSIT_SUCCESS":
      case "ESCROW_RELEASED":
        return { bg: "bg-emerald-50", text: "text-emerald-500", Icon: ArrowDownToLine };
      case "WALLET_DEDUCTION":
        return { bg: "bg-orange-50", text: "text-orange-400", Icon: ArrowUpFromLine };
      case "ESCROW_HOLD":
        return { bg: "bg-amber-50", text: "text-amber-500", Icon: Lock };
      case "ESCROW_REFUNDED":
        return { bg: "bg-blue-50", text: "text-blue-500", Icon: RefreshCcw };
      case "ORDER_CREATED":
      case "ORDER_NEW_FOR_SELLER":
        return { bg: "bg-emerald-50", text: "text-emerald-500", Icon: Package };
      case "ORDER_PREPARING":
      case "ORDER_HANDOVER":
      case "ORDER_IN_TRANSIT":
      case "ORDER_DELIVERED":
        return { bg: "bg-blue-50", text: "text-blue-500", Icon: Truck };
      case "ORDER_RECEIVED":
      case "ORDER_COMPLETED":
      case "ORDER_AUTO_COMPLETED":
        return { bg: "bg-green-50", text: "text-green-500", Icon: CheckCircle2 };
      case "ORDER_CANCELLED":
        return { bg: "bg-red-50", text: "text-red-500", Icon: XCircle };
      case "ITEM_REPORTED":
      case "ORDER_DISPUTED":
        return { bg: "bg-red-50", text: "text-red-500", Icon: AlertTriangle };
      case "ORDER_DISPUTE_RESOLVED":
        return { bg: "bg-emerald-50", text: "text-emerald-500", Icon: ShieldCheck };
      case "SYSTEM":
      default:
        return { bg: "bg-slate-50", text: "text-slate-400", Icon: Info };
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
      ORDER_CREATED: "Đặt hàng thành công",
      ORDER_NEW_FOR_SELLER: "Đơn hàng mới",
      ORDER_PREPARING: "Đang chuẩn bị hàng",
      ORDER_HANDOVER: "Đã giao cho shipper",
      ORDER_IN_TRANSIT: "Đang vận chuyển",
      ORDER_DELIVERED: "Giao hàng thành công",
      ORDER_RECEIVED: "Đã nhận hàng",
      ORDER_COMPLETED: "Đơn hàng hoàn tất",
      ORDER_CANCELLED: "Đơn hàng đã hủy",
      ORDER_DISPUTED: "Khiếu nại đơn hàng",
      ORDER_DISPUTE_RESOLVED: "Đã giải quyết khiếu nại",
      ORDER_AUTO_COMPLETED: "Tự động hoàn tất",
      ESCROW_HOLD: "Tạm giữ tiền",
      ESCROW_RELEASED: "Tiền đã được chuyển vào ví",
      ESCROW_REFUNDED: "Hoàn tiền",
      ORDER_STATUS: "Cập nhật đơn hàng"
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotification(id);
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
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${notifFilter === "all"
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
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${notifFilter === "unread"
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
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${notifFilter === "read"
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
                const { bg, text, Icon } = getTypeInfo(notif.type);
                const { title, desc } = getNotificationContent(notif);
                const time = new Date(notif.createdAt).toLocaleString("vi-VN");

                return (
                  <div
                    key={notif.id}
                    onClick={() =>
                      void handleNotificationClick(notif.id, notif.isRead)
                    }
                    className={`group px-5 py-4 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0 relative ${!notif.isRead ? "bg-emerald-50/20" : ""
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${bg} ${text}`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <div className="flex items-center gap-2 mb-1">
                        <p
                          className={`text-sm flex-1 ${notif.isRead ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}
                        >
                          {title}
                        </p>
                        {!notif.isRead && (
                          <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {desc}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 font-medium">
                        {time}
                      </p>
                    </div>

                    {/* Delete button (visible on hover) */}
                    <button
                      onClick={(e) => void handleDelete(e, notif.id)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-10"
                      title="Xóa thông báo"
                    >
                      <X size={16} />
                    </button>
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
