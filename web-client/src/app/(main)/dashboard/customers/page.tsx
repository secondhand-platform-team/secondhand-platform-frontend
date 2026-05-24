"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Spin, App, Tag, Empty, Input, Drawer, Avatar, Statistic } from "antd";
import {
  Users,
  Search,
  ShoppingBag,
  Package,
  Clock,
  TrendingUp,
  MessageCircle,
  ChevronRight,
  Star,
  CreditCard,
  User,
  Eye,
  Crown,
  Award,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/stores/hooks";
import { createConversation } from "@/stores/slices/chat.slice";
import { chatService } from "@/stores/slices/chat.slice";
import { orderService } from "@/stores/slices/order.slice";
import type { UserProfileApiResponseType } from "@/types/user.type";

import type { OrderType } from "@/types/order.type";
import type { CustomerData } from "@/types/customer.type";

// ====================================================================
// Status Constants
// ====================================================================

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Chờ thanh toán", color: "orange" },
  PAID: { label: "Đã thanh toán", color: "cyan" },
  PREPARING: { label: "Đang chuẩn bị", color: "blue" },
  HANDOVER_TO_SHIPPER: { label: "Giao shipper", color: "geekblue" },
  IN_TRANSIT: { label: "Đang giao", color: "processing" },
  DELIVERED: { label: "Đã giao", color: "lime" },
  RECEIVED: { label: "Đã nhận", color: "green" },
  COMPLETED: { label: "Hoàn tất", color: "green" },
  CANCELLED: { label: "Đã hủy", color: "red" },
  DISPUTED: { label: "Tranh chấp", color: "volcano" },
};

const FILTER_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "LOYAL", label: "Khách quen (≥2 đơn)" },
  { key: "NEW", label: "Khách mới" },
];

// ====================================================================
// Component
// ====================================================================

