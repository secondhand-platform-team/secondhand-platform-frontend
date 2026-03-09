/**
 * Login Form Component
 * Reusable login form with validation
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { login, clearError } from "@/features/auth/authSlice";
import { ROUTES } from "@/config/routes";
import Button from "@/components/common/Button/Button";
import Input from "@/components/common/Input/Input";

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      return;
    }

    try {
      const result = await dispatch(login(formData)).unwrap();
      if (result) {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate(ROUTES.HOME);
        }
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  const handleDismissError = () => {
    dispatch(clearError());
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <h2>Login</h2>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button type="button" onClick={handleDismissError}>
            ×
          </button>
        </div>
      )}

      <Input
        type="email"
        name="email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleChange}
        required
        disabled={loading}
        label="Email"
      />

      <Input
        type="password"
        name="password"
        placeholder="Enter your password"
        value={formData.password}
        onChange={handleChange}
        required
        disabled={loading}
        label="Password"
      />

      <Button type="submit" disabled={loading} fullWidth>
        {loading ? "Logging in..." : "Login"}
      </Button>

      <div className="login-footer">
        <a href={ROUTES.FORGOT_PASSWORD}>Forgot password?</a>
        <span>|</span>
        <a href={ROUTES.REGISTER}>Create account</a>
      </div>
    </form>
  );
};

export default LoginForm;
