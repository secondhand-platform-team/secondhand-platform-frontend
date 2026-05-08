"use client";
import type { ItemWithImages } from "@/types/item.type";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Select, Pagination, message, Spin, Empty, Tag, Dropdown, Image } from "antd";
import { PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Eye, Edit, Trash2, MoreVertical, Clock, MapPin, Heart, TrendingUp, Package } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import PostsDetailModal from "@/components/my-posts/PostsDetailModal";
import { fetchMyItems, clearSelectedItem, deleteItemThunk, updateItemStatusThunk } from "@/stores/slices/items.slice";
import type { MenuProps } from "antd";
import Link from "next/link";

const statusConfig: Record<string, { color: string; label: string; bg: string }> = {
  ACTIVE: { color: "green", label: "Đang bán", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  DRAFT: { color: "emerald", label: "Nháp", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  RESERVED: { color: "orange", label: "Đã đặt cọc", bg: "bg-amber-50 text-amber-700 border-amber-200" },
  SOLD: { color: "red", label: "Đã bán", bg: "bg-red-50 text-red-700 border-red-200" },
  HIDDEN: { color: "default", label: "Ẩn", bg: "bg-slate-50 text-slate-600 border-slate-200" },
  EXPIRED: { color: "error", label: "Hết hạn", bg: "bg-rose-50 text-rose-700 border-rose-200" },
};

const transactionTypeConfig: Record<string, { label: string; bg: string }> = {
  SELL: { label: "Bán", bg: "bg-violet-50 text-violet-700" },
  GIVE_AWAY: { label: "Cho tặng", bg: "bg-emerald-50 text-emerald-700" },
};

export default function MyPostsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    myPosts = [],
    loading = false,
    currentPage = 0,
    totalPages = 0,
  } = useAppSelector((state) => state?.items || {});
  const { isAuth, loading: authLoading } = useAppSelector((state) => state?.auth || {});

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithImages | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [page, setPage] = useState(0);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    // Wait for auth check to finish before deciding to redirect
    if (authLoading) return;
    if (!isAuth) {
      message.warning("Vui lòng đăng nhập để xem quản lý tin đăng");
      router.push("/home");
      return;
    }
  }, [isAuth, authLoading, router]);

  useEffect(() => {
    if (isAuth) {
      void dispatch(fetchMyItems({ page, size: 20 }));
    }
  }, [isAuth, page, dispatch]);

  const handleViewDetail = (item: ItemWithImages) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleEdit = (item: ItemWithImages) => {
    router.push(`/dashboard/my-posts/${item.itemId}/edit`);
  };

  const handleRefresh = () => {
    void dispatch(fetchMyItems({ page, size: 20 }));
  };

  const handleDelete = async (item: ItemWithImages) => {
    setLoadingId(item.itemId);
    try {
      await dispatch(deleteItemThunk(item.itemId)).unwrap();
      message.success("Xóa tin đăng thành công!");
      handleRefresh();
    } catch {
      message.error("Xóa tin đăng thất bại!");
    } finally {
      setLoadingId(null);
    }
  };

  const handleStatusChange = async (item: ItemWithImages, newStatus: string) => {
    setLoadingId(item.itemId);
    try {
      await dispatch(updateItemStatusThunk({ itemId: item.itemId, status: newStatus })).unwrap();
      message.success("Cập nhật trạng thái thành công!");
      handleRefresh();
    } catch {
      message.error("Cập nhật trạng thái thất bại!");
    } finally {
      setLoadingId(null);
    }
  };

  const getMenuItems = (record: ItemWithImages): MenuProps["items"] => {
    const statusOptions = ["ACTIVE", "RESERVED", "SOLD", "HIDDEN", "DRAFT"];
    return [
      { key: "view", label: "Xem chi tiết", icon: <Eye size={15} />, onClick: () => handleViewDetail(record) },
      { key: "edit", label: "Chỉnh sửa", icon: <Edit size={15} />, onClick: () => handleEdit(record) },
      { type: "divider" as const },
      {
        key: "status-submenu", label: "Đổi trạng thái", icon: <Clock size={15} />,
        children: statusOptions.filter((s) => s !== record.status).map((status) => ({
          key: `status-${status}`, label: statusConfig[status]?.label || status,
          onClick: () => handleStatusChange(record, status),
        })),
      },
      { type: "divider" as const },
      { key: "delete", label: "Xóa tin đăng", danger: true, icon: <Trash2 size={15} />, onClick: () => handleDelete(record) },
    ];
  };

  const filteredItems = Array.isArray(myPosts)
    ? myPosts.filter((item) => {
      const matchesSearch = !searchText || item.title.toLowerCase().includes(searchText.toLowerCase()) || item.description?.toLowerCase().includes(searchText.toLowerCase());
      const matchesStatus = !filterStatus || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    : [];

  const formatPrice = (price: number | null | undefined) =>
    price ? price.toLocaleString("vi-VN") + "đ" : "Liên hệ";

  const totalActive = Array.isArray(myPosts) ? myPosts.filter(i => i.status === "ACTIVE").length : 0;
  const totalSold = Array.isArray(myPosts) ? myPosts.filter(i => i.status === "SOLD").length : 0;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Tổng tin đăng", value: myPosts.length, icon: <Package className="w-5 h-5" />, color: "text-slate-700", bg: "bg-slate-50" },
          { label: "Đang bán", value: totalActive, icon: <TrendingUp className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Đã bán", value: totalSold, icon: <Heart className="w-5 h-5" />, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Lượt xem", value: "—", icon: <Eye className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Tìm kiếm tin đăng..."
              allowClear
              prefix={<SearchOutlined className="text-slate-400" />}
              value={searchText}
              onChange={(e) => { setSearchText(e.target.value); setPage(0); }}
              className="!rounded-xl h-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: 140 }}
              value={filterStatus || undefined}
              onChange={(value) => { setFilterStatus(value || ""); setPage(0); }}
              className="[&>.ant-select-selector]:!rounded-xl"
              options={[
                { label: "Đang bán", value: "ACTIVE" },
                { label: "Nháp", value: "DRAFT" },
                { label: "Đã đặt cọc", value: "RESERVED" },
                { label: "Đã bán", value: "SOLD" },
                { label: "Ẩn", value: "HIDDEN" },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading} className="!rounded-xl h-10">
              Làm mới
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/post-item")}
              className="!rounded-xl h-10 bg-emerald-500 hover:!bg-emerald-600 font-semibold !border-none">
              Đăng tin mới
            </Button>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="flex flex-col justify-center items-center h-64 gap-4 bg-white rounded-2xl border border-slate-100">
          <Spin size="large" />
          <p className="text-sm text-slate-500">Đang tải dữ liệu...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 flex flex-col items-center justify-center">
          <Empty description={<span className="text-slate-500">Chưa có tin đăng nào</span>} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push("/post-item")}
            className="mt-6 !rounded-xl bg-emerald-500 hover:!bg-emerald-600 font-bold !border-none h-11 px-8">
            Tạo tin đăng đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const primaryImage = item.images?.[0]?.imageUrl;
            const isLoading = loadingId === item.itemId;
            const stCfg = statusConfig[item.status || "DRAFT"];
            const ttCfg = transactionTypeConfig[item.transactionType];

            return (
              <div key={item.itemId}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden relative">
                {isLoading && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center z-20 rounded-2xl">
                    <Spin />
                  </div>
                )}

                {/* Image Section */}
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  {primaryImage ? (
                    <img src={primaryImage} alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                      <Package className="w-12 h-12" />
                    </div>
                  )}

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                      <button onClick={() => handleViewDetail(item)}
                        className="flex-1 bg-white/90 backdrop-blur-sm text-slate-800 py-2 rounded-xl text-sm font-semibold hover:bg-white transition-colors flex items-center justify-center gap-1.5">
                        <Eye className="w-4 h-4" /> Xem
                      </button>
                      <button onClick={() => handleEdit(item)}
                        className="flex-1 bg-emerald-500/90 backdrop-blur-sm text-white py-2 rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-1.5">
                        <Edit className="w-4 h-4" /> Sửa
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${stCfg.bg}`}>
                      {stCfg.label}
                    </span>
                  </div>

                  {/* Transaction Type */}
                  {ttCfg && (
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${ttCfg.bg}`}>
                        {ttCfg.label}
                      </span>
                    </div>
                  )}

                  {/* Image count */}
                  {item.images && item.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-0 transition-opacity">
                      {item.images.length} ảnh
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-slate-800 line-clamp-2 min-h-[44px] text-[15px] mb-2 group-hover:text-emerald-600 transition-colors">
                    {item.title}
                  </h3>

                  {/* Price */}
                  <div className="mb-3">
                    {item.transactionType === "GIVE_AWAY" ? (
                      <span className="text-emerald-600 font-bold text-lg">Cho tặng miễn phí</span>
                    ) : (
                      <span className="text-emerald-600 font-black text-lg">{formatPrice(item.price)}</span>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
                    {item.viewCount !== undefined && (
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {item.viewCount}</span>
                    )}
                    {item.favoriteCount !== undefined && (
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {item.favoriteCount}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  {/* Location */}
                  {item.location?.address && (
                    <p className="text-xs text-slate-500 mb-3 flex items-start gap-1 line-clamp-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      {item.location.address}
                    </p>
                  )}

                  {/* Actions Footer */}
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(item)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold transition-colors border border-slate-200">
                      <Edit className="w-4 h-4" /> Chỉnh sửa
                    </button>
                    <Dropdown menu={{ items: getMenuItems(item) }} trigger={["click"]} placement="bottomRight">
                      <button className="w-9 h-9 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </Dropdown>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-4">
          <Pagination
            current={page + 1}
            total={totalPages * 20}
            pageSize={20}
            onChange={(newPage) => setPage(newPage - 1)}
            showSizeChanger={false}
          />
        </div>
      )}

      {/* Detail Modal */}
      <PostsDetailModal
        open={detailOpen}
        item={selectedItem}
        loading={false}
        onClose={() => {
          setDetailOpen(false);
          setSelectedItem(null);
          dispatch(clearSelectedItem());
        }}
      />
    </div>
  );
}
