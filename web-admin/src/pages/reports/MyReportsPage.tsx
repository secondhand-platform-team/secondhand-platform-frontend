import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Descriptions,
  Image,
  Spin,
  Pagination,
  App,
  Empty,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import envConfig from "../../config";
import {
  fetchStaffReports,
  updateReportStatus,
  clearSelectedReport,
} from "../../stores/slices/report.slice";
import type { ReportResponse } from "../../types/report.type";
import { deleteItem } from "../../stores/slices/item.slice";

const reportCodeMap: Record<string, { label: string; color: string }> = {
  FRAUD: { label: "Gian lận", color: "red" },
  COUNTERFEIT: { label: "Hàng giả", color: "volcano" },
  FORBIDDEN: { label: "Hàng cấm", color: "error" },
  WRONG_CAT: { label: "Sai danh mục", color: "orange" },
  SOLD_OUT: { label: "Đã bán", color: "blue" },
};

const reportStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "orange" },
  REVIEWING: { label: "Đang xem xét", color: "processing" },
  RESOLVED: { label: "Đã xử lý", color: "success" },
  REJECTED: { label: "Từ chối", color: "default" },
};

const getItemUrl = (itemId: string) =>
  `${envConfig.WEB_CLIENT_URL.replace(/\/$/, "")}/items/${itemId}`;

interface ReportModalState {
  isOpen: boolean;
  report: ReportResponse | null;
}

