import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import LoginPage from "../pages/auth/LoginPage";
import AdminLayout from "../components/layout/AdminLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ProfilePage from "../pages/profile/ProfilePage";

const router = createBrowserRouter([
  {
    path: "",
    element: <App />,
    children: [
      {
        index: true,
        element: <LoginPage />,
      },
      {
        element: <AdminLayout />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "analytics", element: <DashboardPage /> },
          { path: "users", element: <DashboardPage /> },
          { path: "items", element: <DashboardPage /> },
          { path: "transactions", element: <DashboardPage /> },
          { path: "payments", element: <DashboardPage /> },
          { path: "reports", element: <DashboardPage /> },
          { path: "approvals", element: <DashboardPage /> },
          { path: "categories", element: <DashboardPage /> },
          { path: "settings", element: <DashboardPage /> },
        ],
      },
    ],
  },
]);

export default router;
