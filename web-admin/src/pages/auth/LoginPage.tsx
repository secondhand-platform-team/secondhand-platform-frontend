import { useEffect } from "react";
import {
  App,
  Form,
  Input,
  Button,
  Checkbox,
  Typography,
  Row,
  Col,
} from "antd";
import { MailOutlined, LockOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import { ReLifeLogo } from "../../assets/logo/Logo";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { loginAdmin, clearError } from "../../stores/slices/auth.slice";
import { useNavigate } from "react-router-dom";

const { Title, Text, Link } = Typography;

const LoginPageInner = () => {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (error) {
      message.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch, message]);

  const onFinish = (values: { email: string; password: string }) => {
    dispatch(loginAdmin({ email: values.email, password: values.password }));
  };

  return (
    <Row style={{ minHeight: "100vh", background: "#fff" }}>
      {/* LEFT: FORM LOGIN */}
      <Col
        xs={24}
        lg={10}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "40px",
        }}
      >
        <ReLifeLogo />

        <div style={{ maxWidth: 400, margin: "0 auto", width: "100%" }}>
          <div style={{ marginBottom: 32 }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              Hệ thống Quản trị
            </Title>
            <Text type="secondary">
              Nhập thông tin xác thực để truy cập bảng điều khiển.
            </Text>
          </div>

          <Form layout="vertical" size="large" onFinish={onFinish}>
            <Form.Item
              label={<Text strong>Email công việc</Text>}
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="name@company.com"
              />
            </Form.Item>

            <Form.Item
              label={<Text strong>Mật khẩu</Text>}
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
                placeholder="••••••••"
              />
            </Form.Item>

            {/* <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Ghi nhớ phiên đăng nhập</Checkbox>
            </Form.Item> */}

            <Button
              type="primary"
              block
              htmlType="submit"
              loading={loading}
              style={{ height: 48, fontWeight: 600 }}
            >
              Đăng nhập vào hệ thống
            </Button>
          </Form>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#bfbfbf",
            fontSize: 12,
          }}
        >
          <span>© 2026 ReLife Operations</span>
          <span style={{ display: "flex", gap: 16 }}>
            <Link style={{ color: "#bfbfbf", fontSize: 12 }}>Bảo mật</Link>
            <Link style={{ color: "#bfbfbf", fontSize: 12 }}>Hỗ trợ</Link>
          </span>
        </div>
      </Col>

      {/* RIGHT: BRANDING BANNER */}
      <Col
        xs={0}
        lg={14}
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #020617 100%)",
          display: "flex",
          alignItems: "center",
          padding: "80px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-10%",
            right: "-10%",
            width: "400px",
            height: "400px",
            background: "rgba(16, 185, 129, 0.1)",
            filter: "blur(100px)",
            borderRadius: "50%",
          }}
        />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 600 }}>
          <Title style={{ color: "#fff", fontSize: 48, marginBottom: 24 }}>
            Nền tảng quản trị kinh tế{" "}
            <span style={{ color: "#10b981" }}>tuần hoàn.</span>
          </Title>
          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 18,
              display: "block",
              marginBottom: 48,
            }}
          >
            Công cụ quản lý tinh gọn giúp tối ưu hóa luồng hàng hóa secondhand
            và kiểm soát rủi ro.
          </Text>

          <Row gutter={40}>
            <Col>
              <div style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
                99.9%
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)" }}>
                Uptime hệ thống
              </div>
            </Col>
            <Col>
              <div style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
                256-bit
              </div>
              <div style={{ color: "rgba(255,255,255,0.4)" }}>
                Mã hóa dữ liệu
              </div>
            </Col>
          </Row>
        </div>

        <Button
          icon={<QuestionCircleOutlined />}
          type="text"
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Trợ giúp hệ thống
        </Button>
      </Col>
    </Row>
  );
};

// Wrap với App để dùng App.useApp() lấy message context-aware
const LoginPage = () => (
  <App>
    <LoginPageInner />
  </App>
);

export default LoginPage;