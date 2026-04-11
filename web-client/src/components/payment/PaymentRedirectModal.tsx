"use client";

import { CreditCard, X, ExternalLink } from "lucide-react";

interface PaymentRedirectModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentUrl: string;
  transactionId: string;
  itemTitle: string;
}

export default function PaymentRedirectModal({
  isOpen,
  onClose,
  paymentUrl,
  transactionId,
  itemTitle,
}: PaymentRedirectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        {/* Header */}
        <div className="relative border-b border-slate-100 bg-linear-to-b from-slate-50 to-white px-6 py-6">
          <button
            onClick={onClose}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>

          <h1 className="text-center text-2xl font-bold text-slate-900">
            🔐 Thanh toán VNPay
          </h1>
        </div>

        {/* Content */}
        <div className="px-6 pb-8 pt-6 space-y-6">
          {/* Info box */}
          <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200">
            <p className="text-sm text-blue-700 font-medium mb-2">
              Cần thanh toán để đăng tin
            </p>
            <p className="text-xs text-blue-600">
              Bạn hết số lượt đăng tin miễn phí. Vui lòng thanh toán để tiếp tục
              đăng tin sản phẩm này.
            </p>
          </div>

          {/* Item info */}
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
              Sản phẩm
            </p>
            <p className="text-sm font-medium text-slate-900 truncate">
              {itemTitle}
            </p>
          </div>

          {/* Transaction ID */}
          <div>
            <p className="text-xs text-slate-500 uppercase font-semibold mb-1">
              Mã giao dịch
            </p>
            <p className="text-xs font-mono text-slate-700 bg-slate-50 p-2 rounded-lg break-all">
              {transactionId}
            </p>
          </div>

          {/* Info message */}
          <div className="rounded-xl bg-amber-50 p-3 border border-amber-200">
            <p className="text-xs text-amber-700">
              ⚠️ Bạn sẽ được chuyển đến trang thanh toán VNPay. Sau khi thanh
              toán thành công, tin của bạn sẽ được đăng tải ngay lập tức.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-primary/90 flex items-center justify-center gap-2"
            >
              <CreditCard size={18} />
              <span>Thanh toán</span>
              <ExternalLink size={16} />
            </a>
          </div>

          {/* Footer note */}
          <p className="text-xs text-slate-500 text-center">
            Bạn có thể quay lại đây để xem nó bất kỳ lúc nào
          </p>
        </div>
      </div>
    </div>
  );
}
