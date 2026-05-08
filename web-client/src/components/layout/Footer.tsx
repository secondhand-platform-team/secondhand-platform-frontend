import { Globe, Instagram, SendHorizontal } from "lucide-react";

export default function Footer() {
  return (
    <footer id="footer" className="border-t border-white/60 bg-white/80 py-12">
      <div className="mx-auto grid w-full max-w-360 gap-10 px-3 sm:px-4 lg:grid-cols-[1.2fr_0.6fr_0.6fr_1fr] lg:px-5">
        {/* Cột 1: Thông tin thương hiệu */}
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/logo/icon-logo.png"
              alt="Logo Chợ Đồ Cũ"
              className="h-9 w-9 rounded-lg object-contain"
            />
            <div>
              <p className="text-lg font-semibold text-slate-950">ReLife</p>
              <p className="text-sm text-slate-500">
                Nền tảng giao dịch đồ cũ
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-500">
            ChợĐồCũ kết nối người mua và người bán theo cách gọn, minh bạch và
            dễ kiểm soát hơn cho đồ điện tử, thời trang và nội thất.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <a href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-500">
              <Globe size={18} />
            </a>
            <a href="#" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:text-emerald-500">
              <Instagram size={18} />
            </a>
          </div>
        </div>

        {/* Cột 2: Khám phá */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Khám phá
          </p>
          <div className="mt-5 grid gap-3 text-sm">
            <a href="#categories" className="transition hover:!text-slate-950" style={{ color: "#4b5563" }}>Danh mục nổi bật</a>
            <a href="#featured" className="transition hover:!text-slate-950" style={{ color: "#4b5563" }}>Sản phẩm nổi bật</a>
            <a href="#hero" className="transition hover:!text-slate-950" style={{ color: "#4b5563" }}>Đăng tin miễn phí</a>
            <a href="#auth" className="transition hover:!text-slate-950" style={{ color: "#4b5563" }}>Chính sách giao dịch</a>
          </div>
        </div>

        {/* Cột 3: Hỗ trợ */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Hỗ trợ
          </p>
          <div className="mt-5 grid gap-3 text-sm">
            <a href="#footer" className="transition hover:!text-slate-950" style={{ color: "#4b5563" }}>Trung tâm trợ giúp</a>
            <a href="#footer" className="transition hover:!text-slate-950" style={{ color: "#4b5563" }}>Mẹo an toàn</a>
            <a href="#footer" className="transition hover:!text-slate-950" style={{ color: "#4b5563" }}>Liên hệ</a>
            <a href="#footer" className="transition hover:!text-slate-950" style={{ color: "#4b5563" }}>Câu hỏi thường gặp</a>
          </div>
        </div>

        {/* Cột 4: Bản tin (Newsletter) */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Bản tin
          </p>
          <p className="mt-5 text-sm leading-6 text-slate-500">
            Nhận thông báo về các món đồ hấp dẫn nhất.
          </p>
          <form className="mt-4 flex gap-2">
            <input
              type="email"
              placeholder="Email của bạn"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              required
            />
            <button
              type="submit"
              className="flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600"
            >
              Gửi
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto mt-10 w-full max-w-360 border-t border-slate-100 px-3 pt-6 text-sm text-slate-400 sm:px-4 lg:px-5">
        © 2026 ChợĐồCũ. Phiên bản web client đang kết nối API backend.
      </div>
    </footer>
  );
}