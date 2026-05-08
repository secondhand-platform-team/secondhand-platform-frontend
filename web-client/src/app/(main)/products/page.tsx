"use client";
import type { ItemWithImages } from "@/types/item.type";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { itemService,  } from "@/stores/slices/items.slice";
import { categoryService, type Category } from "@/stores/slices/category.slice";
import { MapPin, ChevronRight, Zap, Star, Gift } from "lucide-react";
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

export default function ProductsPage() {
  const router = useRouter();

  const [newItems, setNewItems] = useState<ItemWithImages[]>([]);
  const [featuredItems, setFeaturedItems] = useState<ItemWithImages[]>([]);
  const [freeItems, setFreeItems] = useState<ItemWithImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      itemService.searchItems({ sort: "newest", size: 8 }).then(res => setNewItems(res.content)),
      itemService.getFeaturedItems(8).then(res => setFeaturedItems(res)),
      itemService.searchItems({ transactionType: "GIVE_AWAY", size: 4 }).then(res => setFreeItems(res.content)),
      categoryService.getTopLevelCategories().then(res => setCategories(res))
    ]).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const ProductCard = ({ item }: { item: ItemWithImages }) => (
    <div
      onClick={() => router.push(`/items/${item.itemId}`)}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
    >
      <div className="aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-700 relative">
        <img
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          alt={item.title}
          src={getImageUrl(item)}
          onError={(e) => { (e.target as HTMLImageElement).src = "/icon-other/san-pham-khac.png"; }}
        />
        {(item.transactionType === "GIVE_AWAY" || item.price === 0) && (
          <div className="absolute left-3 top-3 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md z-10">
            Miễn phí
          </div>
        )}
        {item.condition === "NEW" && item.price !== 0 && item.transactionType !== "GIVE_AWAY" && (
          <div className="absolute left-3 top-3 rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-white shadow-md z-10">
            Mới
          </div>
        )}
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton
            itemId={item.itemId}
            initialIsFavorited={item.isFavorited}
            initialFavoriteCount={item.favoriteCount}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-sm transition hover:scale-110"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary transition-colors">
          {item.title}
        </h3>
        <p className="mt-2.5 text-lg font-black text-primary">
          {formatPrice(item.price)}
        </p>
        <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{getLocation(item)}</span>
        </div>
      </div>
    </div>
  );

  const SectionHeader = ({ title, icon: Icon, colorClass, linkHref }: { title: string, icon: any, colorClass: string, linkHref?: string }) => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl text-white shadow-sm ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
      </div>
      {linkHref && (
        <Link href={linkHref} className="hidden sm:flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
          Xem tất cả <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center pb-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-slate-500 font-medium">Đang tải trung tâm mua sắm...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      {/* Banner Section */}
      <div
        className="relative overflow-hidden bg-cover bg-center text-white"
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCKciJ7gRuZ4xQOky6eYhBiCMnXyTu0OfXzxSfN3-DnMipW0XuqBGC7eJUr2PAg_weBoO2-t6oA1JXRr-2Bdx2NyNlaJUnxv_qPCtp_B9Ifh7LVo8bow5JXeaOMbOR62FqDJW73uVthyle6J8oiDgjRowDmVW3-7hGSqbDw4jWfx42GQ3UiA-tWP0vXBeP7l4uOK-37A_5mLDp9irAh2aPmDVF6QK2TRtqQ-BxTyF9KsBUwJV6WAJW88Dh8gqwCUWC-1hDwNEp2WK2F')",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24 flex flex-col items-center text-center gap-8 relative z-10">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight drop-shadow-md">
              Khám Phá Thế Giới Đồ Cũ <br className="hidden md:block" /> Chất Lượng Cao
            </h1>
            <p className="text-slate-200 text-base md:text-lg mx-auto leading-relaxed drop-shadow-md">
              Từ đồ điện tử, thời trang đến đồ gia dụng. Mua sắm thông minh, tiết kiệm chi phí và bảo vệ môi trường cùng ReLife.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/search" className="bg-primary text-white px-8 py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                Tìm kiếm ngay
              </Link>
              <Link href="/home#categories" className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg">
                Xem danh mục
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-4 flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-wider shrink-0 px-2">Danh mục:</span>
          {categories.map(cat => (
            <Link
              key={cat.categoryId || cat.id}
              href={`/category/${cat.categoryId || cat.id}`}
              className="shrink-0 bg-slate-50 dark:bg-slate-700 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 text-slate-700 dark:text-slate-300 font-semibold text-sm px-4 py-2 rounded-xl transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">

        {/* Flash Sale / Bán chạy (Mới nhất) */}
        <section>
          <SectionHeader title="Hàng Mới Lên Kệ" icon={Zap} colorClass="bg-gradient-to-br from-amber-400 to-orange-500" linkHref="/search?sort=newest" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {newItems.map(item => <ProductCard key={item.itemId} item={item} />)}
          </div>
          <div className="mt-6 sm:hidden">
            <Link href="/search?sort=newest" className="block text-center bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-3 rounded-xl">
              Xem tất cả hàng mới
            </Link>
          </div>
        </section>

        {/* Nổi bật / Đặc biệt */}
        <section>
          <SectionHeader title="Sản Phẩm Nổi Bật" icon={Star} colorClass="bg-gradient-to-br from-emerald-500 to-teal-600" linkHref="/search" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {featuredItems.map(item => <ProductCard key={item.itemId} item={item} />)}
          </div>
        </section>

        {/* Đồ Miễn phí / Cho tặng */}
        {freeItems.length > 0 && (
          <section className="bg-emerald-50 dark:bg-emerald-900/10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-12 sm:rounded-3xl">
            <SectionHeader title="Góc Cho Tặng Miễn Phí" icon={Gift} colorClass="bg-gradient-to-br from-emerald-400 to-teal-500" linkHref="/search?transactionType=GIVE_AWAY" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {freeItems.map(item => <ProductCard key={item.itemId} item={item} />)}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
