/**
 * App Router
 * Application routing configuration
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ROUTES } from "@/config/routes";

// Layouts
import MainLayout from "@/layouts/MainLayout";

// Pages
import HomePage from "@/pages/HomePage";
import NotFoundPage from "@/pages/NotFoundPage";
import LoginPage from "@/features/auth/pages/LoginPage";

// Router Components
import ProtectedRoute from "./ProtectedRoute";

const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes - No Layout */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* Public Routes - With MainLayout */}
        <Route
          path={ROUTES.HOME}
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />

        {/* Protected Routes - With MainLayout */}
        <Route
          path={ROUTES.PRODUCTS}
          element={
            <ProtectedRoute>
              <MainLayout>
                <HomePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 Not Found */}
        <Route
          path={ROUTES.NOT_FOUND}
          element={
            <MainLayout>
              <NotFoundPage />
            </MainLayout>
          }
        />

        {/* Catch undefined routes */}
        <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
