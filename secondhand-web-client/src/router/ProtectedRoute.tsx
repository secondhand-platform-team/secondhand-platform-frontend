/**
 * Protected Route Component
 * Wraps routes that require authentication
 */

import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/reduxHooks";
import { ROUTES } from "@/config/routes";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Show loading state if still checking authentication
  if (isAuthenticated === undefined) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
