"use client";

import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchMyFavorites } from "@/stores/slices/items.slice";
import { fetchMyCart } from "@/stores/slices/cart.slice";
import {
  ShoppingBag,
  Heart,
  MessageSquare,
  TrendingUp,
  Clock,
  ArrowRight,
  Plus
} from "lucide-react";
import Link from "next/link";
import { Spin } from "antd";

export default function DashboardOverview() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { myFavorites, loading: favLoading } = useAppSelector((state) => state.items);
  const cartItemCount = useAppSelector((state) => state.cart.cart?.cartItems?.length || 0);

  useEffect(() => {
    dispatch(fetchMyFavorites());
    dispatch(fetchMyCart());
  }, [dispatch]);

  const stats = [
    {
      label: "Tin đang đăng",
      value: user?.freeSellUsed || "0",
      icon: ShoppingBag,
      color: "bg-emerald-50 text-emerald-600",
      link: "/dashboard/my-posts"
    },
    {
      label: "Tin yêu thích",
      value: myFavorites.length,
      icon: Heart,
      color: "bg-rose-50 text-rose-600",
      link: "/dashboard/favorites"
    },
    {
      label: "Giỏ hàng",
      value: cartItemCount,
      icon: ShoppingBag,
      color: "bg-emerald-50 text-emerald-600",
      link: "/cart"
    },
    {
      label: "Phản hồi chat",
      value: "98%",
      icon: MessageSquare,
      color: "bg-amber-50 text-amber-600",
      link: "/chat"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Welcome Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900">Chào mừng trở lại, {user?.fullName || "Người dùng"}! 👋</h2>
        <p className="text-slate-500 mt-1">Dưới đây là tóm tắt hoạt động của bạn trên ReLife.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <Link key={idx} href={stat.link} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`${stat.color} p-3 rounded-2xl`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <h4 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h4>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Favorites */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500" /> Tin yêu thích gần đây
            </h3>
            <Link href="/dashboard/favorites" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="p-4">
            {favLoading ? (
              <div className="py-12 flex justify-center"><Spin /></div>
            ) : myFavorites.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-400 text-sm italic">Bạn chưa có tin yêu thích nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myFavorites.slice(0, 3).map((item) => (
                  <Link key={item.itemId} href={`/items/${item.itemId}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img
                        src={item.itemImageList?.find(img => img.isPrimary)?.imageUrl || item.itemImageList?.[0]?.imageUrl || "/icon-other/san-pham-khac.png"}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-slate-800 truncate text-sm">{item.title}</h5>
                      <p className="text-emerald-600 font-black text-sm mt-0.5">{item.price?.toLocaleString("vi-VN")}đ</p>
                    </div>
                    <Clock className="w-4 h-4 text-slate-300 shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white shadow-lg shadow-emerald-200">
            <h3 className="text-xl font-bold mb-2">Bạn có món đồ muốn chia sẻ?</h3>
            <p className="text-emerald-50/80 text-sm mb-6">Đăng tin ngay để tiếp cận hàng ngàn người mua tiềm năng trong khu vực của bạn.</p>
            <Link href="/post-item" className="inline-flex items-center gap-2 bg-white text-emerald-600 px-6 py-3 rounded-2xl font-bold hover:bg-emerald-50 transition-all shadow-md">
              <Plus className="w-5 h-5" /> Đăng tin mới
            </Link>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 mb-4">Sản phẩm dành cho bạn</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
                <p className="text-slate-600 font-medium italic">"Hoàn thiện hồ sơ giúp tăng tỉ lệ bán hàng thành công lên đến 40%."</p>
                <Link href="/dashboard/profile" className="text-emerald-600 font-bold mt-2 block">Cập nhật ngay →</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
