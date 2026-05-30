import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  DatePicker,
  Input,
  Pagination,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { useAppDispatch, useAppSelector } from "../stores/hooks";
import { fetchWalletTransactions } from "../stores/slices/wallet.slice";
import type { WalletTransaction } from "../stores/slices/wallet.slice";

const { Text } = Typography;
const { RangePicker } = DatePicker;

type WalletFilterState = {
  type: string;
  status: string;
  dateRange: [Dayjs | null, Dayjs | null] | null;
};

const walletTypeOptions = [
  { label: "Tất cả loại", value: "" },
  { label: "Nạp tiền (DEPOSIT)", value: "DEPOSIT" },
  { label: "Rút tiền (WITHDRAW)", value: "WITHDRAW" },
  { label: "Thanh toán (PAYMENT)", value: "PAYMENT" },
  { label: "Hoàn tiền (REFUND)", value: "REFUND" },
  { label: "Ký quỹ giữ (ESCROW_HOLD)", value: "ESCROW_HOLD" },
  { label: "Ký quỹ giải phóng (ESCROW_RELEASE)", value: "ESCROW_RELEASE" },
  { label: "Ký quỹ hoàn tiền (ESCROW_REFUND)", value: "ESCROW_REFUND" },
];

const statusOptions = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Đang chờ (PENDING)", value: "PENDING" },
  { label: "Thành công (SUCCESS)", value: "SUCCESS" },
  { label: "Thất bại (FAILED)", value: "FAILED" },
];

const walletTypeMap: Record<string, { label: string; color: string }> = {
  DEPOSIT: { label: "Nạp tiền", color: "success" },
  WITHDRAW: { label: "Rút tiền", color: "orange" },
  PAYMENT: { label: "Thanh toán", color: "blue" },
  REFUND: { label: "Hoàn tiền", color: "cyan" },
  ESCROW_HOLD: { label: "Ký quỹ giữ", color: "processing" },
  ESCROW_RELEASE: { label: "Ký quỹ giải phóng", color: "success" },
  ESCROW_REFUND: { label: "Ký quỹ hoàn tiền", color: "error" },
};

const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Đang chờ", color: "orange" },
  SUCCESS: { label: "Thành công", color: "success" },
  FAILED: { label: "Thất bại", color: "error" },
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDateTime = (value: string) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

const formatDateParam = (value: Dayjs | null) =>
  value ? value.format("YYYY-MM-DDTHH:mm:ss") : undefined;

export default function WalletTransactionsTable() {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const { transactions, listLoading, totalElements, totalPages } = useAppSelector(
    (s) => s.wallet
  );

  const [filterState, setFilterState] = useState<WalletFilterState>({
    type: "",
    status: "",
    dateRange: null,
  });

  const [pagination, setPagination] = useState({ page: 0, size: 10 });

  const loadTransactions = (page: number = 0, size: number = 10) => {
    const [start, end] = filterState.dateRange || [null, null];
    dispatch(
      fetchWalletTransactions({
        page,
        size,
        type: filterState.type || undefined,
        status: filterState.status || undefined,
        startDate: formatDateParam(start),
        endDate: formatDateParam(end),
      })
    );
  };

  useEffect(() => {
    loadTransactions(pagination.page, pagination.size);
  }, [pagination.page, pagination.size, filterState.type, filterState.status, filterState.dateRange]);

  const handleFilterChange = (type: "type" | "status", value: string) => {
    setFilterState((prev) => ({ ...prev, [type]: value }));
    setPagination({ page: 0, size: 10 });
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setFilterState((prev) => ({ ...prev, dateRange: dates }));
    setPagination({ page: 0, size: 10 });
  };

  const handleResetFilters = () => {
    setFilterState({ type: "", status: "", dateRange: null });
    setPagination({ page: 0, size: 10 });
    dispatch(fetchWalletTransactions({ page: 0, size: 10 }));
  };

  const summary = useMemo(() => {
    const success = transactions.filter((t) => t.status === "SUCCESS").length;
    const pending = transactions.filter((t) => t.status === "PENDING").length;
    const failed = transactions.filter((t) => t.status === "FAILED").length;
    return { success, pending, failed };
  }, [transactions]);

  const columns = [
    {
      title: "Mã giao dịch",
      dataIndex: "id",
      key: "id",
      width: 140,
      render: (id: string) => <Text code>{id ? `${id.substring(0, 12)}...` : "—"}</Text>,
    },
    {
      title: "Người dùng",
      dataIndex: "userId",
      key: "userId",
      width: 140,
      render: (userId: string) => <Text code>{userId ? `${userId.substring(0, 12)}...` : "—"}</Text>,
    },
    {
      title: "Loại giao dịch",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type: string) => {
        const config = walletTypeMap[type] || { label: type, color: "default" };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (amount: number) => formatMoney(amount),
      align: "right" as const,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: string) => {
        const config = statusMap[status] || { label: status, color: "default" };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
  ];

  return (
    <div>
      <Card
        title={
          <div>
            <h3 style={{ margin: 0 }}>Giao Dịch Ví Hệ Thống</h3>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "8px", marginBottom: 0 }}>
              Danh sách toàn bộ giao dịch ví (nạp, rút, thanh toán, ký quỹ) •
              <span style={{ marginLeft: 6, fontWeight: 600 }}>
                {totalElements} giao dịch
              </span>
              <span style={{ marginLeft: 12, color: "#389e0d" }}>
                {summary.success} thành công
              </span>
              <span style={{ marginLeft: 12, color: "#d46b08" }}>
                {summary.pending} chờ xử lý
              </span>
              <span style={{ marginLeft: 12, color: "#cf1322" }}>
                {summary.failed} thất bại
              </span>
            </p>
          </div>
        }
        style={{ marginBottom: "16px" }}
        styles={{ body: { paddingBottom: 0 } }}
      >
        <div className="flex flex-col gap-3" style={{ width: "100%", marginBottom: 16 }}>
          <Space wrap style={{ width: "100%" }}>
            <Select
              style={{ width: 200 }}
              value={filterState.type}
              onChange={(value) => handleFilterChange("type", value)}
              options={walletTypeOptions}
              placeholder="Chọn loại giao dịch"
            />
            <Select
              style={{ width: 180 }}
              value={filterState.status}
              onChange={(value) => handleFilterChange("status", value)}
              options={statusOptions}
              placeholder="Chọn trạng thái"
            />
            <RangePicker
              value={filterState.dateRange}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
              style={{ width: 300 }}
            />
            <Button onClick={() => loadTransactions(pagination.page, pagination.size)}>
              Tìm kiếm
            </Button>
            <Button onClick={handleResetFilters}>Đặt lại</Button>
          </Space>
        </div>
      </Card>

      <Spin spinning={listLoading}>
        <Table
          columns={columns}
          dataSource={transactions.map((t) => ({ ...t, key: t.id }))}
          pagination={false}
          size="small"
          style={{ marginBottom: 16 }}
        />
      </Spin>

      {totalPages > 1 && (
        <Pagination
          current={pagination.page + 1}
          pageSize={pagination.size}
          total={totalElements}
          onChange={(page, size) => {
            const newPage = page - 1;
            setPagination({ page: newPage, size });
            loadTransactions(newPage, size);
          }}
          style={{ textAlign: "right", marginTop: 16 }}
        />
      )}
    </div>
  );
}
