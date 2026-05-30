import { useState, useEffect, useCallback } from "react";
import {
  Table, Tag, Button, Select, Input, Modal, Descriptions, message, Space,
  Card, Typography, Row, Col, Statistic, Tooltip, Drawer,
  Divider, Timeline, Alert, DatePicker, Popconfirm, Badge, Tabs,
} from "antd";
import {
  SearchOutlined, EyeOutlined, EditOutlined, ReloadOutlined,
  AlertOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
  DollarOutlined, ShoppingOutlined, HistoryOutlined,
  FilterOutlined, DownloadOutlined, TruckOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import type { Order, OrderItem } from "../../types/order.type";
import { fetchAllOrders, fetchDisputedOrders, fetchOrderStats, updateOrderStatus, resolveOrderDispute, fetchOrderEvents } from "../../stores/slices/order.slice";

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

// ==================== CONSTANTS ====================
const ORDER_STATUS: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
  PENDING_PAYMENT:    { label: "Chờ thanh toán",    color: "orange",   icon: <ClockCircleOutlined /> },
  PAID:               { label: "Đã thanh toán",      color: "cyan",     icon: <DollarOutlined /> },
  PREPARING:          { label: "Chuẩn bị hàng",      color: "blue",     icon: <ShoppingOutlined /> },
  HANDOVER_TO_SHIPPER:{ label: "Giao shipper",        color: "geekblue", icon: <TruckOutlined /> },
  IN_TRANSIT:         { label: "Đang vận chuyển",     color: "processing",icon: <TruckOutlined /> },
  DELIVERED:          { label: "Đã giao hàng",        color: "lime",     icon: <CheckCircleOutlined /> },
  RECEIVED:           { label: "Đã nhận hàng",        color: "green",    icon: <CheckCircleOutlined /> },
  COMPLETED:          { label: "Hoàn tất",            color: "success",  icon: <CheckCircleOutlined /> },
  CANCELLED:          { label: "Đã hủy",              color: "red",      icon: <CloseCircleOutlined /> },
  DISPUTED:           { label: "Tranh chấp",           color: "volcano",  icon: <AlertOutlined /> },
};

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  ORDER_CREATED:          { label: "Đơn hàng được tạo",         color: "blue" },
  ORDER_PAID:             { label: "Thanh toán thành công",      color: "cyan" },
  ORDER_PREPARING:        { label: "Seller chuẩn bị hàng",       color: "geekblue" },
  ORDER_HANDOVER:         { label: "Giao cho shipper",           color: "purple" },
  ORDER_IN_TRANSIT:       { label: "Đang vận chuyển",            color: "processing" },
  ORDER_DELIVERED:        { label: "Đã giao hàng",               color: "lime" },
  ORDER_COMPLETED:        { label: "Hoàn tất đơn hàng",          color: "green" },
  ORDER_AUTO_COMPLETED:   { label: "Hệ thống tự hoàn tất",       color: "green" },
  ORDER_CANCELLED:        { label: "Đơn hàng bị hủy",            color: "red" },
  ORDER_DISPUTED:         { label: "Buyer khiếu nại",            color: "volcano" },
  ORDER_DISPUTE_RESOLVED: { label: "Admin xử lý khiếu nại",      color: "gold" },
  ESCROW_HELD:            { label: "Tạm giữ tiền buyer",         color: "orange" },
  ESCROW_RELEASED:        { label: "Release tiền cho seller",    color: "cyan" },
  ESCROW_REFUNDED:        { label: "Hoàn tiền cho buyer",        color: "magenta" },
  STATUS_UPDATED:         { label: "Admin cập nhật trạng thái",  color: "gold" },
};

const PAYMENT_METHODS: Record<string, string> = {
  COD: "Thanh toán khi nhận hàng", BANK_TRANSFER: "Chuyển khoản",
  MOMO: "Ví MoMo", VNPAY: "VNPay", WALLET: "Ví ReLife",
};


const formatPrice = (p?: number | null) =>
  p != null ? p.toLocaleString("vi-VN") + "đ" : "—";

const formatDate = (d?: string | null) =>
  d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—";

const formatDateFull = (d?: string | null) =>
  d ? dayjs(d).format("DD/MM/YYYY HH:mm:ss") : "—";

