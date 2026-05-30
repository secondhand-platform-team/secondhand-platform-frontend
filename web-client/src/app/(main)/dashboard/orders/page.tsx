"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spin, App, Modal, Tag, Empty, Input } from "antd";
import {
  ClipboardList, ChevronRight, Package, Truck, CheckCircle2,
  Clock, XCircle, Eye, MapPin, CreditCard, User, Phone,
  AlertTriangle, ShieldCheck, ArrowRight,
} from "lucide-react";
import { useAppSelector } from "@/stores/hooks";
import { orderService } from "@/stores/slices/order.slice";
import { chatService } from "@/stores/slices/chat.slice";
import ReviewModal from "@/components/ReviewModal";
import http from "@/utils/api";

import type { OrderType, OrderItemType, ShipmentType } from "@/types/order.type";



// ====================================================================
// Constants
// ====================================================================

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING_PAYMENT: { label: "Chờ thanh toán", color: "orange", icon: <Clock className="w-3.5 h-3.5" /> },
  PAID: { label: "Đã thanh toán", color: "cyan", icon: <CreditCard className="w-3.5 h-3.5" /> },
  PREPARING: { label: "Đang chuẩn bị", color: "blue", icon: <Package className="w-3.5 h-3.5" /> },
  HANDOVER_TO_SHIPPER: { label: "Đã giao shipper", color: "geekblue", icon: <Package className="w-3.5 h-3.5" /> },
  IN_TRANSIT: { label: "Đang giao", color: "processing", icon: <Truck className="w-3.5 h-3.5" /> },
  DELIVERED: { label: "Đã giao", color: "lime", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  RECEIVED: { label: "Đã nhận hàng", color: "green", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  COMPLETED: { label: "Hoàn tất", color: "green", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  CANCELLED: { label: "Đã hủy", color: "red", icon: <XCircle className="w-3.5 h-3.5" /> },
  DISPUTED: { label: "Tranh chấp", color: "volcano", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

const TAB_FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PAID", label: "Chờ xử lý" },
  { key: "PREPARING", label: "Đang chuẩn bị" },
  { key: "IN_TRANSIT", label: "Đang giao" },
  { key: "DELIVERED", label: "Đã giao" },
  { key: "COMPLETED", label: "Hoàn tất" },
  { key: "CANCELLED", label: "Đã hủy" },
  { key: "DISPUTED", label: "Tranh chấp" },
];

const PROGRESS_STEPS = [
  { key: "PAID", label: "Thanh toán" },
  { key: "PREPARING", label: "Chuẩn bị" },
  { key: "HANDOVER_TO_SHIPPER", label: "Giao shipper" },
  { key: "IN_TRANSIT", label: "Đang giao" },
  { key: "DELIVERED", label: "Đã giao" },
  { key: "COMPLETED", label: "Hoàn tất" },
];

function getProgressIndex(status: string): number {
  const idx = PROGRESS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

const getSimulatedTrackingLocations = (order: OrderType) => {
  const list: { time: string; text: string; active?: boolean }[] = [];
  if (!order || !order.shipment) return list;

  const shipment = order.shipment;
  const createdTime = new Date(order.createdAt);
  const shippedTime = shipment.shippedAt ? new Date(shipment.shippedAt) : null;
  const deliveredTime = shipment.deliveredAt ? new Date(shipment.deliveredAt) : null;

  const formatT = (d: Date) => d.toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  });

  list.push({
    time: formatT(createdTime),
    text: "Đơn hàng đã được tạo thành công",
  });

  const prepTime = new Date(createdTime.getTime() + 2 * 60 * 1000);
  if (!shippedTime || prepTime < shippedTime) {
    list.push({
      time: formatT(prepTime),
      text: "Người bán đang chuẩn bị đóng gói hàng",
    });
  }

  if (shippedTime) {
    list.push({
      time: formatT(shippedTime),
      text: `Đã bàn giao cho đơn vị vận chuyển [${shipment.carrier}]`,
    });

    const pickupTime = new Date(shippedTime.getTime() + 15 * 1000);
    if (order.status === "IN_TRANSIT" || order.status === "DELIVERED" || order.status === "RECEIVED" || order.status === "COMPLETED") {
      list.push({
        time: formatT(pickupTime),
        text: "Shipper đã lấy hàng thành công. Đang di chuyển tới kho trung chuyển",
      });

      const sortingTime = new Date(shippedTime.getTime() + 30 * 1000);
      list.push({
        time: formatT(sortingTime),
        text: "Hàng đã đến kho phân loại trung tâm. Sẵn sàng vận chuyển",
      });
    }

    if (order.status === "DELIVERED" || order.status === "RECEIVED" || order.status === "COMPLETED") {
      const deliveredDate = deliveredTime ? deliveredTime : new Date(shippedTime.getTime() + 60 * 1000);
      const deliveryTripTime = new Date(deliveredDate.getTime() - 15 * 1000);
      list.push({
        time: formatT(deliveryTripTime),
        text: "Shipper đang trên đường giao sản phẩm đến địa chỉ của bạn",
      });

      list.push({
        time: formatT(deliveredDate),
        text: "Đã giao thành công tại địa chỉ người nhận",
        active: true,
      });
    }
  }

  if (list.length > 0 && !list[list.length - 1].active) {
    list[list.length - 1].active = true;
  }

  return list.reverse();
};

// ====================================================================
// Page Component
// ====================================================================

export default function OrderHistoryPage() {
  const router = useRouter();
  const { isAuth, loading: authLoading } = useAppSelector((s) => s.auth);
  const { message: messageApi } = App.useApp();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [detailOrder, setDetailOrder] = useState<OrderType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"BUY" | "SELL">("BUY");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState("");

  // Seller profile info
  const [sellerProfile, setSellerProfile] = useState<any | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);

  // Seller handover form
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverOrderId, setHandoverOrderId] = useState("");
  const [handoverCarrier, setHandoverCarrier] = useState("GHN");
  const [handoverTrackingCode, setHandoverTrackingCode] = useState("");

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewOrderId, setReviewOrderId] = useState("");
  const [reviewedItemIds, setReviewedItemIds] = useState<string[]>([]);

  const openDetail = async (order: OrderType) => {
    setDetailOrder(order);
    setDetailOpen(true);
    setSellerProfile(null);
    if (order.sellerId) {
      try {
        setSellerLoading(true);
        const profile = await chatService.getUserProfileByUserId(order.sellerId);
        setSellerProfile(profile);
      } catch (err) {
        console.error("Failed to load seller profile:", err);
      } finally {
        setSellerLoading(false);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !isAuth) router.push("/home");
  }, [isAuth, authLoading, router, mounted]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = viewMode === "BUY"
        ? await orderService.getBuyerOrders()
        : await orderService.getSellerOrders();
      setOrders(data);
    } catch {
      messageApi.error("Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [viewMode, messageApi]);

  const fetchReviewedItems = useCallback(async () => {
    try {
      const ids = await http.get<string[]>("/core/api/reviews/reviewed-items");
      setReviewedItemIds(ids);
    } catch (err) {
      console.error("Failed to fetch reviewed items:", err);
    }
  }, []);

  useEffect(() => {
    if (isAuth) {
      fetchOrders();
      if (viewMode === "BUY") {
        fetchReviewedItems();
      }
    }
  }, [isAuth, fetchOrders, fetchReviewedItems, viewMode]);

  // ====================================================================
  // Actions
  // ====================================================================

  const handleAction = async (
    orderId: string,
    action: string,
    body?: Record<string, unknown>
  ) => {
    try {
      setActionLoading(true);
      await orderService.actionOrder(action, body);
      messageApi.success("Thao tác thành công!");
      fetchOrders();
    } catch {
      messageApi.error("Thao tác thất bại!");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBuyer = (orderId: string) => {
    Modal.confirm({
      title: "Hủy đơn hàng?",
      content: "Tiền sẽ được hoàn vào ví của bạn (nếu đã thanh toán).",
      okText: "Hủy đơn",
      cancelText: "Không",
      okButtonProps: { danger: true },
      onOk: () => handleAction(orderId, `/${orderId}/cancel`),
    });
  };

  const handleRepay = async (orderId: string, itemId: string) => {
    try {
      setActionLoading(true);
      await orderService.actionOrder(`/${orderId}/cancel`);
      router.push(`/checkout?itemIds=${itemId}`);
    } catch {
      messageApi.error("Không thể khởi tạo lại thanh toán!");
    } finally {
      setActionLoading(false);
      fetchOrders();
    }
  };

  const handleConfirmReceived = (orderId: string) => {
    Modal.confirm({
      title: "Xác nhận đã nhận hàng?",
      content: "Tiền sẽ được chuyển cho người bán sau khi bạn xác nhận.",
      okText: "Đã nhận hàng",
      cancelText: "Chưa",
      onOk: () => handleAction(orderId, `/${orderId}/received`),
    });
  };

  const openDisputeModal = (orderId: string) => {
    setDisputeOrderId(orderId);
    setDisputeReason("");
    setDisputeModalOpen(true);
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      messageApi.warning("Vui lòng nhập lý do khiếu nại.");
      return;
    }
    await handleAction(disputeOrderId, `/${disputeOrderId}/dispute`, { reason: disputeReason });
    setDisputeModalOpen(false);
  };

  // Seller actions
  const handleConfirmPreparing = (orderId: string) => {
    handleAction(orderId, `/seller/${orderId}/preparing`);
  };

  const openHandoverModal = (orderId: string) => {
    setHandoverOrderId(orderId);
    setHandoverCarrier("GHN");
    setHandoverTrackingCode("");
    setHandoverModalOpen(true);
  };

  const handleHandover = async () => {
    if (!handoverTrackingCode.trim()) {
      messageApi.warning("Vui lòng nhập mã vận đơn.");
      return;
    }
    await handleAction(handoverOrderId, `/seller/${handoverOrderId}/handover`, {
      carrier: handoverCarrier,
      trackingCode: handoverTrackingCode,
    });
    setHandoverModalOpen(false);
  };

  const handleCancelSeller = (orderId: string) => {
    Modal.confirm({
      title: "Hủy đơn hàng?",
      content: "Tiền sẽ được hoàn cho người mua.",
      okText: "Hủy đơn",
      cancelText: "Không",
      okButtonProps: { danger: true },
      onOk: () => handleAction(orderId, `/seller/${orderId}/cancel`),
    });
  };

  const openReviewModal = (orderId: string) => {
    setReviewOrderId(orderId);
    setReviewModalOpen(true);
  };

  const openReviewModalFromList = async (order: OrderType) => {
    setDetailOrder(order);
    setReviewOrderId(order.id);
    setReviewModalOpen(true);
    setSellerProfile(null);
    if (order.sellerId) {
      try {
        setSellerLoading(true);
        const profile = await chatService.getUserProfileByUserId(order.sellerId);
        setSellerProfile(profile);
      } catch (err) {
        console.error("Failed to load seller profile:", err);
      } finally {
        setSellerLoading(false);
      }
    }
  };

  const handleReviewSuccess = () => {
    setReviewModalOpen(false);
    fetchOrders();
    fetchReviewedItems();
  };

  // ====================================================================
  // Filter & Render
  // ====================================================================

  const filteredOrders = activeTab === "ALL"
    ? orders
    : orders.filter((o) => o.status === activeTab);

  const formatPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (!mounted || authLoading || !isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Đơn hàng</span>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
            </div>
            {viewMode === "BUY" ? "Đơn mua của tôi" : "Đơn bán của tôi"}
          </h1>

          {/* Seller Stats */}
          {viewMode === "SELL" && (
            <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border shadow-sm">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 font-medium">Cần chuẩn bị</span>
                <span className="text-lg font-bold text-amber-600">
                  {orders.filter(o => o.status === "PAID").length}
                </span>
              </div>
              <div className="w-px h-8 bg-gray-200"></div>
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 font-medium">Đang giao</span>
                <span className="text-lg font-bold text-blue-600">
                  {orders.filter(o => o.status === "IN_TRANSIT" || o.status === "HANDOVER_TO_SHIPPER").length}
                </span>
              </div>
            </div>
          )}

          {/* Toggle BUY / SELL */}
          <div className="flex bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
            <button
              className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === "BUY" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-50 hover:text-emerald-600"}`}
              onClick={() => { setViewMode("BUY"); setActiveTab("ALL"); }}
            >
              Đơn mua
            </button>
            <button
              className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${viewMode === "SELL" ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-50 hover:text-emerald-600"}`}
              onClick={() => { setViewMode("SELL"); setActiveTab("ALL"); }}
            >
              Đơn bán
            </button>
          </div>
        </div>

        {/* Tab filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {TAB_FILTERS.map((tab) => (
            <button
              key={tab.key}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm border"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-emerald-300"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              {tab.key !== "ALL" && (
                <span className="ml-1 text-xs opacity-75">
                  ({orders.filter((o) => o.status === tab.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Spin size="large" />
          </div>
        )}

        {/* Empty */}
        {!loading && filteredOrders.length === 0 && (
          <Empty description="Không có đơn hàng nào" className="py-16" />
        )}

        {/* Order list */}
        {!loading && filteredOrders.map((order) => {
          const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "default", icon: null };
          const item = order.orderItems?.[0];
          const progressIdx = getProgressIndex(order.status);

          return (
            <div key={order.id} className="bg-white rounded-xl border mb-4 overflow-hidden shadow-sm hover:shadow-md transition">
              {/* Order header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Đơn #{order.id.substring(0, 8).toUpperCase()}</span>
                  <Tag color={statusInfo.color} className="flex items-center gap-1 m-0">
                    {statusInfo.icon} {statusInfo.label}
                  </Tag>
                </div>
                <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
              </div>

              {/* Progress bar (chỉ hiện cho đơn chưa cancel/disputed) */}
              {progressIdx >= 0 && order.status !== "CANCELLED" && order.status !== "DISPUTED" && (
                <div className="px-5 py-3 border-b">
                  <div className="flex items-center gap-1">
                    {PROGRESS_STEPS.map((step, i) => {
                      const active = i <= progressIdx;
                      return (
                        <React.Fragment key={step.key}>
                          <div className={`flex items-center gap-1 text-xs ${active ? "text-emerald-600 font-medium" : "text-gray-400"}`}>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-colors ${
                              active ? "bg-emerald-500 text-white shadow-sm" : "bg-gray-100 text-gray-400"
                            }`}>
                              {i + 1}
                            </div>
                            <span className="hidden sm:inline">{step.label}</span>
                          </div>
                          {i < PROGRESS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 transition-colors ${i < progressIdx ? "bg-emerald-500" : "bg-gray-200"}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order item */}
              <div className="px-5 py-4">
                {item && (
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.itemImageUrl ? (
                        <img src={item.itemImageUrl} alt={item.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{item.itemName}</h3>
                      <p className="text-lg font-bold text-red-600 mt-1">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                )}

                {order.shipment && (
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold">{order.shipment.carrier}</span>
                      <span className="text-slate-400">• <span className="font-medium text-emerald-600">{order.shipment.trackingCode}</span></span>
                    </div>
                    {order.shipment.currentLocation && (
                      <p className="text-slate-500 mt-1 text-xs ml-6">{order.shipment.currentLocation}</p>
                    )}
                  </div>
                )}

                {/* Cancel / Dispute reason */}
                {order.cancelReason && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                    <strong>Lý do hủy:</strong> {order.cancelReason}
                  </div>
                )}
                {order.disputeReason && (
                  <div className="mt-3 p-3 bg-orange-50 rounded-lg text-sm text-orange-700">
                    <strong>Lý do khiếu nại:</strong> {order.disputeReason}
                  </div>
                )}

                {/* Auto-complete countdown */}
                {order.status === "DELIVERED" && order.autoCompleteAt && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Đơn hàng sẽ tự động hoàn tất vào {formatDate(order.autoCompleteAt)}</span>
                  </div>
                )}

                {/* COMPLETED message */}
                {order.status === "COMPLETED" && viewMode === "SELL" && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tiền đã được chuyển vào ví của bạn.</span>
                  </div>
                )}
                {order.status === "COMPLETED" && viewMode === "BUY" && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đơn hàng hoàn tất. Tiền đã chuyển cho người bán.</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-5 py-4 bg-gray-50/50 border-t flex items-center justify-between">
                <button
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition flex items-center gap-1.5"
                  onClick={() => openDetail(order)}
                >
                  <Eye className="w-4 h-4" /> Xem chi tiết
                </button>

                <div className="flex gap-2">
                  {/* BUYER actions */}
                  {viewMode === "BUY" && (
                    <>
                      {order.status === "PENDING_PAYMENT" && (
                        <button
                          className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-1.5"
                          onClick={() => handleRepay(order.id, order.orderItems?.[0]?.itemId || "")}
                          disabled={actionLoading}
                        >
                          <CreditCard className="w-4 h-4" /> Thanh toán lại
                        </button>
                      )}
                      {order.status === "PAID" && (
                        <button
                          className="px-4 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                          onClick={() => handleCancelBuyer(order.id)}
                          disabled={actionLoading}
                        >
                          Hủy đơn
                        </button>
                      )}
                      {order.status === "PENDING_PAYMENT" && (
                        <button
                          className="px-4 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                          onClick={() => handleCancelBuyer(order.id)}
                          disabled={actionLoading}
                        >
                          Hủy đơn
                        </button>
                      )}
                      {order.status === "DELIVERED" && (
                        <>
                          <button
                            className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1.5"
                            onClick={() => handleConfirmReceived(order.id)}
                            disabled={actionLoading}
                          >
                            <CheckCircle2 className="w-4 h-4" /> Đã nhận hàng
                          </button>
                          <button
                            className="px-4 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                            onClick={() => openDisputeModal(order.id)}
                            disabled={actionLoading}
                          >
                            Khiếu nại
                          </button>
                        </>
                      )}
                      {order.status === "COMPLETED" && (
                        !reviewedItemIds.includes(order.orderItems?.[0]?.itemId || "") ? (
                          <button
                            className="px-4 py-1.5 text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl hover:shadow-md transition-all flex items-center gap-1.5 font-bold shadow-sm"
                            onClick={() => openReviewModalFromList(order)}
                            disabled={actionLoading}
                          >
                            ⭐ Đánh giá người bán
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 rounded-lg font-medium flex items-center gap-1">
                            ✓ Đã đánh giá
                          </span>
                        )
                      )}
                    </>
                  )}

                  {/* SELLER actions */}
                  {viewMode === "SELL" && (
                    <>
                      {order.status === "PAID" && (
                        <>
                          <button
                            className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 shadow-sm transition-all"
                            onClick={() => handleConfirmPreparing(order.id)}
                            disabled={actionLoading}
                          >
                            Chuẩn bị hàng
                          </button>
                          <button
                            className="px-4 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                            onClick={() => handleCancelSeller(order.id)}
                            disabled={actionLoading}
                          >
                            Hủy đơn
                          </button>
                        </>
                      )}
                      {order.status === "PREPARING" && (
                        <>
                          <button
                            className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 shadow-sm transition-all flex items-center gap-1.5"
                            onClick={() => openHandoverModal(order.id)}
                            disabled={actionLoading}
                          >
                            Giao shipper <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            className="px-4 py-1.5 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition"
                            onClick={() => handleCancelSeller(order.id)}
                            disabled={actionLoading}
                          >
                            Hủy đơn
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ====== Dispute Modal ====== */}
      <Modal
        title="Khiếu nại đơn hàng"
        open={disputeModalOpen}
        onOk={handleDispute}
        onCancel={() => setDisputeModalOpen(false)}
        okText="Gửi khiếu nại"
        cancelText="Hủy"
        confirmLoading={actionLoading}
      >
        <p className="mb-3 text-gray-600">Vui lòng mô tả vấn đề bạn gặp phải:</p>
        <Input.TextArea
          rows={4}
          value={disputeReason}
          onChange={(e) => setDisputeReason(e.target.value)}
          placeholder="Ví dụ: Hàng bị lỗi, sai mô tả, thiếu phụ kiện..."
        />
      </Modal>

      {/* ====== Handover Modal ====== */}
      <Modal
        title={null}
        open={handoverModalOpen}
        onOk={handleHandover}
        onCancel={() => setHandoverModalOpen(false)}
        okText="Xác nhận bàn giao"
        cancelText="Hủy"
        confirmLoading={actionLoading}
        width={520}
        centered
        okButtonProps={{
          className: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl border-none shadow-md shadow-emerald-500/20 px-6 py-2.5 h-auto transition-all"
        }}
        cancelButtonProps={{
          className: "border-slate-200 hover:border-emerald-500 hover:text-emerald-600 font-bold rounded-xl px-6 py-2.5 h-auto transition-all text-slate-500"
        }}
      >
        <div className="-mx-6 -mt-6 mb-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100/50 rounded-t-3xl relative overflow-hidden">
          {/* Subtle design elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-teal-200/20 rounded-full blur-2xl" />
          
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center border border-emerald-100 shrink-0">
              <Truck className="w-6 h-6 text-emerald-600 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md">Quy trình vận đơn</span>
              <h3 className="text-lg font-black text-slate-800 mt-0.5">
                Bàn giao sản phẩm cho Shipper
              </h3>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-1">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chọn đơn vị vận chuyển</label>
            <div className="grid grid-cols-2 gap-3.5">
              {[
                { value: "GHN", label: "Giao Hàng Nhanh", desc: "Độ phủ toàn quốc", color: "from-orange-500 to-amber-500", initials: "GHN" },
                { value: "GHTK", label: "Giao Hàng Tiết Kiệm", desc: "Tối ưu chi phí", color: "from-emerald-500 to-green-500", initials: "GTK" },
                { value: "VNPost", label: "VNPost", desc: "Bưu điện Việt Nam", color: "from-blue-500 to-indigo-500", initials: "VNP" },
                { value: "J&T", label: "J&T Express", desc: "Mạng lưới chuẩn xác", color: "from-red-500 to-rose-500", initials: "J&T" },
                { value: "Grab", label: "Grab Express", desc: "Siêu tốc nội thành", color: "from-emerald-600 to-green-600", initials: "GRB" },
              ].map((c) => {
                const isActive = handoverCarrier === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setHandoverCarrier(c.value)}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                      isActive
                        ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10 shadow-sm"
                        : "border-slate-150 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm`}>
                      {c.initials}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-black truncate ${isActive ? "text-emerald-700" : "text-slate-700"}`}>{c.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{c.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mã vận đơn (Tracking Code)</label>
            <Input
              value={handoverTrackingCode}
              onChange={(e) => setHandoverTrackingCode(e.target.value)}
              placeholder="Nhập mã vận đơn từ nhà vận chuyển (Ví dụ: GHN-12345)..."
              size="large"
              className="rounded-2xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-700 placeholder-slate-400 text-sm py-3 transition"
            />
          </div>
        </div>
      </Modal>

      {/* ====== Detail Modal ====== */}
      <Modal
        title={`Chi tiết đơn hàng #${detailOrder?.id?.substring(0, 8)?.toUpperCase() || ""}`}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={600}
      >
        {detailOrder && (
          <div className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Trạng thái:</span>
              <Tag color={STATUS_MAP[detailOrder.status]?.color || "default"}>
                {STATUS_MAP[detailOrder.status]?.label || detailOrder.status}
              </Tag>
            </div>

            {/* Seller Info */}
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                Người bán / Người đăng tin
              </h4>
              {sellerLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Spin size="small" /> Đang tải thông tin người bán...
                </div>
              ) : sellerProfile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white border shrink-0">
                      {sellerProfile.user_profile?.avatarUrl ? (
                        <img src={sellerProfile.user_profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                          {(sellerProfile.user_profile?.fullName || "U")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{sellerProfile.user_profile?.fullName || "Người dùng ReLife"}</h5>
                      <p className="text-xs text-slate-500">{sellerProfile.user_profile?.city || "Toàn quốc"}</p>
                    </div>
                  </div>
                  <Link
                    href={`/user/${detailOrder.sellerId}`}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-50 transition-all"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  Mã người bán: <span className="font-mono">{detailOrder.sellerId}</span>
                </div>
              )}
            </div>

            {/* Item info */}
            {detailOrder.orderItems?.[0] && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex gap-3">
                  <div className="w-14 h-14 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                    {detailOrder.orderItems[0].itemImageUrl ? (
                      <img src={detailOrder.orderItems[0].itemImageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-400" /></div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{detailOrder.orderItems[0].itemName}</p>
                    <p className="text-red-600 font-bold">{formatPrice(detailOrder.orderItems[0].price)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Receiver info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span>{detailOrder.receiverName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span>{detailOrder.receiverPhone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{detailOrder.shippingAddress}</span>
              </div>
            </div>

            {/* Shipment Routing Timeline */}
            {detailOrder.shipment && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm">
                <p className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <Truck className="w-4 h-4 text-emerald-600 animate-pulse" /> Hành trình vận chuyển (Giả lập Shipper)
                </p>
                
                <div className="mb-4 bg-white p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                  <p><span className="font-semibold text-slate-500">Đơn vị:</span> {detailOrder.shipment.carrier}</p>
                  <p><span className="font-semibold text-slate-500">Mã vận đơn:</span> <span className="text-emerald-600 font-mono font-bold">{detailOrder.shipment.trackingCode}</span></p>
                </div>

                <div className="relative pl-6 border-l border-slate-200 space-y-5 ml-2 mt-2">
                  {getSimulatedTrackingLocations(detailOrder).map((loc, idx) => (
                    <div key={idx} className="relative">
                      {/* Circle Dot */}
                      <span className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-white flex items-center justify-center ${
                        loc.active ? "border-emerald-500 ring-4 ring-emerald-50" : "border-slate-300"
                      }`}>
                        {loc.active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </span>
                      {/* Content */}
                      <div>
                        <p className={`font-semibold text-xs leading-none ${loc.active ? "text-emerald-600" : "text-slate-700"}`}>
                          {loc.text}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">{loc.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-gray-400 space-y-1">
              <p>Tạo lúc: {formatDate(detailOrder.createdAt)}</p>
              <p>Cập nhật: {formatDate(detailOrder.updatedAt)}</p>
            </div>

            {/* Review action - only for DELIVERED orders */}
            {viewMode === "BUY" && (detailOrder.status === "DELIVERED" || detailOrder.status === "RECEIVED" || detailOrder.status === "COMPLETED") && (
              <div className="mt-4 pt-4 border-t flex gap-2">
                {!reviewedItemIds.includes(detailOrder.orderItems?.[0]?.itemId || "") ? (
                  <button
                    onClick={() => openReviewModal(detailOrder.id)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-md transition text-sm font-medium"
                  >
                    ⭐ Đánh giá người bán
                  </button>
                ) : (
                  <div className="flex-1 text-center py-2 bg-gray-100 text-gray-500 rounded-lg text-sm font-medium">
                    ✓ Bạn đã đánh giá sản phẩm này
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      {detailOrder && (
        <ReviewModal
          open={reviewModalOpen}
          itemId={detailOrder.orderItems?.[0]?.itemId || ""}
          sellerId={detailOrder.sellerId || ""}
          sellerName={sellerProfile?.user_profile?.fullName || "Người bán"}
          onClose={() => setReviewModalOpen(false)}
          onSuccess={handleReviewSuccess}
        />
      )}
    </div>
  );
}
