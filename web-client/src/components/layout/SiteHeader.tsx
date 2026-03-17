"use client";

import { CircleUserRound, LogOut } from "lucide-react";
import { useAppDispatch } from "@/stores/hooks";
import { logout } from "@/stores/slices/auth.slice";
import type { UserType } from "@/types/user.type";

type SiteHeaderProps = {
  user: UserType | null;
  isAuth: boolean;
  onOpenAuth: () => void;
};

export default function SiteHeader({
  user,
  isAuth,
  onOpenAuth,
}: SiteHeaderProps) {
  const dispatch = useAppDispatch();
  const showAuthenticatedUi = isAuth && Boolean(user);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <a href="/home" className="flex items-center gap-2 text-primary">
            <img src="/logo/icon-logo.png" alt="" />
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Chợ đồ cũ
            </h2>
          </a>
          <nav className="hidden md:flex items-center gap-6">
            <a
              className="text-sm font-semibold hover:text-primary transition-colors"
              href="#"
            >
              Sản phẩm
            </a>
            <a
              className="text-sm font-semibold hover:text-primary transition-colors"
              href="#"
            >
              Danh mục
            </a>
            <a
              className="text-sm font-semibold hover:text-primary transition-colors"
              href="#"
            >
              Cộng đồng
            </a>
            <a
              className="text-sm font-semibold hover:text-primary transition-colors"
              href="#"
            >
              Liên hệ
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          {showAuthenticatedUi ? (
            <div className="flex items-center gap-3">
              <div className="hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2 text-right sm:block">
                <p className="text-xs text-slate-500">Đã đăng nhập</p>
                <p className="max-w-[180px] truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user?.email}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CircleUserRound size={20} />
              </div>
              <button
                type="button"
                onClick={() => dispatch(logout())}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              {/* <button className="hidden sm:flex items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary/90 transition-all">
                Đăng tin
              </button> */}
              <button
                onClick={onOpenAuth}
                className="flex items-center justify-center rounded-lg bg-[#4cae4f]  px-5 py-2 text-sm font-bold text-white  hover:bg-primary/20 transition-all "
              >
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
