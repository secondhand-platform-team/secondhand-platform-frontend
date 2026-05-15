import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Select,
  Table,
  Badge,
  Space,
  Avatar,
  message,
  List,
} from "antd";
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserAddOutlined,
  PercentageOutlined,
  FireOutlined,
  TrophyOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import http from "../../utils/api";

const { Title, Text } = Typography;

interface TopSeller {
  sellerId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  revenue: number;
  ordersCount: number;
}

interface TopProduct {
  itemId: string;
  title: string;
  price: number;
  imageUrl?: string;
  views: number;
  ordersCount: number;
}

const AnalyticsPage = () => {
  const [timeframe, setTimeframe] = useState("month");
  const [stats, setStats] = useState<any>(null);
  // Fetch metrics and dashboard details
  const fetchAnalytics = async () => {
    try {
      // Fetch user metrics from auth-service
      const userStats = await http.get("/admin/statistics", {
        headers: { "X-Service": "auth" },
        params: { timeframe }
      });

      // Fetch order/revenue metrics from order-service
      const orderStats = await http.get("/orders/admin/statistics", {
        headers: { "X-Service": "order" },
        params: { timeframe }
      });

      // Process daily revenue data for the chart
      const processedRevenueData = orderStats.dailyRevenue?.map((item: any[]) => ({
        label: new Date(item[0]).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        value: item[1] || 0
      })) || [];

      // Process top sellers
      const processedTopSellers = orderStats.topSellers?.map((item: any[]) => ({
        sellerId: String(item[0]),
        fullName: "Người bán " + String(item[0]).substring(0, 5),
        email: "ID: " + String(item[0]).substring(0, 8),
        revenue: Number(item[1]),
        ordersCount: Number(item[2])
      })) || [];

      // Process top products
      const processedTopProducts = orderStats.topProducts?.map((item: any[]) => ({
        itemId: String(item[0]),
        title: String(item[1]),
        price: 0,
        views: 0,
        ordersCount: Number(item[2])
      })) || [];

      setStats({
        totalRevenue: orderStats.totalRevenue || 0,
        revenueGrowth: 0, // Need historical data for growth
        totalOrders: orderStats.totalOrders || 0,
        orderGrowth: 0,
        totalUsers: userStats.totalUsers || 0,
        userGrowth: 0,
        refundRate: 0,
        refundChange: 0,
        revenueData: processedRevenueData.length > 0 ? processedRevenueData : [
          { label: "N/A", value: 0 }
        ],
        categories: [
          { name: "Điện tử", value: 40, color: "#1890ff" },
          { name: "Phương tiện", value: 30, color: "#2f54eb" },
          { name: "Khác", value: 30, color: "#fa8c16" },
        ],
        topSellers: processedTopSellers,
        topProducts: processedTopProducts
      });
    } catch (error) {
      console.error(error);
      message.error("Lỗi khi tải dữ liệu phân tích hệ thống thực tế");
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  if (!stats) return <Card loading={true} style={{ height: "100vh" }} />;

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString()} đ`;
  };

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Title Header */}
      <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.5px" }}>
            Báo Cáo Doanh Thu & Thống Kê
          </Title>
          <Text type="secondary">
            Phân tích số liệu tài chính, hiệu suất kinh doanh, hoạt động của người dùng toàn hệ thống.
          </Text>
        </div>
        <Select
          value={timeframe}
          onChange={(val) => setTimeframe(val)}
          style={{ width: 160 }}
          size="large"
          suffixIcon={<CalendarOutlined />}
        >
          <Select.Option value="day">Hôm nay</Select.Option>
          <Select.Option value="week">7 ngày qua</Select.Option>
          <Select.Option value="month">Tháng này</Select.Option>
          <Select.Option value="year">Năm nay</Select.Option>
        </Select>
      </div>

      {/* KPI Cards row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
              background: "linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)",
              border: "1px solid #91d5ff",
            }}
          >
            <Statistic
              title={<Text type="secondary" strong>TỔNG DOANH THU</Text>}
              value={stats.totalRevenue}
              formatter={(val) => formatCurrency(val as number)}
              valueStyle={{ color: "#096dd9", fontWeight: 700, fontSize: 24 }}
              prefix={<DollarOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Badge status="success" />
              <Text type="success" strong style={{ marginRight: 4 }}>+{stats.revenueGrowth}%</Text>
              <Text type="secondary">so với kỳ trước</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
              background: "linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)",
              border: "1px solid #b7eb8f",
            }}
          >
            <Statistic
              title={<Text type="secondary" strong>TỔNG ĐƠN HÀNG</Text>}
              value={stats.totalOrders}
              valueStyle={{ color: "#389e0d", fontWeight: 700, fontSize: 24 }}
              prefix={<ShoppingCartOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Badge status="success" />
              <Text type="success" strong style={{ marginRight: 4 }}>+{stats.orderGrowth}%</Text>
              <Text type="secondary">so với kỳ trước</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
              background: "linear-gradient(135deg, #fff7e6 0%, #ffffff 100%)",
              border: "1px solid #ffd591",
            }}
          >
            <Statistic
              title={<Text type="secondary" strong>THÀNH VIÊN MỚI</Text>}
              value={stats.totalUsers}
              valueStyle={{ color: "#d46b08", fontWeight: 700, fontSize: 24 }}
              prefix={<UserAddOutlined />}
            />
            <div style={{ marginTop: 8 }}>
              <Badge status="success" />
              <Text type="success" strong style={{ marginRight: 4 }}>+{stats.userGrowth}%</Text>
              <Text type="secondary">so với kỳ trước</Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
              background: "linear-gradient(135deg, #fff1f0 0%, #ffffff 100%)",
              border: "1px solid #ffccc7",
            }}
          >
            <Statistic
              title={<Text type="secondary" strong>TỶ LỆ HOÀN TIỀN</Text>}
              value={stats.refundRate}
              valueStyle={{ color: "#cf1322", fontWeight: 700, fontSize: 24 }}
              prefix={<PercentageOutlined />}
              suffix="%"
            />
            <div style={{ marginTop: 8 }}>
              <Badge status="error" />
              <Text type="danger" strong style={{ marginRight: 4 }}>{stats.refundChange}%</Text>
              <Text type="secondary">giảm xuất sắc</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Charts & Breakdown Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {/* Revenue Trend chart using custom animated inline layout */}
        <Col xs={24} lg={16}>
          <Card
            title={<Text strong style={{ fontSize: 16 }}>Biểu Đồ Xu Hướng Doanh Thu</Text>}
            style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}
          >
            <div style={{ height: 280, display: "flex", alignItems: "flex-end", justifyContent: "space-around", padding: "16px 0" }}>
              {stats.revenueData.map((data: any, idx: number) => {
                const maxVal = Math.max(...stats.revenueData.map((d: any) => d.value), 1000000);
                const heightPercent = (data.value / maxVal) * 80; // Scale to 80% max
                return (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "15%" }}>
                    <Text strong style={{ fontSize: 11, marginBottom: 8, color: "#1890ff" }}>
                      {Math.round(data.value / 1000000)}M
                    </Text>
                    <div
                      style={{
                        width: "100%",
                        height: `${heightPercent}%`,
                        background: "linear-gradient(to top, #1890ff 0%, #69c0ff 100%)",
                        borderRadius: "8px 8px 0 0",
                        transition: "all 0.5s ease-in-out",
                        boxShadow: "0 4px 12px rgba(24, 144, 255, 0.25)",
                      }}
                    />
                    <Text type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                      {data.label}
                    </Text>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* Category distribution Pie breakdown */}
        <Col xs={24} lg={8}>
          <Card
            title={<Text strong style={{ fontSize: 16 }}>Cơ Cấu Doanh Thu Theo Nhóm Ngành</Text>}
            style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)", height: "100%" }}
          >
            <div style={{ padding: "12px 0" }}>
              <List
                dataSource={stats.categories}
                renderItem={(item: any) => (
                  <List.Item style={{ padding: "16px 0", borderBottom: "1px dashed #f0f0f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <Space>
                        <span style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", background: item.color }} />
                        <Text strong style={{ fontSize: 13 }}>{item.name}</Text>
                      </Space>
                      <Text strong style={{ color: item.color, fontSize: 14 }}>{item.value}%</Text>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tops row (Top sellers & Top products) */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <TrophyOutlined style={{ color: "#fa8c16" }} />
                <Text strong style={{ fontSize: 16 }}>Top Người Bán Doanh Số Khủng</Text>
              </Space>
            }
            style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}
          >
            <Table
              dataSource={stats.topSellers}
              rowKey="sellerId"
              pagination={false}
              size="middle"
              columns={[
                {
                  title: "Người bán",
                  key: "seller",
                  render: (_: any, record: TopSeller) => (
                    <Space>
                      <Avatar style={{ backgroundColor: "#1890ff" }}>{record.fullName[0]}</Avatar>
                      <div>
                        <Text strong>{record.fullName}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
                      </div>
                    </Space>
                  ),
                },
                {
                  title: "Đơn bán",
                  dataIndex: "ordersCount",
                  key: "ordersCount",
                  render: (count: number) => <Badge count={count} style={{ backgroundColor: "#52c41a" }} />,
                },
                {
                  title: "Doanh số",
                  dataIndex: "revenue",
                  key: "revenue",
                  render: (rev: number) => <Text strong style={{ color: "#cf1322" }}>{formatCurrency(rev)}</Text>,
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FireOutlined style={{ color: "#ff4d4f" }} />
                <Text strong style={{ fontSize: 16 }}>Top Sản Phẩm Được Săn Đón</Text>
              </Space>
            }
            style={{ borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}
          >
            <Table
              dataSource={stats.topProducts}
              rowKey="itemId"
              pagination={false}
              size="middle"
              columns={[
                {
                  title: "Sản phẩm",
                  key: "product",
                  ellipsis: true,
                  render: (_: any, record: TopProduct) => (
                    <div>
                      <Text strong>{record.title}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 12 }}>{formatCurrency(record.price)}</Text>
                    </div>
                  ),
                },
                {
                  title: "Lượt xem",
                  dataIndex: "views",
                  key: "views",
                  render: (views: number) => <Text>{views.toLocaleString()}</Text>,
                },
                {
                  title: "Đã chốt",
                  dataIndex: "ordersCount",
                  key: "ordersCount",
                  render: (count: number) => <Badge count={count} style={{ backgroundColor: "#1890ff" }} />,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AnalyticsPage;
