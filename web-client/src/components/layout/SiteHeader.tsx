"use client";

import { CircleUserRound, LogOut, MessageSquareMore, Search, Store } from "lucide-react";
import { useAppDispatch } from "@/stores/hooks";
import { logout } from "@/stores/slices/auth.slice";
import type { UserType } from "@/types/user.type";

type SiteHeaderProps = {
  user: UserType | null;
  isAuth: boolean;
  onOpenAuth: () => void;
};

export default function SiteHeader({ user, isAuth, onOpenAuth }: SiteHeaderProps) {
  const dispatch = useAppDispatch();
  const showAuthenticatedUi = isAuth && Boolean(user);

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-[rgba(244,247,241,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <a href="/home" className="flex shrink-0 items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <Store size={20} />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-950">TradeHub</p>
            <p className="text-xs text-slate-500">Secondhand marketplace</p>
          </div>
        </a>

        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-full border border-white/80 bg-white px-5 py-3 shadow-sm lg:flex">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm đồ điện tử, sách, nội thất..."
            className="w-full border-none bg-transparent text-sm text-slate-800 outline-none"
          />
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 lg:flex">
          <a href="/home" className="text-emerald-500">Home</a>
          <a href="#categories" className="transition hover:text-slate-950">Categories</a>
          <a href="#featured" className="transition hover:text-slate-950">Listings</a>
          <a href="#footer" className="transition hover:text-slate-950">Support</a>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white text-slate-600 shadow-sm lg:inline-flex"
            aria-label="Messages"
          >
            <MessageSquareMore size={18} />
          </button>

          {showAuthenticatedUi ? (
            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-white/70 bg-white px-4 py-2 text-right shadow-sm sm:block">
                <p className="text-xs text-slate-500">Đã đăng nhập</p>
                <p className="max-w-[180px] truncate text-sm font-semibold text-slate-950">{user?.email}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <CircleUserRound size={20} />
              </div>
              <button
                type="button"
                onClick={() => dispatch(logout())}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white text-slate-600 shadow-sm"
                aria-label="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
            >
              Đăng nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
}