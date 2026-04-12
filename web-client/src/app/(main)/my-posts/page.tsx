"use client";

import { useEffect, useState, useCallback } from "react";
import { message, Spin, Empty, Button, Space, Tag, Modal } from "antd";
import {
  Edit,
  Trash2,
  Eye,
  Copy,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { itemService } from "@/config/services/item.service";
import type { ItemResponse } from "@/types/item.type";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ItemStatus = "ACTIVE" | "INACTIVE" | "SOLD" | "PENDING";

export default function MyPostsPage() {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const fetchMyItems = useCallback(async () => {
    try {
      setLoading(true);
      const response = await itemService.getMyItems();
      console.log("Response from getMyItems:", response);
      // Handle both response.data and direct array
      const itemsData = Array.isArray(response)
        ? response
        : response.data || [];
      setItems(itemsData);
    } catch (error) {
      console.error("Error fetching items:", error);
      message.error("Không thể tải danh sách tin đăng");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyItems();
  }, [fetchMyItems]);

  const handleDelete = (itemId: string) => {
    Modal.confirm({
      title: "Xóa tin đăng",
      content: "Bạn có chắc chắn muốn xóa tin đăng này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setDeleting(itemId);
          await itemService.deleteItem(itemId);
          message.success("Xóa tin đăng thành công");
          setItems(items.filter((item) => item.id !== itemId));
        } catch (error) {
          console.error("Error deleting item:", error);
          message.error("Không thể xóa tin đăng");
        } finally {
          setDeleting(null);
        }
      },
    });
  };

  const getStatusIcon = (status?: ItemStatus) => {
    switch (status) {
      case "ACTIVE":
        return <CheckCircle size={16} className="text-green-500" />;
      case "PENDING":
        return <Clock size={16} className="text-yellow-500" />;
      case "SOLD":
        return <AlertCircle size={16} className="text-gray-500" />;
      case "INACTIVE":
        return <AlertCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status?: ItemStatus) => {
    switch (status) {
      case "ACTIVE":
        return "Hoạt động";
      case "PENDING":
        return "Chờ duyệt";
      case "SOLD":
        return "Đã bán";
      case "INACTIVE":
        return "Không hoạt động";
      default:
        return "Không xác định";
    }
  };

  const getStatusColor = (status?: ItemStatus) => {
    switch (status) {
      case "ACTIVE":
        return "green";
      case "PENDING":
        return "orange";
      case "SOLD":
        return "default";
      case "INACTIVE":
        return "red";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" tip="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-3 py-8 sm:px-4 lg:px-5">
      <div className="mx-auto max-w-360">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              Quản lý tin đăng
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Bạn có {items.length} tin đăng
            </p>
          </div>
          <Link href="/post-item">
            <Button type="primary" size="large">
              Đăng tin mới
            </Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <Empty
            description="Chưa có tin đăng nào"
            style={{ marginTop: 60 }}
            className="py-12"
          />
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
              >
                {/* Image */}
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      Không có ảnh
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-base font-semibold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                        {item.description}
                      </p>
                    </div>
                    <Tag
                      color={getStatusColor(item.status as ItemStatus)}
                      icon={getStatusIcon(item.status as ItemStatus)}
                      className="flex-shrink-0"
                    >
                      {getStatusLabel(item.status as ItemStatus)}
                    </Tag>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm text-slate-600">
                    <span className="font-semibold text-primary">
                      {new Intl.NumberFormat("vi-VN", {
                        style: "currency",
                        currency: "VND",
                      }).format(item.price || 0)}
                    </span>
                    <span>{item.category}</span>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Space>
                      <Link href={`/post-item/${item.id}`}>
                        <Button
                          type="text"
                          size="small"
                          icon={<Edit size={16} />}
                        >
                          Chỉnh sửa
                        </Button>
                      </Link>
                      <Button
                        type="text"
                        size="small"
                        icon={<Eye size={16} />}
                        onClick={() => router.push(`/post-item/${item.id}`)}
                      >
                        Xem chi tiết
                      </Button>
                      <Button
                        type="text"
                        size="small"
                        icon={<Copy size={16} />}
                        onClick={() => {
                          navigator.clipboard.writeText(
                            window.location.origin + `/post-item/${item.id}`,
                          );
                          message.success("Đã sao chép liên kết");
                        }}
                      >
                        Sao chép liên kết
                      </Button>
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<Trash2 size={16} />}
                        loading={deleting === item.id}
                        onClick={() => handleDelete(item.id)}
                      >
                        Xóa
                      </Button>
                    </Space>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
