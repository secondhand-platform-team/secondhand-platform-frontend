"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  App,
  Button,
  Empty,
  Form,
  InputNumber,
  Pagination,
  Select,
  Spin,
  Tag,
} from "antd";
import { ArrowUpRight, History, RefreshCcw, Wallet } from "lucide-react";
import { useAppDispatch } from "@/stores/hooks";
import {
  depositWallet,
  fetchMyWallet,
  fetchWalletTransactions,
} from "@/stores/slices/wallet.slice";
import type {
  DepositRequest,
  WalletResponse,
  WalletTransactionResponse,
  WalletTransactionStatus,
  WalletTransactionType,
} from "@/types/wallet.type";

const statusMeta: Record<
  WalletTransactionStatus,
  { label: string; color: string }
> = {
  PENDING: { label: "Đang xử lý", color: "gold" },
  SUCCESS: { label: "Thành công", color: "green" },
  FAILED: { label: "Thất bại", color: "red" },
};

const typeMeta: Record<
  WalletTransactionType,
  { label: string; color: string }
> = {
  DEPOSIT: { label: "Nạp tiền", color: "blue" },
  WITHDRAW: { label: "Rút tiền", color: "orange" },
  PAYMENT: { label: "Thanh toán", color: "purple" },
  REFUND: { label: "Hoàn tiền", color: "cyan" },
};

function formatCurrency(value: number | undefined | null) {
  return `${(value || 0).toLocaleString("vi-VN")}đ`;
}

