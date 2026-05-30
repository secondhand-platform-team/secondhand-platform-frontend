"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/stores/hooks";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Settings,
  KeyRound,
  Menu,
  X,
  CheckCircle2,
  MapPin,
  Heart,
  Wallet,
  ClipboardList,
} from "lucide-react";

function getAvatarInitials(fullName?: string, email?: string): string {
  const name = fullName?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2)
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return parts[0]?.[0]?.toUpperCase() || "U";
  }
  if (email?.trim()) return email.trim()[0].toUpperCase();
  return "U";
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navigation = [
    { name: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
    {
      name: "Quản lý tin đăng",
      href: "/dashboard/my-posts",
      icon: ShoppingBag,
    },
    {
      name: "Lịch sử đơn hàng",
      href: "/dashboard/orders",
      icon: ClipboardList,
    },
    { name: "Tin yêu thích", href: "/dashboard/favorites", icon: Heart },
    { name: "Ví của tôi", href: "/dashboard/wallet", icon: Wallet },
    { name: "Quản lý khách hàng", href: "/dashboard/customers", icon: Users },
    { name: "Cài đặt tài khoản", href: "/dashboard/profile", icon: Settings },
    { name: "Đổi mật khẩu", href: "/dashboard/password", icon: KeyRound },
  ];

  const profileStats = [
    { label: "Tỉ lệ phản hồi", value: "Chưa có dữ liệu", highlight: false },
    { label: "Đã bán thành công", value: "Chưa có dữ liệu", highlight: false },
    {
      label: "Lượt đăng miễn phí đã dùng",
      value: (mounted && user?.freeSellUsed) || "0",
      highlight: false,
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen py-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Profile with Wave */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 mb-8 relative">
          {/* Wavy gradient background */}
          <div className="relative h-36 sm:h-40 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
            {/* SVG Wave Bottom */}
            <svg
              className="absolute bottom-0 left-0 w-full"
              viewBox="0 0 1440 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
              style={{ height: "40px" }}
            >
              <path
                d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"
                fill="white"
              />
            </svg>
            {/* Edit Profile Button positioned on the wave */}
            <div className="absolute top-4 right-4 z-10">
              <Link
                href="/dashboard/profile"
                className="px-5 py-2 bg-white/90 hover:bg-white text-emerald-700 rounded-xl font-bold text-sm transition-all shadow-lg backdrop-blur-sm flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Chỉnh sửa hồ sơ
              </Link>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2 relative flex flex-col md:flex-row md:items-end md:justify-between gap-6 -mt-16">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="w-32 h-32 rounded-full border-4 border-white overflow-hidden shadow-xl bg-white shrink-0 relative z-10">
                {mounted && user?.avatarUrl && !user.avatarUrl.includes("ui-avatars.com") ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-4xl font-black">
                    {mounted ? getAvatarInitials(user?.fullName, user?.email) : "U"}
                  </div>
                )}
              </div>
              <div className="text-center md:text-left mb-2">
                <h1 className="text-3xl font-black text-slate-900">
                  {mounted && user?.fullName ? user.fullName : "Người dùng"}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-slate-500 mt-2">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {mounted && user?.city
                      ? `${user.district ? user.district + ", " : ""}${user.city}`
                      : "Toàn quốc"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />{" "}
                    {mounted && user?.createdAt
                      ? `Tham gia từ ${new Date(user.createdAt).toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}`
                      : "Thành viên ReLife"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2 mb-2 text-center md:text-right">
              <span className="text-sm font-semibold text-slate-600">
                Chưa có dữ liệu đánh giá
              </span>
              <p className="text-xs text-slate-500">
                Điểm số và số lượt đánh giá sẽ hiển thị khi backend hỗ trợ.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Sidebar Toggle */}
          <div className="lg:hidden flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm">
            <span className="font-bold text-slate-800">Menu</span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Sidebar */}
          <div
            className={`lg:w-72 shrink-0 space-y-6 ${mobileMenuOpen ? "block" : "hidden lg:block"}`}
          >
            {/* Navigation */}
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
              <nav className="space-y-1.5">
                {navigation.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (pathname.startsWith(item.href) &&
                      item.href !== "/dashboard" &&
                      item.href !== "/my-posts");
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-semibold transition-all ${
                        isActive
                          ? "bg-emerald-50 text-emerald-600"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Stats Widget */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-lg">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900">Thống kê</h3>
              </div>
              <div className="space-y-4">
                {profileStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-slate-500 font-medium">
                      {stat.label}
                    </span>
                    <span
                      className={`font-bold ${stat.highlight ? "text-emerald-600" : "text-slate-800"}`}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}
