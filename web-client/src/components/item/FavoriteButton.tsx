"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { App } from "antd";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { toggleItemFavorite } from "@/stores/slices/items.slice";

type FavoriteButtonProps = {
  itemId: string;
  initialIsFavorited?: boolean;
  initialFavoriteCount?: number;
  className?: string;
  showCount?: boolean;
  showLabel?: boolean;
};

export default function FavoriteButton({
  itemId,
  initialIsFavorited = false,
  initialFavoriteCount = 0,
  className = "",
  showCount = false,
  showLabel = false,
}: FavoriteButtonProps) {
  const dispatch = useAppDispatch();
  const { message: messageApi } = App.useApp();
  const isAuth = useAppSelector((state) => state.auth.isAuth);

  const [faved, setFaved] = useState(initialIsFavorited);
  const [count, setCount] = useState(initialFavoriteCount);
  const [isAnimating, setIsAnimating] = useState(false);

  // Sync state if props change (e.g. when items are loaded asynchronously)
  useEffect(() => {
    setFaved(initialIsFavorited);
  }, [initialIsFavorited]);

  useEffect(() => {
    setCount(initialFavoriteCount);
  }, [initialFavoriteCount]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigating to detail page if embedded in a card

    if (!isAuth) {
      messageApi.warning("Vui lòng đăng nhập để lưu sản phẩm yêu thích!");
      return;
    }

    // Micro-animation trigger
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Optimistic UI updates
    const targetFaved = !faved;
    setFaved(targetFaved);
    setCount((prev) => Math.max(0, prev + (targetFaved ? 1 : -1)));

    try {
      await dispatch(
        toggleItemFavorite({ itemId, isFavorited: faved })
      ).unwrap();

      if (targetFaved) {
        messageApi.success("Đã thêm vào danh sách yêu thích!");
      } else {
        messageApi.success("Đã xóa khỏi danh sách yêu thích!");
      }
    } catch (err) {
      // Revert optimistic updates on error
      setFaved(faved);
      setCount(count);
      messageApi.error(err instanceof Error ? err.message : "Thao tác thất bại!");
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`group flex items-center justify-center gap-1.5 transition-all duration-300 ${
        faved
          ? "text-red-500 scale-105"
          : "text-slate-400 hover:text-red-500 dark:text-slate-500 hover:scale-105"
      } ${className}`}
      style={{ outline: "none" }}
      aria-label={faved ? "Bỏ yêu thích" : "Yêu thích"}
    >
      <div
        className={`relative flex items-center justify-center transition-transform duration-300 ${
          isAnimating ? "scale-125" : ""
        }`}
      >
        <Heart
          className={`w-5 h-5 transition-all duration-300 ${
            faved
              ? "fill-red-500 stroke-red-500 drop-shadow-[0_2px_8px_rgba(239,68,68,0.4)]"
              : "stroke-current fill-transparent group-hover:fill-red-50"
          }`}
        />
      </div>
      {showLabel && (
        <span className={`text-sm font-semibold transition-colors duration-300 ${
          faved ? "text-red-500" : "text-slate-500"
        }`}>
          {faved ? "Đã thích" : "Yêu thích"}
        </span>
      )}
      {showCount && count > 0 && (
        <span
          className={`text-xs font-semibold transition-colors duration-300 ${
            faved ? "text-red-500 font-bold" : "text-slate-500 dark:text-slate-400 group-hover:text-red-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
