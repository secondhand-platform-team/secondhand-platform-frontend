import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Input,
  Modal,
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
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import {
  clearSelectedPayment,
  fetchPaymentDetail,
  fetchPayments,
} from "../../stores/slices/payment.slice";
import type { PaymentResponse, PaymentStatus } from "../../types/payment.type";

const { Text } = Typography;
const { RangePicker } = DatePicker;

type PaymentSearchState = {
  id: string;
  status: PaymentStatus | "";
  dateRange: [Dayjs | null, Dayjs | null] | null;
};

const statusOptions: Array<{ label: string; value: PaymentStatus | "" }> = [
  { label: "Tất cả trạng thái", value: "" },
  { label: "Chờ thanh toán", value: "PENDING" },
  { label: "Đã thanh toán", value: "PAID" },
  { label: "Thất bại", value: "FAILED" },
  { label: "Hoàn trả", value: "REFUNDED" },
];

const methodMap: Record<string, { label: string; color: string }> = {
  WALLET: { label: "Ví", color: "blue" },
  VNPAY: { label: "VNPay", color: "cyan" },
};

const statusMap: Record<PaymentStatus, { label: string; color: string }> = {
  PENDING: { label: "Chờ thanh toán", color: "orange" },
  PAID: { label: "Đã thanh toán", color: "success" },
  FAILED: { label: "Thất bại", color: "error" },
  REFUNDED: { label: "Đã hoàn tiền", color: "processing" },
};

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDateTime = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN");
};

const formatDateParam = (value: Dayjs | null) =>
  value ? value.format("YYYY-MM-DDTHH:mm:ss") : undefined;