function extractPaymentUrl(response: unknown): string | null {
  if (!response) return null;
  if (typeof response === "string" && /^https?:\/\//.test(response)) {
    return response;
  }
  if (typeof response !== "object") return null;

  const data = response as Record<string, unknown>;
  for (const key of ["paymentUrl", "redirectUrl", "url"]) {
    const value = data[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  if (data.data && typeof data.data === "object") {
    return extractPaymentUrl(data.data);
  }

  return null;
}

export default function WalletPage() {
  const { message: messageApi } = App.useApp();
  const dispatch = useAppDispatch();
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>(
    [],
  );
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<DepositRequest>();

  const loadData = async (currentPage = page, currentPageSize = pageSize) => {
    try {
      setLoading(true);
      const [walletData, transactionPage] = await Promise.all([
        dispatch(fetchMyWallet()).unwrap(),
        dispatch(
          fetchWalletTransactions({ page: currentPage, size: currentPageSize }),
        ).unwrap(),
      ]);
      setWallet(walletData);
      setTransactions(transactionPage.content || []);
      setTotalElements(transactionPage.totalElements || 0);
      setTotalPages(transactionPage.totalPages || 0);
    } catch (error) {
      messageApi.error(
        error instanceof Error ? error.message : "Không thể tải dữ liệu ví",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = useMemo(
    () => [
      {
        title: "Giao dịch",
        dataIndex: "type",
        key: "type",
        render: (_: unknown, record: WalletTransactionResponse) => (
          <div>
            <div className="font-semibold text-slate-800">
              {typeMeta[record.type].label}
            </div>
            <div className="text-xs text-slate-500">
              {record.referenceId || "Không có mã tham chiếu"}
            </div>
          </div>
        ),
      },
      {
        title: "Số tiền",
        dataIndex: "amount",
        key: "amount",
        render: (value: number) => (
          <span className="font-bold text-slate-900">
            {formatCurrency(value)}
          </span>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (_: unknown, record: WalletTransactionResponse) => (
          <Tag color={statusMeta[record.status].color}>
            {statusMeta[record.status].label}
          </Tag>
        ),
      },
      {
        title: "Ngày tạo",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value: string) => (
          <span className="text-slate-500">
            {dayjs(value).format("HH:mm DD/MM/YYYY")}
          </span>
        ),
      },
    ],
    [],
  );

  const handleDeposit = async (values: DepositRequest) => {
    try {
      setSubmitting(true);
      const response = await dispatch(
        depositWallet({
          amount: Number(values.amount),
          bankCode: values.bankCode?.trim() || undefined,
          language: values.language || "vn",
        }),
      ).unwrap();
      const paymentUrl = extractPaymentUrl(response);
      messageApi.success("Đã tạo yêu cầu nạp tiền");
      if (paymentUrl && typeof window !== "undefined") {
        window.open(paymentUrl, "_blank", "noopener,noreferrer");
      }
      form.resetFields();
      form.setFieldsValue({ language: "vn" });
      await loadData(0, pageSize);
      setPage(0);
    } catch (error) {
      messageApi.error(
        error instanceof Error
          ? error.message
          : "Không thể tạo yêu cầu nạp tiền",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !wallet) {
    return (
      <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center gap-4 min-h-100">
        <Spin size="large" />
        <p className="text-slate-500 font-medium">Đang tải ví của bạn...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 opacity-95" />
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between text-white">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur-sm">
              <Wallet className="h-4 w-4" /> Ví của tôi
            </div>
            <h2 className="mt-4 text-3xl font-black">
              {formatCurrency(wallet?.balance)}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/85">
              Số dư hiện tại và lịch sử giao dịch wallet được đồng bộ trực tiếp
              từ backend.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-white/70">
                Giao dịch
              </div>
              <div className="text-lg font-bold">{totalElements}</div>
            </div>
            <div className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-white/70">
                Trang
              </div>
              <div className="text-lg font-bold">{totalPages || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Nạp tiền</h3>
              <p className="text-sm text-slate-500">
                Tạo giao dịch nạp qua VNPay.
              </p>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleDeposit}
            initialValues={{ language: "vn" }}
          >
            {/* Hiển thị số dư nổi bật ngay phía trên form để người dùng dễ nhìn */}

            <Form.Item
              label="Số tiền"
              name="amount"
              rules={[
                { required: true, message: "Vui lòng nhập số tiền" },
                { type: "number", min: 1, message: "Số tiền phải lớn hơn 0" },
              ]}
            >
              <InputNumber
                size="large"
                style={{ width: "200px" }}
                min={0}
                step={1000}
                className="w-full rounded-xl text-lg py-3"
                placeholder="Nhập số tiền muốn nạp"
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                }
                parser={(value) => Number((value || "").replace(/\./g, ""))}
              />
            </Form.Item>

            <Form.Item label="Mã ngân hàng" name="bankCode">
              <Select
                allowClear
                placeholder="NCB"
                options={[{ label: "NCB (Ngân hàng Quốc Dân)", value: "NCB" }]}
              />
            </Form.Item>

            <Form.Item label="Ngôn ngữ" name="language">
              <Select
                options={[
                  { label: "Tiếng Việt", value: "vn" },
                  { label: "English", value: "en" },
                ]}
              />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 border-0 font-bold"
            >
              Tạo yêu cầu nạp tiền
            </Button>
          </Form>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Lịch sử giao dịch
                </h3>
                <p className="text-sm text-slate-500">
                  Danh sách trang hiện tại của wallet.
                </p>
              </div>
            </div>
            <Button
              icon={<RefreshCcw className="w-4 h-4" />}
              onClick={() => void loadData(page, pageSize)}
            >
              Làm mới
            </Button>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Spin />
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16">
              <Empty
                description={
                  <span className="text-slate-500">Chưa có giao dịch nào</span>
                }
              />
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {columns.map((column) => (
                        <th key={column.key as string} className="px-4 py-3">
                          {column.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="align-top hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-800">
                            {typeMeta[transaction.type].label}
                          </div>
                          <div className="text-xs text-slate-500">
                            {transaction.referenceId ||
                              "Không có mã tham chiếu"}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-900">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="px-4 py-4">
                          <Tag color={statusMeta[transaction.status].color}>
                            {statusMeta[transaction.status].label}
                          </Tag>
                        </td>
                        <td className="px-4 py-4 text-slate-500">
                          {dayjs(transaction.createdAt).format(
                            "HH:mm DD/MM/YYYY",
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  Tổng {totalElements} giao dịch
                </p>
                <Pagination
                  current={page + 1}
                  pageSize={pageSize}
                  total={totalElements}
                  showSizeChanger
                  pageSizeOptions={["5", "10", "20"]}
                  onChange={(nextPage, nextPageSize) => {
                    const nextSize = nextPageSize || pageSize;
                    setPageSize(nextSize);
                    setPage(nextPage - 1);
                    void loadData(nextPage - 1, nextSize);
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
