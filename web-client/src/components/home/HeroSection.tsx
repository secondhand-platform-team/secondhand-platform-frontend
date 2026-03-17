"use client";

type HeroSectionProps = {
  onOpenAuth: () => void;
};

export default function HeroSection({ onOpenAuth }: HeroSectionProps) {
  return (
    <section className="relative h-125 w-full overflow-hidden" id="hero">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCKciJ7gRuZ4xQOky6eYhBiCMnXyTu0OfXzxSfN3-DnMipW0XuqBGC7eJUr2PAg_weBoO2-t6oA1JXRr-2Bdx2NyNlaJUnxv_qPCtp_B9Ifh7LVo8bow5JXeaOMbOR62FqDJW73uVthyle6J8oiDgjRowDmVW3-7hGSqbDw4jWfx42GQ3UiA-tWP0vXBeP7l4uOK-37A_5mLDp9irAh2aPmDVF6QK2TRtqQ-BxTyF9KsBUwJV6WAJW88Dh8gqwCUWC-1hDwNEp2WK2F')",
        }}
      />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-black leading-tight tracking-tight text-white sm:text-5xl md:max-w-3xl">
          Trao tặng món đồ cũ của bạn một cuộc đời mới
        </h1>
        <p className="mt-3 text-base text-slate-200 sm:text-lg">
          Mua, bán hoặc tặng đồ cũ dễ dàng trong cộng đồng của bạn
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={onOpenAuth}
            className="cursor-pointer rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105"
          >
            Xem sản phẩm
          </button>
          <button className="rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20 cursor-pointer">
            Đăng tin ngay
          </button>
        </div>
      </div>
    </section>
  );
}
