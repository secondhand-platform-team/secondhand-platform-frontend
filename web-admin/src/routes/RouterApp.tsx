import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import LoginPage from "../pages/auth/LoginPage";
import AdminLayout from "../components/layout/AdminLayout";
import DashboardPage from "../pages/dashboard/DashboardPage";
import ProfilePage from "../pages/profile/ProfilePage";
import ReportPage from "../pages/reports/ReportPage";
import MyReportsPage from "../pages/reports/MyReportsPage";
import PaymentPage from "../pages/payments/PaymentPage";
import AnalyticsPage from "../pages/analytics/AnalyticsPage";
import UsersPage from "../pages/users/UsersPage";
import CategoriesPage from "../pages/categories/CategoriesPage";
import OrdersPage from "../pages/orders/OrdersPage";
import ItemsPage from "../pages/items/ItemsPage";
import SettingsPage from "../pages/settings/SettingsPage";

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
          { path: "dashboard",    element: <DashboardPage /> },
          { path: "profile",      element: <ProfilePage /> },
          { path: "analytics",    element: <AnalyticsPage /> },
          { path: "users",        element: <UsersPage /> },
          { path: "items",        element: <ItemsPage /> },
          { path: "orders",       element: <OrdersPage /> },
          { path: "transactions", element: <DashboardPage /> },
          { path: "payments",     element: <PaymentPage /> },
          { path: "reports",      element: <ReportPage /> },
          { path: "my-reports",   element: <MyReportsPage /> },
          { path: "categories",   element: <CategoriesPage /> },
          { path: "settings",     element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

export default router;