const PaymentPage = () => {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const {
    payments,
    selectedPayment,
    listLoading,
    detailLoading,
    totalElements,
  } = useAppSelector((state) => state.payment);

  const [modalOpen, setModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 0, size: 10 });
  const [searchState, setSearchState] = useState<PaymentSearchState>({
    id: "",
    status: "",
    dateRange: null,
  });
  const [searchResult, setSearchResult] = useState<PaymentResponse | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);

  const loadPayments = (
    nextPage = pagination.page,
    nextSize = pagination.size,
  ) => {
    const [start, end] = searchState.dateRange || [];

    dispatch(
      fetchPayments({
        page: nextPage,
        size: nextSize,
        status: searchState.status || undefined,
        startDate: formatDateParam(start ?? null),
        endDate: formatDateParam(end ?? null),
      }),
    );
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    pagination.page,
    pagination.size,
    searchState.status,
    searchState.dateRange,
  ]);

  const paymentSummary = useMemo(() => {
    const success = payments.filter(
      (payment) => payment.status === "PAID",
    ).length;
    const pending = payments.filter(
      (payment) => payment.status === "PENDING",
    ).length;
    const refunded = payments.filter(
      (payment) => payment.status === "REFUNDED",
    ).length;
    return { success, pending, refunded };
  }, [payments]);

  const displayedPayments = searchResult ? [searchResult] : payments;

  const handleSearch = async () => {
    const paymentId = searchState.id.trim();

    if (!paymentId) {
      setSearchResult(null);
      setPagination((prev) => ({ ...prev, page: 0 }));
      loadPayments(0, pagination.size);
      return;
    }

    setSearchLoading(true);
    try {
      const result = await dispatch(fetchPaymentDetail(paymentId)).unwrap();
      setSearchResult(result);
      setPagination((prev) => ({ ...prev, page: 0 }));
    } catch (error) {
      setSearchResult(null);
      message.error((error as Error).message || "Không tìm thấy giao dịch");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchState({ id: "", status: "", dateRange: null });
    setSearchResult(null);
    setPagination({ page: 0, size: 10 });
    dispatch(clearSelectedPayment());
    dispatch(fetchPayments({ page: 0, size: 10 }));
  };

  const openDetail = async (paymentId: string) => {
    setModalOpen(true);
    dispatch(clearSelectedPayment());

    try {
      await dispatch(fetchPaymentDetail(paymentId)).unwrap();
    } catch (error) {
      message.error(
        (error as Error).message || "Không thể tải chi tiết thanh toán",
      );
    }
  };

  const closeDetail = () => {
    setModalOpen(false);
    dispatch(clearSelectedPayment());
  };

  const columns = [
    {
      title: "Mã payment",
      dataIndex: "id",
      key: "id",
      width: 180,
      render: (id: string) => <Text code>{id}</Text>,
    },
    {
      title: "Transaction",
      dataIndex: "transactionId",
      key: "transactionId",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      width: 140,
      render: (amount: number) => formatMoney(amount),
    },
    {
      title: "Phương thức",
      dataIndex: "method",
      key: "method",
      width: 120,
      render: (method: string) => {
        const config = methodMap[method];
        return <Tag color={config?.color}>{config?.label || method}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: PaymentStatus) => {
        const config = statusMap[status];
        return <Tag color={config?.color}>{config?.label || status}</Tag>;
      },
    },
    {
      title: "Mã phản hồi",
      dataIndex: "responseCode",
      key: "responseCode",
      width: 120,
      render: (value: string | null) => value || "—",
    },
    {
      title: "Thanh toán lúc",
      dataIndex: "paidAt",
      key: "paidAt",
      width: 170,
      render: (value: string | null) => formatDateTime(value),
    },
    {
      title: "Hành động",
      key: "action",
      width: 110,
      render: (_: unknown, record: PaymentResponse) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openDetail(record.id)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <div>
            <h2>Quản Lý Thanh Toán</h2>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
              Danh sách các giao dịch payment trong hệ thống •
              <span style={{ marginLeft: 6, fontWeight: 600 }}>
                {totalElements} giao dịch
              </span>
              <span style={{ marginLeft: 12, color: "#389e0d" }}>
                {paymentSummary.success} đã thanh toán
              </span>
              <span style={{ marginLeft: 12, color: "#d46b08" }}>
                {paymentSummary.pending} chờ xử lý
              </span>
              <span style={{ marginLeft: 12, color: "#1677ff" }}>
                {paymentSummary.refunded} hoàn tiền
              </span>
            </p>
          </div>
        }
        style={{ marginBottom: "24px" }}
      >
        <Space
          direction="vertical"
          style={{ width: "100%", marginBottom: 16 }}
          size={12}
        >
          <Space
            wrap
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Input.Search
              allowClear
              style={{ maxWidth: 340 }}
              placeholder="Tìm theo mã payment / transaction ID"
              value={searchState.id}
              onChange={(event) =>
                setSearchState((prev) => ({ ...prev, id: event.target.value }))
              }
              onSearch={handleSearch}
              loading={searchLoading}
            />
            <Space wrap>
              <Select
                style={{ width: 200 }}
                value={searchState.status}
                options={statusOptions}
                onChange={(value: PaymentStatus | "") => {
                  setSearchState((prev) => ({ ...prev, status: value }));
                  setPagination((prev) => ({ ...prev, page: 0 }));
                }}
              />
              <RangePicker
                value={searchState.dateRange || undefined}
                showTime
                allowClear
                onChange={(values) => {
                  setSearchState((prev) => ({
                    ...prev,
                    dateRange: values as [Dayjs | null, Dayjs | null] | null,
                  }));
                  setPagination((prev) => ({ ...prev, page: 0 }));
                }}
              />
              <Button onClick={handleSearch} loading={searchLoading}>
                Tìm kiếm
              </Button>
              <Button onClick={handleResetFilters}>Đặt lại</Button>
            </Space>
          </Space>
          <div style={{ fontSize: 12, color: "#8c8c8c" }}>
            Lọc theo trạng thái và khoảng ngày đang đi qua API core; ô tìm kiếm
            là tra cứu chính xác theo mã giao dịch/payment ID.
          </div>
        </Space>

        <Table
          columns={columns}
          dataSource={displayedPayments}
          loading={listLoading || searchLoading}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1200 }}
        />
        <div style={{ marginTop: "16px", textAlign: "right" }}>
          <Pagination
            current={pagination.page + 1}
            pageSize={pagination.size}
            total={searchResult ? 1 : totalElements}
            onChange={(page, pageSize) => {
              setPagination({ page: page - 1, size: pageSize });
              setSearchResult(null);
            }}
            showSizeChanger
            showTotal={(total) => `Tổng ${total} giao dịch`}
            disabled={Boolean(searchResult)}
          />
        </div>
      </Card>

      <Modal
        title="Chi Tiết Thanh Toán"
        open={modalOpen}
        width={820}
        footer={null}
        onCancel={closeDetail}
      >
        {detailLoading || !selectedPayment ? (
          <Spin />
        ) : (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Mã payment" span={2}>
              <Text code>{selectedPayment.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Transaction ID" span={2}>
              {selectedPayment.transactionId}
            </Descriptions.Item>
            <Descriptions.Item label="Số tiền">
              {formatMoney(selectedPayment.amount)}
            </Descriptions.Item>
            <Descriptions.Item label="Phương thức">
              <Tag color={methodMap[selectedPayment.method]?.color}>
                {methodMap[selectedPayment.method]?.label ||
                  selectedPayment.method}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusMap[selectedPayment.status]?.color}>
                {statusMap[selectedPayment.status]?.label ||
                  selectedPayment.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mã phản hồi">
              {selectedPayment.responseCode || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Order ID">
              {selectedPayment.orderId || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Buyer ID">
              {selectedPayment.buyerId || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Thanh toán lúc">
              {formatDateTime(selectedPayment.paidAt)}
            </Descriptions.Item>
            <Descriptions.Item label="Tạo lúc">
              {formatDateTime(selectedPayment.createdAt)}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default PaymentPage;
