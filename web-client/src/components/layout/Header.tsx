"use client";

import { Dropdown } from "antd";
import {
  ChevronDown,
  CreditCard,
  FileText,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { useAppDispatch } from "@/stores/hooks";
import { logout } from "@/stores/slices/auth.slice";
import type { UserType } from "@/types/user.type";
import { useState } from "react";

type SiteHeaderProps = {
  user: UserType | null;
  isAuth: boolean;
  onOpenAuth: () => void;
};

export default function Header({
  user,
  isAuth,
  onOpenAuth,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const dispatch = useAppDispatch();
  const showAuthenticatedUi = isAuth && Boolean(user);
  const displayName = user?.fullName?.trim() || user?.email || "Người dùng";

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
      key: "wallet",
      label: "Nạp tiền",
      icon: <CreditCard size={16} />,
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
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white dark:bg-background-dark/80 backdrop-blur-md shadow-sm ">
      <div className="mx-auto flex w-full max-w-360 items-center justify-between px-3 py-3 sm:px-4 lg:px-5">
        <div className="flex items-center gap-6 lg:gap-8">
          <a href="/home" className="flex items-center gap-2 text-primary">
            <img
              src="/logo/icon-logo.png"
              alt="Logo Chợ Đồ Cũ"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-xl">
              ReLife
            </h2>
          </a>
          <nav className="hidden items-center gap-5 md:flex lg:gap-6">
            <a
              className="text-sm font-semibold text-slate-700 transition-colors hover:text-primary"
              href="#"
            >
              Sản phẩm
            </a>
            <a
              className="text-sm font-semibold text-slate-700 transition-colors hover:text-primary"
              href="#"
            >
              Danh mục
            </a>
            <a
              className="text-sm font-semibold text-slate-700 transition-colors hover:text-primary"
              href="#"
            >
              Cộng đồng
            </a>
            <a
              className="text-sm font-semibold text-slate-700 transition-colors hover:text-primary"
              href="#"
            >
              Liên hệ
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => {
              if (!showAuthenticatedUi) {
                onOpenAuth();
              }
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary/90 sm:px-5"
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
                    dispatch(logout());
                  }
                },
              }}
            >
              <div className="hidden cursor-pointer items-center gap-2 rounded-xl bg-white px-2.5 py-1.5 transition-all hover:bg-slate-100 hover:shadow-sm dark:bg-slate-800 dark:hover:bg-slate-700 sm:flex">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Ảnh đại diện"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarText
                  )}
                </div>

                <p className="max-w-44 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {displayName}
                </p>

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
                    dispatch(logout());
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
  );
}
