/**
 * Route Configuration
 * Centralized route paths for better maintainability
 */

export const ROUTES = {
  // Public Routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',

  // Protected Routes
  DASHBOARD: '/dashboard',
  HOME: '/',
  
  // User Routes
  PROFILE: '/profile',
  SETTINGS: '/settings',
  MY_PRODUCTS: '/products/my-products',
  
  // Product Routes
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  PRODUCT_CREATE: '/products/create',
  PRODUCT_EDIT: '/products/:id/edit',

  // Catch-all
  NOT_FOUND: '*',
};
