import { useState, useEffect } from "react";
import {
  Table,
  Card,
  Input,
  Select,
  Button,
  Tag,
  Avatar,
  Space,
  Modal,
  Drawer,
  Typography,
  Descriptions,
  Row,
  Col,
  Statistic,
  message,
  Switch,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  EyeOutlined,
  CalendarOutlined,
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import http from "../../utils/api";

const { Title, Text, Paragraph } = Typography;

interface AdminUser {
  userId: string;
  email: string;
  phoneNumber: string;
  role: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  fullName?: string;
  avatarUrl?: string;
  gender?: string;
  bio?: string;
}

const UsersPage = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  
  // Filters
  const [keyword, setKeyword] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  
  // Detail Modal & Drawer
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Construct query params manually or pass them
      const url = `/admin/users?page=${page}&size=${size}${keyword ? `&q=${encodeURIComponent(keyword)}` : ""}${roleFilter ? `&role=${roleFilter}` : ""}`;
      const response = await http.get(url, {
        headers: { "X-Service": "auth" },
      });
      setUsers(response.content || []);
      setTotal(response.totalElements || 0);
    } catch (error: any) {
      message.error(error.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, size, roleFilter]);

  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  const handleStatusToggle = async (user: AdminUser, checked: boolean) => {
    const actionText = checked ? "mở khóa" : "khóa";
    Modal.confirm({
      title: `Xác nhận ${actionText} tài khoản`,
      content: `Bạn có chắc chắn muốn ${actionText} tài khoản của ${user.fullName || user.email}?`,
      okText: "Đồng ý",
      cancelText: "Hủy bỏ",
      okType: checked ? "primary" : "danger",
      onOk: async () => {
        try {
          await http.put(`/admin/users/${user.userId}/status?status=${checked}`, {}, {
            headers: { "X-Service": "auth" },
          });
          message.success(`Đã ${actionText} tài khoản thành công!`);
          fetchUsers();
          if (selectedUser?.userId === user.userId) {
            setSelectedUser({ ...selectedUser, status: checked });
          }
        } catch (error: any) {
          message.error(error.message || `Lỗi khi ${actionText} tài khoản`);
        }
      },
    });
  };

  const showUserDetails = async (user: AdminUser) => {
    try {
      const details = await http.get(`/admin/users/${user.userId}`, {
        headers: { "X-Service": "auth" },
      });
      setSelectedUser(details);
      setDrawerVisible(true);
    } catch (error: any) {
      message.error("Không thể lấy thông tin chi tiết người dùng");
    }
  };

  const columns = [
    {
      title: "Thông tin thành viên",
      key: "user_info",
      render: (_: any, record: AdminUser) => (
        <Space size="middle">
          <Avatar
            size={48}
            src={record.avatarUrl}
            icon={<UserOutlined />}
            style={{ border: "2px solid #52c41a", boxShadow: "0 2px 8px rgba(82, 196, 26, 0.15)" }}
          />
          <div>
            <Text strong style={{ fontSize: 15, display: "block" }}>
              {record.fullName || "Chưa thiết lập tên"}
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (phone: string) => <Text style={{ fontFamily: "monospace" }}>{phone || "—"}</Text>,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      key: "role",
      render: (role: string) => {
        let color = "blue";
        if (role === "ADMIN") color = "red";
        else if (role === "STAFF") color = "orange";
        return (
          <Tag color={color} style={{ padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>
            {role}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: boolean, record: AdminUser) => (
        <Space>
          <Switch
            checkedChildren={<CheckCircleOutlined />}
            unCheckedChildren={<CloseCircleOutlined />}
            checked={status}
            onChange={(checked) => handleStatusToggle(record, checked)}
          />
          <Tag color={status ? "success" : "error"}>
            {status ? "Hoạt động" : "Bị khóa"}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => (
        <Space size="small">
          <CalendarOutlined style={{ color: "#8c8c8c" }} />
          <Text>{date || "—"}</Text>
        </Space>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: AdminUser) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          onClick={() => showUserDetails(record)}
          style={{ borderRadius: 6 }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Title section */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 700, letterSpacing: "-0.5px" }}>
          Quản Lý Người Dùng
        </Title>
        <Text type="secondary">
          Tra cứu, phân tích vai trò, khóa hoặc mở khóa tài khoản thành viên trong hệ thống.
        </Text>
      </div>

      {/* Filter and search bar */}
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={10}>
            <Input
              placeholder="Tìm kiếm theo Tên, Email, Số điện thoại..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={12} md={6}>
            <Select
              placeholder="Lọc vai trò"
              style={{ width: "100%" }}
              value={roleFilter}
              onChange={(val) => setRoleFilter(val)}
              allowClear
              size="large"
            >
              <Select.Option value="USER">Khách hàng (USER)</Select.Option>
              <Select.Option value="STAFF">Nhân viên (STAFF)</Select.Option>
              <Select.Option value="ADMIN">Quản trị viên (ADMIN)</Select.Option>
            </Select>
          </Col>
          <Col xs={12} md={4}>
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              size="large"
              style={{ width: "100%", borderRadius: 8, fontWeight: 500 }}
            >
              Tìm kiếm
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card
        bodyStyle={{ padding: 0 }}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="userId"
          loading={loading}
          pagination={{
            current: page + 1,
            pageSize: size,
            total: total,
            onChange: (p, s) => {
              setPage(p - 1);
              setSize(s);
            },
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
          }}
        />
      </Card>

      {/* Rich User Detail Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <SafetyCertificateOutlined style={{ color: "#52c41a", fontSize: "20px" }} />
            <Text strong style={{ fontSize: "18px" }}>Chi Tiết Hồ Sơ Thành Viên</Text>
          </div>
        }
        placement="right"
        width={520}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ padding: "24px" }}
      >
        {selectedUser && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Header profile card with gradient */}
            <div
              style={{
                background: "linear-gradient(135deg, #13c2c2 0%, #006d75 100%)",
                padding: "24px",
                borderRadius: "16px",
                color: "#fff",
                position: "relative",
                boxShadow: "0 10px 20px rgba(0, 109, 117, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <Avatar
                  size={72}
                  src={selectedUser.avatarUrl}
                  icon={<UserOutlined />}
                  style={{ border: "3px solid rgba(255,255,255,0.4)" }}
                />
                <div>
                  <Title level={4} style={{ color: "#fff", margin: 0, fontWeight: 600 }}>
                    {selectedUser.fullName || "Chưa đặt tên"}
                  </Title>
                  <Tag color={selectedUser.status ? "success" : "error"} style={{ marginTop: 6 }}>
                    {selectedUser.status ? "Tài khoản Hoạt động" : "Tài khoản Bị khóa"}
                  </Tag>
                </div>
              </div>
            </div>

            {/* Performance Stats Cards */}
            <div>
              <Text strong style={{ display: "block", marginBottom: 12, fontSize: 15 }}>
                Chỉ số hoạt động (Giả lập)
              </Text>
              <Row gutter={12}>
                <Col span={8}>
                  <Card style={{ background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: 8, textAlign: "center" }}>
                    <Statistic title="Tin Đăng" value={7} valueStyle={{ color: "#389e0d" }} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={{ background: "#e6f7ff", border: "1px solid #91d5ff", borderRadius: 8, textAlign: "center" }}>
                    <Statistic title="Giao Dịch" value={4} valueStyle={{ color: "#096dd9" }} />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card style={{ background: "#fff7e6", border: "1px solid #ffd591", borderRadius: 8, textAlign: "center" }}>
                    <Statistic title="Đánh Giá" value="4.8" suffix="/5" valueStyle={{ color: "#d46b08" }} />
                  </Card>
                </Col>
              </Row>
            </div>

            {/* Detail accounts parameters */}
            <div>
              <Text strong style={{ display: "block", marginBottom: 12, fontSize: 15 }}>
                Thông tin tài khoản
              </Text>
              <Descriptions column={1} bordered size="small" style={{ borderRadius: 8, overflow: "hidden" }}>
                <Descriptions.Item label="ID Người dùng">
                  <Text copyable style={{ fontSize: 12, fontFamily: "monospace" }}>{selectedUser.userId}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Email">{selectedUser.email}</Descriptions.Item>
                <Descriptions.Item label="Điện thoại">{selectedUser.phoneNumber || "—"}</Descriptions.Item>
                <Descriptions.Item label="Giới tính">{selectedUser.gender || "—"}</Descriptions.Item>
                <Descriptions.Item label="Sinh nhật">{selectedUser.createdAt || "—"}</Descriptions.Item>
                <Descriptions.Item label="Vai trò hệ thống">
                  <Tag color="purple">{selectedUser.role}</Tag>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {/* About / Bio section */}
            <div>
              <Text strong style={{ display: "block", marginBottom: 8, fontSize: 15 }}>
                Giới thiệu bản thân
              </Text>
              <Card style={{ background: "#fafafa", borderRadius: 8 }}>
                <Paragraph style={{ margin: 0, fontStyle: selectedUser.bio ? "normal" : "italic", color: selectedUser.bio ? "inherit" : "#8c8c8c" }}>
                  {selectedUser.bio || "Thành viên này chưa viết lời giới thiệu bản thân."}
                </Paragraph>
              </Card>
            </div>

            {/* Account Locking toggler inside Drawer */}
            <div style={{ marginTop: "auto", borderTop: "1px solid #f0f0f0", paddingTop: "20px" }}>
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <div>
                  <Text strong style={{ display: "block" }}>Trạng thái tài khoản</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>Khóa tài khoản nếu phát hiện vi phạm.</Text>
                </div>
                <Switch
                  checkedChildren="Mở"
                  unCheckedChildren="Khóa"
                  checked={selectedUser.status}
                  onChange={(checked) => handleStatusToggle(selectedUser, checked)}
                />
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default UsersPage;
