"use client";

import { Card, Form, Input, Button, message, Divider } from "antd";
import { Lock, EyeOff, Eye } from "lucide-react";
import { useState } from "react";

export default function ChangePasswordPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const onFinish = async (values: Record<string, unknown>) => {
    try {
      setLoading(true);
      // TODO: Implement API call to change password
      message.success("Đổi mật khẩu thành công!");
      form.resetFields();
    } catch (error) {
      message.error("Đổi mật khẩu thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-8 sm:px-4 lg:px-5">
      <div className="mx-auto max-w-360">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Lock size={24} className="text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Đổi mật khẩu
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Cập nhật mật khẩu để bảo mật tài khoản
              </p>
            </div>
          </div>
        </div>

        <Card>
          <Form layout="vertical" form={form} onFinish={onFinish}>
            <Form.Item
              label="Mật khẩu hiện tại"
              name="currentPassword"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập mật khẩu hiện tại",
                },
              ]}
            >
              <div className="relative">
                <Input
                  placeholder="Nhập mật khẩu hiện tại"
                  type={showPasswords.current ? "text" : "password"}
                  size="large"
                  prefix={<Lock size={18} className="text-slate-400" />}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      current: !showPasswords.current,
                    })
                  }
                >
                  {showPasswords.current ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>
            </Form.Item>

            <Divider className="my-6" />

            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                {
                  min: 8,
                  message: "Mật khẩu phải có ít nhất 8 ký tự",
                },
              ]}
            >
              <div className="relative">
                <Input
                  placeholder="Nhập mật khẩu mới"
                  type={showPasswords.new ? "text" : "password"}
                  size="large"
                  prefix={<Lock size={18} className="text-slate-400" />}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      new: !showPasswords.new,
                    })
                  }
                >
                  {showPasswords.new ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp"),
                    );
                  },
                }),
              ]}
            >
              <div className="relative">
                <Input
                  placeholder="Xác nhận mật khẩu"
                  type={showPasswords.confirm ? "text" : "password"}
                  size="large"
                  prefix={<Lock size={18} className="text-slate-400" />}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() =>
                    setShowPasswords({
                      ...showPasswords,
                      confirm: !showPasswords.confirm,
                    })
                  }
                >
                  {showPasswords.confirm ? (
                    <Eye size={18} />
                  ) : (
                    <EyeOff size={18} />
                  )}
                </button>
              </div>
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              danger
            >
              Đổi mật khẩu
            </Button>
          </Form>

          <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              💡 <strong>Mẹo bảo mật:</strong> Sử dụng mật khẩu mạnh gồm chữ
              hoa, chữ thường, số và ký tự đặc biệt để bảo vệ tài khoản của bạn.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
