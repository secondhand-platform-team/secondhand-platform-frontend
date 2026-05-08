"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, Clock, ArrowLeft, Redo2 } from "lucide-react";

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [redirectIn, setRedirectIn] = useState(5);

  const message = searchParams.get("message") || "Thanh toán không thành công";

  useEffect(() => {
    const timer = setInterval(() => {
      setRedirectIn((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.back();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-orange-50 px-4">
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center ring-1 ring-slate-200">
          {/* Icon */}
          <XCircle size={64} className="mx-auto text-red-600 mb-6" />

          {/* Title */}
          <h1 className="text-3xl font-bold text-red-600 mb-2">
            ❌ Thanh toán thất bại
          </h1>

          {/* Message */}
          <p className="text-slate-600 mb-4">{message}</p>

          {/* Error details */}
          <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-200">
            <div className="flex items-start gap-2">
              <div className="text-red-600 mt-0.5">⚠️</div>
              <div className="text-left">
                <p className="text-xs font-semibold text-red-900 mb-1">
                  Lý do có thể:
                </p>
                <ul className="text-xs text-red-700 space-y-1">
                  <li>• Thẻ bạn không đủ tiền</li>
                  <li>• Thẻ đã hết hạn hoặc bị khóa</li>
                  <li>• Lỗi kết nối mạng</li>
                  <li>• Giao dịch bị từ chối</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Redirect info */}
          <div className="mb-6 p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
            <Clock size={16} className="text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700">
              Tự động chuyển hướng sau{" "}
              <span className="font-bold text-emerald-900">{redirectIn}</span> giây
            </p>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.back()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90"
            >
              <Redo2 size={18} />
              <span>Thử lại</span>
            </button>
            <button
              onClick={() => router.push("/home")}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              <ArrowLeft size={18} />
              <span>Về trang chủ</span>
            </button>
          </div>

          {/* Help text */}
          <div className="mt-6 text-xs text-slate-500 border-t pt-4">
            <p>
              🆘 Nếu vấn đề vẫn tiếp tục, vui lòng{" "}
              <a
                href="mailto:support@secondhand.com"
                className="text-primary hover:underline"
              >
                liên hệ hỗ trợ
              </a>
            </p>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-white rounded-xl shadow-md ring-1 ring-slate-200">
          <p className="text-xs font-semibold text-slate-900 mb-2">💡 Mẹo:</p>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>✓ Kiểm tra tài khoản ngân hàng của bạn</li>
            <li>✓ Thử dùng thẻ khác hoặc phương thức thanh toán khác</li>
            <li>✓ Liên hệ ngân hàng để kiểm tra hạn mức giao dịch</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
