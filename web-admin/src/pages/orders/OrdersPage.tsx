import { useState, useEffect, useCallback } from "react";
import {
  Table, Tag, Button, Select, Input, Modal, Form, Descriptions, message, Space, Card, Tabs, Badge, Divider,
} from "antd";
import {
  SearchOutlined, EyeOutlined, EditOutlined, TruckOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import http from "../../utils/api";

// ==================== TYPES ====================
interface OrderItem {
  id: string; itemId: string; itemName: string; sellerId: string; price: number; quantity: number;
}
interface Payment {
  id: string; amount: number; method: string; status: string; createdAt: string;
}
interface Shipment {
  id: string; carrier: string; trackingCode: string; status: string; shippedAt: string; deliveredAt: string | null;
}
interface Order {
  id: string; buyerId: string; totalPrice: number; status: string; paymentStatus: string;
  receiverName: string; receiverPhone: string; shippingAddress: string;
  createdAt: string; updatedAt: string; orderItems: OrderItem[]; payment: Payment | null; shipment: Shipment | null;
}

// ==================== CONSTANTS ====================
const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "orange" },
  CONFIRMED: { label: "Đã xác nhận", color: "blue" },
  PAID: { label: "Đã thanh toán", color: "cyan" },
  SHIPPING: { label: "Đang giao", color: "geekblue" },
  DELIVERED: { label: "Đã giao", color: "green" },
  CANCELLED: { label: "Đã hủy", color: "red" },
  RETURNED: { label: "Trả hàng", color: "purple" },
};

const SHIPMENT_STATUS: Record<string, { label: string; color: string }> = {
  PREPARING: { label: "Đang chuẩn bị", color: "orange" },
  SHIPPING: { label: "Đang vận chuyển", color: "blue" },
  DELIVERED: { label: "Đã giao", color: "green" },
};

const CARRIERS = [
  { value: "GHN", label: "Giao Hàng Nhanh (GHN)" },
  { value: "GHTK", label: "Giao Hàng Tiết Kiệm (GHTK)" },
  { value: "JT", label: "J&T Express" },
  { value: "VNPOST", label: "VNPost - Bưu Điện Việt Nam" },
  { value: "BEST", label: "BEST Express" },
  { value: "NINJA_VAN", label: "Ninja Van" },
  { value: "SPX", label: "Shopee Express (SPX)" },
  { value: "VIETTEL_POST", label: "Viettel Post" },
];

const PAYMENT_METHODS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng", BANK_TRANSFER: "Chuyển khoản", MOMO: "Ví MoMo", VNPAY: "VNPay",
};

const SVC = { headers: { "X-Service": "order" } };

const formatPrice = (p: number) => p?.toLocaleString("vi-VN") + "đ";
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

