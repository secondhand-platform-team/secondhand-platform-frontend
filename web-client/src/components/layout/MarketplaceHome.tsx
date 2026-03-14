/* eslint-disable @next/next/no-img-element */

"use client";

import { useMemo, useState } from "react";
import {
  BookOpenText,
  Camera,
  ChevronRight,
  LaptopMinimal,
  PackageCheck,
  Shirt,
  Sofa,
  Sparkles,
  Truck,
} from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import CategoryCard from "@/components/item/CategoryCard";
import ProductCard from "@/components/item/ProductCard";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { useAppSelector } from "@/stores/hooks";

const categoryItems = [
  { icon: Shirt, title: "Thời trang", count: "1,200+ sản phẩm" },
  { icon: LaptopMinimal, title: "Điện tử", count: "850+ sản phẩm" },
  { icon: Sofa, title: "Nội thất", count: "430+ sản phẩm" },
  { icon: BookOpenText, title: "Sách", count: "2,100+ sản phẩm" },
];

const featuredProducts = [
  {
    title: "Đồng hồ tối giản màu trắng",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80",
    location: "Brooklyn, NY",
    price: "$45",
    badge: "Vintage",
  },
  {
    title: "Cặp da cao cấp",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    location: "Austin, TX",
    price: "$120",
    badge: "Like new",
  },
  {
    title: "Tai nghe studio không dây",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    location: "Portland, OR",
    price: "$89",
    badge: "Verified",
  },
  {
    title: "Giày chạy bộ hiện đại",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
    location: "Chicago, IL",
    price: "$65",
    badge: "Fast deal",
  },
];

const heroGallery = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511389026070-a14ae610a1be?auto=format&fit=crop&w=1200&q=80",
];

