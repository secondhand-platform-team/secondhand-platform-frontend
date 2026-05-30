"use client";
import type { ItemWithImages } from "@/types/item.type";

import {
  Table,
  Tag,
  Button,
  Dropdown,
  Image,
  Tooltip,
  message,
  Empty,
  Spin,
} from "antd";
import { Edit, Eye, Trash2, MoreVertical, Clock } from "lucide-react";

import { useState } from "react";
import { useAppDispatch } from "@/stores/hooks";
import {
  fetchItemDetail,
  deleteItemThunk,
  updateItemStatusThunk,
} from "@/stores/slices/items.slice";
import type { MenuProps } from "antd";

interface PostsTableProps {
  items: ItemWithImages[];
  loading: boolean;
  onEdit: (item: ItemWithImages) => void;
  onViewDetail: (item: ItemWithImages) => void;
  onRefresh: () => void;
}

const statusConfig: Record<
  string,
  { color: string; label: string; icon?: React.ReactNode }
> = {
  ACTIVE: { color: "green", label: "Hoạt động" },
  DRAFT: { color: "green", label: "Nháp" },
  RESERVED: { color: "orange", label: "Đã đặt cọc" },
  SOLD: { color: "red", label: "Đã bán" },
  HIDDEN: { color: "default", label: "Ẩn" },
  // EXPIRED: { color: "error", label: "Hết hạn" },
};

const conditionConfig: Record<string, string> = {
  NEW: "Mới",
  LIKE_NEW: "Như mới",
  USED: "Đã sử dụng",
  FOR_PARTS: "Lấy linh kiện",
};

const transactionTypeConfig: Record<string, { label: string; color: string }> =
{
  SELL: { label: "Bán", color: "green" },
  GIVE_AWAY: { label: "Cho tặng", color: "green" },
};

export default function PostsTable({
  items,
  loading,
  onEdit,
  onViewDetail,
  onRefresh,
}: PostsTableProps) {
  const dispatch = useAppDispatch();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  console.log("🎨 PostsTable render:", {
    items_count: items?.length,
    items_type: typeof items,
    is_array: Array.isArray(items),
    loading,
    hasItems: Array.isArray(items) && items.length > 0,
    first_item: items?.[0],
  });

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

    // Status menu items
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

  const columns = [
    {
      title: "Hình ảnh",
      dataIndex: "images",
      key: "images",
      width: 80,
      render: (images: any[]) => {
        const primaryImage = images?.[0]?.imageUrl;
        return primaryImage ? (
          <Image
            src={primaryImage}
            alt="Product"
            width={70}
            height={70}
            style={{ objectFit: "cover", borderRadius: "4px" }}
            preview={false}
          />
        ) : (
          <div className="h-[70px] w-[70px] bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400">
            Không có ảnh
          </div>
        );
      },
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      width: 250,
      render: (text: string) => (
        <Tooltip title={text} overlayInnerStyle={{ maxWidth: 400 }}>
          <span className="line-clamp-2">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      width: 120,
      render: (price: number | null, record: ItemWithImages) => {
        if (record.transactionType === "GIVE_AWAY") {
          return <Tag color="green">Cho tặng</Tag>;
        }
        return `${price?.toLocaleString()} ₫`;
      },
    },
    {
      title: "Loại",
      dataIndex: "transactionType",
      key: "transactionType",
      width: 100,
      render: (type: string) => {
        const config = transactionTypeConfig[type];
        return <Tag color={config?.color}>{config?.label || type}</Tag>;
      },
    },
    {
      title: "Tình trạng",
      dataIndex: "condition",
      key: "condition",
      width: 120,
      render: (condition: string) => conditionConfig[condition] || condition,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const config = statusConfig[status];
        return <Tag color={config?.color}>{config?.label || status}</Tag>;
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("vi-VN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        });
      },
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 80,
      fixed: "right" as const,
      render: (_: any, record: ItemWithImages) => (
        <Dropdown menu={{ items: getMenuItems(record) }} trigger={["click"]}>
          <Button
            type="text"
            size="small"
            loading={loadingId === record.itemId}
            icon={<MoreVertical size={16} />}
          />
        </Dropdown>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-4">
        <Spin size="large" />
        <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
        {process.env.NODE_ENV === "development" && (
          <p className="text-xs text-gray-400 font-mono">
            {items?.length || 0} items | loading={String(loading)}
          </p>
        )}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Empty description="Chưa có tin đăng nào" style={{ marginTop: "50px" }} />
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table
        columns={columns}
        dataSource={items.map((item) => ({
          ...item,
          key: item.itemId,
        }))}
        pagination={false}
        scroll={{ x: 1200 }}
        size="small"
        rowClassName={() => "hover:bg-gray-50"}
      />
    </div>
  );
}
