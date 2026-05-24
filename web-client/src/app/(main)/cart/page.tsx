"use client";
import type { ItemWithImages } from "@/types/item.type";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spin, Modal, App } from "antd";
import {
  ArrowLeft,
  Trash2,
  ShieldCheck,
  Truck,
  ShoppingBag,
  Package,
  CreditCard,
  CheckCircle,
  Square,
  CheckSquare,
  User,
  AlertTriangle,
} from "lucide-react";
import {
  type CartType,
  type CartItemType,
  fetchMyCart,
  removeItemFromCart,
} from "@/stores/slices/cart.slice";
import { itemService } from "@/stores/slices/items.slice";
import { chatService } from "@/stores/slices/chat.slice";
import { useAppSelector, useAppDispatch } from "@/stores/hooks";
import type { UserProfileApiResponseType } from "@/types/user.type";

// Extended cart item with product details
interface EnrichedCartItem extends CartItemType {
  product?: ItemWithImages;
}

// Group items by seller
interface SellerGroup {
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  items: EnrichedCartItem[];
}

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuth, loading: authLoading } = useAppSelector(
    (state) => state.auth,
  );
  const { message: messageApi } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedCartItem[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [suggestedItems, setSuggestedItems] = useState<ItemWithImages[]>([]);
  const [sellerProfiles, setSellerProfiles] = useState<Map<string, { name: string; avatar: string }>>(new Map());

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const cartData = await dispatch(fetchMyCart()).unwrap();

      if (cartData && cartData.cartItems && cartData.cartItems.length > 0) {
        const itemsWithDetails = await Promise.all(
          cartData.cartItems.map(async (item) => {
            try {
              const product = await itemService.getItem(item.itemId);
              return { ...item, product } as EnrichedCartItem;
            } catch {
              return { ...item, product: undefined } as unknown as EnrichedCartItem;
            }
          }),
        );
        setEnrichedItems(itemsWithDetails);
        // Auto-select all active items
        const activeIds = new Set(
          itemsWithDetails
            .filter((i) => i.product?.status === "ACTIVE")
            .map((i) => i.itemId),
        );
        setSelectedItemIds(activeIds);

        // Fetch seller profiles
        const uniqueSellerIds = Array.from(
          new Set(itemsWithDetails.map((i) => i.product?.userId).filter(Boolean) as string[])
        );
        const profileMap = new Map<string, { name: string; avatar: string }>();
        await Promise.all(
          uniqueSellerIds.map(async (sellerId) => {
            try {
              const profile = await chatService.getUserProfileByUserId(sellerId);
              profileMap.set(sellerId, {
                name: profile.user_profile?.fullName || `Người bán ${sellerId.substring(0, 6)}`,
                avatar: profile.user_profile?.avatarUrl || "",
              });
            } catch {
              profileMap.set(sellerId, {
                name: `Người bán ${sellerId.substring(0, 6)}`,
                avatar: "",
              });
            }
          }),
        );
        setSellerProfiles(profileMap);
      } else {
        setEnrichedItems([]);
      }

      try {
        const featured = await itemService.getFeaturedItems(4);
        setSuggestedItems(featured);
      } catch {}
    } catch (error) {
      console.error("Cart load error:", error);
      setEnrichedItems([]);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuth) {
      messageApi.warning("Vui lòng đăng nhập để xem giỏ hàng");
      router.push("/home");
      return;
    }
    loadCart();
  }, [isAuth, authLoading, router, loadCart, messageApi]);

  // Group items by seller
  const sellerGroups = useMemo((): SellerGroup[] => {
    const map = new Map<string, SellerGroup>();
    for (const item of enrichedItems) {
      const sellerId = item.product?.userId || "unknown";
      const profile = sellerProfiles.get(sellerId);
      const sellerName = profile?.name || `Người bán ${sellerId.substring(0, 6)}`;
      const sellerAvatar = profile?.avatar || "";
      if (!map.has(sellerId)) {
        map.set(sellerId, { sellerId, sellerName, sellerAvatar, items: [] });
      }
      map.get(sellerId)!.items.push(item);
    }
    return Array.from(map.values());
  }, [enrichedItems, sellerProfiles]);

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingItemId(itemId);
      await dispatch(removeItemFromCart(itemId)).unwrap();
      setEnrichedItems((prev) => prev.filter((item) => item.itemId !== itemId));
      setSelectedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
      messageApi.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch {
      messageApi.error("Không thể xóa sản phẩm");
      loadCart();
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearAll = () => {
    Modal.confirm({
      title: "Xóa tất cả sản phẩm?",
      content: "Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?",
      okText: "Xóa tất cả",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        for (const item of enrichedItems) {
          await handleRemoveItem(item.itemId);
        }
      },
    });
  };

  // Toggle selection
  const toggleItem = (itemId: string) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleAll = () => {
    const activeIds = enrichedItems
      .filter((i) => i.product?.status === "ACTIVE")
      .map((i) => i.itemId);
    if (selectedItemIds.size === activeIds.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(activeIds));
    }
  };

  const toggleSellerGroup = (group: SellerGroup) => {
    const activeInGroup = group.items
      .filter((i) => i.product?.status === "ACTIVE")
      .map((i) => i.itemId);
    const allSelected = activeInGroup.every((id) => selectedItemIds.has(id));
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        activeInGroup.forEach((id) => next.delete(id));
      } else {
        activeInGroup.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Single item checkout
  const handleCheckoutSingle = (itemId: string) => {
    router.push(`/checkout?itemIds=${itemId}`);
  };

  // Multi-item checkout
  const handleCheckoutSelected = () => {
    if (selectedItemIds.size === 0) {
      messageApi.warning("Vui lòng chọn ít nhất 1 sản phẩm để mua");
      return;
    }
    const ids = Array.from(selectedItemIds).join(",");
    router.push(`/checkout?itemIds=${ids}`);
  };

  // Calculate totals
  const selectedItems = enrichedItems.filter((i) =>
    selectedItemIds.has(i.itemId),
  );
  const subtotal = selectedItems.reduce(
    (acc, item) => acc + (item.product?.price ?? 0),
    0,
  );
  const activeItemCount = enrichedItems.filter(
    (i) => i.product?.status === "ACTIVE",
  ).length;

  const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Spin size="large" />
        <p className="text-slate-500 text-sm font-medium">
          Đang tải giỏ hàng...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/home"
            className="hover:text-emerald-600 transition-colors"
          >
            Trang chủ
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-800 font-semibold">Giỏ hàng</span>
        </nav>

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                Giỏ hàng của bạn
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {enrichedItems.length} sản phẩm
              </p>
            </div>
          </div>
          {enrichedItems.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Xóa tất cả
            </button>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column - Cart Items */}
          <div className="flex-1 w-full space-y-4">
            {enrichedItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                  <ShoppingBag className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Giỏ hàng trống
                </h3>
                <p className="text-slate-500 mb-8 max-w-sm">
                  Hãy khám phá và thêm những sản phẩm yêu thích vào giỏ hàng!
                </p>
                <Link
                  href="/home"
                  className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-emerald-500/20 inline-flex items-center gap-2"
                >
                  <Package className="w-5 h-5" /> Khám phá sản phẩm
                </Link>
              </div>
            ) : (
              <>
                {/* Select all bar */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
                  <button
                    onClick={toggleAll}
                    className="flex items-center gap-3 text-sm font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
                  >
                    {selectedItemIds.size === activeItemCount &&
                    activeItemCount > 0 ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                    Chọn tất cả ({activeItemCount} sản phẩm)
                  </button>
                  <span className="text-sm text-slate-500">
                    Đã chọn:{" "}
                    <span className="font-bold text-emerald-600">
                      {selectedItemIds.size}
                    </span>
                  </span>
                </div>

                {/* Items grouped by seller */}
                {sellerGroups.map((group) => {
                  const activeInGroup = group.items.filter(
                    (i) => i.product?.status === "ACTIVE",
                  );
                  const allGroupSelected =
                    activeInGroup.length > 0 &&
                    activeInGroup.every((i) => selectedItemIds.has(i.itemId));
                  const someGroupSelected =
                    !allGroupSelected &&
                    activeInGroup.some((i) => selectedItemIds.has(i.itemId));

                  return (
                    <div
                      key={group.sellerId}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                      {/* Seller header */}
                      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-3">
                        <button
                          onClick={() => toggleSellerGroup(group)}
                          className="flex items-center gap-2 text-sm hover:text-emerald-600 transition-colors"
                        >
                          {allGroupSelected ? (
                            <CheckSquare className="w-4.5 h-4.5 text-emerald-600" />
                          ) : someGroupSelected ? (
                            <CheckSquare className="w-4.5 h-4.5 text-emerald-400" />
                          ) : (
                            <Square className="w-4.5 h-4.5 text-slate-400" />
                          )}
                        </button>
                        <Link href={`/user/${group.sellerId}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-emerald-100 flex items-center justify-center shrink-0">
                            {group.sellerAvatar ? (
                              <img src={group.sellerAvatar} alt={group.sellerName} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-emerald-700" />
                            )}
                          </div>
                          <span className="font-bold text-slate-800 text-sm truncate hover:text-emerald-600 transition-colors">
                            {group.sellerName}
                          </span>
                        </Link>
                        <span className="text-xs text-slate-400 ml-auto">
                          {group.items.length} sản phẩm
                        </span>
                      </div>

                      {/* Items */}
                      <div className="divide-y divide-slate-100">
                        {group.items.map((item) => {
                          const isActive = item.product?.status === "ACTIVE";
                          const isSelected = selectedItemIds.has(item.itemId);

                          return (
                            <div
                              key={item.itemId}
                              className={`p-5 relative group transition-all ${
                                isSelected ? "bg-emerald-50/30" : ""
                              } ${!isActive ? "opacity-60" : ""}`}
                            >
                              {updatingItemId === item.itemId && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                                  <Spin />
                                </div>
                              )}

                              <div className="flex gap-4">
                                {/* Checkbox */}
                                <button
                                  onClick={() =>
                                    isActive && toggleItem(item.itemId)
                                  }
                                  className={`mt-1 shrink-0 ${!isActive ? "cursor-not-allowed" : "cursor-pointer"}`}
                                  disabled={!isActive}
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <Square
                                      className={`w-5 h-5 ${isActive ? "text-slate-400 hover:text-emerald-500" : "text-slate-300"}`}
                                    />
                                  )}
                                </button>

                                {/* Product Image */}
                                <Link
                                  href={`/items/${item.itemId}`}
                                  className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100 hover:border-emerald-200 transition-colors"
                                >
                                  <img
                                    src={
                                      item.product?.images?.[0]?.imageUrl ||
                                      "/icon-other/san-pham-khac.png"
                                    }
                                    alt={item.product?.title || "Sản phẩm"}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                  />
                                </Link>

                                {/* Product Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <Link
                                        href={`/items/${item.itemId}`}
                                        className="font-bold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-2 text-[15px]"
                                      >
                                        {item.product?.title ||
                                          "Sản phẩm không khả dụng"}
                                      </Link>

                                      {/* Status badges */}
                                      {!isActive && item.product?.status && (
                                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                          <AlertTriangle className="w-3 h-3" />
                                          {item.product.status === "RESERVED"
                                            ? "Đã có người đặt"
                                            : item.product.status === "SOLD"
                                              ? "Đã bán"
                                              : item.product.status}
                                        </span>
                                      )}
                                      {isActive && (
                                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                                          <CheckCircle className="w-3 h-3" />
                                          Còn hàng
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        handleRemoveItem(item.itemId)
                                      }
                                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                                      title="Xóa sản phẩm"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="flex items-end justify-between mt-3">
                                    {/* Price */}
                                    <p className="text-lg font-black text-emerald-600">
                                      {formatPrice(item.product?.price ?? 0)}
                                    </p>

                                    {/* Single buy button */}
                                    <button
                                      onClick={() =>
                                        handleCheckoutSingle(item.itemId)
                                      }
                                      disabled={!isActive}
                                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 shadow-sm hover:shadow-md"
                                    >
                                      <CreditCard className="w-4 h-4" /> Mua
                                      ngay
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Continue Shopping */}
                <div className="pt-2">
                  <Link
                    href="/home"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{" "}
                    Tiếp tục mua sắm
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Right Column - Summary */}
          {enrichedItems.length > 0 && (
            <div className="w-full lg:w-[380px] shrink-0 space-y-5 lg:sticky lg:top-24">
              {/* Cart Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Tóm tắt đơn hàng
                </h2>

                <div className="space-y-3.5 mb-5 text-sm">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>
                      Đã chọn ({selectedItemIds.size} sản phẩm)
                    </span>
                    <span className="font-semibold text-slate-800">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Phí vận chuyển</span>
                    <span className="font-semibold text-emerald-600">
                      Miễn phí
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-end mb-4">
                    <span className="font-bold text-slate-800 text-base">
                      Tổng ước tính
                    </span>
                    <span className="text-2xl font-black text-emerald-600">
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  {/* Multi-buy button */}
                  <button
                    onClick={handleCheckoutSelected}
                    disabled={selectedItemIds.size === 0}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30 disabled:shadow-none text-base flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    Mua {selectedItemIds.size > 0 ? selectedItemIds.size : ""}{" "}
                    sản phẩm đã chọn
                  </button>

                  <p className="text-[11px] text-slate-400 text-center mt-3">
                    Mỗi sản phẩm secondhand là duy nhất — mua ngay để không bỏ
                    lỡ!
                  </p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-white rounded-2xl p-5 space-y-4 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Escrow bảo vệ
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tiền tạm giữ đến khi bạn xác nhận nhận hàng.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Giao hàng nhanh
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Nhận hàng từ 2-4 ngày làm việc.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Khiếu nại dễ dàng
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Hoàn tiền nếu sản phẩm không đúng mô tả.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggested Items */}
        {suggestedItems.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">
                Có thể bạn quan tâm
              </h2>
              <Link
                href="/products"
                className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Xem thêm →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
              {suggestedItems.map((item) => (
                <Link
                  href={`/items/${item.itemId}`}
                  key={item.itemId}
                  className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="aspect-[4/5] bg-slate-100 overflow-hidden relative">
                    <img
                      src={
                        item.images?.[0]?.imageUrl ||
                        "/icon-other/san-pham-khac.png"
                      }
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors min-h-[40px]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-lg font-black text-emerald-600">
                      {formatPrice(item.price ?? 0)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
