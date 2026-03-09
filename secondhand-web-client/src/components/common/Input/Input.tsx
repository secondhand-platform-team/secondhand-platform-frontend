/**
 * Input Component
 * Reusable input component with validation
 */

import React from "react";
import "./Input.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  fullWidth = true,
  className = "",
  ...props
}) => {
  const inputClass = [
    "input-field",
    error && "input-field--error",
    fullWidth && "input-field--full-width",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`input-wrapper ${fullWidth ? "input-wrapper--full-width" : ""}`}
    >
      {label && (
        <label htmlFor={props.id} className="input-label">
          {label}
          {props.required && <span className="required">*</span>}
        </label>
      )}
      <input className={inputClass} {...props} />
      {error && <span className="input-error">{error}</span>}
      {helperText && !error && (
        <span className="input-helper">{helperText}</span>
      )}
    </div>
  );
};

export default Input;
