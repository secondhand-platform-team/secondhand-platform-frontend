"use client";

import { useEffect, useState } from "react";
import { message, Spin, Empty, Button } from "antd";
import { Heart, ShoppingBag } from "lucide-react";
import { itemService } from "@/config/services/item.service";
import type { ItemResponse } from "@/types/item.type";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const response = await itemService.getMyFavorites();
      setItems(response.data || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      message.error("Không thể tải danh sách yêu thích");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (itemId: string) => {
    try {
      setRemoving(itemId);
      await itemService.removeFavorite(itemId);
      message.success("Đã xóa khỏi danh sách yêu thích");
      setItems(items.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Error removing favorite:", error);
      message.error("Không thể xóa khỏi danh sách yêu thích");
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-8 sm:px-4 lg:px-5">
      <div className="mx-auto max-w-360">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <Heart size={28} className="text-primary" fill="currentColor" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Danh sách yêu thích
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Bạn có {items.length} sản phẩm yêu thích
              </p>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-12 text-center">
            <Heart
              size={48}
              className="mx-auto mb-4 text-gray-300"
              strokeWidth={1}
            />
            <Empty description="Chưa có sản phẩm yêu thích nào" />
            <Link href="/home">
              <Button type="primary" size="large" className="mt-4">
                Khám phá sản phẩm
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                {/* Image */}
                <div
                  className="relative h-48 w-full overflow-hidden bg-gray-100 cursor-pointer"
                  onClick={() => router.push(`/post-item/${item.id}`)}
                >
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Không có ảnh
                    </div>
                  )}

                  {/* Badge */}
                  <div className="absolute right-2 top-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFavorite(item.id);
                      }}
                      className="rounded-full bg-white p-2 shadow-md transition hover:bg-red-50"
                      disabled={removing === item.id}
                    >
                      <Heart
                        size={20}
                        className="text-primary"
                        fill="currentColor"
                      />
                    </button>
                  </div>

                  {/* Quick View */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                    <Button
                      type="primary"
                      icon={<ShoppingBag size={16} />}
                      onClick={() => router.push(`/post-item/${item.id}`)}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                    {item.description}
                  </p>

                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-lg font-bold text-primary">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.price || 0)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {item.category}
                    </span>
                  </div>

                  <Button
                    block
                    size="small"
                    className="mt-3"
                    onClick={() => router.push(`/post-item/${item.id}`)}
                  >
                    Xem ngay
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
