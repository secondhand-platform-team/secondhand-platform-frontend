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
  Space,
  Spin,
  Pagination,
  App,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "../../stores/hooks";
import {
  fetchPendingReports,
  assignReportToStaff,
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

interface ReportModalState {
  isOpen: boolean;
  report: ReportResponse | null;
  isAssigning: boolean;
}

const ReportPage = () => {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const { reports, loading, pendingCount } = useAppSelector((s) => s.report);

  const [modalState, setModalState] = useState<ReportModalState>({
    isOpen: false,
    report: null,
    isAssigning: false,
  });
  const [pagination, setPagination] = useState({ page: 0, size: 10 });
  const [form] = Form.useForm();
  const user = useAppSelector((s) => s.auth.user);
  const profile = useAppSelector((s) => s.auth.profile);
  const currentStaffId = user?.userId;

  const getStaffName = (staffId: string | null) => {
    if (!staffId) return "Chưa gán";
    if (staffId === currentStaffId && profile?.fullName) {
      return profile.fullName;
    }
    return staffId;
  };

  useEffect(() => {
    dispatch(
      fetchPendingReports({ page: pagination.page, size: pagination.size }),
    );
  }, [dispatch, pagination]);

  const openModal = (report: ReportResponse) => {
    setModalState({ isOpen: true, report, isAssigning: false });
    form.resetFields();
  };

  const closeModal = () => {
    setModalState({ isOpen: false, report: null, isAssigning: false });
    dispatch(clearSelectedReport());
    form.resetFields();
  };

  const handleAssignReport = async () => {
    if (!modalState.report) return;

    setModalState((prev) => ({ ...prev, isAssigning: true }));
    try {
      await dispatch(
        assignReportToStaff({
          reportId: modalState.report.id,
          staffId: currentStaffId || "",
        }),
      ).unwrap();

      message.success("Đã nhận báo cáo để xử lý");
      closeModal();
    } catch (error) {
      message.error((error as Error).message || "Lỗi khi nhận báo cáo");
    } finally {
      setModalState((prev) => ({ ...prev, isAssigning: false }));
    }
  };

  const handleUpdateStatus = async (
    reportId: string,
    newStatus: string,
    adminNote: string,
  ) => {
    try {
      // Nếu là RESOLVED thì trước tiên cố gắng xóa tin đăng;
      // nếu xóa không thành công thì không cập nhật trạng thái báo cáo.
      if (newStatus === "RESOLVED" && modalState.report?.itemId) {
        try {
          await dispatch(deleteItem(modalState.report.itemId)).unwrap();
        } catch (itemError: any) {
          message.error(
            (itemError as Error).message ||
              "Không thể xóa tin đăng — trạng thái báo cáo không được cập nhật",
          );
          return; // dừng, không cập nhật report
        }
      }

      // Sau khi xóa (hoặc trường hợp không phải RESOLVED), cập nhật trạng thái báo cáo
      await dispatch(
        updateReportStatus({
          reportId,
          status: newStatus,
          adminNote,
        }),
      ).unwrap();

      if (newStatus === "RESOLVED") {
        message.success("Đã xác nhận vi phạm và xóa tin đăng thành công");
      } else {
        message.success("Cập nhật trạng thái thành công");
      }

      closeModal();
    } catch (error: any) {
      message.error((error as Error).message || "Lỗi khi cập nhật trạng thái");
    }
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
      title: "Người xử lý",
      dataIndex: "assignedStaffId",
      key: "assignedStaffId",
      width: 120,
      render: (staffId: string | null) => {
        const staffName = getStaffName(staffId);
        if (!staffId) return <span className="text-gray-400">Chưa gán</span>;
        return <span>{staffName}</span>;
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
      width: 120,
      render: (_: unknown, record: ReportResponse) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => openModal(record)}
          >
            Xem
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <div>
            <h2>Báo Cáo Vi Phạm</h2>
            <p style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
              Quản lý và xử lý báo cáo vi phạm từ người dùng •
              <span style={{ color: "#ff4d4f", fontWeight: "bold" }}>
                {" "}
                {pendingCount} báo cáo chờ xử lý
              </span>
            </p>
          </div>
        }
        style={{ marginBottom: "24px" }}
      >
        <Table
          columns={columns}
          dataSource={reports}
          loading={loading}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1200 }}
        />
        <div style={{ marginTop: "16px", textAlign: "right" }}>
          <Pagination
            current={pagination.page + 1}
            pageSize={pagination.size}
            total={pendingCount}
            onChange={(page) =>
              setPagination({ ...pagination, page: page - 1 })
            }
            showSizeChanger
            onShowSizeChange={(_, pageSize) =>
              setPagination({ page: 0, size: pageSize })
            }
          />
        </div>
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
                {modalState.report.itemId}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày báo cáo">
                {new Date(modalState.report.createdAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
              <Descriptions.Item label="Người xử lý">
                {getStaffName(modalState.report.assignedStaffId)}
              </Descriptions.Item>
              {modalState.report.adminNote && (
                <Descriptions.Item label="Ghi chú Admin" span={2}>
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
                }}
              >
                {modalState.report.description}
              </p>
            </div>

            {/* Hình ảnh báo cáo */}
            {modalState.report.reportImages.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <h4>Hình ảnh báo cáo</h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {modalState.report.reportImages.map((img) => (
                    <Image
                      key={img.id}
                      src={img.imageUrl}
                      width={100}
                      height={100}
                      style={{ objectFit: "cover", borderRadius: "4px" }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Form xử lý báo cáo */}
            {modalState.report.status === "PENDING" && (
              <div
                style={{
                  marginTop: "16px",
                  paddingTop: "16px",
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                <h4>Xử lý báo cáo</h4>
                <Space
                  direction="vertical"
                  style={{ width: "100%", gap: "12px" }}
                >
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={modalState.isAssigning}
                    disabled={
                      !!modalState.report.assignedStaffId &&
                      modalState.report.assignedStaffId !== currentStaffId
                    }
                    onClick={handleAssignReport}
                  >
                    {modalState.report.assignedStaffId === currentStaffId
                      ? "✓ Bạn đang xử lý báo cáo này"
                      : modalState.report.assignedStaffId
                        ? "Đã gán cho nhân viên khác"
                        : "Nhận báo cáo để xử lý"}
                  </Button>

                  {modalState.report.assignedStaffId === currentStaffId && (
                    <Form
                      layout="vertical"
                      onFinish={(values) => {
                        handleUpdateStatus(
                          modalState.report!.id,
                          values.status,
                          values.adminNote,
                        );
                        closeModal();
                      }}
                    >
                      <Form.Item
                        label="Quyết định xử lý"
                        name="status"
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
                  )}
                </Space>
              </div>
            )}

            {/* Trạng thái không phải PENDING */}
            {modalState.report.status !== "PENDING" && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  background: "#f0f5ff",
                  borderRadius: "4px",
                }}
              >
                <p>
                  <strong>Quyết định:</strong>{" "}
                  {reportStatusMap[modalState.report.status]?.label}
                </p>
                <p>
                  <strong>Ghi chú:</strong>{" "}
                  {modalState.report.adminNote || "Không có"}
                </p>
                {modalState.report.resolvedAt && (
                  <p>
                    <strong>Thời gian xử lý:</strong>{" "}
                    {new Date(modalState.report.resolvedAt).toLocaleString(
                      "vi-VN",
                    )}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ReportPage;
