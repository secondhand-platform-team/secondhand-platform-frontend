"use client";
import type { ItemWithImages } from "@/types/item.type";

import {
  Card,
  Button,
  Tag,
  Dropdown,
  Image,
  Tooltip,
  message,
  Empty,
  Spin,
} from "antd";
import { Edit, Trash2, MoreVertical, Clock, Eye } from "lucide-react";

import { useState } from "react";
import { useAppDispatch } from "@/stores/hooks";
import {
  deleteItemThunk,
  updateItemStatusThunk,
} from "@/stores/slices/items.slice";
import type { MenuProps } from "antd";

interface PostsGridProps {
  items: ItemWithImages[];
  loading: boolean;
  onEdit: (item: ItemWithImages) => void;
  onViewDetail: (item: ItemWithImages) => void;
  onRefresh: () => void;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: "green", label: "Đang bán" },
  DRAFT: { color: "green", label: "Nháp" },
  RESERVED: { color: "orange", label: "Đã đặt cọc" },
  SOLD: { color: "red", label: "Đã bán" },
  HIDDEN: { color: "default", label: "Ẩn" },
  EXPIRED: { color: "error", label: "Hết hạn" },
};

const transactionTypeConfig: Record<string, { label: string; color: string }> =
{
  SELL: { label: "Bán", color: "green" },
  GIVE_AWAY: { label: "Cho tặng", color: "green" },
};

export default function PostsGrid({
  items,
  loading,
  onEdit,
  onViewDetail,
  onRefresh,
}: PostsGridProps) {
  const dispatch = useAppDispatch();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (item: ItemWithImages) => {
    setLoadingId(item.itemId);
    try {
      await dispatch(deleteItemThunk(item.itemId)).unwrap();
      message.success("Xóa tin đăng thành công!");
      onRefresh();
    } catch {
      message.error("Xóa tin đăng thất bại!");
    } finally {
      setLoadingId(null);
    }
  };

  const handleStatusChange = async (
    item: ItemWithImages,
    newStatus: string,
  ) => {
    setLoadingId(item.itemId);
    try {
      await dispatch(
        updateItemStatusThunk({ itemId: item.itemId, status: newStatus }),
      ).unwrap();
      message.success("Cập nhật trạng thái thành công!");
      onRefresh();
    } catch {
      message.error("Cập nhật trạng thái thất bại!");
    } finally {
      setLoadingId(null);
    }
  };

  const getMenuItems = (record: ItemWithImages): MenuProps["items"] => {
    const items: MenuProps["items"] = [
      {
        key: "view",
        label: "Xem chi tiết",
        icon: <Eye size={16} />,
        onClick: () => onViewDetail(record),
      },
      {
        key: "edit",
        label: "Chỉnh sửa",
        icon: <Edit size={16} />,
        onClick: () => onEdit(record),
      },
      {
        type: "divider",
      },
    ];

    const statusOptions = ["ACTIVE", "RESERVED", "SOLD", "HIDDEN", "DRAFT"];
    items.push({
      key: "status-submenu",
      label: "Đổi trạng thái",
      icon: <Clock size={16} />,
      children: statusOptions
        .filter((s) => s !== record.status)
        .map((status) => ({
          key: `status-${status}`,
          label: statusConfig[status]?.label || status,
          onClick: () => handleStatusChange(record, status),
        })),
    });

    items.push({
      type: "divider",
    });

    items.push({
      key: "delete",
      label: "Xóa",
      danger: true,
      icon: <Trash2 size={16} />,
      onClick: () => handleDelete(record),
    });

    return items;
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Spin size="large" />
        <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Empty description="Chưa có tin đăng nào" style={{ marginTop: "50px" }} />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const primaryImage = item.images?.[0]?.imageUrl;
        const isLoading = loadingId === item.itemId;

        return (
          <Card
            key={item.itemId}
            hoverable
            className="overflow-hidden transition-all hover:shadow-lg"
            cover={
              <div className="relative bg-gray-200 h-52 overflow-hidden group">
                {primaryImage ? (
                  <Image
                    src={primaryImage}
                    alt={item.title}
                    width="100%"
                    height={200}
                    style={{
                      objectFit: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                    preview
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500">
                    Không có ảnh
                  </div>
                )}

                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="primary"
                    icon={<Eye size={18} />}
                    onClick={() => onViewDetail(item)}
                  >
                    Xem
                  </Button>
                  <Button
                    icon={<Edit size={18} />}
                    onClick={() => onEdit(item)}
                  >
                    Sửa
                  </Button>
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <Tag color={statusConfig[item.status || "DRAFT"].color}>
                    {statusConfig[item.status || "DRAFT"].label}
                  </Tag>
                </div>

                {/* Image Count */}
                {item.images && item.images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {item.images.length} ảnh
                  </div>
                )}
              </div>
            }
          >
            {/* Title */}
            <Tooltip title={item.title} overlayInnerStyle={{ maxWidth: 300 }}>
              <h3 className="font-semibold text-base mb-2 line-clamp-2 text-gray-900">
                {item.title}
              </h3>
            </Tooltip>

            {/* Price & Type */}
            <div className="flex items-center justify-between mb-3">
              <div>
                {item.transactionType === "GIVE_AWAY" ? (
                  <Tag color="green">Cho tặng</Tag>
                ) : (
                  <p className="text-lg font-bold text-primary">
                    {item.price?.toLocaleString()} ₫
                  </p>
                )}
              </div>
              <Tag color={transactionTypeConfig[item.transactionType]?.color}>
                {transactionTypeConfig[item.transactionType]?.label}
              </Tag>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-xs text-gray-500 mb-3 pb-3 border-b">
              {item.viewCount !== undefined && (
                <span>👁️ {item.viewCount} lượt xem</span>
              )}
              {item.favoriteCount !== undefined && (
                <span>❤️ {item.favoriteCount} yêu thích</span>
              )}
            </div>

            {/* Location */}
            {item.location?.address && (
              <p className="text-xs text-gray-600 mb-3 line-clamp-1">
                📍 {item.location.address}
              </p>
            )}

            {/* Date */}
            <p className="text-xs text-gray-400 mb-4">
              Đăng: {new Date(item.createdAt).toLocaleDateString("vi-VN")}
            </p>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="default"
                size="small"
                block
                icon={<Edit size={16} />}
                onClick={() => onEdit(item)}
              >
                Chỉnh sửa
              </Button>
              <Dropdown
                menu={{ items: getMenuItems(item) }}
                trigger={["click"]}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<MoreVertical size={16} />}
                  loading={isLoading}
                />
              </Dropdown>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
