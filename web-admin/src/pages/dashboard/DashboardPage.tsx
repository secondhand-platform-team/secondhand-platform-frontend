import { useEffect, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Typography,
  Progress,
  Space,
} from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { fetchAllItems } from "../../stores/slices/item.slice";
import { fetchAllCategories } from "../../stores/slices/category.slice";
import { fetchPendingCount } from "../../stores/slices/report.slice";
import type { ItemResponse } from "../../types";

const { Text } = Typography;

// Map trạng thái → màu tag
const statusMap: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: "cyan", label: "Đang bán" },
  PENDING: { color: "orange", label: "Chờ duyệt" },
  SOLD: { color: "green", label: "Đã bán" },
  INACTIVE: { color: "default", label: "Ẩn" },
  FLAGGED: { color: "red", label: "Bị báo cáo" },
  GIFTED: { color: "purple", label: "Đã tặng" },
};

const typeMap: Record<string, { color: string; label: string }> = {
  SELL: { color: "gold", label: "Bán" },
  GIFT: { color: "purple", label: "Tặng" },
  EXCHANGE: { color: "cyan", label: "Trao đổi" },
};

const formatPrice = (price: number | null, type: string) => {
  if (type === "GIFT") return "Miễn phí";
  if (type === "EXCHANGE" || !price) return "—";
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
};

const DashboardPage = () => {
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((s) => s.item);
  const { categories } = useAppSelector((s) => s.category);
  const { pendingCount } = useAppSelector((s) => s.report);

  useEffect(() => {
    dispatch(fetchAllItems());
    dispatch(fetchAllCategories());
    dispatch(fetchPendingCount());
  }, [dispatch]);

  // Tính metrics từ items
  const metrics = useMemo(() => {
    const active = items.filter((i) => i.status === "ACTIVE").length;
    const sold = items.filter(
      (i) => i.status === "SOLD" || i.status === "GIFTED",
    ).length;
    const flagged = items.filter((i) => i.status === "FLAGGED").length;
    return {
      total: items.length,
      active,
      sold,
      flagged,
      pendingReports: pendingCount,
    };
  }, [items, pendingCount]);

  // Tính danh mục phổ biến
  const categoryStats = useMemo(() => {
    const catCount: Record<string, number> = {};
    items.forEach((item) => {
      catCount[item.categoryId] = (catCount[item.categoryId] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(catCount), 1);
    return categories
      .map((cat) => ({
        name: cat.name,
        count: catCount[cat.categoryId] || 0,
        percent: Math.round(((catCount[cat.categoryId] || 0) / maxCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [items, categories]);

  // Tính giao dịch theo loại
  const typeCounts = useMemo(() => {
    const sell = items.filter((i) => i.transactionType === "SELL").length;
    const gift = items.filter((i) => i.transactionType === "GIFT").length;
    const exchange = items.filter(
      (i) => i.transactionType === "EXCHANGE",
    ).length;
    return { sell, gift, exchange };
  }, [items]);

  // Tin đăng gần đây
  const recentItems = useMemo(() => {
    return [...items]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);
  }, [items]);

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: "title",
      key: "title",
      render: (_: any, record: ItemResponse) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {record.title}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {record.userId?.slice(0, 8)}...
          </Text>
        </div>
      ),
    },
    {
      title: "Loại",
      dataIndex: "transactionType",
      key: "type",
      render: (type: string) => {
        const t = typeMap[type] || { color: "default", label: type };
        return <Tag color={t.color}>{t.label}</Tag>;
      },
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (_: any, record: ItemResponse) => (
        <Text strong style={{ fontSize: 13 }}>
          {formatPrice(record.price, record.transactionType)}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const s = statusMap[status] || { color: "default", label: status };
        return <Tag color={s.color}>{s.label}</Tag>;
      },
    },
  ];

  const catColors = ["#1D9E75", "#BA7517", "#7F77DD", "#378ADD", "#D85A30"];

  return (
    <div>
      {/* Metrics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng tin đăng"
              value={metrics.total}
              prefix={<FileTextOutlined style={{ color: "#059669" }} />}
              suffix={
                <Text style={{ fontSize: 12, color: "#059669" }}>
                  <ArrowUpOutlined /> mới
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tin hoạt động"
              value={metrics.active}
              prefix={<CheckCircleOutlined style={{ color: "#d4a017" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Giao dịch thành công"
              value={metrics.sold}
              prefix={<CheckCircleOutlined style={{ color: "#3B6D11" }} />}
              suffix={
                <Text style={{ fontSize: 12, color: "#3B6D11" }}>
                  <ArrowUpOutlined />
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Vi phạm chờ xử lý"
              value={metrics.pendingReports}
              prefix={<WarningOutlined style={{ color: "#D85A30" }} />}
              styles={{
                content: {
                  color: metrics.pendingReports > 0 ? "#D85A30" : undefined,
                },
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 2: Chart + Categories */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title="Phân loại giao dịch" extra={<a>Chi tiết →</a>}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div
                    style={{ fontSize: 28, fontWeight: 600, color: "#d4a017" }}
                  >
                    {typeCounts.sell}
                  </div>
                  <Tag color="gold">Bán</Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div
                    style={{ fontSize: 28, fontWeight: 600, color: "#7F77DD" }}
                  >
                    {typeCounts.gift}
                  </div>
                  <Tag color="purple">Tặng</Tag>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div
                    style={{ fontSize: 28, fontWeight: 600, color: "#1D9E75" }}
                  >
                    {typeCounts.exchange}
                  </div>
                  <Tag color="cyan">Trao đổi</Tag>
                </div>
              </Col>
            </Row>

            {/* Mini bar chart using Ant Progress */}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 8,
                alignItems: "flex-end",
                height: 100,
              }}
            >
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, i) => {
                const h = [50, 76, 62, 86, 68, 42, 35][i];
                return (
                  <div key={day} style={{ flex: 1, textAlign: "center" }}>
                    <div
                      style={{
                        height: h,
                        background: i === 3 ? "#1D9E75" : "#E1F5EE",
                        border: i !== 3 ? "1px solid #9FE1CB" : "none",
                        borderRadius: "4px 4px 0 0",
                        transition: "height 0.3s",
                      }}
                    />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {day}
                    </Text>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Danh mục phổ biến">
            <Space orientation="vertical" style={{ width: "100%" }} size={12}>
              {categoryStats.length > 0 ? (
                categoryStats.map((cat, i) => (
                  <div key={cat.name}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <Space>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: catColors[i % catColors.length],
                          }}
                        />
                        <Text style={{ fontSize: 12 }}>{cat.name}</Text>
                      </Space>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {cat.count} tin ({cat.percent}%)
                      </Text>
                    </div>
                    <Progress
                      percent={cat.percent}
                      showInfo={false}
                      strokeColor={catColors[i % catColors.length]}
                      size="small"
                    />
                  </div>
                ))
              ) : (
                <Text type="secondary">Chưa có dữ liệu</Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Row 3: Recent items table */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Tin đăng gần đây" extra={<a>Xem tất cả →</a>}>
            <Table
              columns={columns}
              dataSource={recentItems}
              rowKey="itemId"
              pagination={false}
              loading={loading}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
