/**
 * Login Page
 * Authentication page for user login
 */

import React from "react";
import AuthLayout from "@/layouts/AuthLayout";
import LoginForm from "../components/LoginForm";

const LoginPage: React.FC = () => {
  return (
    <AuthLayout>
      <div className="login-page-container">
        <LoginForm />
      </div>
    </AuthLayout>
  );
};

export default LoginPage;
