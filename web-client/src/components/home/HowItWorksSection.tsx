"use client";

export default function HowItWorksSection() {
  return (
    <section className="py-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
          Hoạt động như thế nào?
        </h2>
        <p className="mt-4 text-slate-500">
          Chỉ với 3 bước đơn giản để bắt đầu hành trình trao đổi
        </p>
      </div>
      <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#4cae4f]/10 text-[#4cae4f]">
            <img
              src="/icon-other/post-story.png"
              className="material-symbols-outlined text-4xl"
              alt="post"
            />
          </div>
          <h3 className="text-xl font-bold mb-3">1. Đăng tin</h3>
          <p className="text-slate-500">
            Chụp ảnh món đồ bạn không dùng nữa và đăng tin kèm mô tả chi tiết
            chỉ trong vài phút.
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#4cae4f]/10 text-[#4cae4f]">
            <img
              src="/icon-other/chat.png"
              className="material-symbols-outlined text-4xl"
              alt="chat"
            />
          </div>
          <h3 className="text-xl font-bold mb-3">2. Kết nối</h3>
          <p className="text-slate-500">
            Nhận tin nhắn từ những người quan tâm. Trao đổi và thỏa thuận trực
            tiếp một cách an toàn.
          </p>
        </div>
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#4cae4f]/10 text-[#4cae4f]">
            <img
              src="/icon-other/transaction.png"
              className="material-symbols-outlined text-4xl"
              alt="transaction"
            />
          </div>
          <h3 className="text-xl font-bold mb-3">3. Giao dịch</h3>
          <p className="text-slate-500">
            Gặp mặt trực tiếp hoặc gửi hàng để hoàn tất giao dịch. Chúc mừng món
            đồ đã có chủ mới!
          </p>
        </div>
      </div>
    </section>
  );
}
