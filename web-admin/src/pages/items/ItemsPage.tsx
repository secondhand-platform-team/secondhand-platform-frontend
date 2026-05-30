import { useState, useEffect, useCallback } from "react";
import {
  Table, Tag, Button, Select, Input, Descriptions, message, Space,
  Card, Avatar, Typography, Row, Col, Statistic, Tooltip, Popconfirm,
  Drawer, Image,
} from "antd";
import {
  SearchOutlined, EyeOutlined, DeleteOutlined, LockOutlined, UnlockOutlined,
  ReloadOutlined, FilterOutlined, FileTextOutlined, PictureOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import type { ItemResponse } from "../../types/item.type";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { fetchAllItems, updateItemStatus, deleteItem } from "../../stores/slices/item.slice";

const { Text, Title, Paragraph } = Typography;

// ==================== CONSTANTS ====================
const ITEM_STATUS: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
  AVAILABLE:  { label: "Đang bán",    color: "success",  icon: <CheckCircleOutlined /> },
  RESERVED:   { label: "Đã đặt cọc", color: "processing",icon: <ExclamationCircleOutlined /> },
  SOLD:       { label: "Đã bán",      color: "default",  icon: <CheckCircleOutlined /> },
  INACTIVE:   { label: "Bị khóa",    color: "error",    icon: <LockOutlined /> },
  REMOVED:    { label: "Đã xóa",     color: "red",      icon: <DeleteOutlined /> },
  ACTIVE:     { label: "Đang bán",    color: "success",  icon: <CheckCircleOutlined /> },
};

const CONDITION_MAP: Record<string, string> = {
  NEW: "Mới 100%", LIKE_NEW: "Như mới", GOOD: "Tốt",
  FAIR: "Khá", POOR: "Cũ",
};

const TRANSACTION_TYPE_MAP: Record<string, { label: string; color: string }> = {
  SELL: { label: "Bán", color: "green" },
  EXCHANGE: { label: "Trao đổi", color: "blue" },
  DONATE: { label: "Cho tặng", color: "purple" },
};


const formatPrice = (p?: number | null) =>
  p != null ? p.toLocaleString("vi-VN") + "đ" : "Miễn phí";

const formatDate = (d?: string | null) =>
  d ? dayjs(d).format("DD/MM/YYYY HH:mm") : "—";

