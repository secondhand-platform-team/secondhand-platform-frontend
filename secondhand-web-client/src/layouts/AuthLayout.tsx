/**
 * Auth Layout
 * Layout for authentication pages (login, register, etc.)
 */

import React from "react";
import type { ReactNode } from "react";
import "./AuthLayout.css";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
