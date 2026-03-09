/**
 * Home Page
 * Application home/dashboard page
 */

import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/reduxHooks";
import { getCurrentUser } from "@/features/auth/authSlice";
import Button from "@/components/common/Button/Button";
import { ROUTES } from "@/config/routes";

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getCurrentUser());
    }
  }, [isAuthenticated, user, dispatch]);

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h1>Welcome to SecondHand</h1>
        <p>Buy and sell quality secondhand products online</p>

        {isAuthenticated ? (
          <div className="user-greeting">
            <h2>Welcome back, {user?.firstName}!</h2>
            <div className="action-buttons">
              <Button variant="primary" size="large">
                <a
                  href={ROUTES.MY_PRODUCTS}
                  style={{ textDecoration: "none", color: "white" }}
                >
                  My Products
                </a>
              </Button>
              <Button variant="success" size="large">
                <a
                  href={ROUTES.PRODUCT_CREATE}
                  style={{ textDecoration: "none", color: "white" }}
                >
                  Sell Something
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div className="guest-actions">
            <Button variant="primary" size="large">
              <a
                href={ROUTES.LOGIN}
                style={{ textDecoration: "none", color: "white" }}
              >
                Login
              </a>
            </Button>
            <Button variant="secondary" size="large">
              <a
                href={ROUTES.REGISTER}
                style={{ textDecoration: "none", color: "white" }}
              >
                Create Account
              </a>
            </Button>
          </div>
        )}
      </div>

      {/* Featured Products Section */}
      <section className="featured-section">
        <h2>Featured Products</h2>
        <div className="products-grid">
          <div className="product-card">
            <div className="product-image">📱</div>
            <h3>Electronics</h3>
            <p>Browse quality secondhand electronics</p>
          </div>
          <div className="product-card">
            <div className="product-image">👕</div>
            <h3>Fashion</h3>
            <p>Trendy clothes and accessories</p>
          </div>
          <div className="product-card">
            <div className="product-image">📚</div>
            <h3>Books</h3>
            <p>Used books for all interests</p>
          </div>
          <div className="product-card">
            <div className="product-image">🏠</div>
            <h3>Home & Garden</h3>
            <p>Furniture and home decor items</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
