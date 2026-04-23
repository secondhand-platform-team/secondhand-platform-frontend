/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MapPin } from "lucide-react";
import { itemService, type ItemWithImages } from "@/config/services/item.service";

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

  useEffect(() => {
    itemService.getFeaturedItems(4)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-primary/5 py-12 dark:bg-primary/5" id="featured">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Sản phẩm nổi bật
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
            {items.map((item) => (
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
                  <button
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                    type="button"
                    aria-label="Yêu thích"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
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