import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import LoginPage from "../pages/auth/LoginPage";
import AdminLayout from "../components/layout/AdminLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ProfilePage from "../pages/profile/ProfilePage";
import ReportPage from "../pages/reports/ReportPage";
import MyReportsPage from "../pages/reports/MyReportsPage";
import AnalyticsPage from "../pages/analytics/AnalyticsPage";
import UsersPage from "../pages/users/UsersPage";
import CategoriesPage from "../pages/categories/CategoriesPage";
import OrdersPage from "../pages/orders/OrdersPage";

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
          { path: "analytics", element: <AnalyticsPage /> },
          { path: "users", element: <UsersPage /> },
          { path: "items", element: <DashboardPage /> },
          { path: "orders", element: <OrdersPage /> },
          { path: "transactions", element: <DashboardPage /> },
          { path: "payments", element: <DashboardPage /> },
          { path: "reports", element: <ReportPage /> },
          { path: "my-reports", element: <MyReportsPage /> },
          { path: "approvals", element: <DashboardPage /> },
          { path: "categories", element: <CategoriesPage /> },
          { path: "settings", element: <DashboardPage /> },
        ],
      },
    ],
  },
]);

export default router;
