import { useState, useCallback } from "react";
import { message } from "antd";
import { itemService } from "@/config/services/item.service";

type UseFavoritesReturnType = {
  isFavorited: boolean;
  isLoading: boolean;
  toggleFavorite: (itemId: string) => Promise<void>;
};

export const useFavorite = (
  initialState: boolean = false,
): UseFavoritesReturnType => {
  const [isFavorited, setIsFavorited] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFavorite = useCallback(
    async (itemId: string) => {
      try {
        setIsLoading(true);

        if (isFavorited) {
          await itemService.removeFavorite(itemId);
          setIsFavorited(false);
          message.success("Đã xóa khỏi danh sách yêu thích");
        } else {
          await itemService.addFavorite(itemId);
          setIsFavorited(true);
          message.success("Đã thêm vào danh sách yêu thích");
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        message.error("Không thể cập nhật danh sách yêu thích");
      } finally {
        setIsLoading(false);
      }
    },
    [isFavorited],
  );

  return { isFavorited, isLoading, toggleFavorite };
};
