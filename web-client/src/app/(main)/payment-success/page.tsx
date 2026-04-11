"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader, ArrowRight } from "lucide-react";
import { useAppDispatch } from "@/stores/hooks";
import { fetchCurrentUser } from "@/stores/slices/auth.slice";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [redirectIn, setRedirectIn] = useState(3);

  const transactionId = searchParams.get("transactionId");

  useEffect(() => {
    const refreshAndRedirect = async () => {
      try {
        // Refresh user data to update freeSellUse
        await dispatch(fetchCurrentUser()).unwrap();
      } catch (error) {
        console.error("Failed to refresh user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    refreshAndRedirect();
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setInterval(() => {
        setRedirectIn((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push("/home");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center ring-1 ring-slate-200">
          {/* Icon */}
          {isLoading ? (
            <Loader
              size={64}
              className="mx-auto text-primary animate-spin mb-6"
            />
          ) : (
            <CheckCircle size={64} className="mx-auto text-green-600 mb-6" />
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            {isLoading ? "Đang xác nhận..." : "✅ Thanh toán thành công"}
          </h1>

          {/* Description */}
          <p className="text-slate-600 mb-2">
            {isLoading
              ? "Chúng tôi đang xác nhận thanh toán của bạn..."
              : "Tin của bạn đã được đăng tải thành công!"}
          </p>

          {/* Transaction ID */}
          {transactionId && !isLoading && (
            <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
              <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
                Mã giao dịch
              </p>
              <p className="text-xs font-mono text-slate-700 break-all">
                {transactionId}
              </p>
            </div>
          )}

          {/* Redirect info */}
          {!isLoading && (
            <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700">
                Bạn sẽ được chuyển hướng về trang chủ trong{" "}
                <span className="font-bold text-blue-900">{redirectIn}</span>{" "}
                giây
              </p>
            </div>
          )}

          {/* Button */}
          <button
            onClick={() => router.push("/home")}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90"
          >
            <span>Về trang chủ</span>
            <ArrowRight size={18} />
          </button>

          {/* Loading indicator for payment verification */}
          {isLoading && (
            <div className="mt-6 flex items-center justify-center gap-2 text-slate-500">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" } as React.CSSProperties}
              />
              <div
                className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" } as React.CSSProperties}
              />
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-slate-600">
          <p>📧 Bạn sẽ nhận được email xác nhận giao dịch sau ít phút </p>
        </div>
      </div>
    </div>
  );
}
