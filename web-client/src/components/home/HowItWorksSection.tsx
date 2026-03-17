"use client";

export default function HowItWorksSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
          Hoạt động như thế nào?
        </h2>
        <p className="mt-3 text-sm text-slate-500 sm:text-base">
          Chỉ với 3 bước đơn giản để bắt đầu hành trình trao đổi
        </p>
      </div>
      <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <img
              src="/icon-other/post-story.png"
              className="material-symbols-outlined text-3xl"
              alt="post"
            />
          </div>
          <h3 className="mb-2 text-lg font-bold">1. Đăng tin</h3>
          <p className="text-sm text-slate-500 sm:text-base">
            Chụp ảnh món đồ bạn không dùng nữa và đăng tin kèm mô tả chi tiết
            chỉ trong vài phút.
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <img
              src="/icon-other/chat.png"
              className="material-symbols-outlined text-3xl"
              alt="chat"
            />
          </div>
          <h3 className="mb-2 text-lg font-bold">2. Kết nối</h3>
          <p className="text-sm text-slate-500 sm:text-base">
            Nhận tin nhắn từ những người quan tâm. Trao đổi và thỏa thuận trực
            tiếp một cách an toàn.
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <img
              src="/icon-other/transaction.png"
              className="material-symbols-outlined text-3xl"
              alt="transaction"
            />
          </div>
          <h3 className="mb-2 text-lg font-bold">3. Giao dịch</h3>
          <p className="text-sm text-slate-500 sm:text-base">
            Gặp mặt trực tiếp hoặc gửi hàng để hoàn tất giao dịch. Chúc mừng món
            đồ đã có chủ mới!
          </p>
        </div>
      </div>
    </section>
  );
}
