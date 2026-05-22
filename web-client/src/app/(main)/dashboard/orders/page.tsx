"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spin, App, Modal, Tag, Empty } from "antd";
import {
  ClipboardList, ChevronRight, Package, Truck, CheckCircle2,
  Clock, XCircle, RotateCcw, Eye, MapPin, CreditCard, User, Phone,
} from "lucide-react";
import { useAppSelector } from "@/stores/hooks";
import http from "@/utils/api";
import { itemService } from "@/stores/slices/items.slice";
import { addItemToCart } from "@/stores/slices/cart.slice";
import { useAppDispatch } from "@/stores/hooks";
import type { ItemWithImages } from "@/types/item.type";

interface OrderItemType {
  id: string;
  itemId: string;
  itemName: string;
  sellerId: string;
  price: number;
  quantity: number;
}

interface PaymentType {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

interface ShipmentType {
  id: string;
  carrier: string;
  trackingCode: string;
  status: string;
  shippedAt?: string;
  deliveredAt?: string;
}

interface OrderType {
  id: string;
  buyerId: string;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
  orderItems: OrderItemType[];
  payment: PaymentType | null;
  shipment: ShipmentType | null;
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Chờ xử lý", color: "orange", icon: <Clock className="w-3.5 h-3.5" /> },
  CONFIRMED: { label: "Đã xác nhận", color: "blue", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  PAID: { label: "Đã thanh toán", color: "cyan", icon: <CreditCard className="w-3.5 h-3.5" /> },
  SHIPPING: { label: "Đang giao", color: "processing", icon: <Truck className="w-3.5 h-3.5" /> },
  DELIVERED: { label: "Đã giao", color: "green", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELLED: { label: "Đã hủy", color: "red", icon: <XCircle className="w-3.5 h-3.5" /> },
  RETURNED: { label: "Trả hàng", color: "purple", icon: <RotateCcw className="w-3.5 h-3.5" /> },
};

const PAYMENT_METHOD_MAP: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng",
  BANK_TRANSFER: "Chuyển khoản ngân hàng",
  MOMO: "Ví MoMo",
  VNPAY: "VNPay",
};

const TAB_FILTERS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Chờ xử lý" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "DELIVERED", label: "Đã giao" },
];

export default function OrderHistoryPage() {
  const router = useRouter();
  const { isAuth, loading: authLoading } = useAppSelector((s) => s.auth);
  const { message: messageApi } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [detailOrder, setDetailOrder] = useState<OrderType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [itemImages, setItemImages] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);
  const dispatch = useAppDispatch();

  // Seller & Shipment states
  const [viewMode, setViewMode] = useState<"BUY" | "SELL">("BUY");
  const [showShipmentForm, setShowShipmentForm] = useState(false);
  const [carrier, setCarrier] = useState("GHTK");
  const [trackingCode, setTrackingCode] = useState("");

  const formatPrice = (p: number) => p.toLocaleString("vi-VN") + "đ";
  const formatDate = (d: string) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const url = viewMode === "BUY" ? "/order/api/orders/me" : "/order/api/orders/seller";
      const data = await http.get<OrderType[]>(url);
      setOrders(data);

      // Load first images for order items
      const imageMap: Record<string, string> = {};
      const allItemIds = new Set<string>();
      data.forEach((o) => o.orderItems.forEach((i) => allItemIds.add(i.itemId)));

