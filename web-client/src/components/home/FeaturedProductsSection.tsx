/* eslint-disable @next/next/no-img-element */
"use client";
import type { ItemWithImages } from "@/types/item.type";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import { itemService,  } from "@/stores/slices/items.slice";
import FavoriteButton from "@/components/item/FavoriteButton";
import { useAppSelector } from "@/stores/hooks";

function formatPrice(price: number | null | undefined): string {
  if (price == null || price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "đ";
}

function getImageUrl(item: ItemWithImages): string {
  const img = item.itemImageList?.find((i) => i.isPrimary) ?? item.itemImageList?.[0];
  return img?.imageUrl ?? "/icon-other/san-pham-khac.png";
}

function getLocation(item: ItemWithImages): string {
  if (!item.location) return "Toàn quốc";
  const parts = [item.location.district, item.location.city].filter(Boolean);
  return parts.join(", ") || "Toàn quốc";
}

export default function FeaturedProductsSection() {
  const router = useRouter();
  const [items, setItems] = useState<ItemWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = useAppSelector((state) => state.auth.user?.userId);

  useEffect(() => {
    let cancelled = false;

    const loadItems = async () => {
      // 1. Luôn tải sản phẩm nổi bật trước làm fallback
      try {
        const fallbackItems = await itemService.getFeaturedItems(4);
        if (!cancelled) {
          setItems(fallbackItems);
          setLoading(false);
        }
      } catch (err) {
        console.error("Lỗi lấy sản phẩm nổi bật:", err);
        if (!cancelled) setLoading(false);
      }

      // 2. Nếu đã đăng nhập, thử gọi AI để cá nhân hóa (không block UI)
      if (!currentUserId) return;

      try {
        const fetchOptions: RequestInit = {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Client-Type": "user",
          },
        };

        let recentItemNames: string[] = [];
        let cartItemIds: string[] = [];

        // Lấy lịch sử xem + giỏ hàng song song
        const [historyResult, cartResult] = await Promise.allSettled([
          fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000"}/core/api/view-history/recent`, fetchOptions),
          fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000"}/order/api/carts/me`, fetchOptions),
        ]);

        if (historyResult.status === "fulfilled" && historyResult.value.ok) {
          try {
            const historyData = await historyResult.value.json();
            recentItemNames = (Array.isArray(historyData) ? historyData : [])
              .map((h: any) => h.item?.title)
              .filter(Boolean);
          } catch {}
        }

        if (cartResult.status === "fulfilled" && cartResult.value.ok) {
          try {
            const cartData = await cartResult.value.json();
            if (cartData && Array.isArray(cartData.cartItems)) {
              cartItemIds = cartData.cartItems.map((c: any) => c.itemId).filter(Boolean);
            }
          } catch {}
        }

        // Gọi AI-Service với timeout 8 giây
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const aiRes = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000"}/ai/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            user_id: currentUserId,
            recent_items: recentItemNames,
            cart_item_ids: cartItemIds,
            limit: 8,
          }),
        });
        clearTimeout(timeoutId);

        if (!cancelled && aiRes.ok) {
          const aiData = await aiRes.json();
          const recommendedItems = (Array.isArray(aiData.items) ? aiData.items : []).map((item: any) => ({
            ...item,
            images: item.itemImageList || [{ imageUrl: item.image_url }],
            favoriteCount: item.favoriteCount ?? 0,
            isFavorited: item.isFavorited ?? false,
          }));
          if (recommendedItems.length > 0 && !cancelled) {
            setItems(recommendedItems);
          }
        }
      } catch {
        // AI thất bại → giữ nguyên fallback items đã hiển thị
      }
    };

    loadItems();
    return () => { cancelled = true; };
  }, [currentUserId]);

  return (
    <section className="bg-primary/5 py-12 dark:bg-primary/5" id="featured">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Sản phẩm dành cho bạn
          </h2>
          <button
            onClick={() => router.push("/search")}
            className="cursor-pointer text-sm font-bold text-primary hover:underline"
            type="button"
          >
            Xem tất cả
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-white dark:bg-slate-800 overflow-hidden">
                <div className="aspect-square bg-slate-200 dark:bg-slate-700" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.filter((item) => !currentUserId || item.userId !== currentUserId).slice(0, 4).map((item) => (
              <div
                key={item.itemId}
                onClick={() => router.push(`/items/${item.itemId}`)}
                className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-xl dark:bg-slate-800"
              >
                <div className="aspect-square w-full overflow-hidden bg-slate-200">
                  <img
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    alt={item.title}
                    src={getImageUrl(item)}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/icon-other/san-pham-khac.png";
                    }}
                  />
                  {(item.transactionType === "GIVE_AWAY" || item.price === 0) && (
                    <div className="absolute left-3 top-3 rounded-lg bg-primary px-2 py-1 text-xs font-bold uppercase text-white">
                      Tặng miễn phí
                    </div>
                  )}
                  <div className="absolute right-3 top-3 z-10">
                    <FavoriteButton
                      itemId={item.itemId}
                      initialIsFavorited={item.isFavorited}
                      initialFavoriteCount={item.favoriteCount}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm shadow-sm transition hover:scale-110"
                    />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-lg font-black text-primary">
                    {formatPrice(item.price)}
                  </p>
                  <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{getLocation(item)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}