// ==================== COMPONENT ====================
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [shipmentModalOpen, setShipmentModalOpen] = useState(false);
  const [shipmentForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await http.get<Order[]>("/orders/admin/all", SVC);
      setOrders(data);
    } catch (err: any) {
      message.error(err?.message || "Không thể tải danh sách đơn hàng");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  // Filters
  const filtered = orders.filter((o) => {
    if (activeTab !== "ALL" && o.status !== activeTab) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return o.id.toLowerCase().includes(q) || o.receiverName?.toLowerCase().includes(q) || o.receiverPhone?.includes(q);
    }
    return true;
  });

  // Status counts for tabs
  const statusCounts: Record<string, number> = { ALL: orders.length };
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  // ==================== HANDLERS ====================
  const openDetail = (order: Order) => { setSelectedOrder(order); setDetailOpen(true); };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order); setNewStatus(order.status); setStatusModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      setSaving(true);
      await http.put(`/orders/admin/${selectedOrder.id}/status`, { status: newStatus }, SVC);
      message.success("Cập nhật trạng thái thành công");
      setStatusModalOpen(false);
      loadOrders();
    } catch (err: any) { message.error(err?.message || "Lỗi cập nhật"); }
    finally { setSaving(false); }
  };

  const openShipmentModal = (order: Order) => {
    setSelectedOrder(order);
    if (order.shipment) {
      shipmentForm.setFieldsValue({
        carrier: order.shipment.carrier,
        trackingCode: order.shipment.trackingCode,
        status: order.shipment.status,
      });
    } else {
      shipmentForm.resetFields();
      shipmentForm.setFieldValue("status", "PREPARING");
    }
    setShipmentModalOpen(true);
  };

  const handleSaveShipment = async () => {
    if (!selectedOrder) return;
    try {
      const vals = await shipmentForm.validateFields();
      setSaving(true);
      if (selectedOrder.shipment) {
        await http.put(`/orders/admin/${selectedOrder.id}/shipment`, vals, SVC);
      } else {
        await http.post(`/orders/admin/${selectedOrder.id}/shipment`, vals, SVC);
      }
      message.success("Lưu thông tin vận chuyển thành công");
      setShipmentModalOpen(false);
      loadOrders();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(err?.message || "Lỗi lưu vận chuyển");
    } finally { setSaving(false); }
  };

  // ==================== TABLE COLUMNS ====================
  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn", dataIndex: "id", width: 130,
      render: (id: string) => <span style={{ color: "#16a34a", fontWeight: 700 }}>#{id.substring(0, 8).toUpperCase()}</span>,
    },
    {
      title: "Người nhận", dataIndex: "receiverName", width: 160,
      render: (_: any, r: Order) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.receiverName}</div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.receiverPhone}</div>
        </div>
      ),
    },
    {
      title: "Sản phẩm", key: "items", width: 200,
      render: (_: any, r: Order) => (
        <div>
          <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
            {r.orderItems?.[0]?.itemName || "—"}
          </div>
          {r.orderItems?.length > 1 && <span style={{ fontSize: 12, color: "#94a3b8" }}>+{r.orderItems.length - 1} sản phẩm khác</span>}
        </div>
      ),
    },
    {
      title: "Tổng tiền", dataIndex: "totalPrice", width: 130, sorter: (a, b) => a.totalPrice - b.totalPrice,
      render: (v: number) => <span style={{ fontWeight: 700 }}>{formatPrice(v)}</span>,
    },
    {
      title: "Trạng thái", dataIndex: "status", width: 140,
      render: (s: string) => {
        const st = ORDER_STATUS[s] || { label: s, color: "default" };
        return <Tag color={st.color}>{st.label}</Tag>;
      },
    },
    {
      title: "Vận chuyển", key: "shipment", width: 140,
      render: (_: any, r: Order) => {
        if (!r.shipment) return <Tag>Chưa có</Tag>;
        const sh = SHIPMENT_STATUS[r.shipment.status] || { label: r.shipment.status, color: "default" };
        return <Tag color={sh.color}>{sh.label}</Tag>;
      },
    },
    {
      title: "Ngày tạo", dataIndex: "createdAt", width: 160, sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (d: string) => <span style={{ fontSize: 13 }}>{formatDate(d)}</span>,
    },
    {
      title: "Thao tác", key: "actions", width: 200, fixed: "right" as const,
      render: (_: any, r: Order) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>Chi tiết</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openStatusModal(r)}>Trạng thái</Button>
          <Button size="small" type="primary" ghost icon={<TruckOutlined />} onClick={() => openShipmentModal(r)}>
            {r.shipment ? "Sửa VC" : "Giao hàng"}
          </Button>
        </Space>
      ),
    },
  ];

  // ==================== RENDER ====================
  const tabItems = [
    { key: "ALL", label: <Badge count={statusCounts.ALL} size="small" offset={[10, 0]} showZero>Tất cả</Badge> },
    ...Object.entries(ORDER_STATUS).map(([key, val]) => ({
      key,
      label: <Badge count={statusCounts[key] || 0} size="small" offset={[10, 0]} showZero={false}>{val.label}</Badge>,
    })),
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Quản lý đơn hàng</h1>
          <p style={{ color: "#94a3b8", margin: 0, marginTop: 4 }}>Quản lý tất cả đơn hàng, cập nhật trạng thái và điều phối vận chuyển</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadOrders} loading={loading}>Làm mới</Button>
      </div>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <Input prefix={<SearchOutlined />} placeholder="Tìm mã đơn, người nhận, SĐT..." value={searchText}
            onChange={(e) => setSearchText(e.target.value)} style={{ width: 300 }} allowClear />
          <Select placeholder="Lọc trạng thái" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 180 }}
            options={Object.entries(ORDER_STATUS).map(([k, v]) => ({ value: k, label: v.label }))} />
        </div>

        <Table columns={columns} dataSource={filtered} rowKey="id" loading={loading} pagination={{ pageSize: 20, showSizeChanger: false, showTotal: (t) => `Tổng ${t} đơn hàng` }}
          scroll={{ x: 1200 }} size="middle" />
      </Card>

      {/* ==================== ORDER DETAIL MODAL ==================== */}
      <Modal open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null} width={720}
        title={<span style={{ fontSize: 18, fontWeight: 700 }}>Chi tiết đơn hàng #{selectedOrder?.id.substring(0, 8).toUpperCase()}</span>}>
        {selectedOrder && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Trạng thái">
                <Tag color={ORDER_STATUS[selectedOrder.status]?.color}>{ORDER_STATUS[selectedOrder.status]?.label}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDate(selectedOrder.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Người nhận">{selectedOrder.receiverName}</Descriptions.Item>
              <Descriptions.Item label="SĐT">{selectedOrder.receiverPhone}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ" span={2}>{selectedOrder.shippingAddress}</Descriptions.Item>
              <Descriptions.Item label="Thanh toán">
                {selectedOrder.payment ? PAYMENT_METHODS[selectedOrder.payment.method] || selectedOrder.payment.method : "—"}
              </Descriptions.Item>
              <Descriptions.Item label="TT thanh toán">
                <Tag color={selectedOrder.paymentStatus === "PAID" ? "green" : "orange"}>
                  {selectedOrder.paymentStatus === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedOrder.shipment && (
              <>
                <Divider orientation={"left" as any}>Thông tin vận chuyển</Divider>
                <Descriptions bordered column={2} size="small" style={{ marginBottom: 20 }}>
                  <Descriptions.Item label="Đơn vị">{CARRIERS.find((c) => c.value === selectedOrder.shipment?.carrier)?.label || selectedOrder.shipment.carrier}</Descriptions.Item>
                  <Descriptions.Item label="Mã vận đơn"><span style={{ fontWeight: 600, color: "#16a34a" }}>{selectedOrder.shipment.trackingCode}</span></Descriptions.Item>
                  <Descriptions.Item label="Trạng thái VC">
                    <Tag color={SHIPMENT_STATUS[selectedOrder.shipment.status]?.color}>{SHIPMENT_STATUS[selectedOrder.shipment.status]?.label || selectedOrder.shipment.status}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày giao">{selectedOrder.shipment.shippedAt ? formatDate(selectedOrder.shipment.shippedAt) : "—"}</Descriptions.Item>
                </Descriptions>
              </>
            )}

            <Divider orientation={"left" as any}>Sản phẩm ({selectedOrder.orderItems?.length})</Divider>
            <Table dataSource={selectedOrder.orderItems} rowKey="id" pagination={false} size="small"
              columns={[
                { title: "Sản phẩm", dataIndex: "itemName", key: "name" },
                { title: "Đơn giá", dataIndex: "price", key: "price", render: (v: number) => formatPrice(v) },
                { title: "SL", dataIndex: "quantity", key: "qty", width: 60 },
                { title: "Thành tiền", key: "total", render: (_: any, r: OrderItem) => <b>{formatPrice(r.price * r.quantity)}</b> },
              ]}
            />
            <div style={{ textAlign: "right", marginTop: 12, fontSize: 16 }}>
              <b>Tổng: <span style={{ color: "#16a34a" }}>{formatPrice(selectedOrder.totalPrice)}</span></b>
            </div>
          </div>
        )}
      </Modal>

      {/* ==================== STATUS UPDATE MODAL ==================== */}
      <Modal open={statusModalOpen} onCancel={() => setStatusModalOpen(false)} onOk={handleUpdateStatus}
        confirmLoading={saving} title="Cập nhật trạng thái đơn hàng" okText="Cập nhật" cancelText="Hủy">
        <div style={{ marginTop: 16 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>Trạng thái hiện tại: <Tag color={ORDER_STATUS[selectedOrder?.status || ""]?.color}>{ORDER_STATUS[selectedOrder?.status || ""]?.label}</Tag></p>
          <Select value={newStatus} onChange={setNewStatus} style={{ width: "100%" }} size="large"
            options={Object.entries(ORDER_STATUS).map(([k, v]) => ({ value: k, label: v.label }))} />
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
            Luồng trạng thái hợp lý: PENDING → CONFIRMED → PAID → SHIPPING → DELIVERED
          </p>
        </div>
      </Modal>

      {/* ==================== SHIPMENT MODAL ==================== */}
      <Modal open={shipmentModalOpen} onCancel={() => setShipmentModalOpen(false)} onOk={handleSaveShipment}
        confirmLoading={saving} width={560}
        title={<span><TruckOutlined style={{ marginRight: 8 }} />{selectedOrder?.shipment ? "Cập nhật vận chuyển" : "Tạo vận chuyển"}</span>}
        okText="Lưu" cancelText="Hủy">
        <Form form={shipmentForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Đơn vị vận chuyển" name="carrier" rules={[{ required: true, message: "Chọn đơn vị vận chuyển" }]}>
            <Select placeholder="Chọn đơn vị vận chuyển" size="large" options={CARRIERS} />
          </Form.Item>
          <Form.Item label="Mã vận đơn" name="trackingCode" rules={[{ required: true, message: "Nhập mã vận đơn" }]}>
            <Input placeholder="Nhập mã vận đơn từ đơn vị vận chuyển" size="large" />
          </Form.Item>
          {selectedOrder?.shipment && (
            <Form.Item label="Trạng thái vận chuyển" name="status">
              <Select size="large" options={Object.entries(SHIPMENT_STATUS).map(([k, v]) => ({ value: k, label: v.label }))} />
            </Form.Item>
          )}
        </Form>
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, fontSize: 13, color: "#64748b" }}>
          <b>Luồng vận chuyển:</b> Đang chuẩn bị → Đang vận chuyển → Đã giao
          <br /><span style={{ fontSize: 12 }}>• Khi tạo vận chuyển, đơn hàng PENDING sẽ tự động chuyển sang CONFIRMED</span>
          <br /><span style={{ fontSize: 12 }}>• Khi chuyển sang "Đang vận chuyển", đơn hàng sẽ chuyển sang SHIPPING</span>
          <br /><span style={{ fontSize: 12 }}>• Khi chuyển sang "Đã giao", đơn hàng sẽ chuyển sang DELIVERED</span>
        </div>
      </Modal>
    </div>
  );
}
