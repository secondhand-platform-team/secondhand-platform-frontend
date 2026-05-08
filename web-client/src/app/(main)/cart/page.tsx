"use client";
import type { ItemWithImages } from "@/types/item.type";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { message as antdMessage, Input, Button, Spin, Modal, App } from "antd";
import { ArrowLeft, Trash2, Minus, Plus, ShieldCheck, Truck, ShoppingBag, Package, Tag, CreditCard } from "lucide-react";
import { type CartType, type CartItemType, fetchMyCart, updateItemQuantity, removeItemFromCart } from "@/stores/slices/cart.slice";
import { itemService,  } from "@/stores/slices/items.slice";
import { useAppSelector, useAppDispatch } from "@/stores/hooks";

// Extended cart item with product details
interface EnrichedCartItem extends CartItemType {
  product?: ItemWithImages;
}

export default function CartPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuth, loading: authLoading } = useAppSelector((state) => state.auth);
  const { message: messageApi } = App.useApp();

  const [loading, setLoading] = useState(true);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedCartItem[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [suggestedItems, setSuggestedItems] = useState<ItemWithImages[]>([]);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const cartData = await dispatch(fetchMyCart()).unwrap();

      if (cartData && cartData.cartItems && cartData.cartItems.length > 0) {
        const itemsWithDetails = await Promise.all(
          cartData.cartItems.map(async (item) => {
            try {
              const product = await itemService.getItem(item.itemId);
              return { ...item, product };
            } catch {
              return item;
            }
          })
        );
        setEnrichedItems(itemsWithDetails);
      } else {
        setEnrichedItems([]);
      }

      try {
        const featured = await itemService.getFeaturedItems(4);
        setSuggestedItems(featured);
      } catch { }

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

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    try {
      setUpdatingItemId(itemId);
      await dispatch(updateItemQuantity({ itemId, quantity: newQuantity })).unwrap();
      // Update local state optimistically
      setEnrichedItems(prev => prev.map(item =>
        item.itemId === itemId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (err) {
      messageApi.error("Không thể cập nhật số lượng");
      // Reload cart to get correct state
      loadCart();
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setUpdatingItemId(itemId);
      await dispatch(removeItemFromCart(itemId)).unwrap();
      // Remove from local state immediately
      setEnrichedItems(prev => prev.filter(item => item.itemId !== itemId));
      messageApi.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (err) {
      messageApi.error("Không thể xóa sản phẩm");
      // Reload cart to get correct state
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

  const handleCheckout = () => {
    messageApi.info("Tính năng thanh toán đang được phát triển");
  };

  const subtotal = enrichedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shippingFee = subtotal > 0 ? 35000 : 0;
  const discount = 0;
  const total = subtotal + shippingFee - discount;

  const formatPrice = (price: number) => price.toLocaleString("vi-VN") + "đ";

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Spin size="large" />
        <p className="text-slate-500 text-sm font-medium">Đang tải giỏ hàng...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/home" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
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
                <h1 className="text-2xl font-black text-slate-900">Giỏ hàng của bạn</h1>
                <p className="text-sm text-slate-500 mt-0.5">{enrichedItems.length} sản phẩm</p>
              </div>
            </div>
            {enrichedItems.length > 0 && (
              <button onClick={handleClearAll}
                className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-50">
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
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Giỏ hàng trống</h3>
                  <p className="text-slate-500 mb-8 max-w-sm">Hãy khám phá và thêm những sản phẩm yêu thích vào giỏ hàng!</p>
                  <Link href="/home" className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-emerald-500/20 inline-flex items-center gap-2">
                    <Package className="w-5 h-5" /> Khám phá sản phẩm
                  </Link>
                </div>
              ) : (
                <>
                  {enrichedItems.map((item, index) => (
                    <div key={item.itemId}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all p-5 relative group"
                      style={{ animationDelay: `${index * 50}ms` }}>
                      {updatingItemId === item.itemId && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
                          <Spin />
                        </div>
                      )}

                      <div className="flex gap-5">
                        {/* Product Image */}
                        <Link href={`/items/${item.itemId}`}
                          className="w-28 h-28 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100 hover:border-emerald-200 transition-colors">
                          <img
                            src={item.product?.images?.[0]?.imageUrl || "/icon-other/san-pham-khac.png"}
                            alt={item.product?.title || "Sản phẩm"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <Link href={`/items/${item.itemId}`}
                                className="font-bold text-slate-800 hover:text-emerald-600 transition-colors line-clamp-2 text-[15px]">
                                {item.product?.title || "Sản phẩm không khả dụng"}
                              </Link>
                              <p className="text-xs text-slate-500 mt-1">
                                Người bán: <span className="text-slate-700 font-medium">{item.product?.userId?.substring(0, 8) || "Đang cập nhật"}</span>
                              </p>
                            </div>
                            <button onClick={() => handleRemoveItem(item.itemId)}
                              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                              title="Xóa sản phẩm">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-end justify-between mt-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                              <button onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                                className="w-9 h-9 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-40"
                                disabled={item.quantity <= 1 || updatingItemId === item.itemId}>
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <div className="w-12 h-9 flex items-center justify-center font-bold text-sm bg-white border-x border-slate-200 text-slate-800">
                                {item.quantity}
                              </div>
                              <button onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                                className="w-9 h-9 flex items-center justify-center hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-40"
                                disabled={updatingItemId === item.itemId}>
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-xs text-slate-500">Đơn giá: {formatPrice(item.price)}</p>
                              <p className="text-lg font-black text-emerald-600 mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Continue Shopping */}
                  <div className="pt-2">
                    <Link href="/home" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors group">
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Tiếp tục mua sắm
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* Right Column - Summary */}
            {enrichedItems.length > 0 && (
              <div className="w-full lg:w-[380px] shrink-0 space-y-5 lg:sticky lg:top-24">
                {/* Order Summary */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                    Tóm tắt đơn hàng
                  </h2>

                  <div className="space-y-3.5 mb-5 text-sm">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Tạm tính ({enrichedItems.length} sản phẩm)</span>
                      <span className="font-semibold text-slate-800">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>Phí vận chuyển (ước tính)</span>
                      <span className="font-semibold text-slate-800">{formatPrice(shippingFee)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between items-center text-emerald-600">
                        <span>Giảm giá</span>
                        <span className="font-semibold">-{formatPrice(discount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Discount Code */}
                  <div className="flex gap-2 mb-5 pb-5 border-b border-slate-100">
                    <Input
                      placeholder="Nhập mã giảm giá"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      prefix={<Tag className="w-4 h-4 text-slate-400" />}
                      className="!rounded-xl"
                    />
                    <Button type="default" className="!rounded-xl font-semibold shrink-0">Áp dụng</Button>
                  </div>

                  {/* Total */}
                  <div className="mb-6">
                    <div className="flex justify-between items-end mb-1">
                      <span className="font-bold text-slate-800 text-base">Tổng cộng</span>
                      <span className="text-2xl font-black text-emerald-600">{formatPrice(total)}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 text-right">(Đã bao gồm VAT nếu có)</p>
                  </div>

                  <button onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30 text-base flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Tiến hành thanh toán
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="bg-white rounded-2xl p-5 space-y-4 border border-slate-100 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Giao dịch an toàn</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Thông tin cá nhân được bảo mật tuyệt đối.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Giao hàng nhanh</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Nhận hàng từ 2-4 ngày làm việc.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Đổi trả dễ dàng</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Hoàn tiền nếu sản phẩm không đúng mô tả.</p>
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
                <h2 className="text-xl font-bold text-slate-900">Có thể bạn quan tâm</h2>
                <Link href="/products" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Xem thêm →
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
                {suggestedItems.map((item) => (
                  <Link href={`/items/${item.itemId}`} key={item.itemId}
                    className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                    <div className="aspect-[4/5] bg-slate-100 overflow-hidden relative">
                      <img
                        src={item.images?.[0]?.imageUrl || "/icon-other/san-pham-khac.png"}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-emerald-600 transition-colors min-h-[40px]">{item.title}</h3>
                      <p className="mt-2 text-lg font-black text-emerald-600">{formatPrice(item.price ?? 0)}</p>
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
