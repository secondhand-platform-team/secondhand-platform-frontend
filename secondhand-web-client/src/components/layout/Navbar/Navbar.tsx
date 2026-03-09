/**
 * Navbar Component
 * Main navigation bar
 */

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { logout } from "@/features/auth/authSlice";
import { ROUTES } from "@/config/routes";
import "./Navbar.css";

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <a href={ROUTES.HOME}>SecondHand</a>
        </div>

        {/* Menu Button (Mobile) */}
        <button
          className="navbar-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>

        {/* Navigation Items */}
        <ul className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
          <li>
            <a href={ROUTES.HOME}>Home</a>
          </li>
          <li>
            <a href={ROUTES.PRODUCTS}>Browse</a>
          </li>

          {isAuthenticated ? (
            <>
              <li>
                <a href={ROUTES.MY_PRODUCTS}>My Products</a>
              </li>
              <li>
                <a href={ROUTES.PRODUCT_CREATE}>Sell</a>
              </li>
              <li className="navbar-user">
                <span className="user-avatar">
                  {user?.firstName?.charAt(0).toUpperCase()}
                </span>
                <div className="user-menu">
                  <a href={ROUTES.PROFILE}>
                    {user?.firstName} {user?.lastName}
                  </a>
                  <a href={ROUTES.SETTINGS}>Settings</a>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              </li>
            </>
          ) : (
            <>
              <li>
                <a href={ROUTES.LOGIN} className="btn-login">
                  Login
                </a>
              </li>
              <li>
                <a href={ROUTES.REGISTER} className="btn-register">
                  Register
                </a>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
