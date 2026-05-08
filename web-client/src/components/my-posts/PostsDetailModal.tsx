"use client";

import {
  Modal,
  Image,
  Tag,
  Divider,
  Descriptions,
  Button,
  message,
  Spin,
} from "antd";
import {
  Heart,
  Eye,
  Download,
  Copy,
  Calendar,
  MapPin,
  DollarSign,
} from "lucide-react";
import type { ItemWithImages } from "@/types/item.type";

interface PostsDetailModalProps {
  open: boolean;
  item: ItemWithImages | null;
  loading: boolean;
  onClose: () => void;
}

const statusConfig: Record<string, { color: string; label: string }> = {
  ACTIVE: { color: "green", label: "Hoạt động" },
  DRAFT: { color: "green", label: "Nháp" },
  RESERVED: { color: "orange", label: "Đã đặt cọc" },
  SOLD: { color: "red", label: "Đã bán" },
  HIDDEN: { color: "default", label: "Ẩn" },
  EXPIRED: { color: "error", label: "Hết hạn" },
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

export default function PostsDetailModal({
  open,
  item,
  loading,
  onClose,
}: PostsDetailModalProps) {
  const handleCopyLink = async () => {
    if (item) {
      const url =
        typeof window !== "undefined"
          ? `${window.location.origin}/items/${item.itemId}`
          : "";
      try {
        await navigator.clipboard.writeText(url);
        message.success("Đã sao chép liên kết!");
      } catch {
        message.error("Sao chép thất bại!");
      }
    }
  };

  const handleDownloadImages = async () => {
    if (!item?.images || item.images.length === 0) {
      message.warning("Không có hình ảnh để tải xuống!");
      return;
    }

    // Simple implementation: open each image in a new tab
    item.images.forEach((img) => {
      const a = document.createElement("a");
      a.href = img.imageUrl;
      a.download = `${item.itemId}-${img.imageId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <span>Chi tiết tin đăng</span>
          {item && (
            <Tag color={statusConfig[item.status || "DRAFT"].color}>
              {statusConfig[item.status || "DRAFT"].label}
            </Tag>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button
          key="copy"
          type="primary"
          icon={<Copy size={16} />}
          onClick={handleCopyLink}
        >
          Sao chép liên kết
        </Button>,
      ]}
    >
      <Spin spinning={loading}>
        {item && (
          <div className="space-y-4">
            {/* Images */}
            {item.images && item.images.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Hình ảnh</h3>
                <div className="grid grid-cols-3 gap-3">
                  {item.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <Image
                        src={img.imageUrl}
                        alt={`Image ${idx + 1}`}
                        width="100%"
                        style={{
                          objectFit: "cover",
                          borderRadius: "8px",
                          height: "150px",
                        }}
                      />
                      {img.isPrimary && (
                        <Tag color="green" className="absolute top-2 left-2">
                          Chính
                        </Tag>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  block
                  icon={<Download size={16} />}
                  onClick={handleDownloadImages}
                  className="mt-2"
                >
                  Tải tất cả hình ảnh
                </Button>
              </div>
            )}

            <Divider />

            {/* Basic Info */}
            <div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <Tag color={transactionTypeConfig[item.transactionType]?.color}>
                  {transactionTypeConfig[item.transactionType]?.label}
                </Tag>
                {item.price !== null && (
                  <Tag icon={<DollarSign size={14} />}>
                    {item.transactionType === "GIVE_AWAY"
                      ? "Miễn phí"
                      : `${item.price?.toLocaleString()} ₫`}
                  </Tag>
                )}
                <Tag>{conditionConfig[item.condition] || item.condition}</Tag>
              </div>
            </div>

            {/* Description */}
            {item.description && (
              <div>
                <h3 className="font-semibold mb-2">Mô tả</h3>
                <p className="text-sm text-gray-600 line-clamp-4">
                  {item.description}
                </p>
              </div>
            )}

            <Divider />

            {/* Metadata */}
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item
                label={
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    Ngày tạo
                  </div>
                }
              >
                {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Descriptions.Item>

              {item.updatedAt && item.updatedAt !== item.createdAt && (
                <Descriptions.Item label="Cập nhật lần cuối">
                  {new Date(item.updatedAt).toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </Descriptions.Item>
              )}

              {item.location && (
                <Descriptions.Item
                  label={
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      Địa điểm
                    </div>
                  }
                  span={2}
                >
                  {item.location.address}
                  {item.location.ward && `, ${item.location.ward}`}
                  {item.location.district && `, ${item.location.district}`}
                  {item.location.city && `, ${item.location.city}`}
                </Descriptions.Item>
              )}

              {item.viewCount !== undefined && (
                <Descriptions.Item
                  label={
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      Lượt xem
                    </div>
                  }
                >
                  {item.viewCount}
                </Descriptions.Item>
              )}

              {item.favoriteCount !== undefined && (
                <Descriptions.Item
                  label={
                    <div className="flex items-center gap-1">
                      <Heart size={14} />
                      Yêu thích
                    </div>
                  }
                >
                  {item.favoriteCount}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Attributes */}
            {item.attributes && item.attributes.length > 0 && (
              <>
                <Divider />
                <div>
                  <h3 className="font-semibold mb-2">Thông tin chi tiết</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {item.attributes.map((attr, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <p className="text-xs font-semibold text-gray-600">
                          {attr.code}
                        </p>
                        <p className="text-sm text-gray-900">
                          {String(attr.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Payment Info */}
            {item.paymentUrl && (
              <>
                <Divider />
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded">
                  <p className="text-sm font-semibold text-emerald-900 mb-2">
                    Thông tin thanh toán
                  </p>
                  <p className="text-sm text-emerald-800">
                    Transaction ID: {item.transactionId || "N/A"}
                  </p>
                  {item.paymentInitiatedAt && (
                    <p className="text-sm text-emerald-800">
                      Thời gian thanh toán:{" "}
                      {new Date(item.paymentInitiatedAt).toLocaleDateString(
                        "vi-VN",
                        {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </Spin>
    </Modal>
  );
}
