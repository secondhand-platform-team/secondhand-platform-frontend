"use client";

type HeroSectionProps = {
  onOpenAuth: () => void;
};

export default function HeroSection({ onOpenAuth }: HeroSectionProps) {
  return (
    <section className="relative h-[560px] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url('https://lh3.googleusercontent.com/aida-public/AB6AXuCKciJ7gRuZ4xQOky6eYhBiCMnXyTu0OfXzxSfN3-DnMipW0XuqBGC7eJUr2PAg_weBoO2-t6oA1JXRr-2Bdx2NyNlaJUnxv_qPCtp_B9Ifh7LVo8bow5JXeaOMbOR62FqDJW73uVthyle6J8oiDgjRowDmVW3-7hGSqbDw4jWfx42GQ3UiA-tWP0vXBeP7l4uOK-37A_5mLDp9irAh2aPmDVF6QK2TRtqQ-BxTyF9KsBUwJV6WAJW88Dh8gqwCUWC-1hDwNEp2WK2F')",
        }}
      />
      <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl md:max-w-3xl">
          Trao tặng món đồ cũ của bạn một cuộc đời mới
        </h1>
        <p className="mt-4 text-lg text-slate-200 sm:text-xl">
          Mua, bán hoặc tặng đồ cũ dễ dàng trong cộng đồng của bạn
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            onClick={onOpenAuth}
            className="rounded-lg bg-[#4cae4f] px-8 py-4 text-lg font-bold text-white shadow-lg hover:scale-105 transition-transform cursor-pointer"
          >
            Xem sản phẩm
          </button>
          <button className="rounded-lg bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
            Đăng tin ngay
          </button>
        </div>
      </div>
    </section>
  );
}
