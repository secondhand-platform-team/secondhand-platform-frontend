import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Button } from "antd";
import {
  DashboardOutlined,
  BarChartOutlined,
  UserOutlined,
  FileTextOutlined,
  WarningOutlined,
  CreditCardOutlined,
  AppstoreOutlined,
  SettingOutlined,
  LeftOutlined,
  RightOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { useAppSelector } from "../../stores/hooks";
import { ReLifeLogo } from "../../assets/logo/Logo";

const { Sider } = Layout;

const menuItems = [
  {
    type: "group" as const,
    label: "TỔNG QUAN",
    key: "g1",
    children: [
      { key: "/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
      {
        key: "/analytics",
        icon: <BarChartOutlined />,
        label: "Phân tích & Báo cáo",
      },
    ],
  },
  {
    type: "group" as const,
    label: "QUẢN LÝ",
    key: "g2",
    children: [
      { key: "/users", icon: <UserOutlined />, label: "Người dùng" },
      { key: "/items", icon: <FileTextOutlined />, label: "Tin đăng" },
      { key: "/orders", icon: <ShoppingCartOutlined />, label: "Đơn hàng" },
      // { key: "/transactions", icon: <SwapOutlined />, label: "Giao dịch" },
      { key: "/payments", icon: <CreditCardOutlined />, label: "Thanh toán" },
    ],
  },
  {
    type: "group" as const,
    label: "KIỂM DUYỆT",
    key: "g3",
    children: [
      { key: "/reports", icon: <WarningOutlined />, label: "Báo cáo vi phạm" },
      {
        key: "/my-reports",
        icon: <FileTextOutlined />,
        label: "Báo cáo của tôi",
      },
      { key: "/categories", icon: <AppstoreOutlined />, label: "Danh mục" },
    ],
  },
  {
    type: "group" as const,
    label: "HỆ THỐNG",
    key: "g4",
    children: [
      { key: "/settings", icon: <SettingOutlined />, label: "Cài đặt" },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const themeMode = useAppSelector((state) => state.theme.mode);

  const borderColor = themeMode === "dark" ? "#303030" : "#f0f0f0";
  const toggleBg = themeMode === "dark" ? "#141414" : "#ffffff";
  const toggleBorder = themeMode === "dark" ? "#3f3f3f" : "#d9d9d9";

  return (
    <Sider
      collapsed={collapsed}
      trigger={null}
      width={240}
      collapsedWidth={68}
      style={{
        height: "100vh",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 100,
        overflow: "visible",
        borderRight: `1px solid ${borderColor}`,
      }}
    >
      {/* Toggle button nằm trên đường kẻ, absolute ra ngoài sider */}
      <Button
        type="text"
        icon={collapsed ? <LeftOutlined /> : <RightOutlined />}
        onClick={onToggle}
        style={{
          position: "absolute",
          right: -16,
          top: 40,
          zIndex: 101,
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: `1px solid ${toggleBorder}`,
          background: toggleBg,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          padding: 0,
        }}
      />

      {/* Logo header */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: collapsed ? "0 12px" : "0 16px",
          borderBottom: `1px solid ${borderColor}`,
          overflow: "hidden",
        }}
      >
        <ReLifeLogo collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: "none" }}
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
