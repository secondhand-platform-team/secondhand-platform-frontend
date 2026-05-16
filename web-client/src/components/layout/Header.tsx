"use client";

import Image from "next/image";
import Link from "next/link";
import { Dropdown, App, Badge } from "antd";
import {
  ChevronDown,
  ClipboardList,
  FileText,
  Heart,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  Users,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { logoutUser } from "@/stores/slices/auth.slice";
import { fetchMyCart } from "@/stores/slices/cart.slice";
import { fetchMyWallet } from "@/stores/slices/wallet.slice";
import type { UserType } from "@/types/user.type";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";

type SiteHeaderProps = {
  user: UserType | null;
  isAuth: boolean;
  onOpenAuth: () => void;
};

export default function Header({ user, isAuth, onOpenAuth }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const cartItemCount = useAppSelector(
    (state) => state.cart.cart?.cartItems?.length || 0,
  );
  const walletBalance = useAppSelector(
    (state) => state.wallet.wallet?.balance ?? null,
  );
  const { message: messageApi } = App.useApp();

  // Close notification dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    if (notifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  const [mounted, setMounted] = useState(false);
  
  // Đảm bảo UI khớp giữa Server và Client để tránh Hydration error
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isAuth && mounted) {
      dispatch(fetchMyCart());
      dispatch(fetchMyWallet());
    }
  }, [isAuth, dispatch]);

  const formatCurrency = (value?: number | null) => {
    if (value == null) return "0đ";
    return `${value.toLocaleString("vi-VN")}đ`;
  };

  const showAuthenticatedUi = isAuth && Boolean(user);
  }, [isAuth, dispatch, mounted]);

  const showAuthenticatedUi = mounted && isAuth && Boolean(user);
  const displayName = user?.fullName?.trim() || user?.email || "Người dùng";
  const router = useRouter();
  const pathname = usePathname();
  const isChat = pathname?.startsWith("/chat") ?? false;

  const getAvatarText = (fullName?: string, email?: string) => {
    const normalizedName = fullName?.trim();
    if (normalizedName) {
      const parts = normalizedName.split(/\s+/).filter(Boolean);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return parts[0][0]?.toUpperCase() || "U";
    }

    if (email?.trim()) {
      return email.trim()[0].toUpperCase();
    }

    return "U";
  };

  const avatarText = getAvatarText(user?.fullName, user?.email);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
      messageApi.success("Đã đăng xuất");
      router.replace("/home");
    } catch (error) {
      messageApi.error(
        error instanceof Error ? error.message : "Đăng xuất thất bại!",
      );
    }
  };

  const userMenuItems = [
    {
      key: "overview",
      label: "Tổng quan",
      icon: <LayoutDashboard size={16} />,
    },
    {
      key: "posts",
      label: "Quản lý tin đăng",
      icon: <FileText size={16} />,
    },
    {
      key: "customers",
      label: "Quản lý khách hàng",
      icon: <Users size={16} />,
    },
    {
      key: "orders",
      label: "Lịch sử đơn hàng",
      icon: <ClipboardList size={16} />,
    },
    {
      type: "divider" as const,
    },
    {
      key: "settings",
      label: "Cài đặt tài khoản",
      icon: <Settings size={16} />,
    },
    {
      key: "password",
      label: "Đổi mật khẩu",
      icon: <KeyRound size={16} />,
    },
    {
      key: "logout",
      label: "Đăng xuất",
      icon: <LogOut size={16} />,
      danger: true,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full h-16 border-b border-primary/10 bg-white dark:bg-background-dark/80 backdrop-blur-md">
        <div className="mx-auto flex h-full w-full max-w-360 items-center justify-between px-3 sm:px-4 lg:px-5">
          <div className="flex items-center gap-6 lg:gap-8">
            <a href="/home" className="flex items-center group">
              <div className="relative flex items-center justify-center">
                <Image
                  src="/logo/icon-logo.png"
                  alt="Logo ReLife"
                  width={120}
                  height={80}
                  className="h-20 w-auto max-w-30 object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </a>
            <nav className="hidden items-center gap-5 md:flex lg:gap-6">
              <a
                className="text-sm font-semibold transition-colors hover:text-emerald-600!"
                href="/products"
                style={{ color: "#4b5563" }}
              >
                Sản phẩm
              </a>
              <a
                className="text-sm font-semibold transition-colors hover:text-emerald-600!"
                href="/home#categories"
                style={{ color: "#4b5563" }}
              >
                Danh mục
              </a>
              <a
                className="text-sm font-semibold transition-colors hover:text-emerald-600!"
                href="/community"
                style={{ color: "#4b5563" }}
              >
                Cộng đồng
              </a>
              <a
                className="text-sm font-semibold transition-colors hover:text-emerald-600!"
                href="/contact"
                style={{ color: "#4b5563" }}
              >
                Liên hệ
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {showAuthenticatedUi && (
              <div className="flex items-center gap-1">
                <NotificationBell />

                {!isChat && (
                  <>
                    {/* Chat */}
                    <button
                      onClick={() => router.push("/chat")}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600"
                      title="Tin nhắn"
                    >
                      <MessageCircle size={18} />
                    </button>
                  </>
                )}

                {/* Favorites */}
                <button
                  onClick={() => router.push("/dashboard/favorites")}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600"
                  title="Yêu thích"
                >
                  <Heart size={18} />
                </button>

                {/* Cart */}
                <button
                  onClick={() => router.push("/cart")}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-emerald-600"
                  title="Giỏ hàng"
                >
                  <Badge count={cartItemCount} size="small" offset={[-2, 2]}>
                    <ShoppingCart size={18} />
                  </Badge>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (!showAuthenticatedUi) {
                  onOpenAuth();
                  return;
                }
                router.push("/post-item");
              }}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-emerald-700 sm:px-5"
            >
              Đăng tin
            </button>
            {showAuthenticatedUi ? (
              <Dropdown
                trigger={["click"]}
                placement="bottomRight"
                open={open}
                onOpenChange={(flag) => setOpen(flag)}
                menu={{
                  items: userMenuItems,
                  onClick: ({ key }) => {
                    if (key === "logout") {
                      void handleLogout();
                    } else if (key === "posts") {
                      router.push("/dashboard/my-posts");
                      setOpen(false);
                    } else if (key === "overview") {
                      router.push("/dashboard");
                      setOpen(false);
                    } else if (key === "customers") {
                      router.push("/dashboard/customers");
                      setOpen(false);
                    } else if (key === "orders") {
                      router.push("/dashboard/orders");
                      setOpen(false);
                    } else if (key === "settings") {
                      router.push("/dashboard/profile");
                      setOpen(false);
                    } else if (key === "password") {
                      router.push("/dashboard/password");
                      setOpen(false);
                    }
                  },
                }}
              >
                <div className="hidden cursor-pointer items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 transition-all hover:bg-slate-100 hover:shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-bold text-emerald-600">
                    {user?.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt="Ảnh đại diện"
                        width={36}
                        height={36}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      avatarText
                    )}
                  </div>

                  <div className="flex flex-col max-w-44">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {displayName}
                    </p>
                    {walletBalance != null && (
                      <Link
                        href="/dashboard/wallet"
                        className="text-xs text-emerald-600 font-semibold hover:underline"
                      >
                        {formatCurrency(walletBalance)}
                      </Link>
                    )}
                  </div>

                  <ChevronDown
                    size={16}
                    className={`text-slate-500 transition-transform duration-200 ${
                      open ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </Dropdown>
            ) : (
              <button
                onClick={onOpenAuth}
                className="inline-flex items-center justify-center rounded-lg border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/20 sm:px-5"
              >
                Đăng nhập
              </button>
            )}

            {showAuthenticatedUi ? (
              <Dropdown
                trigger={["click"]}
                placement="bottomRight"
                menu={{
                  items: userMenuItems,
                  onClick: ({ key }) => {
                    if (key === "logout") {
                      void handleLogout();
                    } else if (key === "posts") {
                      router.push("/dashboard/my-posts");
                    } else if (key === "overview") {
                      router.push("/dashboard");
                    } else if (key === "customers") {
                      router.push("/dashboard/customers");
                    } else if (key === "orders") {
                      router.push("/dashboard/orders");
                    } else if (key === "settings") {
                      router.push("/dashboard/profile");
                    } else if (key === "password") {
                      router.push("/dashboard/password");
                    }
                  },
                }}
              >
                <div className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary sm:hidden">
                  {avatarText}
                </div>
              </Dropdown>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}
