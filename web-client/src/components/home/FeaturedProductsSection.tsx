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
    const fetchAIRecommendations = async () => {
      try {
        let recentItemNames: string[] = [];
        let cartItemIds: string[] = [];
        
        if (currentUserId) {
          const headers = { "Authorization": `Bearer ${localStorage.getItem("access_token")}` };
          
          // 1. Lấy lịch sử xem của user để làm "thói quen"
          try {
            const historyRes = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000"}/core/api/view-history/recent`, { headers });
            if (historyRes.ok) {
              const historyData = await historyRes.json();
              recentItemNames = (Array.isArray(historyData) ? historyData : [])
                .map((h: any) => h.item?.title)
                .filter(Boolean);
            }
          } catch (e) {}

          // 2. Lấy giỏ hàng của user
          try {
            const cartRes = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000"}/order/api/carts/me`, { headers });
            if (cartRes.ok) {
              const cartData = await cartRes.json();
              if (cartData && Array.isArray(cartData.cartItems)) {
                cartItemIds = cartData.cartItems.map((c: any) => c.itemId).filter(Boolean);
              }
            }
          } catch (e) {}
        }

        // 3. Gọi AI-Service để lấy gợi ý
        const aiRes = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT || "http://localhost:8000"}/ai/recommend`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: currentUserId,
            recent_items: recentItemNames,
            cart_item_ids: cartItemIds,
            limit: 8
          })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const recommendedItems = (Array.isArray(aiData.items) ? aiData.items : []).map((item: any) => ({
            ...item,
            images: item.itemImageList || [{ imageUrl: item.image_url }],
            favoriteCount: item.favoriteCount ?? 0,
            isFavorited: item.isFavorited ?? false,
          }));
          setItems(recommendedItems);
        } else {
          const fallbackItems = await itemService.getFeaturedItems(4);
          setItems(fallbackItems);
        }
      } catch (err) {
        const fallbackItems = await itemService.getFeaturedItems(4);
        setItems(fallbackItems);
      } finally {
        setLoading(false);
      }
    };

    fetchAIRecommendations();
  }, [currentUserId]);

  return (
    <section className="bg-primary/5 py-12 dark:bg-primary/5" id="featured">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Gợi ý cho bạn ✨
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