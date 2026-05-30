"use client";

import React, { useState } from "react";
import { Modal, Form, Input, Rate, App, Spin } from "antd";
import { Star } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { createReview } from "@/stores/slices/review.slice";

interface ReviewModalProps {
  open: boolean;
  itemId: string;
  sellerId: string;
  sellerName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({
  open,
  itemId,
  sellerId,
  sellerName = "Người bán",
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { message: messageApi } = App.useApp();
  const { submitting } = useAppSelector((s) => s.review);

  const handleSubmit = async (values: any) => {
    try {
      const result = await dispatch(
        createReview({
          itemId,
          data: {
            rating: values.rating,
            comment: values.comment || "",
          },
        })
      ).unwrap();
      
      messageApi.success("Đánh giá thành công!");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (error: any) {
      const errorMsg = error || "Không thể gửi đánh giá";
      messageApi.error(errorMsg);
    }
  };

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText="Gửi đánh giá"
      cancelText="Hủy"
      width={480}
      centered
      className="premium-modal"
      okButtonProps={{
        className: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl border-none shadow-md shadow-emerald-500/20 px-6 py-2.5 h-auto transition-all"
      }}
      cancelButtonProps={{
        className: "border-slate-200 hover:border-emerald-500 hover:text-emerald-600 font-bold rounded-xl px-6 py-2.5 h-auto transition-all text-slate-500"
      }}
    >
      <Spin spinning={submitting}>
        <div className="-mx-6 -mt-6 mb-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-b border-emerald-100/50 rounded-t-3xl relative overflow-hidden">
          {/* Subtle design elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-200/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-teal-200/20 rounded-full blur-2xl" />
          
          <div className="relative flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center border border-emerald-100 shrink-0">
              <Star className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded-md">Đánh giá người dùng</span>
              <h3 className="text-lg font-black text-slate-800 mt-0.5">
                Trải nghiệm giao dịch với {sellerName}
              </h3>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
          className="px-2"
        >
          {/* Rating Stars */}
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center justify-center gap-2.5 transition hover:border-emerald-200 mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chọn số sao đánh giá</span>
            <Form.Item
              name="rating"
              rules={[{ required: true, message: "Vui lòng chọn số sao để tiếp tục" }]}
              className="mb-0"
            >
              <Rate
                className="text-3xl text-amber-400 flex gap-1.5"
                allowHalf={false}
                tooltips={["Rất tệ", "Không tốt", "Bình thường", "Tốt", "Tuyệt vời"]}
              />
            </Form.Item>
            <span className="text-[11px] font-medium text-slate-400">Hãy đánh giá trung thực để xây dựng cộng đồng Relife tin cậy</span>
          </div>

          {/* Comment */}
          <Form.Item
            label={
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nhận xét chi tiết</span>
            }
            name="comment"
            rules={[
              { max: 500, message: "Bình luận không được vượt quá 500 ký tự" },
            ]}
          >
            <Input.TextArea
              placeholder="Nhập trải nghiệm thực tế của bạn về chất lượng tin đăng, thái độ phục vụ hay quá trình bàn giao..."
              rows={4}
              maxLength={500}
              showCount
              className="rounded-2xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 text-slate-700 placeholder-slate-400 text-sm p-3.5 transition"
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
}
