"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Spin, App, Tag, Empty, Tabs } from "antd";
import {
  MapPin,
  ShoppingBag,
  Clock,
  MessageCircle,
  ChevronRight,
  Star,
  User,
  Shield,
  Heart,
  Eye,
  Calendar,
  Phone,
  Package,
  ArrowLeft,
  Share2,
  Flag,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/stores/hooks";
import { createConversation } from "@/stores/slices/chat.slice";
import { chatService } from "@/stores/slices/chat.slice";
import { itemService } from "@/stores/slices/items.slice";
import { fetchReviewsBySellerId } from "@/stores/slices/review.slice";
import type { UserProfileApiResponseType } from "@/types/user.type";
import type { ItemWithImages } from "@/types/item.type";

// ====================================================================
// Constants
// ====================================================================

const CONDITION_MAP: Record<string, { label: string; color: string }> = {
  NEW: { label: "Mới 100%", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  LIKE_NEW: { label: "Như mới", color: "text-blue-600 bg-blue-50 border-blue-200" },
  USED: { label: "Đã sử dụng", color: "text-amber-600 bg-amber-50 border-amber-200" },
  FOR_PARTS: { label: "Linh kiện", color: "text-slate-600 bg-slate-50 border-slate-200" },
};

// ====================================================================
// Page Component
// ====================================================================

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const userId = params.userId as string;
  const { isAuth, user: currentUser } = useAppSelector((s) => s.auth);
  const { message: messageApi } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileApiResponseType | null>(null);
  const [items, setItems] = useState<ItemWithImages[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [itemFilter, setItemFilter] = useState("ALL");
  const [shareTooltip, setShareTooltip] = useState(false);
  const [tabView, setTabView] = useState<"items" | "reviews">("items");
  const { reviews, averageRating, totalReviews, loading: reviewsLoading } = useAppSelector((s) => s.review);

  const isOwnProfile = currentUser?.userId === userId;

  const formatPrice = (p: number | null) =>
    p ? p.toLocaleString("vi-VN") + "đ" : "Miễn phí";

  const formatDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  };

  const formatFullDate = (d?: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isExpiredItem = (item: ItemWithImages) => {
    if (item.status === "SOLD") return false;
    if (!item.expiredAt) return item.status === "EXPIRED";
    return new Date(item.expiredAt).getTime() <= Date.now();
  };

  // ================================================================
  // Load data
  // ================================================================

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch profile and items in parallel
      const [profileData, itemsData] = await Promise.all([
        chatService.getUserProfileByUserId(userId),
        itemService.getItemsByUserId(userId),
      ]);

      setProfile(profileData);
      setItems(itemsData || []);
      
      // Fetch reviews using Redux dispatch
      dispatch(fetchReviewsBySellerId(userId));
    } catch {
      messageApi.error("Không thể tải thông tin người dùng");
    } finally {
      setLoading(false);
    }
  }, [userId, messageApi, dispatch]);

  useEffect(() => {
    if (userId) loadData();
  }, [userId, loadData]);

  // ================================================================
  // Actions
  // ================================================================

  const handleChat = async () => {
    if (!isAuth) {
      messageApi.warning("Vui lòng đăng nhập để nhắn tin");
      return;
    }
    if (isOwnProfile) {
      messageApi.info("Đây là trang cá nhân của bạn");
      return;
    }
    try {
      setChatLoading(true);
      await dispatch(
        createConversation({
          participantId: userId,
          participantName: profile?.user_profile?.fullName || undefined,
          participantAvatar: profile?.user_profile?.avatarUrl || undefined,
        }),
      ).unwrap();
      router.push("/chat");
    } catch {
      messageApi.error("Không thể mở trò chuyện");
    } finally {
      setChatLoading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/user/${userId}`;
    navigator.clipboard.writeText(url);
    setShareTooltip(true);
    setTimeout(() => setShareTooltip(false), 2000);
    messageApi.success("Đã sao chép liên kết hồ sơ!");
  };

  // ================================================================
  // Derived data
  // ================================================================

  const displayName =
    profile?.user_profile?.fullName || `Người dùng ${userId.substring(0, 8)}`;
  const avatar = profile?.user_profile?.avatarUrl || "";
  const bio = profile?.user_profile?.bio || "";
  const location = [
    profile?.user_profile?.city,
    profile?.user_profile?.district,
  ]
    .filter(Boolean)
    .join(", ");

  const activeItems = items.filter((i) => i.status === "ACTIVE" && !isExpiredItem(i));
  const soldItems = items.filter((i) => i.status === "SOLD");
  const expiredItems = items.filter((i) => isExpiredItem(i));

  const filteredItems =
    itemFilter === "ALL"
      ? isOwnProfile
        ? items.filter((i) => i.status === "ACTIVE" || isExpiredItem(i))
        : items.filter((i) => i.status === "ACTIVE")
      : itemFilter === "SOLD"
        ? soldItems
        : itemFilter === "EXPIRED"
          ? expiredItems
          : items.filter((i) => i.status === "ACTIVE" && !isExpiredItem(i));

  const joinDate = formatDate(profile?.user?.createdAt || undefined);

  // ================================================================
  // Loading state
  // ================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Spin size="large" />
        <p className="text-slate-500 text-sm font-medium">
          Đang tải hồ sơ người dùng...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <User className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700">
          Không tìm thấy người dùng
        </h2>
        <p className="text-slate-500">
          Người dùng này không tồn tại hoặc đã bị xóa.
        </p>
        <Link
          href="/home"
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  // ================================================================
  // Render
  // ================================================================

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Banner */}
      <div className="relative">
        {/* Gradient Background */}
        <div className="h-48 sm:h-56 bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
            <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-teal-200/15 rounded-full blur-2xl" />
          </div>
          {/* Back button */}
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-medium transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          </div>
          {/* SVG wave */}
          <svg
            className="absolute bottom-0 left-0 w-full"
            viewBox="0 0 1440 80"
            fill="none"
            preserveAspectRatio="none"
            style={{ height: "40px" }}
          >
            <path
              d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"
              fill="#f8fafc"
            />
          </svg>
        </div>

        {/* Profile Card overlapping banner */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="px-6 sm:px-8 pt-6 pb-6">
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Avatar */}
                <div className="shrink-0">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-4xl font-black">
                        {displayName[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
                        {displayName}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        {location && (
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            {location}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          Tham gia {joinDate}
                        </span>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {profile.user.status && (
                          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã xác minh
                          </span>
                        )}
                        {activeItems.length >= 10 && (
                          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                            <Sparkles className="w-3 h-3" />
                            Người bán tích cực
                          </span>
                        )}
                        {soldItems.length >= 5 && (
                          <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                            <Shield className="w-3 h-3" />
                            Đáng tin cậy
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!isOwnProfile && (
                        <button
                          onClick={handleChat}
                          disabled={chatLoading}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-emerald-500/30 disabled:opacity-60"
                        >
                          {chatLoading ? (
                            <Spin size="small" />
                          ) : (
                            <MessageCircle className="w-4 h-4" />
                          )}
                          Nhắn tin
                        </button>
                      )}
                      {isOwnProfile && (
                        <Link
                          href="/dashboard/profile"
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold transition-all shadow-md"
                        >
                          Chỉnh sửa hồ sơ
                        </Link>
                      )}
                      <button
                        onClick={handleShare}
                        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors relative"
                        title="Chia sẻ hồ sơ"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 sm:px-8 py-4">
              <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto">
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800">
                      {activeItems.length}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium -mt-0.5">
                      Đang bán
                    </p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800">
                      {soldItems.length}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium -mt-0.5">
                      Đã bán
                    </p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Star className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800">
                      {averageRating ? averageRating.toFixed(1) : "—"}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium -mt-0.5">
                      {totalReviews > 0 ? `${totalReviews} đánh giá` : "Chưa có đánh giá"}
                    </p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200" />
                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-800">—</p>
                    <p className="text-[11px] text-slate-500 font-medium -mt-0.5">
                      Phản hồi
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-72 shrink-0 space-y-5">
            {/* About */}
            {bio && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-500" />
                  Giới thiệu
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {bio}
                </p>
              </div>
            )}

            {/* Contact & Info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Thông tin
              </h3>
              <div className="space-y-3 text-sm">
                {location && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{location}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Tham gia {joinDate}</span>
                </div>
                {profile.user_profile?.gender && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {profile.user_profile.gender === "MALE"
                        ? "Nam"
                        : profile.user_profile.gender === "FEMALE"
                          ? "Nữ"
                          : "Khác"}
                    </span>
                  </div>
                )}
                {profile.user.phoneNumber && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{profile.user.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                Mức độ tin cậy
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-slate-600">
                    Email đã xác minh
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {profile.user.phoneNumber ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  )}
                  <span className="text-sm text-slate-600">
                    Số điện thoại{" "}
                    {profile.user.phoneNumber ? "đã xác minh" : "chưa thêm"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {profile.user_profile?.avatarUrl ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  )}
                  <span className="text-sm text-slate-600">
                    Ảnh đại diện{" "}
                    {profile.user_profile?.avatarUrl ? "đã cập nhật" : "chưa có"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {bio ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                  )}
                  <span className="text-sm text-slate-600">
                    Bio {bio ? "đã viết" : "chưa viết"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content — Product Listings & Reviews */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Main Tabs */}
              <div className="px-5 pt-5 pb-0 border-b border-slate-100">
                <div className="flex gap-2 pb-3">
                  {[
                    {
                      key: "items",
                      label: "Sản phẩm",
                      icon: <ShoppingBag className="w-4 h-4" />,
                      count: activeItems.length,
                    },
                    ...(isOwnProfile
                      ? [
                          {
                            key: "EXPIRED",
                            label: "Hết hạn",
                            count: expiredItems.length,
                          },
                        ]
                      : []),
                    {
                      key: "reviews",
                      label: "Đánh giá",
                      icon: <Star className="w-4 h-4" />,
                      count: totalReviews,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setTabView(tab.key as "items" | "reviews")}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                        tabView === tab.key
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm border"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                      <span className="ml-1.5 text-xs opacity-75">
                        ({tab.count})
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Items Tab */}
              {tabView === "items" && (
                <>
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-emerald-500" />
                      Sản phẩm đang bán
                    </h2>
                    <div className="flex gap-2">
                      {[
                        {
                          key: "ALL",
                          label: "Đang bán",
                          count: activeItems.length,
                        },
                        {
                          key: "SOLD",
                          label: "Đã bán",
                          count: soldItems.length,
                        },
                      ].map((subTab) => (
                        <button
                          key={subTab.key}
                          onClick={() => setItemFilter(subTab.key)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            itemFilter === subTab.key
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm border"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {subTab.label}
                          <span className="ml-1.5 text-xs opacity-75">
                            ({subTab.count})
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Items Grid */}
                  <div className="p-5">
                    {filteredItems.length === 0 ? (
                      <Empty
                        description={
                          <span className="text-slate-500">
                            {itemFilter === "SOLD"
                              ? "Chưa có sản phẩm nào đã bán"
                              : "Chưa có sản phẩm nào đang bán"}
                          </span>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        className="py-12"
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredItems.map((item) => {
                      const primaryImage =
                        item.images?.find((img) => img.isPrimary) ||
                        item.images?.[0] ||
                        item.itemImageList?.find((img) => img.isPrimary) ||
                        item.itemImageList?.[0];
                      const condition =
                        CONDITION_MAP[item.condition] || CONDITION_MAP.USED;
                        const isSold = item.status === "SOLD";
                        const isExpired = isExpiredItem(item);

                      return (
                          <Link
                            key={item.itemId}
                            href={`/items/${item.itemId}`}
                            className={`group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all duration-300 ${isSold ? "opacity-75" : ""} ${isExpired ? "ring-1 ring-amber-200" : ""}`}
                          >
                          {/* Image */}
                          <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                            {primaryImage?.imageUrl ? (
                              <img
                                src={primaryImage.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="w-10 h-10" />
                              </div>
                            )}
                            {/* Sold overlay */}
                            {isSold && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="text-white font-bold text-lg bg-red-500 px-4 py-1.5 rounded-full">
                                  ĐÃ BÁN
                                </span>
                              </div>
                            )}
                            {/* Condition badge */}
                            {!isSold && (
                              <span
                                className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border ${condition.color}`}
                              >
                                {condition.label}
                              </span>
                            )}
                            {isExpired && (
                              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700">
                                HẾT HẠN
                              </span>
                            )}
                            {/* Favorite count */}
                            {item.favoriteCount ? (
                              <span className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2 py-0.5 rounded-full text-red-500">
                                <Heart className="w-3 h-3 fill-red-500" />
                                {item.favoriteCount}
                              </span>
                            ) : null}
                          </div>
                          {/* Info */}
                          <div className="p-3.5">
                            <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-1.5 group-hover:text-emerald-600 transition-colors">
                              {item.title}
                            </h3>
                            <p className="text-lg font-black text-emerald-600">
                              {formatPrice(item.price)}
                            </p>
                            {/* Meta */}
                            <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                              {item.location?.city && (
                                <span className="flex items-center gap-1 truncate">
                                  <MapPin className="w-3 h-3" />
                                  {item.location.city}
                                </span>
                              )}
                              <span>{formatFullDate(item.createdAt)}</span>
                            </div>
                            {isExpired && isOwnProfile && (
                              <div className="mt-3">
                                <span className="inline-flex items-center justify-center w-full rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold px-3 py-2 border border-amber-200">
                                  Nhấn để xem và gia hạn
                                </span>
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
                  </div>
                </>
              )}

              {/* Reviews Tab */}
              {tabView === "reviews" && (
                <div className="p-5">
                  {reviewsLoading ? (
                    <Spin className="flex justify-center py-12" />
                  ) : !reviews || reviews.length === 0 ? (
                    <Empty
                      description="Chưa có đánh giá nào"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      className="py-12"
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="mb-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-5 h-5 ${
                                  i < Math.round(averageRating)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">
                              {averageRating.toFixed(1)} / 5.0
                            </p>
                            <p className="text-xs text-slate-600">
                              Trên {totalReviews} đánh giá
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className="p-4 border border-slate-100 rounded-xl hover:border-emerald-200 transition"
                        >
                          <div className="flex items-start gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-emerald-700">
                                {(review.buyerName || "U")[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <p className="font-semibold text-slate-800 text-sm">
                                  {review.buyerName || "Người mua"}
                                </p>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3.5 h-3.5 ${
                                        i < review.rating
                                          ? "fill-amber-400 text-amber-400"
                                          : "text-slate-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-slate-400">
                                {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-slate-600 mt-2">
                              {review.comment}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
