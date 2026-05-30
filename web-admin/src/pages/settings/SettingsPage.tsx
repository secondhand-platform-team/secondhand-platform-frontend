import { useState } from "react";
import {
  Card, Tabs, Typography, Descriptions, Form, Input, Button,
  Switch, Row, Col, message, Space, Modal, Alert,
} from "antd";
import {
  SettingOutlined, LockOutlined, BulbOutlined,
  SaveOutlined, LogoutOutlined, SunOutlined, MoonOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { useAppSelector, useAppDispatch } from "../../stores/hooks";
import { toggleTheme } from "../../stores/slices/theme.slice";
import { logoutAdmin, changePassword } from "../../stores/slices/auth.slice";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const themeMode = useAppSelector((s) => s.theme.mode);

  const [passwordForm] = Form.useForm();
  const [savingPassword, setSavingPassword] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  const isDark = themeMode === "dark";

  const handleChangePassword = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("Mật khẩu mới không khớp");
      return;
    }
    try {
      setSavingPassword(true);
      await dispatch(changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })).unwrap();
      message.success("Đổi mật khẩu thành công");
      passwordForm.resetFields();
    } catch (err: any) {
      message.error(err?.message || "Đổi mật khẩu thất bại");
    } finally { setSavingPassword(false); }
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutAdmin()).unwrap();
      message.error("Đã đăng xuất");
      navigate("/");
    } catch { navigate("/"); }
  };

  const cardStyle = {
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
    border: "1px solid rgba(0,0,0,0.06)",
  };

  const tabItems = [
    {
      key: "system",
      label: (
        <span>
          <SettingOutlined style={{ marginRight: 6 }} />
          Cài đặt hệ thống
        </span>
      ),
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Theme */}
          <Card style={cardStyle}>
            <Title level={5} style={{ marginBottom: 20 }}>
              <BulbOutlined style={{ marginRight: 8, color: "#667eea" }} />
              Giao diện
            </Title>
            <Row align="middle" justify="space-between" style={{ padding: "12px 0" }}>
              <Col>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: isDark ? "#1f1f1f" : "#fff",
                    border: "2px solid #e8e8e8",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20,
                  }}>
                    {isDark ? <MoonOutlined style={{ color: "#a78bfa" }} /> : <SunOutlined style={{ color: "#f59e0b" }} />}
                  </div>
                  <div>
                    <Text strong style={{ display: "block" }}>Chế độ {isDark ? "tối" : "sáng"}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      {isDark ? "Giao diện tối — dễ nhìn ban đêm" : "Giao diện sáng — phù hợp ban ngày"}
                    </Text>
                  </div>
                </div>
              </Col>
              <Col>
                <Switch
                  checked={isDark}
                  onChange={() => dispatch(toggleTheme())}
                  checkedChildren={<MoonOutlined />}
                  unCheckedChildren={<SunOutlined />}
                  style={{ background: isDark ? "#667eea" : undefined }}
                />
              </Col>
            </Row>
          </Card>

          {/* System Info */}
          <Card style={cardStyle}>
            <Title level={5} style={{ marginBottom: 16 }}>
              <SafetyOutlined style={{ marginRight: 8, color: "#16a34a" }} />
              Thông tin hệ thống
            </Title>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Phiên bản Admin">v1.0.0</Descriptions.Item>
              <Descriptions.Item label="Backend API">Kong Gateway :8000</Descriptions.Item>
              <Descriptions.Item label="Kiến trúc">Microservices (Spring Boot 3 + Java 21)</Descriptions.Item>
              <Descriptions.Item label="Order Service">CQRS + Event Sourcing</Descriptions.Item>
              <Descriptions.Item label="Frontend">Vite 7 + React 19 + Ant Design</Descriptions.Item>
              <Descriptions.Item label="Database">PostgreSQL 16 (Auth + Core + Order)</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Danger Zone */}
          <Card
            style={{ ...cardStyle, border: "1px solid #ffccc7" }}
            title={<span style={{ color: "#cf1322" }}>⚠️ Vùng nguy hiểm</span>}
          >
            <Alert
              type="warning"
              showIcon
              message="Các hành động bên dưới có thể ảnh hưởng đến phiên làm việc của bạn."
              style={{ marginBottom: 16 }}
            />
            <Button
              danger
              icon={<LogoutOutlined />}
              size="large"
              onClick={() => setLogoutModal(true)}
            >
              Đăng xuất khỏi hệ thống
            </Button>
          </Card>
        </div>
      ),
    },
    {
      key: "security",
      label: (
        <span>
          <LockOutlined style={{ marginRight: 6 }} />
          Bảo mật
        </span>
      ),
      children: (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Change Password */}
          <Card style={cardStyle}>
            <Title level={5} style={{ marginBottom: 4 }}>
              <LockOutlined style={{ marginRight: 8, color: "#667eea" }} />
              Đổi mật khẩu
            </Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
              Mật khẩu mạnh nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
            </Text>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              style={{ maxWidth: 480 }}
            >
              <Form.Item
                label="Mật khẩu hiện tại"
                name="currentPassword"
                rules={[{ required: true, message: "Nhập mật khẩu hiện tại" }]}
              >
                <Input.Password size="large" placeholder="••••••••" />
              </Form.Item>
              <Form.Item
                label="Mật khẩu mới"
                name="newPassword"
                rules={[
                  { required: true, message: "Nhập mật khẩu mới" },
                  { min: 8, message: "Mật khẩu phải ít nhất 8 ký tự" },
                ]}
              >
                <Input.Password size="large" placeholder="••••••••" />
              </Form.Item>
              <Form.Item
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                rules={[{ required: true, message: "Xác nhận mật khẩu mới" }]}
              >
                <Input.Password size="large" placeholder="••••••••" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={savingPassword}
                size="large"
              >
                Đổi mật khẩu
              </Button>
            </Form>
          </Card>

          {/* Session Info */}
          <Card style={cardStyle}>
            <Title level={5} style={{ marginBottom: 16 }}>
              <SafetyOutlined style={{ marginRight: 8, color: "#16a34a" }} />
              Phiên đăng nhập
            </Title>
            <Alert
              type="success"
              showIcon
              message="Phiên làm việc hiện tại đang hoạt động"
              description="Hệ thống sử dụng HttpOnly Cookie + JWT với auto-refresh. Token được quản lý tự động."
            />
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Cài đặt</Title>
        <Text type="secondary">Quản lý thông tin tài khoản, giao diện và bảo mật</Text>
      </div>

      <Tabs
        items={tabItems}
        tabPosition="left"
        style={{ minHeight: 500 }}
        tabBarStyle={{ width: 180 }}
      />

      {/* Logout Confirm Modal */}
      <Modal
        open={logoutModal}
        onCancel={() => setLogoutModal(false)}
        onOk={handleLogout}
        title={
          <Space>
            <LogoutOutlined style={{ color: "#cf1322" }} />
            Xác nhận đăng xuất
          </Space>
        }
        okText="Đăng xuất" okType="danger"
        cancelText="Hủy"
      >
        <Text>Bạn có chắc chắn muốn đăng xuất khỏi hệ thống quản trị?</Text>
      </Modal>
    </div>
  );
}
