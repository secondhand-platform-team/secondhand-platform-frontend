import { useEffect, useState } from "react";
import { Layout, Spin } from "antd";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppSelector, useAppDispatch } from "../../stores/hooks";
import { fetchProfile } from "../../stores/slices/auth.slice";

const { Content } = Layout;

const TOPBAR_HEIGHT = 56;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useAppDispatch();
  const isAuth = useAppSelector((state) => state.auth.isAuth);
  const user = useAppSelector((state) => state.auth.user);

  // authChecked starts true if already authenticated (fresh login), false if page refresh
  const [authChecked, setAuthChecked] = useState(isAuth);

  useEffect(() => {
    // Only verify session from cookie when NOT already authenticated (page refresh / direct URL)
    if (!isAuth) {
      dispatch(fetchProfile()).finally(() => setAuthChecked(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — run only once on mount

  // Still waiting for cookie-based session verification
  if (!authChecked) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuth && !user) {
    return <Navigate to="/" replace />;
  }

  const siderWidth = collapsed ? 68 : 240;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      {/* Right panel — pushes away from fixed sidebar */}
      <Layout
        style={{
          marginLeft: siderWidth,
          transition: "margin-left 0.2s ease",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Topbar cố định ở trên */}
        <div style={{ flexShrink: 0, position: "sticky", top: 0, zIndex: 98 }}>
          <Topbar />
        </div>

        {/* Content cuộn */}
        <Content
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 24,
            height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