export default function MarketplaceHome() {
  const [authOpen, setAuthOpen] = useState(false);
  const { isAuth, user } = useAppSelector((state) => state.auth);

  const heroCopy = useMemo(
    () =>
      isAuth
        ? `Xin chào ${user?.email}, bạn đã sẵn sàng đăng bán hoặc săn món hời tiếp theo.`
        : "TradeHub giúp bạn mua bán đồ cũ chất lượng cao với giao diện gọn, rõ và an toàn hơn.",
    [isAuth, user?.email]
  );

  return (
    <div className="tradehub-shell">
      <SiteHeader isAuth={isAuth} user={user} onOpenAuth={() => setAuthOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <section id="hero" className="hero-grid glass-card overflow-hidden rounded-[36px] border border-white/70 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">
                <Sparkles size={14} />
                New items every minute
              </div>
              <h1 className="mt-6 max-w-xl text-5xl font-semibold leading-[1.04] text-slate-950 sm:text-6xl">
                Find
                <span className="font-display text-emerald-500"> pre-loved </span>
                gems.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-slate-500">{heroCopy}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600"
                >
                  {isAuth ? "Bắt đầu đăng bán" : "Khám phá ngay"}
                  <ChevronRight size={18} />
                </button>
                <a
                  href="#featured"
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                >
                  Xem sản phẩm nổi bật
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/70 bg-white/80 p-4">
                  <p className="text-2xl font-bold text-slate-950">12k+</p>
                  <p className="mt-2 text-sm text-slate-500">Người dùng giao dịch mỗi tháng</p>
                </div>
                <div className="rounded-[24px] border border-white/70 bg-white/80 p-4">
                  <p className="text-2xl font-bold text-slate-950">97%</p>
                  <p className="mt-2 text-sm text-slate-500">Tin đăng được phản hồi trong 24h</p>
                </div>
                <div className="rounded-[24px] border border-white/70 bg-white/80 p-4">
                  <p className="text-2xl font-bold text-slate-950">Secure</p>
                  <p className="mt-2 text-sm text-slate-500">Phiên auth dùng Redux Toolkit và js-cookie</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid gap-4 rounded-[32px] border border-white/60 bg-white p-4 shadow-[0_28px_70px_rgba(15,23,42,0.08)] sm:grid-cols-[1.3fr_0.7fr]">
                <div className="overflow-hidden rounded-[28px] bg-slate-100">
                  <img
                    src={heroGallery[0]}
                    alt="Curated fashion collection"
                    className="h-full min-h-[360px] w-full object-cover"
                  />
                </div>
                <div className="grid gap-4">
                  <div className="overflow-hidden rounded-[24px] bg-slate-100">
                    <img src={heroGallery[1]} alt="Fashion item" className="h-[172px] w-full object-cover" />
                  </div>
                  <div className="overflow-hidden rounded-[24px] bg-slate-100">
                    <img src={heroGallery[2]} alt="Accessories" className="h-[172px] w-full object-cover" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-6 left-6 rounded-[24px] border border-white/70 bg-white px-5 py-4 shadow-[0_24px_44px_rgba(15,23,42,0.12)]">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <PackageCheck size={18} className="text-emerald-500" />
                  Verified sellers
                </p>
                <p className="mt-1 text-sm text-slate-500">100% secure trade workflow</p>
              </div>

              <div className="absolute -right-2 top-8 hidden rounded-[24px] border border-emerald-100 bg-emerald-50 px-5 py-4 shadow-lg lg:block">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <Truck size={17} />
                  Giao hàng nhanh nội thành
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="categories" className="pt-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-500">Categories</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Duyệt theo nhóm sản phẩm</h2>
            </div>
            <a href="#featured" className="text-sm font-semibold text-emerald-500">Xem tất cả</a>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {categoryItems.map((item) => (
              <CategoryCard key={item.title} {...item} />
            ))}
          </div>
        </section>

        <section id="featured" className="pt-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-500">Featured Listings</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">Một vài món đang được quan tâm</h2>
            </div>
            <a href="#hero" className="text-sm font-semibold text-slate-500 transition hover:text-slate-950">Bộ lọc nâng cao</a>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featuredProducts.map((item) => (
              <ProductCard key={`${item.title}-${item.location}`} {...item} />
            ))}
          </div>
        </section>

        <section className="pt-20">
          <div className="glass-card overflow-hidden rounded-[32px] border border-white/70 p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-500">Auth Integration</p>
                <h2 className="mt-3 text-3xl font-semibold text-slate-950">Home page đã nối sẵn vào backend auth-service</h2>
                <p className="mt-5 text-base leading-8 text-slate-500">
                  Modal đăng nhập và đăng ký gọi trực tiếp các endpoint thật của backend: đăng nhập người dùng, đăng ký người dùng và lấy hồ sơ hiện tại bằng bearer token.
                </p>
                <button
                  id="auth"
                  type="button"
                  onClick={() => setAuthOpen(true)}
                  className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Camera size={18} />
                  Mở auth modal
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-emerald-100 bg-emerald-50 p-6">
                  <p className="text-sm font-semibold text-emerald-700">POST /login/user</p>
                  <p className="mt-3 text-sm leading-7 text-emerald-900">
                    Đăng nhập bằng email và password, lưu access token vào cookie rồi lấy hồ sơ `/me`.
                  </p>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                  <p className="text-sm font-semibold text-slate-900">POST /register/user</p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Đăng ký với fullName, email, phoneNumber, password, confirmPassword rồi tự đăng nhập lại.
                  </p>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                  <p className="text-sm font-semibold text-slate-900">GET /me</p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Provider tự kiểm tra cookie khi app khởi động và đồng bộ user vào Redux store.
                  </p>
                </div>
                <div className="rounded-[28px] border border-slate-200 bg-white p-6">
                  <p className="text-sm font-semibold text-slate-900">Redux Toolkit</p>
                  <p className="mt-3 text-sm leading-7 text-slate-500">
                    Slice quản lý loading, trạng thái auth, lỗi đăng nhập và logout để tái sử dụng cho các trang sau.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      {authOpen ? <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} /> : null}
    </div>
  );
}