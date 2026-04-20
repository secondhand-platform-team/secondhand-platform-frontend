import { flushSync } from "react-dom";
import { useAppDispatch } from "../stores/hooks";
import { toggleTheme } from "../stores/slices/theme.slice";

/**
 * Hook toggle dark/light mode dùng View Transition API để toàn bộ trang
 * chuyển đổi cùng lúc (cross-fade) thay vì từng component re-render riêng lẻ.
 * Fallback về dispatch thường nếu browser không hỗ trợ View Transition API.
 */
export const useThemeToggle = () => {
  const dispatch = useAppDispatch();

  const handleToggle = () => {
    if (!document.startViewTransition) {
      dispatch(toggleTheme());
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => {
        dispatch(toggleTheme());
      });
    });
  };

  return handleToggle;
};
