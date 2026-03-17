import { Globe, Instagram, Store } from "lucide-react";

export default function SiteFooter() {
  return (
    <footer id="footer" className="border-t border-white/60 bg-white/80 py-14">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.3fr_0.8fr_0.8fr] lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <img
                src="/logo/icon-logo.png"
                alt=""
                className="h-8 w-8 brightness-0 invert"
              />{" "}
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-950">TradeHub</p>
              <p className="text-sm text-slate-500">
                Nền tảng giao dịch đồ đã qua sử dụng
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
            TradeHub kết nối người mua và người bán theo cách gọn, minh bạch và
            dễ kiểm soát hơn cho đồ điện tử, thời trang, sách và nội thất.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a
              href="https://example.com"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-500"
            >
              <Globe size={18} />
            </a>
            <a
              href="https://instagram.com"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-500"
            >
              <Instagram size={18} />
            </a>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Marketplace
          </p>
          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            <a href="#categories" className="transition hover:text-slate-950">
              All Categories
            </a>
            <a href="#featured" className="transition hover:text-slate-950">
              Featured Items
            </a>
            <a href="#hero" className="transition hover:text-slate-950">
              Sell an Item
            </a>
            <a href="#auth" className="transition hover:text-slate-950">
              Trade Policy
            </a>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Support
          </p>
          <div className="mt-5 grid gap-3 text-sm text-slate-600">
            <a href="#footer" className="transition hover:text-slate-950">
              Help Center
            </a>
            <a href="#footer" className="transition hover:text-slate-950">
              Safety Tips
            </a>
            <a href="#footer" className="transition hover:text-slate-950">
              Contact Us
            </a>
            <a href="#footer" className="transition hover:text-slate-950">
              FAQ
            </a>
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-slate-100 px-4 pt-6 text-sm text-slate-400 sm:px-6 lg:px-8">
        © 2026 TradeHub. Web client connected to auth-service API.
      </div>
    </footer>
  );
}
