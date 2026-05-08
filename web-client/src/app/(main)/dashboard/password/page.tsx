"use client";

import { useState } from "react";
import { Button, Input, Form, message } from "antd";

export default function PasswordSettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      message.info("Tính năng đổi mật khẩu đang được nâng cấp");
      setLoading(false);
      form.resetFields();
    }, 1000);
  };

  return (
    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Đổi mật khẩu</h2>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
      >
        <Form.Item 
          label="Mật khẩu hiện tại" 
          name="oldPassword" 
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
        >
          <Input.Password placeholder="Nhập mật khẩu hiện tại" className="rounded-xl" />
        </Form.Item>

        <Form.Item 
          label="Mật khẩu mới" 
          name="newPassword" 
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }, { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }]}
        >
          <Input.Password placeholder="Nhập mật khẩu mới" className="rounded-xl" />
        </Form.Item>

        <Form.Item 
          label="Xác nhận mật khẩu mới" 
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
          <Input.Password placeholder="Xác nhận mật khẩu mới" className="rounded-xl" />
        </Form.Item>

        <Button type="primary" htmlType="submit" loading={loading} className="mt-4 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold px-8 h-12 w-full">
          Cập nhật mật khẩu
        </Button>
      </Form>
    </div>
  );
}
