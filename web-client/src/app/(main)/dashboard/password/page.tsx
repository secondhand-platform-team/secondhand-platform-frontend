"use client";

import { useState } from "react";
import { Button, Input, Form, App } from "antd";
import { LockOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { userService } from "@/stores/slices/auth.slice";

export default function PasswordSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { message: messageApi } = App.useApp();

  const onFinish = async (values: any) => {
    setLoading(true);
    setSuccess(false);
    try {
      await userService.changePassword({
        currentPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      messageApi.success("Đổi mật khẩu thành công!");
      setSuccess(true);
      form.resetFields();
    } catch (error: any) {
      messageApi.error(error?.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <LockOutlined className="text-emerald-600 text-lg" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 !mb-0">Đổi mật khẩu</h2>
          <p className="text-slate-400 text-sm mt-0.5">Cập nhật mật khẩu để bảo vệ tài khoản</p>
        </div>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
          <CheckCircleOutlined className="text-emerald-500 text-lg" />
          <span className="text-emerald-700 font-medium text-sm">
            Mật khẩu đã được cập nhật thành công!
          </span>
        </div>
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
        className="mt-6"
      >
        <Form.Item
          label={<span className="font-semibold text-slate-700">Mật khẩu hiện tại</span>}
          name="oldPassword"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="Nhập mật khẩu hiện tại"
            className="!rounded-xl !h-12"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-slate-700">Mật khẩu mới</span>}
          name="newPassword"
          rules={[
            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
            className="!rounded-xl !h-12"
          />
        </Form.Item>

        <Form.Item
          label={<span className="font-semibold text-slate-700">Xác nhận mật khẩu mới</span>}
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="text-slate-400" />}
            placeholder="Xác nhận mật khẩu mới"
            className="!rounded-xl !h-12"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className="mt-2 !bg-gradient-to-r !from-emerald-500 !to-teal-600 !border-none !rounded-xl !font-bold !px-8 !h-12 w-full !shadow-lg !shadow-emerald-200 hover:!shadow-emerald-300 !transition-all"
        >
          Cập nhật mật khẩu
        </Button>
      </Form>
    </div>
  );
}
