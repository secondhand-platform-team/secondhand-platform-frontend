"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { itemService, type ItemWithImages } from "@/config/services/item.service";
import { categoryService } from "@/config/services/category.service";
import type { CategoryType } from "@/types/item/item.type";
import { MapPin, Heart, Share2, ZoomIn, Info, MessageCircle, Phone, ChevronRight, ShieldCheck, Star } from "lucide-react";

const CONDITIONS: Record<string, string> = {
  NEW: "Mới",
  LIKE_NEW: "Như mới",
  USED: "Đã sử dụng",
  FOR_PARTS: "Hỏng / linh kiện",
};

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = Array.isArray(params.itemId) ? params.itemId[0] : params.itemId;

  const [item, setItem] = useState<ItemWithImages | null>(null);
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [similarItems, setSimilarItems] = useState<ItemWithImages[]>([]);

  useEffect(() => {
    if (!itemId) return;

    setLoading(true);
    itemService.getItem(itemId)
      .then((data) => {
        setItem(data);
        if (data.categoryId) {
          categoryService.getCategoryById(data.categoryId)
            .then(setCategory)
            .catch(() => {});
          
          itemService.searchItems({ categoryId: data.categoryId, size: 5 })
            .then(res => {
              setSimilarItems(res.content.filter(i => i.itemId !== data.itemId).slice(0, 4));
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        // Redirect or show error if item not found
      })
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-slate-500 mb-6">Sản phẩm này có thể đã bị xóa hoặc không tồn tại.</p>
        <Link href="/home" className="bg-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary/90 transition">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price == null || price === 0) return "Miễn phí";
    return price.toLocaleString("vi-VN") + " đ";
  };

  const images = item.images && item.images.length > 0 
    ? item.images 
    : [{ imageUrl: "/icon-other/san-pham-khac.png", isPrimary: true, imageId: "default" }];
    
  const activeImage = images[activeImageIndex];
  
  const addressString = [item.location?.address, item.location?.ward, item.location?.district, item.location?.city].filter(Boolean).join(", ");
  const shortAddressString = [item.location?.district, item.location?.city].filter(Boolean).join(", ") || "Toàn quốc";

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link href="/home" className="hover:text-primary transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          {category ? (
             <>
               <Link href={`/category/${category.categoryId}`} className="hover:text-primary transition-colors">{category.name}</Link>
               <ChevronRight className="w-3.5 h-3.5 shrink-0" />
             </>
          ) : null}
          <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[200px] sm:max-w-md">{item.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Image Gallery */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 mb-4 group">
                <img 
                  src={activeImage.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/icon-other/san-pham-khac.png"; }}
                />
                <button className="absolute top-4 right-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2.5 rounded-full text-slate-700 dark:text-slate-200 hover:text-primary dark:hover:text-primary transition shadow-sm opacity-0 group-hover:opacity-100">
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
              
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {images.slice(0, 5).map((img, idx) => {
                    const isLastAndMore = idx === 4 && images.length > 5;
                    return (
                      <button 
                        key={img.imageId || idx}
                        onClick={() => !isLastAndMore && setActiveImageIndex(idx)}
                        className={`relative w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-transparent hover:border-primary/30'}`}
                      >
                        <img 
                          src={img.imageUrl} 
                          alt="thumbnail" 
                          className={`w-full h-full object-cover ${isLastAndMore ? 'opacity-40' : ''}`}
                        />
                        {isLastAndMore && (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-800 dark:text-white font-bold text-lg bg-black/10 dark:bg-black/40">
                            +{images.length - 4}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Mô tả chi tiết</h2>
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-sm sm:text-base">
                {item.description}
              </div>
            </div>

            {/* Similar Products */}
            {similarItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Sản phẩm tương tự</h2>
                  <Link href={`/category/${item.categoryId}`} className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:underline flex items-center">
                    Xem tất cả <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {similarItems.map(simItem => {
                    const simImg = (simItem.images && simItem.images.length > 0) ? simItem.images[0].imageUrl : "/icon-other/san-pham-khac.png";
                    return (
                      <Link href={`/items/${simItem.itemId}`} key={simItem.itemId} className="group flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg transition-all border border-slate-100 dark:border-slate-700">
                        <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-700 overflow-hidden relative">
                           <img src={simImg} alt={simItem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <div className="p-3.5 flex-1 flex flex-col">
                           <h3 className="line-clamp-2 text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">{simItem.title}</h3>
                           <p className="mt-auto pt-2.5 text-base font-black text-primary">{formatPrice(simItem.price)}</p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Main Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                  {item.transactionType === 'SELL' ? 'Đang bán' : (item.transactionType === 'GIVE_AWAY' ? 'Cho tặng' : 'Mới')}
                </span>
                <div className="flex gap-2">
                  <button className="text-slate-400 hover:text-primary bg-slate-50 dark:bg-slate-700 hover:bg-primary/10 transition p-2 rounded-full"><Share2 className="w-4 h-4" /></button>
                  <button className="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-500/10 transition p-2 rounded-full"><Heart className="w-4 h-4" /></button>
                </div>
              </div>
              
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug mb-4">
                {item.title}
              </h1>
              
              <p className="text-3xl font-black text-primary mb-6">
                {formatPrice(item.price)}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="bg-slate-50 dark:bg-slate-700 p-2.5 rounded-full text-slate-500 dark:text-slate-400 shrink-0"><Info className="w-4 h-4" /></div>
                  <div className="min-w-0">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider mb-0.5">Tình trạng</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{CONDITIONS[item.condition] || item.condition}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-slate-50 dark:bg-slate-700 p-2.5 rounded-full text-slate-500 dark:text-slate-400 shrink-0"><MapPin className="w-4 h-4" /></div>
                  <div className="min-w-0">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px] uppercase font-bold tracking-wider mb-0.5">Khu vực</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 text-sm truncate">{shortAddressString}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl font-bold transition-all shadow-sm hover:shadow-emerald-500/20">
                  <Phone className="w-5 h-5" /> Liên hệ người bán
                </button>
                <button className="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 hover:border-primary dark:hover:border-primary text-slate-700 dark:text-slate-200 hover:text-primary py-3 rounded-2xl font-bold transition-all">
                  <MessageCircle className="w-5 h-5" /> Chat trực tuyến
                </button>
              </div>
            </div>

            {/* Seller Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden shrink-0 border-2 border-white dark:border-slate-800 shadow-sm">
                  <img src={"https://ui-avatars.com/api/?name=" + (item.userId || "User") + "&background=random"} alt="Seller" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-white truncate">Người bán {item.userId?.substring(0,6) || "Đang cập nhật"}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Đã xác thực • Mới tham gia
                  </div>
                </div>
                <button className="text-sm font-bold text-primary hover:text-primary/80 transition-colors whitespace-nowrap shrink-0">
                  Xem cửa hàng
                </button>
              </div>
              
              <div className="flex border-t border-slate-100 dark:border-slate-700 pt-5 text-center divide-x divide-slate-100 dark:divide-slate-700">
                <div className="flex-1 px-2">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5">Đánh giá</p>
                  <p className="font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1 text-lg">
                    4.9/5 <Star className="w-4 h-4 text-amber-400 fill-amber-400 mb-0.5" />
                  </p>
                </div>
                <div className="flex-1 px-2">
                  <p className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-1.5">Phản hồi</p>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-lg">~15p</p>
                </div>
              </div>
            </div>

            {/* Location Map Card */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5 mb-5 text-slate-800 dark:text-slate-100 font-bold">
                <div className="bg-emerald-50 dark:bg-emerald-900/30 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                Địa điểm giao dịch
              </div>
              
              <div className="w-full h-36 bg-slate-50 dark:bg-slate-900 rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden border border-slate-100 dark:border-slate-700">
                {/* Mock Map Background */}
                <div className="absolute inset-0 opacity-40 dark:opacity-20" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 2px, transparent 2px)', backgroundSize: '16px 16px' }}></div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center relative z-10 animate-pulse">
                  <MapPin className="w-6 h-6 text-primary drop-shadow-md" />
                </div>
              </div>
              
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center px-2 leading-relaxed">
                {addressString || "Chưa cập nhật địa chỉ cụ thể"}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
