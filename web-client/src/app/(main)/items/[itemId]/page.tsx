"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { itemService,  } from "@/stores/slices/items.slice";
import { categoryService } from "@/stores/slices/category.slice";
import type { ItemWithImages } from "@/types/item.type";
import type { CategoryType } from "@/types/category.type";
import { MapPin, Share2, ZoomIn, Info, MessageCircle, Phone, ChevronRight, ChevronLeft, ShieldCheck, Star, Clock, ShoppingCart, Heart, Eye, Tag, Package, ArrowLeft, X } from "lucide-react";
import FavoriteButton from "@/components/item/FavoriteButton";
import { chatService } from "@/stores/slices/chat.slice";
import type { UserProfileApiResponseType } from "@/types/user.type";
import { message as antdMessage, Spin, App } from "antd";

import { useAppSelector, useAppDispatch } from "@/stores/hooks";
import { addItemToCart } from "@/stores/slices/cart.slice";

const CONDITIONS: Record<string, string> = {
  NEW: "Mới 100%",
  LIKE_NEW: "Như mới (99%)",
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
  const [sellerProfile, setSellerProfile] = useState<UserProfileApiResponseType | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { isAuth } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { message: messageApi } = App.useApp();

  useEffect(() => {
    if (!itemId) return;
    setLoading(true);
    setActiveImageIndex(0);
    itemService.getItem(itemId)
      .then((data) => {
        setItem(data);
        if (data.categoryId) {
          categoryService.getCategoryById(data.categoryId).then((res) => setCategory(res as any)).catch(() => { });
          itemService.searchItems({ categoryId: data.categoryId, size: 5 })
            .then(res => setSimilarItems(res.content.filter(i => i.itemId !== data.itemId).slice(0, 4)))
            .catch(() => { });
        }
        if (data.userId) {
          chatService.getUserProfileByUserId(data.userId).then(res => setSellerProfile(res as any)).catch(() => { });
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Spin size="large" />
        <p className="text-sm text-slate-500 font-medium">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Không tìm thấy sản phẩm</h2>
        <p className="text-slate-500 mb-6">Sản phẩm này có thể đã bị xóa hoặc không tồn tại.</p>
        <Link href="/home" className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Về trang chủ
        </Link>
      </div>
    );
  }

  const formatPrice = (price: number | null | undefined) => {
    if (price == null || price === 0) return "Miễn phí";
    return price.toLocaleString("vi-VN") + " đ";
  };

  const images = item.images && item.images.length > 0 ? item.images : [{ imageUrl: "/icon-other/san-pham-khac.png", isPrimary: true, imageId: "default" }];
  const activeImage = images[activeImageIndex];
  const addressParts = [item.location?.address, item.location?.ward, item.location?.district, item.location?.city].filter(Boolean);
  const addressString = addressParts.join(", ");
  const shortAddress = [item.location?.district, item.location?.city].filter(Boolean).join(", ") || "Toàn quốc";

  const handleChat = async () => {
    if (!item.userId) { messageApi.error("Không thể lấy thông tin người bán"); return; }
    try {
      setChatLoading(true);
      const res = await chatService.createConversation({ userId: item.userId });
      if (res.conversationId) {
        const params = new URLSearchParams();
        params.set("userId", item.userId);
        if (sellerProfile?.user_profile?.fullName) params.set("name", sellerProfile.user_profile.fullName);
        if (sellerProfile?.user_profile?.avatarUrl) params.set("avatar", sellerProfile.user_profile.avatarUrl);
        router.push(`/chat/${res.conversationId}?${params.toString()}`);
      }
    } catch { messageApi.error("Lỗi khi tạo cuộc trò chuyện"); } finally { setChatLoading(false); }
  };

  const handleAddToCart = async () => {
    if (!isAuth) { messageApi.warning("Vui lòng đăng nhập để thêm vào giỏ hàng"); return; }
    try {
      setAddingToCart(true);
      await dispatch(addItemToCart({ itemId: item.itemId, quantity: 1, price: item.price || 0 })).unwrap();
      messageApi.success("Đã thêm vào giỏ hàng");
    } catch { messageApi.error("Lỗi khi thêm vào giỏ hàng"); } finally { setAddingToCart(false); }
  };

  const navigateImage = (dir: number) => {
    setActiveImageIndex((prev) => {
      const next = prev + dir;
      if (next < 0) return images.length - 1;
      if (next >= images.length) return 0;
      return next;
    });
  };

  const sellerName = sellerProfile?.user_profile?.fullName || "Người bán " + (item.userId?.substring(0, 6) || "");
  const sellerAvatar = sellerProfile?.user_profile?.avatarUrl || "";
  const sellerInitials = (() => {
    const parts = sellerName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || "U";
  })();

  return (
    <>
      <div className="bg-slate-50 min-h-screen pb-20">
      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} className="absolute top-6 right-6 text-white/80 hover:text-white z-10"><X className="w-8 h-8" /></button>
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); navigateImage(-1); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm z-10"><ChevronLeft className="w-6 h-6" /></button>
              <button onClick={(e) => { e.stopPropagation(); navigateImage(1); }} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm z-10"><ChevronRight className="w-6 h-6" /></button>
            </>
          )}
          <img src={activeImage.imageUrl} alt={item.title} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium">{activeImageIndex + 1} / {images.length}</div>
        </div>
      )}

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <Link href="/home" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />
          {category && (
            <>
              <Link href={`/search?categoryId=${category.categoryId}`} className="hover:text-emerald-600 transition-colors">{category.name}</Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-300" />
            </>
          )}
          <span className="text-slate-700 font-medium truncate max-w-[200px] sm:max-w-md">{item.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="lg:col-span-7 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Main Image */}
              <div className="relative aspect-[4/3] bg-slate-100 group cursor-pointer" onClick={() => setLightboxOpen(true)}>
                <img src={activeImage.imageUrl} alt={item.title}
                  className="w-full h-full object-contain transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/icon-other/san-pham-khac.png"; }} />
                {/* Nav Arrows */}
                {images.length > 1 && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); navigateImage(-1); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-slate-700 shadow-md opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); navigateImage(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full flex items-center justify-center text-slate-700 shadow-md opacity-0 group-hover:opacity-100 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                {/* Zoom hint */}
                <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-3.5 h-3.5" /> Phóng to
                </div>
                {/* Image counter */}
                {images.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-medium">
                    {activeImageIndex + 1}/{images.length}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, idx) => (
                    <button key={img.imageId || idx} onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-transparent hover:border-slate-300'}`}>
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-600" /> Mô tả chi tiết
              </h2>
              <div className="text-slate-600 whitespace-pre-wrap leading-relaxed text-[15px]">
                {item.description || "Chưa có mô tả."}
              </div>
            </div>

            {/* Item Attributes */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-600" /> Thông tin sản phẩm
              </h2>
              <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                {[
                  { label: "Tình trạng", value: CONDITIONS[item.condition] || item.condition || "—" },
                  { label: "Hình thức", value: item.transactionType === "SELL" ? "Bán" : item.transactionType === "GIVE_AWAY" ? "Cho tặng" : "—" },
                  { label: "Khu vực", value: shortAddress },
                  { label: "Danh mục", value: category?.name || "—" },
                ].map((attr, idx) => (
                  <div key={idx} className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{attr.label}</span>
                    <span className="text-sm font-medium text-slate-800">{attr.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Products */}
            {similarItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-800">Sản phẩm tương tự</h2>
                  <Link href={`/search?categoryId=${item.categoryId}`} className="text-emerald-600 text-sm font-semibold hover:underline flex items-center gap-0.5">
                    Xem tất cả <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {similarItems.map(simItem => (
                    <Link href={`/items/${simItem.itemId}`} key={simItem.itemId}
                      className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-100">
                      <div className="aspect-[4/5] bg-slate-100 overflow-hidden">
                        <img src={simItem.images?.[0]?.imageUrl || "/icon-other/san-pham-khac.png"} alt={simItem.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-3">
                        <h3 className="line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-emerald-600 transition-colors min-h-[36px]">{simItem.title}</h3>
                        <p className="mt-2 text-base font-black text-emerald-600">{formatPrice(simItem.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20 self-start">
            {/* Main Product Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-200">
                  {item.transactionType === "SELL" ? "Đang bán" : item.transactionType === "GIVE_AWAY" ? "Cho tặng" : "Mới"}
                </span>
                <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold border border-emerald-200">
                  {CONDITIONS[item.condition] || item.condition || "Chưa rõ"}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-3">{item.title}</h1>

              {/* Price */}
              <div className="flex items-end gap-3 mb-5 pb-5 border-b border-slate-100">
                <p className="text-3xl font-black text-emerald-600">{formatPrice(item.price)}</p>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Khu vực</p>
                    <p className="text-sm font-medium text-slate-700 truncate">{shortAddress}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-slate-50 rounded-xl">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Đăng ngày</p>
                    <p className="text-sm font-medium text-slate-700">{new Date(item.createdAt).toLocaleDateString("vi-VN")}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mb-5">
                <button onClick={() => setShowPhone(!showPhone)}
                  className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98]">
                  <Phone className="w-5 h-5" />
                  {showPhone ? (sellerProfile?.user.phoneNumber || "Đang cập nhật") : "Hiện số điện thoại"}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleChat} disabled={chatLoading}
                    className="flex items-center justify-center gap-2 bg-emerald-50 border-2 border-emerald-200 hover:border-emerald-400 text-emerald-700 py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70">
                    {chatLoading ? <Spin size="small" /> : <MessageCircle className="w-5 h-5" />}
                    <span className="text-sm">Chat ngay</span>
                  </button>
                  <button onClick={handleAddToCart} disabled={addingToCart}
                    className="flex items-center justify-center gap-2 bg-white border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50 py-3 rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70">
                    {addingToCart ? <Spin size="small" /> : <ShoppingCart className="w-5 h-5" />}
                    <span className="text-sm">Giỏ hàng</span>
                  </button>
                </div>
              </div>

              {/* Share & Favorite Row */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <FavoriteButton itemId={item.itemId} initialIsFavorited={item.isFavorited} initialFavoriteCount={item.favoriteCount}
                  showCount={true} showLabel={true} className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 transition p-2 px-4 rounded-xl" />
                <button className="text-slate-400 hover:text-emerald-600 bg-slate-50 hover:bg-emerald-50 transition p-2 px-4 rounded-xl flex items-center gap-2 text-sm font-semibold">
                  <Share2 className="w-4 h-4" /> Chia sẻ
                </button>
              </div>
            </div>

            {/* Seller Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden shrink-0 border-2 border-white shadow-md">
                  {sellerAvatar ? (
                    <img src={sellerAvatar} alt={sellerName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-black">
                      {sellerInitials}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">{sellerName}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold mt-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Đã xác thực
                  </div>
                </div>
                <Link href={`/user/${item.userId}`} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition hover:underline shrink-0">
                  Xem trang →
                </Link>
              </div>
              <div className="flex border-t border-slate-100 pt-4 text-center divide-x divide-slate-100">
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Đánh giá</p>
                  <p className="font-black text-slate-800 flex items-center justify-center gap-1">4.9 <Star className="w-4 h-4 text-amber-400 fill-amber-400" /></p>
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Phản hồi</p>
                  <p className="font-black text-slate-800 flex items-center justify-center gap-1"><Clock className="w-3.5 h-3.5 text-emerald-500" /> ~15p</p>
                </div>
              </div>
            </div>

            {/* Location Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2.5 mb-4 text-slate-800 font-bold text-sm">
                <div className="bg-emerald-50 p-2 rounded-lg"><MapPin className="w-4 h-4 text-emerald-600" /></div>
                Địa điểm giao dịch
              </div>
              <div className="w-full h-32 bg-slate-50 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden border border-slate-100">
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1.5px, transparent 1.5px)', backgroundSize: '14px 14px' }}></div>
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center relative z-10 animate-pulse">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-sm text-slate-600 text-center leading-relaxed">{addressString || "Chưa cập nhật địa chỉ cụ thể"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
