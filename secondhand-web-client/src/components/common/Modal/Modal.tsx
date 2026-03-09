/**
 * Modal Component
 * Reusable modal dialog component
 */

import React from "react";
import type { ReactNode } from "react";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "small" | "medium" | "large";
  closeButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "medium",
  closeButton = true,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const sizeClass = `modal--${size}`;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal ${sizeClass}`}>
        {/* Header */}
        <div className="modal-header">
          {title && <h2 className="modal-title">{title}</h2>}
          {closeButton && (
            <button
              className="modal-close"
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          )}
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
