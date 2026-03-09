/**
 * useAuth Hook
 * Custom hook for authentication logic
 */

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { logout } from '@/features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { user, token, isAuthenticated, loading, error } = useAppSelector(
    (state) => state.auth
  );

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    logout: handleLogout,
  };
};