// ==================== COMPONENT ====================
export default function ItemsPage() {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector(state => state.item);

  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string | undefined>(undefined);

  // Detail Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemResponse | null>(null);

  // Saving states
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadItems = useCallback(() => {
    dispatch(fetchAllItems());
  }, [dispatch]);

  useEffect(() => { loadItems(); }, [loadItems]);

  // ==================== COMPUTED ====================
  const filtered = items.filter((item) => {
    if (statusFilter && item.status !== statusFilter) return false;
    if (transactionTypeFilter && item.transactionType !== transactionTypeFilter) return false;
    if (searchText) {
      const q = searchText.toLowerCase();
      return (
        item.itemId.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.userId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countByStatus = (s: string) => items.filter((i) => i.status === s).length;

  // ==================== HANDLERS ====================
  const openDrawer = (item: ItemResponse) => { setSelectedItem(item); setDrawerOpen(true); };

  const handleUpdateStatus = async (itemId: string, status: string) => {
    try {
      setSavingId(itemId);
      await dispatch(updateItemStatus({ itemId, status })).unwrap();
      message.success(`Đã cập nhật trạng thái thành ${ITEM_STATUS[status]?.label || status}`);
      if (selectedItem?.itemId === itemId) setSelectedItem((prev) => prev ? { ...prev, status } : null);
    } catch (err: any) {
      message.error(err || "Lỗi cập nhật trạng thái");
    } finally { setSavingId(null); }
  };

  const handleDelete = async (itemId: string) => {
    try {
      setSavingId(itemId);
      await dispatch(deleteItem(itemId)).unwrap();
      message.success("Đã xóa tin đăng");
      if (selectedItem?.itemId === itemId) setDrawerOpen(false);
    } catch (err: any) {
      message.error(err || "Không thể xóa tin đăng");
    } finally { setSavingId(null); }
  };

  // ==================== TABLE COLUMNS ====================
  const columns: ColumnsType<ItemResponse> = [
    {
      title: "Tin đăng",
      key: "item",
      width: 280,
      render: (_: any, r: ItemResponse) => (
        <Space size="middle">
          {r.itemImageList?.[0]?.imageUrl ? (
            <Image
              src={r.itemImageList[0].imageUrl}
              width={56}
              height={56}
              style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e8e8e8" }}
              preview={false}
            />
          ) : (
            <Avatar
              shape="square"
              size={56}
              icon={<PictureOutlined />}
              style={{ background: "#f0f0f0", color: "#8c8c8c", borderRadius: 8 }}
            />
          )}
          <div style={{ maxWidth: 200 }}>
            <Tooltip title={r.title}>
              <Text strong style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.title}
              </Text>
            </Tooltip>
            <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
              #{r.itemId.substring(0, 8)}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Giá", dataIndex: "price", width: 120,
      sorter: (a, b) => (a.price ?? 0) - (b.price ?? 0),
      render: (v: number | null, r: ItemResponse) => (
        <div>
          <Text strong style={{ color: r.transactionType === "DONATE" ? "#8c8c8c" : "#16a34a" }}>
            {formatPrice(v)}
          </Text>
          <div>
            <Tag color={TRANSACTION_TYPE_MAP[r.transactionType]?.color} style={{ marginTop: 2, fontSize: 10 }}>
              {TRANSACTION_TYPE_MAP[r.transactionType]?.label || r.transactionType}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "Người đăng", dataIndex: "userId", width: 150,
      render: (userId: string) => (
        <Text copyable style={{ fontSize: 11, fontFamily: "monospace" }}>
          {userId.substring(0, 12)}...
        </Text>
      ),
    },
    {
      title: "Tình trạng", dataIndex: "condition", width: 120,
      render: (c: string) => <Tag>{CONDITION_MAP[c] || c}</Tag>,
    },
    {
      title: "Trạng thái", dataIndex: "status", width: 140,
      render: (s: string) => {
        const st = ITEM_STATUS[s] || { label: s, color: "default" };
        return <Tag color={st.color} icon={st.icon}>{st.label}</Tag>;
      },
    },
    {
      title: "Địa điểm", key: "location", width: 150,
      render: (_: any, r: ItemResponse) => (
        <Space size={4}>
          <EnvironmentOutlined style={{ color: "#8c8c8c" }} />
          <Text style={{ fontSize: 12 }}>
            {r.location ? `${r.location.district}, ${r.location.province}` : "—"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Ngày đăng", dataIndex: "createdAt", width: 140,
      sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
      render: (d: string) => <Text style={{ fontSize: 12 }}>{formatDate(d)}</Text>,
    },
    {
      title: "Thao tác", key: "actions", width: 200, fixed: "right" as const,
      render: (_: any, r: ItemResponse) => (
        <Space size={4} wrap>
          <Tooltip title="Xem chi tiết">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDrawer(r)} />
          </Tooltip>
          {r.status !== "INACTIVE" && r.status !== "SOLD" && r.status !== "REMOVED" ? (
            <Popconfirm
              title="Khóa tin đăng?"
              description="Tin sẽ không hiển thị với người dùng."
              onConfirm={() => handleUpdateStatus(r.itemId, "INACTIVE")}
              okText="Khóa" cancelText="Hủy" okType="danger"
            >
              <Button
                size="small" danger icon={<LockOutlined />}
                loading={savingId === r.itemId}
              >
                Khóa
              </Button>
            </Popconfirm>
          ) : r.status === "INACTIVE" ? (
            <Popconfirm
              title="Mở khóa tin đăng?"
              description="Tin sẽ được hiển thị trở lại."
              onConfirm={() => handleUpdateStatus(r.itemId, "AVAILABLE")}
              okText="Mở khóa" cancelText="Hủy"
            >
              <Button
                size="small" type="primary" icon={<UnlockOutlined />}
                loading={savingId === r.itemId}
              >
                Mở khóa
              </Button>
            </Popconfirm>
          ) : null}
          <Popconfirm
            title="Xóa tin đăng?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(r.itemId)}
            okText="Xóa" cancelText="Hủy" okType="danger"
          >
            <Button
              size="small" danger ghost icon={<DeleteOutlined />}
              loading={savingId === r.itemId}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* ==================== HEADER ==================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Quản lý tin đăng</Title>
          <Text type="secondary">Xem, khóa, xóa và kiểm duyệt toàn bộ tin đăng trên nền tảng</Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={loadItems} loading={loading}>Làm mới</Button>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)", border: "none" }}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Đang bán</span>}
              value={countByStatus("AVAILABLE") + countByStatus("ACTIVE")}
              loading={loading}
              valueStyle={{ color: "#fff", fontWeight: 800, fontSize: 28 }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: "linear-gradient(135deg, #4776e6 0%, #8e54e9 100%)", border: "none" }}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Đã đặt cọc</span>}
              value={countByStatus("RESERVED")}
              loading={loading}
              valueStyle={{ color: "#fff", fontWeight: 800, fontSize: 28 }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", border: "none" }}>
            <Statistic
              title={<span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>Bị khóa</span>}
              value={countByStatus("INACTIVE")}
              loading={loading}
              valueStyle={{ color: "#fff", fontWeight: 800, fontSize: 28 }}
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, background: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)", border: "none" }}>
            <Statistic
              title={<span style={{ color: "rgba(120,60,20,0.8)", fontWeight: 600 }}>Đã bán</span>}
              value={countByStatus("SOLD")}
              loading={loading}
              valueStyle={{ color: "#7c3400", fontWeight: 800, fontSize: 28 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ==================== MAIN TABLE ==================== */}
      <Card style={{ borderRadius: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
        {/* Filters */}
        <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={10} md={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Tìm tên tin, ID tin, ID người đăng..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              size="large"
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Trạng thái"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              size="large"
              style={{ width: "100%" }}
              options={Object.entries(ITEM_STATUS).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Loại giao dịch"
              value={transactionTypeFilter}
              onChange={setTransactionTypeFilter}
              allowClear
              size="large"
              style={{ width: "100%" }}
              options={Object.entries(TRANSACTION_TYPE_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
            />
          </Col>
          <Col xs={24} sm={8} md={4}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: "100%" }}>
              <FilterOutlined style={{ color: "#8c8c8c" }} />
              <Text type="secondary" style={{ fontSize: 13 }}>
                Hiển thị <Text strong>{filtered.length}</Text> / {items.length} tin
              </Text>
            </div>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="itemId"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (t) => `Tổng ${t} tin đăng`,
          }}
          scroll={{ x: 1400 }}
          size="middle"
        />
      </Card>

      {/* ==================== DETAIL DRAWER ==================== */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined style={{ color: "#667eea" }} />
            <span>Chi tiết tin đăng</span>
            {selectedItem && (
              <Tag color={ITEM_STATUS[selectedItem.status]?.color}>
                {ITEM_STATUS[selectedItem.status]?.label}
              </Tag>
            )}
          </Space>
        }
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          selectedItem && (
            <Space>
              {selectedItem.status === "INACTIVE" ? (
                <Button
                  type="primary" icon={<UnlockOutlined />}
                  loading={savingId === selectedItem.itemId}
                  onClick={() => handleUpdateStatus(selectedItem.itemId, "AVAILABLE")}
                >
                  Mở khóa
                </Button>
              ) : selectedItem.status !== "SOLD" && selectedItem.status !== "REMOVED" ? (
                <Button
                  danger icon={<LockOutlined />}
                  loading={savingId === selectedItem.itemId}
                  onClick={() => handleUpdateStatus(selectedItem.itemId, "INACTIVE")}
                >
                  Khóa tin
                </Button>
              ) : null}
              <Popconfirm
                title="Xóa tin đăng này?"
                onConfirm={() => handleDelete(selectedItem.itemId)}
                okText="Xóa" cancelText="Hủy" okType="danger"
              >
                <Button danger ghost icon={<DeleteOutlined />} loading={savingId === selectedItem.itemId}>
                  Xóa
                </Button>
              </Popconfirm>
            </Space>
          )
        }
      >
        {selectedItem && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Images Gallery */}
            {selectedItem.itemImageList?.length > 0 && (
              <div>
                <Text strong style={{ display: "block", marginBottom: 10, fontSize: 14 }}>
                  Hình ảnh ({selectedItem.itemImageList.length})
                </Text>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Image.PreviewGroup>
                    {selectedItem.itemImageList.map((img) => (
                      <Image
                        key={img.imageId}
                        src={img.imageUrl}
                        width={110}
                        height={110}
                        style={{ objectFit: "cover", borderRadius: 8, border: "1px solid #e8e8e8" }}
                      />
                    ))}
                  </Image.PreviewGroup>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div>
              <Text strong style={{ display: "block", marginBottom: 10, fontSize: 14 }}>Thông tin cơ bản</Text>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="ID">
                  <Text copyable style={{ fontFamily: "monospace", fontSize: 12 }}>{selectedItem.itemId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tiêu đề">{selectedItem.title}</Descriptions.Item>
                <Descriptions.Item label="Giá">
                  <Text strong style={{ color: "#16a34a", fontSize: 16 }}>{formatPrice(selectedItem.price)}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Loại giao dịch">
                  <Tag color={TRANSACTION_TYPE_MAP[selectedItem.transactionType]?.color}>
                    {TRANSACTION_TYPE_MAP[selectedItem.transactionType]?.label || selectedItem.transactionType}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Tình trạng">
                  {CONDITION_MAP[selectedItem.condition] || selectedItem.condition}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={ITEM_STATUS[selectedItem.status]?.color}>
                    {ITEM_STATUS[selectedItem.status]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Người đăng">
                  <Text copyable style={{ fontFamily: "monospace", fontSize: 12 }}>{selectedItem.userId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày đăng">{formatDate(selectedItem.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="Cập nhật">{formatDate(selectedItem.updatedAt)}</Descriptions.Item>
              </Descriptions>
            </div>

            {/* Location */}
            {selectedItem.location && (
              <div>
                <Text strong style={{ display: "block", marginBottom: 10, fontSize: 14 }}>
                  <EnvironmentOutlined /> Địa điểm
                </Text>
                <Card style={{ background: "#f8fafc", borderRadius: 8 }}>
                  <Text>{selectedItem.location.address}, {selectedItem.location.ward}, {selectedItem.location.district}, {selectedItem.location.province}</Text>
                </Card>
              </div>
            )}

            {/* Description */}
            <div>
              <Text strong style={{ display: "block", marginBottom: 8, fontSize: 14 }}>Mô tả</Text>
              <Card style={{ background: "#f8fafc", borderRadius: 8 }}>
                <Paragraph style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {selectedItem.description || "Không có mô tả"}
                </Paragraph>
              </Card>
            </div>

            {/* Attributes */}
            {selectedItem.attributes?.length > 0 && (
              <div>
                <Text strong style={{ display: "block", marginBottom: 10, fontSize: 14 }}>Thuộc tính</Text>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {selectedItem.attributes.map((attr) => (
                    <Tag key={attr.attributeId} color="blue">
                      {attr.attributeName}: {attr.attributeValue}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
