"use client";

import type { ItemWithImages } from "@/types/item.type";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { itemService } from "@/stores/slices/items.slice";
import { categoryService, type Category } from "@/stores/slices/category.slice";
import { MapPin, ChevronRight, Zap, Star, Gift, Search, Tag as TagIcon } from "lucide-react";
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
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-slate-100"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-slate-50 relative">
        <img
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          alt={item.title}
          src={getImageUrl(item)}
          onError={(e) => { (e.target as HTMLImageElement).src = "/icon-other/san-pham-khac.png"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-2 z-10">
          {(item.transactionType === "GIVE_AWAY" || item.price === 0) && (
            <div className="rounded-lg bg-emerald-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm flex items-center gap-1">
              <Gift className="w-3 h-3" /> Miễn phí
            </div>
          )}
          {item.condition === "NEW" && item.price !== 0 && item.transactionType !== "GIVE_AWAY" && (
            <div className="rounded-lg bg-teal-500 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm flex items-center gap-1">
              <Star className="w-3 h-3" /> Mới 100%
            </div>
          )}
        </div>

        {/* Favorite Button */}
        <div className="absolute right-3 top-3 z-10">
          <FavoriteButton
            itemId={item.itemId}
            initialIsFavorited={item.isFavorited}
            initialFavoriteCount={item.favoriteCount}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-sm transition-transform hover:scale-110 text-slate-500 hover:text-red-500"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 bg-white">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors leading-snug">
          {item.title}
        </h3>
        <p className="mt-2.5 text-lg font-black text-emerald-600 tracking-tight">
          {formatPrice(item.price)}
        </p>
        <div className="mt-auto pt-4 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{getLocation(item)}</span>
        </div>
      </div>
    </div>
  );

  const SectionHeader = ({ title, subtitle, icon: Icon, colorClass, linkHref }: { title: string, subtitle: string, icon: any, colorClass: string, linkHref?: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-2xl text-white shadow-md ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">{subtitle}</p>
        </div>
      </div>
      {linkHref && (
        <Link href={linkHref} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors">
          Xem tất cả <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 flex flex-col items-center justify-center pb-20">
        <div className="w-16 h-16 relative flex items-center justify-center mb-4">
          <div className="absolute inset-0 border-4 border-emerald-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
          <TagIcon className="w-6 h-6 text-emerald-500" />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Đang tải trung tâm mua sắm...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* Modern Premium Banner Section */}
      <div className="relative pt-8 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-600 shadow-xl">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-emerald-900/20 blur-3xl"></div>
          
          <div className="relative z-10 px-6 py-16 md:py-20 md:px-16 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="max-w-2xl space-y-6 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider">
                <SparklesIcon className="w-3.5 h-3.5" /> Nền Tảng ReLife
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                Mua Sắm <span className="text-emerald-100">Thông Minh</span>, <br className="hidden md:block" /> Tiết Kiệm Tối Đa
              </h1>
              <p className="text-emerald-50 text-base md:text-lg leading-relaxed max-w-xl opacity-90">
                Khám phá hàng ngàn món đồ chất lượng từ cộng đồng. Từ thời trang, đồ điện tử đến đồ gia dụng - Tất cả đều có ở ReLife.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                <Link href="/search" className="bg-white text-emerald-700 px-7 py-3.5 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-lg flex items-center gap-2 hover:-translate-y-0.5">
                  <Search className="w-5 h-5" /> Tìm kiếm ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Category Pills */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          <div className="shrink-0 flex items-center gap-2 text-slate-400 font-bold px-2">
            <TagIcon className="w-5 h-5" /> <span>DANH MỤC</span>
          </div>
          <div className="w-px h-6 bg-slate-200 shrink-0 mx-2"></div>
          {categories.map(cat => (
            <Link
              key={cat.categoryId || cat.id}
              href={`/category/${cat.categoryId || cat.id}`}
              className="snap-start shrink-0 bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">

        {/* Flash Sale / Bán chạy (Mới nhất) */}
        <section>
          <SectionHeader 
            title="Hàng Mới Lên Kệ" 
            subtitle="Những sản phẩm vừa được đăng bán gần đây nhất"
            icon={Zap} 
            colorClass="bg-gradient-to-br from-amber-400 to-orange-500" 
            linkHref="/search?sort=newest" 
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {newItems.map(item => <ProductCard key={item.itemId} item={item} />)}
          </div>
        </section>

        {/* Nổi bật / Đặc biệt */}
        <section>
          <SectionHeader 
            title="Sản Phẩm Nổi Bật" 
            subtitle="Được nhiều người quan tâm và tìm kiếm nhất"
            icon={Star} 
            colorClass="bg-gradient-to-br from-emerald-500 to-teal-600" 
            linkHref="/search" 
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {featuredItems.map(item => <ProductCard key={item.itemId} item={item} />)}
          </div>
        </section>

        {/* Đồ Miễn phí / Cho tặng */}
        {freeItems.length > 0 && (
          <section className="relative overflow-hidden bg-emerald-900 rounded-3xl p-6 md:p-10 shadow-xl">
            {/* Background elements */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-400 text-white shadow-lg">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Góc Cho Tặng Miễn Phí</h2>
                    <p className="text-sm text-emerald-200 mt-1 font-medium">Chia sẻ đồ cũ, nhân đôi niềm vui</p>
                  </div>
                </div>
                <Link href="/search?transactionType=GIVE_AWAY" className="inline-flex items-center gap-1 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-xl transition-all backdrop-blur-sm">
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {freeItems.map(item => <ProductCard key={item.itemId} item={item} />)}
              </div>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

// Sparkles icon definition
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5zM16.5 15a.75.75 0 01.712.513l.394 1.183c.15.447.5.799.948.948l1.183.395a.75.75 0 010 1.422l-1.183.395c-.447.15-.799.5-.948.948l-.395 1.183a.75.75 0 01-1.422 0l-.395-1.183a1.5 1.5 0 00-.948-.948l-1.183-.395a.75.75 0 010-1.422l1.183-.395c.447-.15.799-.5.948-.948l.395-1.183A.75.75 0 0116.5 15z" clipRule="evenodd" />
    </svg>
  );
}
