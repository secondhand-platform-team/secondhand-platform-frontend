import { Layout, Input, Avatar, Dropdown, Switch, Typography, Space, Badge } from "antd";
import {
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import { logoutAdmin } from "../../stores/slices/auth.slice";
import { useThemeToggle } from "../../hooks/useThemeToggle";

const { Header } = Layout;
const { Text } = Typography;

interface TopbarProps {
  title?: string;
}

const Topbar = ({ title = "Dashboard" }: TopbarProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const profile = useAppSelector((state) => state.auth.profile);
  const themeMode = useAppSelector((state) => state.theme.mode);
  const toggleTheme = useThemeToggle();

  const handleLogout = () => {
    dispatch(logoutAdmin()).then(() => navigate("/"));
  };

  const dropdownItems = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Hồ sơ cá nhân",
        onClick: () => navigate("/profile"),
      },
      {
        key: "theme",
        icon: themeMode === "dark" ? <SunOutlined /> : <MoonOutlined />,
        label: (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", minWidth: 160 }}>
            <span>{themeMode === "dark" ? "Chế độ sáng" : "Chế độ tối"}</span>
            <Switch
              size="small"
              checked={themeMode === "dark"}
              onChange={toggleTheme}
            />
          </div>
        ),
      },
      { type: "divider" as const },
      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Đăng xuất",
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Header
      style={{
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        lineHeight: "56px",
        borderBottom: `1px solid ${themeMode === "dark" ? "#303030" : "#f0f0f0"}`,
        background: themeMode === "dark"
          ? "rgba(20,20,20,0.85)"
          : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <Text strong style={{ fontSize: 18, fontFamily: "'Fraunces', serif" }}>
        {/* {title} */}
      </Text>

      <Space size="middle">
        <Input
          placeholder="Tìm kiếm..."
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          style={{ width: 220, borderRadius: 8 }}
          allowClear
        />

        <Badge count={3} size="small">
          <BellOutlined style={{ fontSize: 18, cursor: "pointer" }} />
        </Badge>

        <Dropdown menu={dropdownItems} trigger={["click"]} placement="bottomRight">
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Text style={{ fontSize: 13 }}>{profile?.fullName || "Admin"}</Text>
            <Avatar
              size={32}
              src={profile?.avatarUrl}
              style={{ backgroundColor: "#059669" }}
            >
              {profile?.fullName?.charAt(0) || "A"}
            </Avatar>
          </div>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default Topbar;
