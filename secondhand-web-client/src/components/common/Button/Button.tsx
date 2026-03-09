/**
 * Button Component
 * Reusable button component with multiple variants
 */

import React from "react";
import "./Button.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "medium",
  fullWidth = false,
  loading = false,
  disabled = false,
  children,
  className = "",
  ...props
}) => {
  const baseClass = "btn";
  const variantClass = `btn--${variant}`;
  const sizeClass = `btn--${size}`;
  const fullWidthClass = fullWidth ? "btn--full-width" : "";
  const disabledClass = disabled ? "btn--disabled" : "";

  const classes = [
    baseClass,
    variantClass,
    sizeClass,
    fullWidthClass,
    disabledClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <span className="btn-spinner">⏳</span>
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