// ==================== COMPONENT ====================
export default function OrdersPage() {
  const dispatch = useAppDispatch();
  const { 
    orders, disputedOrders, events, stats, 
    loading, eventsLoading, statsLoading 
  } = useAppSelector(state => state.order);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sellerIdFilter, setSellerIdFilter] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [activeTab, setActiveTab] = useState("ALL");

  // Modals & Drawers
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveAction, setResolveAction] = useState<"refund" | "release">("refund");
  const [timelineOpen, setTimelineOpen] = useState(false);

  const loadOrders = useCallback(() => {
    dispatch(fetchAllOrders());
  }, [dispatch]);

  const loadDisputedOrders = useCallback(() => {
    dispatch(fetchDisputedOrders());
  }, [dispatch]);

  const loadStats = useCallback(() => {
    dispatch(fetchOrderStats());
  }, [dispatch]);

  useEffect(() => {
    loadOrders();
    loadDisputedOrders();
    loadStats();
  }, [loadOrders, loadDisputedOrders, loadStats]);

  // ==================== COMPUTED FILTERS ====================
  const filtered = (activeTab === "DISPUTED" ? disputedOrders : orders).filter((o) => {
    if (activeTab !== "ALL" && activeTab !== "DISPUTED" && o.status !== activeTab) return false;
    if (statusFilter && o.status !== statusFilter) return false;
    if (sellerIdFilter && !o.sellerId?.toLowerCase().includes(sellerIdFilter.toLowerCase())) return false;
    if (minPrice && o.totalPrice < Number(minPrice)) return false;
    if (maxPrice && o.totalPrice > Number(maxPrice)) return false;
    if (dateRange) {
      const created = dayjs(o.createdAt);
      if (created.isBefore(dateRange[0].startOf("day")) || created.isAfter(dateRange[1].endOf("day"))) return false;
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      return o.id.toLowerCase().includes(q) ||
        o.receiverName?.toLowerCase().includes(q) ||
        o.receiverPhone?.includes(q) ||
        o.buyerId?.toLowerCase().includes(q);
    }
    return true;
  });

  const statusCounts: Record<string, number> = { ALL: orders.length, DISPUTED: disputedOrders.length };
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  // ==================== HANDLERS ====================
  const openDetail = (order: Order) => { setSelectedOrder(order); setDetailOpen(true); };
  const openStatusModal = (order: Order) => { setSelectedOrder(order); setNewStatus(order.status); setStatusModalOpen(true); };
  const openResolveModal = (order: Order, action: "refund" | "release") => {
    setSelectedOrder(order); setResolveAction(action); setResolveModalOpen(true);
  };

  const openTimeline = async (order: Order) => {
    setSelectedOrder(order);
    setTimelineOpen(true);
    dispatch(fetchOrderEvents(order.id));
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      setSaving(true);
      await dispatch(updateOrderStatus({ orderId: selectedOrder.id, status: newStatus })).unwrap();
      message.success("Cập nhật trạng thái thành công");
      setStatusModalOpen(false);
    } catch (err: any) { message.error(err || "Lỗi cập nhật"); }
    finally { setSaving(false); }
  };

  const handleResolveDispute = async () => {
    if (!selectedOrder) return;
    try {
      setSaving(true);
      await dispatch(resolveOrderDispute({ orderId: selectedOrder.id, action: resolveAction })).unwrap();
      message.success(resolveAction === "refund" ? "Đã hoàn tiền cho buyer" : "Đã release tiền cho seller");
      setResolveModalOpen(false);
    } catch (err: any) { message.error(err || "Lỗi xử lý tranh chấp"); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    const rows = [
      ["Mã đơn", "Người nhận", "SĐT", "Tổng tiền", "Trạng thái", "Ngày tạo"],
      ...filtered.map(o => [
        o.id, o.receiverName, o.receiverPhone,
        o.totalPrice, ORDER_STATUS[o.status]?.label || o.status,
        formatDate(o.createdAt)
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "orders.csv"; a.click();
  };

  // ==================== TABLE COLUMNS ====================
  const columns: ColumnsType<Order> = [
    {
      title: "Mã đơn", dataIndex: "id", width: 120,
      render: (id: string) => (
        <Text strong style={{ color: "#16a34a", fontFamily: "monospace" }}>
          #{id.substring(0, 8).toUpperCase()}
        </Text>
      ),
    },
    {
      title: "Người nhận", dataIndex: "receiverName", width: 160,
      render: (_: any, r: Order) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.receiverName}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.receiverPhone}</Text>
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
          {r.orderItems?.length > 1 && (
            <Text type="secondary" style={{ fontSize: 12 }}>+{r.orderItems.length - 1} sản phẩm khác</Text>
          )}
        </div>
      ),
    },
    {
      title: "Tổng tiền", dataIndex: "totalPrice", width: 130,
      sorter: (a, b) => a.totalPrice - b.totalPrice,
      render: (v: number) => <Text strong style={{ color: "#16a34a" }}>{formatPrice(v)}</Text>,
    },
    {
      title: "Trạng thái", dataIndex: "status", width: 155,
      render: (s: string) => {
        const st = ORDER_STATUS[s] || { label: s, color: "default" };
        return <Tag color={st.color} icon={st.icon}>{st.label}</Tag>;
      },
    },
    {
      title: "Ngày tạo", dataIndex: "createdAt", width: 140,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (d: string) => <Text style={{ fontSize: 13 }}>{formatDate(d)}</Text>,
    },
    {
      title: "Thao tác", key: "actions", width: 230, fixed: "right" as const,
      render: (_: any, r: Order) => (
        <Space size={4} wrap>
          <Tooltip title="Chi tiết đơn hàng">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>Chi tiết</Button>
          </Tooltip>
          <Tooltip title="Lịch sử sự kiện">
            <Button size="small" icon={<HistoryOutlined />} onClick={() => openTimeline(r)}>Timeline</Button>
          </Tooltip>
          <Tooltip title="Cập nhật trạng thái">
            <Button size="small" icon={<EditOutlined />} onClick={() => openStatusModal(r)}>Trạng thái</Button>
          </Tooltip>
          {r.status === "DISPUTED" && (
            <>
              <Popconfirm
                title="Hoàn tiền buyer?"
                description="Escrow sẽ được refund 100% về ví buyer, item trả ACTIVE."
                onConfirm={() => openResolveModal(r, "refund")}
                okText="Xác nhận" cancelText="Hủy" okType="danger"
              >
                <Button size="small" danger icon={<CloseCircleOutlined />}>Refund</Button>
              </Popconfirm>
              <Popconfirm
                title="Release tiền seller?"
                description="Escrow sẽ được release 100% cho seller, item chuyển SOLD."
                onConfirm={() => openResolveModal(r, "release")}
                okText="Xác nhận" cancelText="Hủy"
              >
                <Button size="small" type="primary" icon={<CheckCircleOutlined />}>Release</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  // ==================== TABS ====================
  const tabItems = [
    {
      key: "ALL",
      label: <Badge count={statusCounts.ALL} size="small" offset={[10, 0]} showZero overflowCount={9999}>Tất cả</Badge>,
    },
    {
      key: "DISPUTED",
      label: (
        <Badge count={statusCounts.DISPUTED || 0} size="small" offset={[10, 0]} showZero={false} color="volcano">
          <span style={{ color: disputedOrders.length > 0 ? "#cf1322" : undefined }}>⚠️ Tranh chấp</span>
        </Badge>
      ),
    },
    ...Object.entries(ORDER_STATUS)
      .filter(([k]) => k !== "DISPUTED")
      .map(([key, val]) => ({
        key,
        label: (
          <Badge count={statusCounts[key] || 0} size="small" offset={[10, 0]} showZero={false}>
            {val.label}
          </Badge>
        ),
      })),
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* ==================== HEADER ==================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Quản lý đơn hàng</Title>
          <Text type="secondary">Theo dõi toàn bộ đơn hàng, xử lý tranh chấp và xem audit log</Text>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} onClick={exportCSV}>Export CSV</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { loadOrders(); loadDisputedOrders(); loadStats(); }} loading={loading}>
            Làm mới
          </Button>
        </Space>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", border: "none" }}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Tổng đơn hàng</span>}
              value={orders.length}
              loading={loading}
              valueStyle={{ color: "#fff", fontWeight: 800, fontSize: 28 }}
              prefix={<ShoppingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", border: "none" }}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Doanh thu ước tính</span>}
              value={stats?.totalRevenue || 0}
              loading={statsLoading}
              valueStyle={{ color: "#fff", fontWeight: 800, fontSize: 22 }}
              suffix="đ"
              formatter={(v) => Number(v).toLocaleString("vi-VN")}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", border: "none" }}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Đang tranh chấp</span>}
              value={disputedOrders.length}
              loading={loading}
              valueStyle={{ color: "#fff", fontWeight: 800, fontSize: 28 }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", border: "none" }}>
            <Statistic
              title={<span style={{ color: "rgba(120,60,20,0.8)", fontWeight: 600 }}>Chờ thanh toán</span>}
              value={orders.filter(o => o.status === "PENDING_PAYMENT").length}
              loading={loading}
              valueStyle={{ color: "#7c3400", fontWeight: 800, fontSize: 28 }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* ==================== MAIN TABLE ==================== */}
      <Card style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 0 }} />
        <Divider style={{ margin: "12px 0" }} />

        {/* Filters */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8} md={6}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm mã đơn, người nhận, SĐT..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: "100%" }}
              options={Object.entries(ORDER_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Input
              prefix={<FilterOutlined />}
              placeholder="ID Người bán"
              value={sellerIdFilter}
              onChange={(e) => setSellerIdFilter(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={5}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as any)}
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              placeholder={["Từ ngày", "Đến ngày"]}
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Input
              placeholder="Giá tối thiểu"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              prefix="≥"
            />
          </Col>
          <Col xs={12} sm={6} md={2}>
            <Input
              placeholder="Tối đa"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              prefix="≤"
            />
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"],
            showTotal: (t) => `Tổng ${t} đơn hàng`,
          }}
          scroll={{ x: 1300 }}
          size="middle"
          rowClassName={(r) => r.status === "DISPUTED" ? "disputed-row" : ""}
        />
      </Card>

      {/* ==================== ORDER DETAIL MODAL ==================== */}
      <Modal
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="timeline" icon={<HistoryOutlined />} onClick={() => { setDetailOpen(false); openTimeline(selectedOrder!); }}>
            Xem Timeline
          </Button>,
          <Button key="close" onClick={() => setDetailOpen(false)}>Đóng</Button>,
        ]}
        width={780}
        title={
          <Space>
            <ShoppingOutlined style={{ color: "#16a34a" }} />
            <span style={{ fontWeight: 700 }}>
              Chi tiết đơn hàng #{selectedOrder?.id.substring(0, 8).toUpperCase()}
            </span>
            {selectedOrder && <Tag color={ORDER_STATUS[selectedOrder.status]?.color}>{ORDER_STATUS[selectedOrder.status]?.label}</Tag>}
          </Space>
        }
      >
        {selectedOrder && (
          <div>
            {selectedOrder.status === "DISPUTED" && (
              <Alert
                type="error"
                showIcon
                icon={<AlertOutlined />}
                message="Đơn hàng đang tranh chấp"
                description={`Lý do: ${selectedOrder.disputeReason || "Không có lý do"}`}
                style={{ marginBottom: 16 }}
                action={
                  <Space direction="vertical">
                    <Button size="small" danger onClick={() => openResolveModal(selectedOrder, "refund")}>Hoàn tiền Buyer</Button>
                    <Button size="small" type="primary" onClick={() => openResolveModal(selectedOrder, "release")}>Release Seller</Button>
                  </Space>
                }
              />
            )}
            {selectedOrder.cancelReason && (
              <Alert
                type="warning" showIcon
                message={`Lý do hủy: ${selectedOrder.cancelReason}`}
                style={{ marginBottom: 16 }}
              />
            )}

            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Mã đơn hàng" span={2}>
                <Text strong copyable style={{ fontFamily: "monospace" }}>{selectedOrder.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{formatDate(selectedOrder.createdAt)}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật">{formatDate(selectedOrder.updatedAt)}</Descriptions.Item>
              <Descriptions.Item label="Buyer ID">
                <Text copyable style={{ fontFamily: "monospace", fontSize: 12 }}>{selectedOrder.buyerId}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Seller ID">
                <Text copyable style={{ fontFamily: "monospace", fontSize: 12 }}>{selectedOrder.sellerId}</Text>
              </Descriptions.Item>
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
                <Divider style={{ margin: "12px 0" }}>Thông tin vận chuyển</Divider>
                <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="Đơn vị">{selectedOrder.shipment.carrier}</Descriptions.Item>
                  <Descriptions.Item label="Mã vận đơn">
                    <Text strong copyable style={{ color: "#16a34a" }}>{selectedOrder.shipment.trackingCode}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái VC">{selectedOrder.shipment.status}</Descriptions.Item>
                  <Descriptions.Item label="Ngày giao">{formatDate(selectedOrder.shipment.shippedAt)}</Descriptions.Item>
                </Descriptions>
              </>
            )}

            <Divider style={{ margin: "12px 0" }}>Sản phẩm ({selectedOrder.orderItems?.length})</Divider>
            <Table
              dataSource={selectedOrder.orderItems}
              rowKey="id" pagination={false} size="small"
              columns={[
                { title: "Sản phẩm", dataIndex: "itemName", key: "name" },
                { title: "Item ID", dataIndex: "itemId", key: "itemId", width: 120, render: (v: string) => <Text style={{ fontSize: 11, fontFamily: "monospace" }}>{v.substring(0, 8)}</Text> },
                { title: "Đơn giá", dataIndex: "price", key: "price", render: (v: number) => formatPrice(v) },
                { title: "Thành tiền", key: "total", render: (_: any, r: OrderItem) => <Text strong>{formatPrice(r.price * r.quantity)}</Text> },
              ]}
              footer={() => (
                <div style={{ textAlign: "right", fontSize: 15 }}>
                  <Text strong>Tổng: <span style={{ color: "#16a34a", fontSize: 17 }}>{formatPrice(selectedOrder.totalPrice)}</span></Text>
                </div>
              )}
            />
          </div>
        )}
      </Modal>

      {/* ==================== STATUS UPDATE MODAL ==================== */}
      <Modal
        open={statusModalOpen}
        onCancel={() => setStatusModalOpen(false)}
        onOk={handleUpdateStatus}
        confirmLoading={saving}
        title="Cập nhật trạng thái đơn hàng"
        okText="Cập nhật" cancelText="Hủy"
      >
        <div style={{ marginTop: 16 }}>
          <p style={{ marginBottom: 8 }}>
            Trạng thái hiện tại:
            <Tag color={ORDER_STATUS[selectedOrder?.status || ""]?.color} style={{ marginLeft: 8 }}>
              {ORDER_STATUS[selectedOrder?.status || ""]?.label}
            </Tag>
          </p>
          <Select
            value={newStatus}
            onChange={setNewStatus}
            style={{ width: "100%" }}
            size="large"
            options={Object.entries(ORDER_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <Alert
            type="info"
            showIcon
            message="Luồng trạng thái hợp lý"
            description="PENDING_PAYMENT → PAID → PREPARING → HANDOVER_TO_SHIPPER → IN_TRANSIT → DELIVERED → RECEIVED → COMPLETED"
            style={{ marginTop: 12, fontSize: 12 }}
          />
        </div>
      </Modal>

      {/* ==================== RESOLVE DISPUTE MODAL ==================== */}
      <Modal
        open={resolveModalOpen}
        onCancel={() => setResolveModalOpen(false)}
        onOk={handleResolveDispute}
        confirmLoading={saving}
        title={
          <Space>
            <AlertOutlined style={{ color: "#cf1322" }} />
            Xử lý tranh chấp #{selectedOrder?.id.substring(0, 8).toUpperCase()}
          </Space>
        }
        okText={resolveAction === "refund" ? "Hoàn tiền Buyer" : "Release cho Seller"}
        okType={resolveAction === "refund" ? "danger" : "primary"}
        cancelText="Hủy"
        width={520}
      >
        <div style={{ marginTop: 16 }}>
          {selectedOrder?.disputeReason && (
            <Alert
              type="warning" showIcon
              message={`Lý do khiếu nại: "${selectedOrder.disputeReason}"`}
              style={{ marginBottom: 16 }}
            />
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <Card
              onClick={() => setResolveAction("refund")}
              style={{
                flex: 1, cursor: "pointer", borderRadius: 10,
                border: resolveAction === "refund" ? "2px solid #cf1322" : "1px solid #f0f0f0",
                background: resolveAction === "refund" ? "#fff2f0" : undefined,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <CloseCircleOutlined style={{ fontSize: 28, color: "#cf1322" }} />
                <div style={{ fontWeight: 700, marginTop: 8, color: "#cf1322" }}>Hoàn tiền Buyer</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Escrow refund → ví buyer<br />Item trả về AVAILABLE
                </Text>
              </div>
            </Card>
            <Card
              onClick={() => setResolveAction("release")}
              style={{
                flex: 1, cursor: "pointer", borderRadius: 10,
                border: resolveAction === "release" ? "2px solid #16a34a" : "1px solid #f0f0f0",
                background: resolveAction === "release" ? "#f0fff4" : undefined,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <CheckCircleOutlined style={{ fontSize: 28, color: "#16a34a" }} />
                <div style={{ fontWeight: 700, marginTop: 8, color: "#16a34a" }}>Release Seller</div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Escrow release → ví seller<br />Item chuyển SOLD
                </Text>
              </div>
            </Card>
          </div>
          <Alert
            type="warning" showIcon
            message="Hành động này không thể hoàn tác!"
            style={{ marginTop: 16 }}
          />
        </div>
      </Modal>

      {/* ==================== EVENT SOURCING TIMELINE DRAWER ==================== */}
      <Drawer
        title={
          <Space>
            <HistoryOutlined style={{ color: "#667eea" }} />
            <span>Lịch sử sự kiện #{selectedOrder?.id.substring(0, 8).toUpperCase()}</span>
          </Space>
        }
        placement="right"
        width={520}
        open={timelineOpen}
        onClose={() => setTimelineOpen(false)}
      >
        {eventsLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8c8c8c" }}>Đang tải lịch sử...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#8c8c8c" }}>Chưa có sự kiện nào</div>
        ) : (
          <Timeline
            mode="left"
            items={events.map((ev) => {
              const evInfo = EVENT_LABELS[ev.eventType] || { label: ev.eventType, color: "gray" };
              return {
                color: evInfo.color,
                dot: undefined,
                label: <Text style={{ fontSize: 11, color: "#8c8c8c" }}>{formatDateFull(ev.occurredAt)}</Text>,
                children: (
                  <div style={{ marginBottom: 4 }}>
                    <div>
                      <Tag color={evInfo.color} style={{ marginBottom: 4 }}>{evInfo.label}</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Bởi: <Text strong style={{ fontSize: 12 }}>{ev.triggeredBy}</Text>
                      {" "}({ev.actorRole})
                    </Text>
                    {(() => {
                      let metaObj: Record<string, any> = {};
                      if (ev.metadata) {
                        if (typeof ev.metadata === "string") {
                          try {
                            metaObj = JSON.parse(ev.metadata);
                          } catch (e) {
                            return (
                              <div style={{
                                marginTop: 6, padding: "6px 10px",
                                background: "#f8fafc", borderRadius: 6,
                                fontSize: 11, fontFamily: "monospace",
                                border: "1px solid #e2e8f0",
                                color: "#4a5568",
                              }}>
                                {ev.metadata}
                              </div>
                            );
                          }
                        } else if (typeof ev.metadata === "object") {
                          metaObj = ev.metadata;
                        }
                      }
                      
                      if (!metaObj || Object.keys(metaObj).length === 0) return null;

                      return (
                        <div style={{
                          marginTop: 6, padding: "8px 12px",
                          background: "#f8fafc", borderRadius: 6,
                          fontSize: 11, fontFamily: "SFMono-Regular, Consolas, Monaco, monospace",
                          border: "1px solid #e2e8f0",
                          color: "#4a5568",
                        }}>
                          {Object.entries(metaObj).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", gap: "6px", margin: "2px 0" }}>
                              <span style={{ color: "#718096", fontWeight: 600 }}>{k}:</span>
                              <span style={{ color: "#2d3748" }}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                ),
              };
            })}
          />
        )}
      </Drawer>

      <style>{`
        .disputed-row { background: #fff2f0 !important; }
        .disputed-row:hover td { background: #ffe4e1 !important; }
      `}</style>
    </div>
  );
}