export default function CustomersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuth, loading: authLoading, user } = useAppSelector(
    (s) => s.auth,
  );
  const { message: messageApi } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(p);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  // ================================================================
  // Load seller orders → extract unique buyers → fetch profiles
  // ================================================================

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const orders = await orderService.getSellerOrders();

      // Group orders by buyerId
      const buyerMap = new Map<
        string,
        {
          buyerId: string;
          orders: OrderType[];
          totalSpent: number;
          completedOrders: number;
          cancelledOrders: number;
          lastOrderDate: string;
        }
      >();

      for (const order of orders) {
        if (!order.buyerId) continue;
        const existing = buyerMap.get(order.buyerId);
        if (existing) {
          existing.orders.push(order);
          existing.totalSpent += order.totalPrice || 0;
          if (order.status === "COMPLETED" || order.status === "RECEIVED")
            existing.completedOrders++;
          if (order.status === "CANCELLED") existing.cancelledOrders++;
          if (order.createdAt > existing.lastOrderDate)
            existing.lastOrderDate = order.createdAt;
        } else {
          buyerMap.set(order.buyerId, {
            buyerId: order.buyerId,
            orders: [order],
            totalSpent: order.totalPrice || 0,
            completedOrders:
              order.status === "COMPLETED" || order.status === "RECEIVED"
                ? 1
                : 0,
            cancelledOrders: order.status === "CANCELLED" ? 1 : 0,
            lastOrderDate: order.createdAt,
          });
        }
      }

      // Fetch profiles for each unique buyer
      const buyerIds = Array.from(buyerMap.keys());
      const profileMap = new Map<
        string,
        { name: string; avatar: string; email: string; bio: string }
      >();

      await Promise.all(
        buyerIds.map(async (buyerId) => {
          try {
            const profile =
              await chatService.getUserProfileByUserId(buyerId);
            profileMap.set(buyerId, {
              name:
                profile.user_profile?.fullName ||
                `Khách hàng ${buyerId.substring(0, 6)}`,
              avatar: profile.user_profile?.avatarUrl || "",
              email: profile.user?.email || "",
              bio: profile.user_profile?.bio || "",
            });
          } catch {
            profileMap.set(buyerId, {
              name: `Khách hàng ${buyerId.substring(0, 6)}`,
              avatar: "",
              email: "",
              bio: "",
            });
          }
        }),
      );

      // Build customer list
      const customerList: CustomerData[] = Array.from(buyerMap.values())
        .map((data) => {
          const profile = profileMap.get(data.buyerId);
          return {
            buyerId: data.buyerId,
            buyerName: profile?.name || `Khách hàng ${data.buyerId.substring(0, 6)}`,
            buyerAvatar: profile?.avatar || "",
            buyerEmail: profile?.email || "",
            buyerBio: profile?.bio || "",
            totalOrders: data.orders.length,
            totalSpent: data.totalSpent,
            completedOrders: data.completedOrders,
            cancelledOrders: data.cancelledOrders,
            lastOrderDate: data.lastOrderDate,
            orders: data.orders.sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            ),
          };
        })
        .sort((a, b) => b.totalSpent - a.totalSpent); // Sort by total spent descending

      setCustomers(customerList);
    } catch {
      messageApi.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  }, [messageApi]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuth) {
      router.push("/home");
      return;
    }
    loadCustomers();
  }, [isAuth, authLoading, router, loadCustomers]);

  // ================================================================
  // Filters
  // ================================================================

  const filteredCustomers = useMemo(() => {
    let list = customers;

    // Filter by tab
    if (filterTab === "LOYAL") {
      list = list.filter((c) => c.totalOrders >= 2);
    } else if (filterTab === "NEW") {
      list = list.filter((c) => c.totalOrders === 1);
    }

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.buyerName.toLowerCase().includes(q) ||
          c.buyerEmail.toLowerCase().includes(q) ||
          c.buyerId.toLowerCase().includes(q),
      );
    }

    return list;
  }, [customers, filterTab, searchTerm]);

  // ================================================================
  // Stats
  // ================================================================

  const totalCustomers = customers.length;
  const loyalCustomers = customers.filter((c) => c.totalOrders >= 2).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  // ================================================================
  // Actions
  // ================================================================

  const handleChat = async (customer: CustomerData) => {
    try {
      await dispatch(
        createConversation({
          participantId: customer.buyerId,
          participantName: customer.buyerName,
          participantAvatar: customer.buyerAvatar,
        }),
      ).unwrap();
      router.push("/chat");
    } catch {
      messageApi.error("Không thể mở trò chuyện");
    }
  };

  const openDetail = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setDrawerOpen(true);
  };

  // Get customer tier
  const getCustomerTier = (c: CustomerData) => {
    if (c.totalOrders >= 5) return { label: "VIP", color: "text-amber-500", bg: "bg-amber-50", icon: <Crown className="w-3.5 h-3.5" /> };
    if (c.totalOrders >= 2) return { label: "Khách quen", color: "text-emerald-600", bg: "bg-emerald-50", icon: <Award className="w-3.5 h-3.5" /> };
    return { label: "Mới", color: "text-blue-600", bg: "bg-blue-50", icon: <Star className="w-3.5 h-3.5" /> };
  };

  // ================================================================
  // Render
  // ================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-r from-violet-400 to-emerald-400 rounded-b-[50%] opacity-10 pointer-events-none" />

        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-6">
            <Users className="w-6 h-6 text-emerald-500" /> Quản lý khách hàng
          </h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 font-medium">
                    Tổng khách hàng
                  </p>
                  <p className="text-2xl font-black text-emerald-700">
                    {totalCustomers}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-medium">
                    Khách quen / VIP
                  </p>
                  <p className="text-2xl font-black text-amber-700">
                    {loyalCustomers}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium">
                    Tổng doanh thu
                  </p>
                  <p className="text-xl font-black text-blue-700">
                    {formatPrice(totalRevenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs + Search */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilterTab(tab.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filterTab === tab.key
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm border"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-emerald-300"
                  }`}
                >
                  {tab.label}
                  {tab.key === "ALL" && (
                    <span className="ml-1 text-xs opacity-75">
                      ({totalCustomers})
                    </span>
                  )}
                  {tab.key === "LOYAL" && (
                    <span className="ml-1 text-xs opacity-75">
                      ({loyalCustomers})
                    </span>
                  )}
                  {tab.key === "NEW" && (
                    <span className="ml-1 text-xs opacity-75">
                      ({totalCustomers - loyalCustomers})
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex-1 w-full sm:max-w-xs ml-auto">
              <Input
                placeholder="Tìm kiếm khách hàng..."
                prefix={<Search className="w-4 h-4 text-slate-400" />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="!rounded-xl"
                size="large"
                allowClear
              />
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16">
            <Empty
              description={
                <span className="text-slate-500">
                  {searchTerm
                    ? "Không tìm thấy khách hàng nào"
                    : "Chưa có khách hàng nào. Khi có người mua hàng của bạn, họ sẽ xuất hiện ở đây."}
                </span>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredCustomers.map((customer, idx) => {
              const tier = getCustomerTier(customer);
              return (
                <div
                  key={customer.buyerId}
                  className="px-6 py-5 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank Badge (for top customers) */}
                    <div className="w-7 text-center shrink-0">
                      {idx < 3 ? (
                        <span
                          className={`text-sm font-black ${
                            idx === 0
                              ? "text-amber-500"
                              : idx === 1
                                ? "text-slate-400"
                                : "text-amber-700"
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">
                          #{idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {customer.buyerAvatar ? (
                        <img
                          src={customer.buyerAvatar}
                          alt={customer.buyerName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
                          {customer.buyerName[0]?.toUpperCase() || "K"}
                        </div>
                      )}
                      {customer.totalOrders >= 5 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-slate-800 truncate">
                          {customer.buyerName}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${tier.color} ${tier.bg}`}
                        >
                          {tier.icon}
                          {tier.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {customer.buyerEmail && (
                          <span className="truncate max-w-[150px]">
                            {customer.buyerEmail}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(customer.lastOrderDate)}
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 font-medium">
                          Đơn hàng
                        </p>
                        <p className="text-lg font-bold text-slate-700">
                          {customer.totalOrders}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-400 font-medium">
                          Tổng chi
                        </p>
                        <p className="text-sm font-bold text-emerald-600">
                          {formatPrice(customer.totalSpent)}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleChat(customer)}
                        className="w-9 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-colors"
                        title="Nhắn tin"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDetail(customer)}
                        className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mobile stats */}
                  <div className="md:hidden flex items-center gap-4 mt-3 ml-[76px] text-xs">
                    <span className="text-slate-500">
                      <span className="font-bold text-slate-700">
                        {customer.totalOrders}
                      </span>{" "}
                      đơn hàng
                    </span>
                    <span className="text-emerald-600 font-bold">
                      {formatPrice(customer.totalSpent)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Detail Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-lg">Chi tiết khách hàng</span>
          </div>
        }
        placement="right"
        size="large"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3" />
              <div className="flex items-center gap-4 relative z-10">
                {selectedCustomer.buyerAvatar ? (
                  <img
                    src={selectedCustomer.buyerAvatar}
                    alt={selectedCustomer.buyerName}
                    className="w-16 h-16 rounded-full object-cover border-3 border-white/40 shadow-lg"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shadow-lg">
                    {selectedCustomer.buyerName[0]?.toUpperCase() || "K"}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedCustomer.buyerName}
                  </h3>
                  {selectedCustomer.buyerEmail && (
                    <p className="text-white/70 text-sm mt-0.5">
                      {selectedCustomer.buyerEmail}
                    </p>
                  )}
                  <div className="mt-2">
                    {(() => {
                      const tier = getCustomerTier(selectedCustomer);
                      return (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 flex items-center gap-1 w-fit">
                          {tier.icon}
                          {tier.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                <p className="text-2xl font-black text-emerald-700">
                  {selectedCustomer.totalOrders}
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  Tổng đơn hàng
                </p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                <p className="text-lg font-black text-blue-700">
                  {formatPrice(selectedCustomer.totalSpent)}
                </p>
                <p className="text-xs text-blue-600 font-medium mt-1">
                  Tổng chi tiêu
                </p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
                <p className="text-2xl font-black text-green-700">
                  {selectedCustomer.completedOrders}
                </p>
                <p className="text-xs text-green-600 font-medium mt-1">
                  Đơn hoàn tất
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-center">
                <p className="text-2xl font-black text-red-600">
                  {selectedCustomer.cancelledOrders}
                </p>
                <p className="text-xs text-red-500 font-medium mt-1">
                  Đơn đã hủy
                </p>
              </div>
            </div>

            {/* Chat Button */}
            <button
              onClick={() => handleChat(selectedCustomer)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl font-bold transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              Nhắn tin cho khách hàng
            </button>

            {/* Bio / About */}
            <div>
              <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Giới thiệu bản thân
              </h4>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className={`text-sm leading-relaxed ${selectedCustomer.buyerBio ? "text-slate-600" : "text-slate-400 italic"}`}>
                  {selectedCustomer.buyerBio || "Khách hàng này chưa viết lời giới thiệu."}
                </p>
              </div>
            </div>

            {/* Order History */}
            <div>
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                Lịch sử đơn hàng ({selectedCustomer.orders.length})
              </h4>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {selectedCustomer.orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] || {
                    label: order.status,
                    color: "default",
                  };
                  const item = order.orderItems?.[0];
                  return (
                    <div
                      key={order.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-400 font-mono">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </span>
                        <Tag color={statusInfo.color} className="m-0 text-xs">
                          {statusInfo.label}
                        </Tag>
                      </div>
                      {item && (
                        <div className="flex gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-slate-100 shrink-0">
                            {item.itemImageUrl ? (
                              <img
                                src={item.itemImageUrl}
                                alt={item.itemName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {item.itemName}
                            </p>
                            <p className="text-sm font-bold text-emerald-600">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                        <span>{formatDate(order.createdAt)}</span>
                        <span className="font-medium text-slate-500">
                          {order.receiverName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
