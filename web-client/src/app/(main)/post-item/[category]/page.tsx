"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { X, ChevronRight, AlertCircle, Loader } from "lucide-react";
import {
  categoryService,
  type ChildCategory,
} from "@/stores/slices/category.slice";

const categoryLabelMap: Record<string, string> = {
  vehicles: "Xe cộ",
  electronics: "Đồ điện tử",
  others: "Sản phẩm khác",
};

// Map semantic IDs to backend category IDs
const categoryIdMap: Record<string, string> = {
  vehicles: "cg-0002",
  electronics: "cg-0001",
  others: "cg-0003",
};

export default function PostItemCategoryPage() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const categoryKey = params?.category || "";

  const categoryLabel = categoryLabelMap[categoryKey] || "Danh mục";

  const [childCategories, setChildCategories] = useState<ChildCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load child categories từ API
  useEffect(() => {
    const loadChildCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get backend category ID from semantic param
        const backendCategoryId = categoryIdMap[categoryKey];
        if (!backendCategoryId) {
          throw new Error("Danh mục không hợp lệ");
        }

        const children =
          await categoryService.getChildCategories(backendCategoryId);
        setChildCategories(children);
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Lỗi tải danh mục con";
        setError(errorMsg);
        console.error("Failed to load child categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (categoryKey) {
      loadChildCategories();
    }
  }, [categoryKey]);

  const handleSelectChild = (childId: string) => {
    router.push(`/post-item/${categoryKey}/${childId}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Chọn danh mục con
            </h1>
            <p className="mt-1 text-slate-600">{categoryLabel}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-200 sm:p-8">
          {/* Error loading categories */}
          {error && (
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 mb-6">
              <AlertCircle size={20} className="shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Lỗi tải danh mục con</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader size={24} className="animate-spin text-primary mr-3" />
              <span className="text-slate-600">Đang tải danh mục con...</span>
            </div>
          )}

          {/* Child categories grid */}
          {!isLoading && childCategories.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {childCategories.map((child) => (
                <button
                  key={child.categoryId}
                  onClick={() => handleSelectChild(child.categoryId)}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:bg-primary/5 hover:border-primary"
                >
                  <span className="font-medium text-slate-900">
                    {child.name}
                  </span>
                  <ChevronRight
                    size={18}
                    className="text-slate-400 transition group-hover:text-primary"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && childCategories.length === 0 && !error && (
            <div className="py-12 text-center">
              <p className="text-slate-500">Không có danh mục con nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
