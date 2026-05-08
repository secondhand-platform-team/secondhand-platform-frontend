"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchService } from "@/stores/slices/search.slice";
import type { SearchHistoryResponse } from "@/types/search.type";

export default function RecentSearches() {
  const router = useRouter();
  const [searches, setSearches] = useState<SearchHistoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      const data = await searchService.getRecentSearches();
      setSearches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load recent searches:", error);
      // Fallback to empty array on error
      setSearches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchClick = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleDeleteSearch = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await searchService.deleteSearchHistory(id);
      setSearches(searches.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete search:", error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa tất cả tìm kiếm gần đây?")) {
      return;
    }

    try {
      await searchService.clearSearchHistory();
      setSearches([]);
    } catch (error) {
      console.error("Failed to clear search history:", error);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse">Đang tải...</div>;
  }

  if (searches.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Tìm kiếm gần đây
        </h3>
        <button
          onClick={handleClearAll}
          className="text-sm text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
        >
          Xóa tất cả
        </button>
      </div>

      <div className="space-y-2">
        {searches.slice(0, 10).map((search) => (
          <button
            key={search.id}
            onClick={() => handleSearchClick(search.searchQuery)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-3 text-left">
              <svg
                className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-slate-700 dark:text-slate-300">
                {search.searchQuery}
              </span>
            </div>
            <button
              onClick={(e) => handleDeleteSearch(search.id, e)}
              className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Xóa"
            >
              <svg
                className="w-4 h-4 text-slate-400 hover:text-red-600 dark:hover:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