      await Promise.all(
        Array.from(allItemIds).map(async (itemId) => {
          try {
            const item = await itemService.getItem(itemId);
            if (item.images?.[0]?.imageUrl) imageMap[itemId] = item.images[0].imageUrl;
          } catch {}
        })
      );
      setItemImages(imageMap);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [viewMode]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuth) { router.push("/home"); return; }
    loadOrders();
  }, [isAuth, authLoading, router, loadOrders]);

  const filteredOrders = activeTab === "ALL" ? orders : orders.filter((o) => o.status === activeTab);

  const getStatusCounts = () => {
    const counts: Record<string, number> = { ALL: orders.length };
    orders.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  };
  const statusCounts = getStatusCounts();

  const openDetail = (order: OrderType) => {
    setDetailOrder(order);
    setShowShipmentForm(false);
    if (order.shipment) {
      setCarrier(order.shipment.carrier || "GHTK");
      setTrackingCode(order.shipment.trackingCode || "");
    } else {
      setCarrier("GHTK");
      setTrackingCode("");
    }
    setDetailOpen(true);
  };

  const handleCancelOrder = () => {
    if (!detailOrder || detailOrder.status !== "PENDING") return;
    Modal.confirm({
      title: "Hủy đơn hàng",
      content: "Bạn có chắc chắn muốn hủy đơn hàng này không? Thao tác này không thể hoàn tác.",
      okText: "Hủy đơn",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          setActionLoading(true);
          await http.put(`/order/api/orders/${detailOrder.id}/cancel`, {});
          messageApi.success("Hủy đơn hàng thành công");
          setDetailOpen(false);
          loadOrders();
        } catch (err: any) {
          messageApi.error(err?.message || "Lỗi khi hủy đơn hàng");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleReturnOrder = () => {
    if (!detailOrder || detailOrder.status !== "DELIVERED") return;
    Modal.confirm({
      title: "Yêu cầu trả hàng",
      content: "Bạn muốn trả lại đơn hàng này? Vui lòng chắc chắn sản phẩm vẫn còn nguyên vẹn.",
      okText: "Xác nhận trả hàng",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          setActionLoading(true);
          await http.put(`/order/api/orders/${detailOrder.id}/return`, {});
          messageApi.success("Yêu cầu trả hàng thành công");
          setDetailOpen(false);
          loadOrders();
        } catch (err: any) {
          messageApi.error(err?.message || "Lỗi khi trả hàng");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleRepurchase = async () => {
    if (!detailOrder) return;
    try {
      setActionLoading(true);
      // Thêm tất cả sản phẩm vào giỏ
      for (const item of detailOrder.orderItems) {
        await dispatch(addItemToCart({
          itemId: item.itemId,
          quantity: item.quantity,
          price: item.price
        })).unwrap();
      }
      messageApi.success("Đã thêm các sản phẩm vào giỏ hàng!");
      router.push("/cart");
    } catch (err: any) {
      messageApi.error(err?.message || "Có lỗi xảy ra khi mua lại");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrderBySeller = () => {
    if (!detailOrder) return;
    Modal.confirm({
      title: "Hủy đơn hàng (Người bán)",
      content: "Bạn có chắc chắn muốn hủy đơn hàng này không? Khách hàng sẽ nhận được thông báo hủy đơn.",
      okText: "Hủy đơn",
      okType: "danger",
      cancelText: "Không",
      onOk: async () => {
        try {
          setActionLoading(true);
          const updatedOrder = await http.put<OrderType>(`/order/api/orders/seller/${detailOrder.id}/cancel`, {});
          messageApi.success("Hủy đơn hàng thành công");
          setDetailOpen(false);
          loadOrders();
        } catch (err: any) {
          messageApi.error(err?.message || "Lỗi khi hủy đơn hàng");
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleCreateShipment = async () => {
    if (!detailOrder) return;
    if (!carrier.trim() || !trackingCode.trim()) {
      messageApi.error("Vui lòng nhập đầy đủ Đơn vị vận chuyển và Mã vận đơn");
      return;
    }
    try {
      setActionLoading(true);
      const updatedOrder = await http.post<OrderType>(`/order/api/orders/seller/${detailOrder.id}/shipment`, {
        carrier,
        trackingCode,
      });
      messageApi.success("Tạo thông tin vận chuyển thành công");
      setShowShipmentForm(false);
      setDetailOrder(updatedOrder);
      loadOrders();
    } catch (err: any) {
      messageApi.error(err?.message || "Lỗi khi tạo thông tin vận chuyển");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateShipmentInfo = async () => {
    if (!detailOrder) return;
    if (!carrier.trim() || !trackingCode.trim()) {
      messageApi.error("Vui lòng nhập đầy đủ Đơn vị vận chuyển và Mã vận đơn");
      return;
    }
    try {
      setActionLoading(true);
      const updatedOrder = await http.put<OrderType>(`/order/api/orders/seller/${detailOrder.id}/shipment`, {
        carrier,
        trackingCode,
      });
      messageApi.success("Cập nhật thông tin vận chuyển thành công");
      setShowShipmentForm(false);
      setDetailOrder(updatedOrder);
      loadOrders();
    } catch (err: any) {
      messageApi.error(err?.message || "Lỗi khi cập nhật thông tin vận chuyển");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateShipmentStatus = async (newShipmentStatus: string) => {
    if (!detailOrder) return;
    try {
      setActionLoading(true);
      const updatedOrder = await http.put<OrderType>(`/order/api/orders/seller/${detailOrder.id}/shipment`, {
        status: newShipmentStatus,
      });
      messageApi.success(`Chuyển trạng thái đơn hàng sang ${newShipmentStatus === "SHIPPING" ? "Đang giao" : "Đã giao"} thành công`);
      setDetailOrder(updatedOrder);
      loadOrders();
    } catch (err: any) {
      messageApi.error(err?.message || "Lỗi khi cập nhật trạng thái vận chuyển");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Spin size="large" />
        <p className="text-slate-500 text-sm font-medium">Đang tải lịch sử đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/home" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-emerald-600 font-semibold">Lịch sử đơn hàng</span>
        </nav>

        {/* Header */}
        <div className="mb-2">
          <h1 className="text-3xl font-black text-slate-900">Lịch sử đơn hàng</h1>
          <p className="text-slate-500 mt-1">Theo dõi và quản lý các đơn mua bán đồ cũ của bạn.</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit mt-6">
          <button
            onClick={() => { setViewMode("BUY"); setActiveTab("ALL"); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              viewMode === "BUY" ? "bg-emerald-500 text-white shadow-md" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Đơn đã mua
          </button>
          <button
            onClick={() => { setViewMode("SELL"); setActiveTab("ALL"); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              viewMode === "SELL" ? "bg-emerald-500 text-white shadow-md" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Package className="w-4 h-4" />
            Đơn đã bán
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 mt-6 mb-6 overflow-x-auto">
          {TAB_FILTERS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.key
                  ? "border-emerald-500 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}>
              {tab.label}
              {(statusCounts[tab.key] ?? 0) > 0 && (
                <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {statusCounts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <ClipboardList className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có đơn hàng nào</h3>
            <p className="text-slate-500 mb-8 max-w-sm">Bạn chưa có đơn hàng nào trong mục này.</p>
            <Link href="/home" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md inline-flex items-center gap-2">
              <Package className="w-5 h-5" /> Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-2">Mã đơn hàng</div>
              <div className="col-span-2">Ngày đặt</div>
              <div className="col-span-3">Sản phẩm</div>
              <div className="col-span-2">Tổng tiền</div>
              <div className="col-span-2">Trạng thái</div>
              <div className="col-span-1 text-right">Thao tác</div>
            </div>

            {/* Table Rows */}
            {filteredOrders.map((order) => {
              const st = STATUS_MAP[order.status] || STATUS_MAP.PENDING;
              const firstItem = order.orderItems[0];
              const extraCount = order.orderItems.length - 1;
              return (
                <div key={order.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 px-6 py-5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors items-center cursor-pointer"
                  onClick={() => openDetail(order)}>
                  {/* Order ID */}
                  <div className="col-span-2">
                    <span className="text-sm font-bold text-emerald-600">#{order.id.substring(0, 8).toUpperCase()}</span>
                  </div>
                  {/* Date */}
                  <div className="col-span-2">
                    <span className="text-sm text-slate-600">{formatDate(order.createdAt)}</span>
                  </div>
                  {/* Product */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {order.orderItems.slice(0, 2).map((item) => (
                        <div key={item.id} className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white bg-slate-100 shrink-0">
                          <img src={itemImages[item.itemId] || "/icon-other/san-pham-khac.png"} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                          +{extraCount}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-slate-700 font-medium line-clamp-1">{firstItem?.itemName || "Sản phẩm"}</span>
                  </div>
                  {/* Total */}
                  <div className="col-span-2">
                    <span className="text-sm font-bold text-slate-800">{formatPrice(order.totalPrice)}</span>
                  </div>
                  {/* Status */}
                  <div className="col-span-2">
                    <Tag color={st.color} className="!rounded-full !px-3 !py-0.5 !text-xs !font-bold !border-0 inline-flex items-center gap-1">
                      {st.icon} {st.label}
                    </Tag>
                  </div>
                  {/* Action */}
                  <div className="col-span-1 text-right">
                    <button className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center gap-1"
                      onClick={(e) => { e.stopPropagation(); openDetail(order); }}>
                      Chi tiết
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={680}
        title={
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Chi tiết đơn hàng</h3>
              <p className="text-xs text-slate-500 font-normal">#{detailOrder?.id.substring(0, 8).toUpperCase()}</p>
            </div>
          </div>
        }
      >
        {detailOrder && (
          <div className="space-y-5 mt-4">
            {/* Status & Date */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <p className="text-xs text-slate-500 font-medium mb-1">Trạng thái</p>
                <Tag color={STATUS_MAP[detailOrder.status]?.color || "default"} className="!rounded-full !px-3 !py-1 !text-sm !font-bold !border-0 inline-flex items-center gap-1.5">
                  {STATUS_MAP[detailOrder.status]?.icon} {STATUS_MAP[detailOrder.status]?.label || detailOrder.status}
                </Tag>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium mb-1">Ngày đặt</p>
                <p className="text-sm font-semibold text-slate-800">{formatDate(detailOrder.createdAt)}</p>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="p-4 border border-slate-200 rounded-xl">
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" /> Thông tin giao hàng
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{detailOrder.receiverName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{detailOrder.receiverPhone}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{detailOrder.shippingAddress}</span>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
              <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" /> Thanh toán
              </h4>
              <p className="text-sm text-slate-600">
                {detailOrder.payment ? PAYMENT_METHOD_MAP[detailOrder.payment.method] || detailOrder.payment.method : "Không rõ"}
              </p>
            </div>

            {/* Shipment Info */}
            {detailOrder.shipment && (
              <div className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm">
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-500" /> Thông tin vận chuyển
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Đơn vị vận chuyển:</span>
                    <span className="font-semibold text-slate-800">{detailOrder.shipment.carrier}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-slate-500">Mã vận đơn:</span>
                    <span className="font-bold text-emerald-600 font-mono">{detailOrder.shipment.trackingCode}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Trạng thái vận chuyển:</span>
                    <span className={`font-semibold px-2.5 py-0.5 rounded-full text-xs ${
                      detailOrder.shipment.status === "DELIVERED" ? "bg-green-50 text-green-700" :
                      detailOrder.shipment.status === "SHIPPING" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {detailOrder.shipment.status === "PREPARING" ? "Đang chuẩn bị" :
                       detailOrder.shipment.status === "SHIPPING" ? "Đang giao" :
                       detailOrder.shipment.status === "DELIVERED" ? "Đã giao" : detailOrder.shipment.status}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Shipment Form */}
            {showShipmentForm && (
              <div className="p-4 border-2 border-emerald-500/20 bg-emerald-50/10 rounded-xl space-y-4 shadow-inner">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-500" /> Nhập thông tin vận chuyển
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Đơn vị vận chuyển</label>
                    <select
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    >
                      <option value="GHTK">Giao Hàng Tiết Kiệm (GHTK)</option>
                      <option value="GHN">Giao Hàng Nhanh (GHN)</option>
                      <option value="Viettel Post">Viettel Post</option>
                      <option value="VNPost">VNPost (Bưu điện VN)</option>
                      <option value="Ninja Van">Ninja Van</option>
                      <option value="J&T Express">J&T Express</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Mã vận đơn</label>
                    <input
                      type="text"
                      placeholder="Nhập mã vận đơn"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setShowShipmentForm(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-all"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={detailOrder.shipment ? handleUpdateShipmentInfo : handleCreateShipment}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold transition-all shadow-sm"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-500" /> Sản phẩm ({detailOrder.orderItems.length})
              </h4>
              <div className="space-y-3">
                {detailOrder.orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-white border border-slate-100 shrink-0">
                      <img src={itemImages[item.itemId] || "/icon-other/san-pham-khac.png"} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.itemName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Số lượng: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-emerald-600 shrink-0">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-xl">
              <span className="text-base font-bold text-slate-800">Tổng cộng</span>
              <span className="text-xl font-black text-emerald-600">{formatPrice(detailOrder.totalPrice)}</span>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200">
              {viewMode === "BUY" ? (
                <>
                  {detailOrder.status === "PENDING" && (
                    <button
                      onClick={handleCancelOrder}
                      disabled={actionLoading}
                      className="w-full py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      Hủy đơn hàng
                    </button>
                  )}

                  {["CONFIRMED", "PAID", "SHIPPING"].includes(detailOrder.status) && (
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium text-center">
                      Đơn hàng đang trong quá trình xử lý và giao hàng, không thể hủy.
                    </div>
                  )}

                  {detailOrder.status === "DELIVERED" && (
                    <button
                      onClick={handleReturnOrder}
                      disabled={actionLoading}
                      className="w-full py-3 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl font-bold transition-colors disabled:opacity-50"
                    >
                      Yêu cầu trả hàng
                    </button>
                  )}

                  {["CANCELLED", "RETURNED"].includes(detailOrder.status) && (
                    <button
                      onClick={handleRepurchase}
                      disabled={actionLoading}
                      className="w-full py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Mua lại đơn hàng
                    </button>
                  )}
                </>
              ) : (
                // SELLER ACTIONS
                <>
                  {!showShipmentForm && (
                    <div className="space-y-3">
                      {detailOrder.status === "PENDING" && (
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                            onClick={handleCancelOrderBySeller}
                            disabled={actionLoading}
                            className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors disabled:opacity-50"
                          >
                            Hủy đơn hàng
                          </button>
                          <button
                            onClick={() => setShowShipmentForm(true)}
                            disabled={actionLoading}
                            className="flex-1 py-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Truck className="w-4 h-4" /> Xác nhận & Giao hàng
                          </button>
                        </div>
                      )}

                      {["CONFIRMED", "PAID"].includes(detailOrder.status) && (
                        <div className="flex flex-col gap-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() => handleUpdateShipmentStatus("SHIPPING")}
                              disabled={actionLoading}
                              className="py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm animate-pulse-subtle"
                            >
                              <Truck className="w-4 h-4" /> Bắt đầu giao hàng
                            </button>
                            <button
                              onClick={() => handleUpdateShipmentStatus("DELIVERED")}
                              disabled={actionLoading}
                              className="py-3 bg-green-500 text-white hover:bg-green-600 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Đã giao thành công
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() => setShowShipmentForm(true)}
                              disabled={actionLoading}
                              className="py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <ClipboardList className="w-4 h-4" /> Cập nhật Vận đơn
                            </button>
                            <button
                              onClick={handleCancelOrderBySeller}
                              disabled={actionLoading}
                              className="py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors disabled:opacity-50"
                            >
                              Hủy đơn hàng
                            </button>
                          </div>
                        </div>
                      )}

                      {detailOrder.status === "SHIPPING" && (
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => handleUpdateShipmentStatus("DELIVERED")}
                            disabled={actionLoading}
                            className="w-full py-3 bg-green-500 text-white hover:bg-green-600 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Đã giao thành công
                          </button>
                          <button
                            onClick={() => setShowShipmentForm(true)}
                            disabled={actionLoading}
                            className="w-full py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <ClipboardList className="w-4 h-4" /> Cập nhật Vận đơn
                          </button>
                        </div>
                      )}

                      {["DELIVERED", "CANCELLED", "RETURNED"].includes(detailOrder.status) && (
                        <div className="p-3.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold text-center">
                          Đơn hàng đã kết thúc ở trạng thái: <span className="text-slate-800 font-bold">{STATUS_MAP[detailOrder.status]?.label}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