const MyReportsPage = () => {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const { staffReports, loading } = useAppSelector((s) => s.report);

  const [modalState, setModalState] = useState<ReportModalState>({
    isOpen: false,
    report: null,
  });
  const [pagination, setPagination] = useState({ page: 0, size: 10 });
  const [form] = Form.useForm();
  const user = useAppSelector((s) => s.auth.user);
  const profile = useAppSelector((s) => s.auth.profile);
  const currentStaffId = user?.userId;

  useEffect(() => {
    if (currentStaffId) {
      dispatch(
        fetchStaffReports({
          staffId: currentStaffId,
          page: pagination.page,
          size: pagination.size,
        }),
      );
    }
  }, [dispatch, pagination, currentStaffId]);

  const openModal = (report: ReportResponse) => {
    setModalState({ isOpen: true, report });
    form.resetFields();
  };

  const closeModal = () => {
    setModalState({ isOpen: false, report: null });
    dispatch(clearSelectedReport());
    form.resetFields();
  };

  const handleUpdateStatus = async (
    reportId: string,
    newStatus: string,
    adminNote: string,
  ) => {
    try {
      // Nếu là RESOLVED thì cố gắng xóa tin đăng trước;
      // nếu xóa không thành công thì không cập nhật trạng thái báo cáo.
      if (newStatus === "RESOLVED" && modalState.report?.itemId) {
        try {
          await dispatch(deleteItem(modalState.report.itemId)).unwrap();
        } catch (itemError: any) {
          message.error(
            (itemError as Error).message ||
              "Không thể xóa tin đăng — trạng thái báo cáo không được cập nhật",
          );
          return;
        }
      }

      // Sau khi xóa thành công (hoặc nếu không phải RESOLVED), cập nhật trạng thái báo cáo
      await dispatch(
        updateReportStatus({ reportId, status: newStatus, adminNote }),
      ).unwrap();

      if (newStatus === "RESOLVED") {
        message.success("Đã xác nhận vi phạm và xóa tin đăng thành công");
      } else {
        message.success("Cập nhật trạng thái báo cáo thành công");
      }

      closeModal();
    } catch (error) {
      message.error((error as Error).message || "Lỗi khi cập nhật trạng thái");
    }
  };

  const getStaffFullName = () => {
    return profile?.fullName || currentStaffId || "Nhân viên";
  };

  const columns = [
    {
      title: "Mã báo cáo",
      dataIndex: "id",
      key: "id",
      width: 120,
      render: (id: string) => <span className="font-mono text-sm">{id}</span>,
    },
    {
      title: "Loại vi phạm",
      dataIndex: "code",
      key: "code",
      width: 120,
      render: (code: string) => {
        const config = reportCodeMap[code];
        return <Tag color={config?.color}>{config?.label || code}</Tag>;
      },
    },
    {
      title: "Lý do",
      dataIndex: "reason",
      key: "reason",
      width: 150,
      ellipsis: true,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const config = reportStatusMap[status];
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
    },
    {
      title: "Ngày báo cáo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      render: (_: unknown, record: ReportResponse) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => openModal(record)}
        >
          Xem
        </Button>
      ),
    },
  ];

  const getStatusStats = () => {
    const stats = {
      total: staffReports.length,
      pending: staffReports.filter((r) => r.status === "PENDING").length,
      reviewing: staffReports.filter((r) => r.status === "REVIEWING").length,
      resolved: staffReports.filter((r) => r.status === "RESOLVED").length,
    };
    return stats;
  };

  const stats = getStatusStats();

  if (!currentStaffId) {
    return <Empty description="Vui lòng đăng nhập" />;
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Thống kê */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {[
          { label: "Tổng báo cáo", value: stats.total, color: "#1890ff" },
          { label: "Chờ xử lý", value: stats.pending, color: "#faad14" },
          { label: "Đang xem xét", value: stats.reviewing, color: "#13c2c2" },
          { label: "Đã hoàn thành", value: stats.resolved, color: "#52c41a" },
        ].map((stat, idx) => (
          <Card key={idx} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
            <div style={{ color: "#666" }}>{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Danh sách báo cáo */}
      <Card title="Báo Cáo Được Gán Cho Tôi">
        {staffReports.length === 0 ? (
          <Empty description="Bạn chưa nhận báo cáo nào" />
        ) : (
          <>
            <Table
              columns={columns}
              dataSource={staffReports}
              loading={loading}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1000 }}
            />
            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <Pagination
                current={pagination.page + 1}
                pageSize={pagination.size}
                total={stats.total}
                onChange={(page) =>
                  setPagination({ ...pagination, page: page - 1 })
                }
                showSizeChanger
                onShowSizeChange={(_, pageSize) =>
                  setPagination({ page: 0, size: pageSize })
                }
              />
            </div>
          </>
        )}
      </Card>

      {/* Modal xem chi tiết báo cáo */}
      <Modal
        title="Chi Tiết Báo Cáo Vi Phạm"
        open={modalState.isOpen}
        width={800}
        footer={null}
        onCancel={closeModal}
      >
        {!modalState.report ? (
          <Spin />
        ) : (
          <div>
            <Descriptions
              column={2}
              bordered
              size="small"
              style={{ marginBottom: "16px" }}
            >
              <Descriptions.Item label="Mã báo cáo" span={2}>
                {modalState.report.id}
              </Descriptions.Item>
              <Descriptions.Item label="Loại vi phạm">
                <Tag color={reportCodeMap[modalState.report.code]?.color}>
                  {reportCodeMap[modalState.report.code]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={reportStatusMap[modalState.report.status]?.color}>
                  {reportStatusMap[modalState.report.status]?.label}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Lý do" span={2}>
                {modalState.report.reason}
              </Descriptions.Item>
              <Descriptions.Item label="Người báo cáo">
                {modalState.report.reporterId}
              </Descriptions.Item>
              <Descriptions.Item label="ID tin đăng">
                <Space direction="vertical" size={0}>
                  <span>{modalState.report.itemId}</span>
                  <a
                    href={getItemUrl(modalState.report.itemId)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mở trang sản phẩm
                  </a>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày báo cáo">
                {new Date(modalState.report.createdAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Người xử lý">
                {getStaffFullName()}
              </Descriptions.Item>
              {modalState.report.adminNote && (
                <Descriptions.Item label="Ghi chú" span={2}>
                  {modalState.report.adminNote}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginBottom: "16px" }}>
              <h4>Mô tả chi tiết</h4>
              <p
                style={{
                  padding: "12px",
                  background: "#f5f5f5",
                  borderRadius: "4px",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                }}
              >
                {modalState.report.description}
              </p>
            </div>

            {/* Hình ảnh báo cáo */}
            {modalState.report.reportImages.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h4>Hình ảnh báo cáo</h4>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {modalState.report.reportImages.map((img) => (
                    <Image
                      key={img.id}
                      src={img.imageUrl}
                      width={100}
                      height={100}
                      style={{
                        objectFit: "cover",
                        borderRadius: "4px",
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Form xử lý báo cáo */}
            {modalState.report.status !== "RESOLVED" &&
              modalState.report.status !== "REJECTED" && (
                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "16px",
                    borderTop: "1px solid #f0f0f0",
                  }}
                >
                  <h4>Xử lý báo cáo</h4>
                  <Form
                    layout="vertical"
                    onFinish={(values) => {
                      handleUpdateStatus(
                        modalState.report!.id,
                        values.status,
                        values.adminNote,
                      );
                    }}
                  >
                    <Form.Item
                      label="Quyết định xử lý"
                      name="status"
                      initialValue={modalState.report.status}
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng chọn quyết định",
                        },
                      ]}
                    >
                      <Select
                        options={[
                          {
                            label: "Đang xem xét",
                            value: "REVIEWING",
                          },
                          {
                            label: "Xác nhận vi phạm - Xóa tin",
                            value: "RESOLVED",
                          },
                          { label: "Từ chối báo cáo", value: "REJECTED" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item
                      label="Ghi chú"
                      name="adminNote"
                      initialValue={modalState.report.adminNote || ""}
                      rules={[
                        {
                          required: true,
                          message: "Vui lòng nhập ghi chú",
                        },
                      ]}
                    >
                      <Input.TextArea
                        rows={3}
                        placeholder="Nhập ghi chú về quyết định xử lý..."
                      />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>
                      Cập nhật trạng thái
                    </Button>
                  </Form>
                </div>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyReportsPage;
