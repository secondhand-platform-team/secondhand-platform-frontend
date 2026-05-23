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
import http from "@/utils/api";

// ====================================================================
// Types
// ====================================================================

interface OrderItemType {
  id: string;
  itemId: string;
  itemName: string;
  sellerId: string;
  price: number;
  itemImageUrl?: string;
}

interface ShipmentType {
  id: string;
  carrier: string;
  trackingCode: string;
  status: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface OrderType {
  id: string;
  buyerId: string;
  sellerId: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  escrowTransactionId?: string;
  autoCompleteAt?: string;
  cancelReason?: string;
  disputeReason?: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItemType[];
  shipment: ShipmentType | null;
}

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

// ====================================================================
// Page Component
// ====================================================================

export default function OrderHistoryPage() {
  const router = useRouter();
  const { isAuth, loading: authLoading } = useAppSelector((s) => s.auth);
  const { message: messageApi } = App.useApp();

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

  // Seller handover form
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverOrderId, setHandoverOrderId] = useState("");
  const [handoverCarrier, setHandoverCarrier] = useState("GHN");
  const [handoverTrackingCode, setHandoverTrackingCode] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuth) router.push("/home");
  }, [isAuth, authLoading, router]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const endpoint = viewMode === "BUY" ? "/order/api/orders/me" : "/order/api/orders/seller";
      const data = await http.get<OrderType[]>(endpoint);
      setOrders(data);
    } catch {
      messageApi.error("Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [viewMode, messageApi]);

  useEffect(() => {
    if (isAuth) fetchOrders();
  }, [isAuth, fetchOrders]);

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
      await http.put(`/order/api/orders${action}`, body || {});
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
      content: "Tiền sẽ được hoàn vào ví của bạn.",
      okText: "Hủy đơn",
      cancelText: "Không",
      okButtonProps: { danger: true },
      onOk: () => handleAction(orderId, `/${orderId}/cancel`),
    });
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

  if (authLoading || !isAuth) {
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
                  onClick={() => { setDetailOrder(order); setDetailOpen(true); }}
                >
                  <Eye className="w-4 h-4" /> Xem chi tiết
                </button>

                <div className="flex gap-2">
                  {/* BUYER actions */}
                  {viewMode === "BUY" && (
                    <>
                      {order.status === "PAID" && (
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
        title="Giao hàng cho shipper"
        open={handoverModalOpen}
        onOk={handleHandover}
        onCancel={() => setHandoverModalOpen(false)}
        okText="Xác nhận giao"
        cancelText="Hủy"
        confirmLoading={actionLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị vận chuyển</label>
            <select
              className="w-full border rounded-lg px-3 py-2"
              value={handoverCarrier}
              onChange={(e) => setHandoverCarrier(e.target.value)}
            >
              <option value="GHN">Giao Hàng Nhanh (GHN)</option>
              <option value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</option>
              <option value="VNPost">VNPost</option>
              <option value="J&T">J&T Express</option>
              <option value="Grab">Grab Express</option>
              <option value="Khác">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mã vận đơn</label>
            <Input
              value={handoverTrackingCode}
              onChange={(e) => setHandoverTrackingCode(e.target.value)}
              placeholder="Nhập mã vận đơn..."
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

            {/* Shipment */}
            {detailOrder.shipment && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-sm">
                <p className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                  <Truck className="w-4 h-4 text-emerald-600" /> Thông tin vận chuyển
                </p>
                <div className="space-y-1.5 text-slate-600 ml-6">
                  <p><span className="font-medium text-slate-500">Đơn vị:</span> {detailOrder.shipment.carrier}</p>
                  <p><span className="font-medium text-slate-500">Mã vận đơn:</span> <span className="text-emerald-600 font-medium">{detailOrder.shipment.trackingCode}</span></p>
                  {detailOrder.shipment.currentLocation && (
                    <p><span className="font-medium text-slate-500">Vị trí:</span> {detailOrder.shipment.currentLocation}</p>
                  )}
                  {detailOrder.shipment.shippedAt && (
                    <p><span className="font-medium text-slate-500">Ngày giao:</span> {formatDate(detailOrder.shipment.shippedAt)}</p>
                  )}
                  {detailOrder.shipment.deliveredAt && (
                    <p><span className="font-medium text-slate-500">Ngày nhận:</span> {formatDate(detailOrder.shipment.deliveredAt)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="text-xs text-gray-400 space-y-1">
              <p>Tạo lúc: {formatDate(detailOrder.createdAt)}</p>
              <p>Cập nhật: {formatDate(detailOrder.updatedAt)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
