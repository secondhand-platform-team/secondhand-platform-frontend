"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchMyFavorites, toggleItemFavorite } from "@/stores/slices/items.slice";
import { message as antdMessage, Spin, Modal, Empty, App } from "antd";
import { Heart, MapPin, Trash2, ShoppingBag, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ItemWithImages } from "@/types/item.type";
import FavoriteButton from "@/components/item/FavoriteButton";

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

export default function DashboardFavoritesPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { myFavorites, loading } = useAppSelector((state) => state.items);
  const { message: messageApi } = App.useApp();

  useEffect(() => {
    dispatch(fetchMyFavorites());
  }, [dispatch]);

  const onRemoveFavorite = async (itemId: string) => {
    try {
      await dispatch(toggleItemFavorite({ itemId, isFavorited: true })).unwrap();
      messageApi.success("Đã xóa khỏi danh sách yêu thích");
    } catch (error) {
      messageApi.error(typeof error === "string" ? error : "Không thể xóa yêu thích");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-4">
        <Spin size="large" />
        <p className="text-slate-500 font-medium">Đang tải danh sách yêu thích...</p>
      </div>
    );
  }

  return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 sm:px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Tin yêu thích</h2>
              <p className="text-sm text-slate-500">{myFavorites.length} sản phẩm đã lưu</p>
            </div>
          </div>
          <Link href="/search" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors">
            Tìm thêm <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {myFavorites.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có tin yêu thích</h3>
              <p className="text-slate-500 mb-8 max-w-sm">Hãy khám phá và bấm nút ❤️ để lưu những sản phẩm bạn quan tâm!</p>
              <Link href="/search" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-emerald-500/20 inline-flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Khám phá sản phẩm
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {myFavorites.map((item) => (
                <div
                  key={item.itemId}
                  className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative cursor-pointer" onClick={() => router.push(`/items/${item.itemId}`)}>
                    <img
                      src={getImageUrl(item)}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/icon-other/san-pham-khac.png"; }}
                    />
                    {/* Badges */}
                    {(item.transactionType === "GIVE_AWAY" || item.price === 0) && (
                      <span className="absolute left-3 top-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">Miễn phí</span>
                    )}
                    {item.status && item.status !== "AVAILABLE" && (
                      <span className="absolute left-3 bottom-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md">{item.status === "SOLD" ? "Đã bán" : item.status}</span>
                    )}
                    {/* Favorite button */}
                    <div className="absolute right-3 top-3 z-10">
                      <FavoriteButton
                        itemId={item.itemId}
                        initialIsFavorited={true}
                        initialFavoriteCount={item.favoriteCount}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm transition hover:scale-110"
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <Link href={`/items/${item.itemId}`} className="line-clamp-2 text-sm font-semibold text-slate-800 hover:text-emerald-600 transition-colors min-h-[40px] block">
                      {item.title}
                    </Link>

                    <p className="mt-2 text-lg font-black text-emerald-600">{formatPrice(item.price)}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{getLocation(item)}</span>
                      </div>
                      <button
                        onClick={() => onRemoveFavorite(item.itemId)}
                        className="text-xs font-medium text-slate-400 hover:text-red-500 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-all"
                        title="Bỏ yêu thích"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
  );
}
