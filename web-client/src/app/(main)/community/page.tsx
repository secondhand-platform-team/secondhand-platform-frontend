import Link from "next/link";
import { Users, MessageSquare, ArrowRight } from "lucide-react";

export default function CommunityPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center justify-center p-6 bg-primary/10 rounded-full mb-4 text-primary relative">
          <Users className="w-16 h-16" />
          <div className="absolute top-0 right-0 w-6 h-6 bg-emerald-500 rounded-full animate-ping"></div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          Cộng Đồng ReLife
        </h1>
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
          Tính năng Cộng đồng đang được chúng tôi phát triển và sẽ sớm ra mắt trong thời gian tới. 
          Nơi đây sẽ là không gian giao lưu lý tưởng để mọi người chia sẻ kinh nghiệm mua bán đồ cũ, mẹo vặt tái chế và cùng nhau xây dựng lối sống xanh.
        </p>
        
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/products" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg hover:-translate-y-1">
            Khám phá sản phẩm
          </Link>
          <Link href="/home" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:text-primary transition-all">
            Quay lại trang chủ <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
