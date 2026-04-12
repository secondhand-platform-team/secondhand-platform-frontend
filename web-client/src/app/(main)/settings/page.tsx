"use client";

import { Card, Form, Input, Button, message, Upload } from "antd";
import { Camera } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      setLoading(true);
      // TODO: Implement API call to update user settings
      message.success("Cập nhật cài đặt thành công!");
    } catch (error) {
      message.error("Cập nhật cài đặt thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-8 sm:px-4 lg:px-5">
      <div className="mx-auto max-w-360">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Cài đặt tài khoản
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Quản lý thông tin cá nhân và cài đặt tài khoản
          </p>
        </div>

        <Card className="mb-6">
          <h2 className="mb-6 text-lg font-semibold">Ảnh đại diện</h2>
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Camera size={32} className="text-primary" />
            </div>
            <Upload
              maxCount={1}
              beforeUpload={() => {
                message.info("Tính năng sẽ được cập nhật!");
                return false;
              }}
            >
              <Button>Thay đổi ảnh đại diện</Button>
            </Upload>
          </div>
        </Card>

        <Card>
          <h2 className="mb-6 text-lg font-semibold">Thông tin cá nhân</h2>
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item
              label="Họ và tên"
              name="fullName"
              rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
            >
              <Input placeholder="Nhập họ và tên" size="large" />
            </Form.Item>

            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input placeholder="Nhập email" size="large" disabled />
            </Form.Item>

            <Form.Item
              label="Số điện thoại"
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
              ]}
            >
              <Input placeholder="Nhập số điện thoại" size="large" />
            </Form.Item>

            <Form.Item label="Địa chỉ" name="address">
              <Input placeholder="Nhập địa chỉ" size="large" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
            >
              Lưu cài đặt
            </Button>
          </Form>
        </Card>
      </div>
    </div>
  );
}
