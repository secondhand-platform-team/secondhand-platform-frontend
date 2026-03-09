/**
 * Sidebar Component
 * Side navigation panel (optional for admin/dashboard)
 */

import React from "react";
import "./Sidebar.css";

interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  href: string;
  children?: SidebarItem[];
}

interface SidebarProps {
  items: SidebarItem[];
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ items, isOpen = true, onClose }) => {
  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <h3>Menu</h3>
        {onClose && (
          <button className="sidebar-close" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <a href={item.href} className="sidebar-link">
                {item.icon && <span className="sidebar-icon">{item.icon}</span>}
                <span>{item.label}</span>
              </a>
              {item.children && (
                <ul className="sidebar-submenu">
                  {item.children.map((child) => (
                    <li key={child.id}>
                      <a href={child.href}>{child.label}</a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
