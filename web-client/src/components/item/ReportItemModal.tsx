"use client";

import { Form, Input, Modal, Select, message, Upload } from "antd";
import type { ReportCode, ReportRequest } from "@/types/item.type";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { reportItemThunk } from "@/stores/slices/items.slice";
import { useState } from "react";
import type { UploadFile } from "antd/es/upload/interface";
import { Upload as UploadIcon } from "lucide-react";

interface ReportItemModalProps {
  open: boolean;
  itemId: string;
  onClose: () => void;
}

const reportCodeOptions: { label: string; value: ReportCode }[] = [
  { label: "Gian lận", value: "FRAUD" },
  { label: "Hàng giả", value: "COUNTERFEIT" },
  { label: "Nội dung bị cấm", value: "FORBIDDEN" },
  { label: "Sai danh mục", value: "WRONG_CAT" },
  { label: "Đã bán / Hết hàng", value: "SOLD_OUT" },
];

const MAX_IMAGES = 3;
const MAX_FILE_SIZE_MB = 5;

export default function ReportItemModal({
  open,
  itemId,
  onClose,
}: ReportItemModalProps) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.items);
  const { isAuth } = useAppSelector((state) => state.auth);
  const [submitted, setSubmitted] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ hỗ trợ tệp hình ảnh");
      return Upload.LIST_IGNORE;
    }

    const isValidSize = file.size / 1024 / 1024 < MAX_FILE_SIZE_MB;
    if (!isValidSize) {
      message.error(`Mỗi ảnh phải nhỏ hơn ${MAX_FILE_SIZE_MB}MB`);
      return Upload.LIST_IGNORE;
    }

    if (fileList.length >= MAX_IMAGES) {
      message.error(`Tối đa ${MAX_IMAGES} ảnh cho báo cáo`);
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const handleSubmit = async (values: {
    code: ReportCode;
    reason: string;
    description?: string;
  }) => {
    if (!isAuth) {
      message.error("Vui lòng đăng nhập để báo cáo bài viết");
      onClose();
      return;
    }

    try {
      const reportData: ReportRequest = {
        code: values.code,
        reason: values.reason,
        description: values.description,
        itemId,
      };

      const images = fileList
        .map((file) => file.originFileObj)
        .filter((file): file is NonNullable<typeof file> => file !== undefined);

      await dispatch(reportItemThunk({ data: reportData, images })).unwrap();
      // message.success(
      //   "Báo cáo bài viết thành công. Cảm ơn đóng góp ý kiến của bạn!",
      // );
      form.resetFields();
      setFileList([]);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
      }, 1500);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Không thể báo cáo bài viết";
      if (errorMsg.includes("Unauthorized")) {
        message.error("Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.");
      } else {
        message.error(errorMsg);
      }
    }
  };

  const handleCancel = () => {
    form.resetFields();
    setFileList([]);
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal
      title="Báo cáo bài viết"
      open={open}
      onCancel={handleCancel}
      okText="Gửi báo cáo"
      cancelText="Hủy"
      confirmLoading={loading}
      okButtonProps={{ disabled: !isAuth || loading }}
      onOk={() => form.submit()}
    >
      {!isAuth && (
        <div style={{
          padding: '12px',
          marginBottom: '16px',
          backgroundColor: '#FFF1F0',
          border: '1px solid #FFCCC7',
          borderRadius: '4px',
          color: '#C5222B',
          fontSize: '14px'
        }}>
          Vui lòng đăng nhập để báo cáo bài viết
        </div>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        style={{ marginTop: 20 }}
      >
        <Form.Item
          label="Lý do báo cáo"
          name="code"
          rules={[{ required: true, message: "Vui lòng chọn lý do báo cáo" }]}
        >
          <Select
            placeholder="Chọn lý do báo cáo"
            options={reportCodeOptions}
          />
        </Form.Item>

        <Form.Item
          label="Mô tả ngắn"
          name="reason"
          rules={[
            { required: true, message: "Vui lòng nhập mô tả ngắn" },
            { min: 10, message: "Mô tả phải ít nhất 10 ký tự" },
            { max: 200, message: "Mô tả không quá 200 ký tự" },
          ]}
        >
          <Input
            placeholder="Vui lòng mô tả vấn đề (tối thiểu 10 ký tự)"
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          label="Mô tả chi tiết (tuỳ chọn)"
          name="description"
          rules={[{ max: 500, message: "Mô tả chi tiết không quá 500 ký tự" }]}
        >
          <Input.TextArea
            placeholder="Cung cấp thêm chi tiết để giúp chúng tôi đánh giá báo cáo của bạn"
            rows={4}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item label={`Hình ảnh chứng minh (tối đa ${MAX_IMAGES} ảnh)`}>
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={({ fileList: newFileList }) => setFileList(newFileList)}
            beforeUpload={beforeUpload}
            maxCount={MAX_IMAGES}
            accept="image/*"
          >
            {fileList.length < MAX_IMAGES && (
              <div>
                <UploadIcon size={24} className="text-slate-500" />
                <div
                  style={{ marginTop: 8 }}
                  className="text-sm text-slate-600"
                >
                  Tải ảnh lên
                </div>
              </div>
            )}
          </Upload>
          <p style={{ fontSize: 12, color: "#999", marginTop: 8 }}>
            Các ảnh chứng minh sẽ giúp chúng tôi xử lý báo cáo nhanh hơn. Tối đa{" "}
            {MAX_FILE_SIZE_MB}MB/ảnh.
          </p>
        </Form.Item>
      </Form>
    </Modal>
  );
}
