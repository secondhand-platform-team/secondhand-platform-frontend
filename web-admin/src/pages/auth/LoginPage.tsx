import React, { useState } from "react";
import { Form, Input, Button, ConfigProvider, Checkbox, Typography, Divider, Row, Col, Space } from "antd";
import { MailOutlined, LockOutlined, GoogleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { ReLifeLogo } from "../../assets/logo/Logo";

const { Title, Text, Link } = Typography;

const LoginPage = () => {
  const [loading, setLoading] = useState(false);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#059669",
          borderRadius: 6,
          controlHeightLG: 45,
          fontFamily: "Inter, system-ui, sans-serif",
        },
      }}
    >
      {/* Container chính dùng Row của Antd để đảm bảo phân tách 2 bên chuẩn xác */}
      <Row style={{ minHeight: "100vh", background: "#fff" }}>
        
        {/* LEFT: FORM LOGIN */}
        <Col xs={24} lg={10} style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px" }}>
          
          <ReLifeLogo />

          {/* Center Form Content */}
          <div style={{ maxWidth: 400, margin: "0 auto", width: "100%" }}>
            <div style={{ marginBottom: 32 }}>
              <Title level={2} style={{ marginBottom: 8 }}>Hệ thống Quản trị</Title>
              <Text type="secondary">Nhập thông tin xác thực để truy cập bảng điều khiển.</Text>
            </div>

            <Form layout="vertical" size="large" onFinish={() => setLoading(true)}>
              <Form.Item 
                label={<Text strong>Email công việc</Text>} 
                name="email"
                rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
              >
                <Input prefix={<MailOutlined style={{ color: "#bfbfbf" }} />} placeholder="name@company.com" />
              </Form.Item>

              <Form.Item 
                label={
                  <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                    <Text strong>Mật khẩu</Text>

                  </div>
                } 
                name="password"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: "#bfbfbf" }} />} placeholder="••••••••" />
              </Form.Item>

              <Form.Item name="remember" valuePropName="checked">
                <Checkbox>Ghi nhớ phiên đăng nhập</Checkbox>
              </Form.Item>

              <Button type="primary" block htmlType="submit" loading={loading} style={{ height: 48, fontWeight: 600 }}>
                Đăng nhập vào hệ thống
              </Button>

              
            </Form>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", justifyContent: "space-between", color: "#bfbfbf", fontSize: 12 }}>
            <span>© 2026 ReLife Operations</span>
            <Space split={<Divider type="vertical" />}>
              <Link type="secondary">Bảo mật</Link>
              <Link type="secondary">Hỗ trợ</Link>
            </Space>
          </div>
        </Col>

        {/* RIGHT: BRANDING BANNER (Chỉ hiện trên màn hình lớn) */}
        <Col xs={0} lg={14} style={{ 
          background: "linear-gradient(135deg, #064e3b 0%, #020617 100%)", 
          display: "flex", 
          alignItems: "center", 
          padding: "80px",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* Decor Circles */}
          <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "400px", height: "400px", background: "rgba(16, 185, 129, 0.1)", filter: "blur(100px)", borderRadius: "50%" }} />
          
          <div style={{ position: "relative", zIndex: 1, maxWidth: 600 }}>
            <Title style={{ color: "#fff", fontSize: 48, marginBottom: 24 }}>
              Nền tảng quản trị kinh tế <span style={{ color: "#10b981" }}>tuần hoàn.</span>
            </Title>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, display: "block", marginBottom: 48 }}>
              Công cụ quản lý tinh gọn giúp tối ưu hóa luồng hàng hóa secondhand và kiểm soát rủi ro.
            </Text>

            <Row gutter={40}>
              <Col>
                <div style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>99.9%</div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>Uptime hệ thống</div>
              </Col>
              <Col>
                <div style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>256-bit</div>
                <div style={{ color: "rgba(255,255,255,0.4)" }}>Mã hóa dữ liệu</div>
              </Col>
            </Row>
          </div>
          
          <Button icon={<QuestionCircleOutlined />} type="text" style={{ position: "absolute", bottom: 40, right: 40, color: "rgba(255,255,255,0.4)" }}>
            Trợ giúp hệ thống
          </Button>
        </Col>
      </Row>
    </ConfigProvider>
  );
};

export default LoginPage;