"use client";

import { Button, Card, Empty, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { deletePost, fetchMyPosts, updatePostStatus } from "@/stores/slices/item.slice";
import type { ItemResponseType, ItemStatus } from "@/types/item/item.type";

const statusColor: Record<string, string> = {
  AVAILABLE: "green",
  RESERVED: "orange",
  SOLD: "blue",
  HIDDEN: "default",
  ACTIVE: "cyan",
};

export default function MyPostsPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { myPosts, loading } = useAppSelector((state) => state.item);

  useEffect(() => {
    dispatch(fetchMyPosts());
  }, [dispatch]);

  const onStatusChange = async (itemId: string, status: ItemStatus) => {
    try {
      await dispatch(updatePostStatus({ itemId, status })).unwrap();
      message.success("Đã cập nhật trạng thái tin");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Cập nhật thất bại");
    }
  };

  const onDelete = async (itemId: string) => {
    try {
      await dispatch(deletePost(itemId)).unwrap();
      message.success("Đã xóa tin đăng");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Xóa tin thất bại");
    }
  };

  const columns: ColumnsType<ItemResponseType> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text type="secondary">{record.categoryId}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (value: number) => `${value?.toLocaleString("vi-VN")} VND`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <Tag color={statusColor[status] || "default"}>{status}</Tag>,
    },
    {
      title: "Cập nhật trạng thái",
      key: "statusAction",
      render: (_, record) => (
        <Select
          value={(record.status as ItemStatus) || "AVAILABLE"}
          style={{ minWidth: 140 }}
          onChange={(value) => onStatusChange(record.itemId, value)}
          options={[
            { label: "Hiển thị", value: "AVAILABLE" },
            { label: "Đã bán", value: "SOLD" },
            { label: "Đã giữ", value: "RESERVED" },
            { label: "Ẩn tin", value: "HIDDEN" },
          ]}
        />
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Popconfirm
          title="Xóa tin đăng này?"
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => onDelete(record.itemId)}
        >
          <Button danger>Xóa</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={2} className="!mb-0">Quản lý tin đăng</Typography.Title>
        <Button type="primary" onClick={() => router.push("/post-new")}>Đăng tin mới</Button>
      </div>

      <Card>
        {myPosts.length === 0 && !loading ? (
          <Empty description="Bạn chưa có tin đăng nào" />
        ) : (
          <Table
            rowKey="itemId"
            loading={loading}
            dataSource={myPosts}
            columns={columns}
            pagination={{ pageSize: 8 }}
          />
        )}
      </Card>
    </div>
  );
}
