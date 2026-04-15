"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchMyItems, clearSelectedItem } from "@/stores/slices/items.slice";
import { Button, Input, Select, Pagination, message } from "antd";
import { Plus, RefreshCw } from "lucide-react";
import PostsGrid from "@/components/my-posts/PostsGrid";
import PostsDetailModal from "@/components/my-posts/PostsDetailModal";
import type { ItemWithImages } from "@/config/services/item.service";

export default function MyPostsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const {
    myItems = [],
    loading = false,
    currentPage = 0,
    totalPages = 0,
    error,
  } = useAppSelector((state) => state?.items || {});
  const { isAuth, user } = useAppSelector((state) => state?.auth || {});

  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemWithImages | null>(null);
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [page, setPage] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

  // Check auth and load data
  useEffect(() => {
    if (!isAuth) {
      message.warning("Vui lòng đăng nhập để xem quản lý tin đăng");
      router.push("/home");
      return;
    }

    setPageLoading(false);
  }, [isAuth, router]);

  // Load items when page mounts or changes
  useEffect(() => {
    if (isAuth && !pageLoading) {
      void dispatch(fetchMyItems({ page, size: 20 }));
    }
  }, [isAuth, page, dispatch, pageLoading]);

  const handleViewDetail = (item: ItemWithImages) => {
    setSelectedItem(item);
    setDetailOpen(true);
  };

  const handleEdit = (item: ItemWithImages) => {
    // TODO: Implement edit page/modal
    router.push(`/my-posts/${item.itemId}/edit`);
  };

  const handleRefresh = () => {
    void dispatch(fetchMyItems({ page, size: 20 }));
  };

  const handleCreateNew = () => {
    router.push("/post-item");
  };

  // Filter items based on search and status
  const filteredItems = Array.isArray(myItems)
    ? myItems.filter((item) => {
        const matchesSearch =
          !searchText ||
          item.title.toLowerCase().includes(searchText.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus = !filterStatus || item.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
    : [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Tin đăng của tôi
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {filteredItems.length} tin đăng
              </p>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<Plus size={18} />}
              onClick={handleCreateNew}
            >
              Đăng tin mới
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Search & Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex-1 max-w-md">
            <Input.Search
              placeholder="Tìm kiếm tin đăng..."
              allowClear
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(0);
              }}
              size="large"
            />
          </div>
          <div className="flex gap-2">
            <Select
              placeholder="Lọc theo trạng thái"
              allowClear
              style={{ width: 150 }}
              value={filterStatus || undefined}
              onChange={(value) => {
                setFilterStatus(value || "");
                setPage(0);
              }}
              options={[
                { label: "Hoạt động", value: "ACTIVE" },
                { label: "Nháp", value: "DRAFT" },
                { label: "Đã đặt cọc", value: "RESERVED" },
                { label: "Đã bán", value: "SOLD" },
                { label: "Ẩn", value: "HIDDEN" },
              ]}
            />
            <Button
              icon={<RefreshCw size={16} />}
              onClick={handleRefresh}
              loading={loading}
            >
              Làm mới
            </Button>
          </div>
        </div>

        {/* Grid */}
        <PostsGrid
          items={filteredItems}
          loading={loading}
          onEdit={handleEdit}
          onViewDetail={handleViewDetail}
          onRefresh={handleRefresh}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              current={page + 1}
              total={totalPages * 20}
              pageSize={20}
              onChange={(newPage) => {
                setPage(newPage - 1);
              }}
            />
          </div>
        )}
      </div>

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