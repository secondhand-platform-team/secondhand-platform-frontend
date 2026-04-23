"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchService } from "@/config/services/search.service";

export default function TrendingSearches() {
  const router = useRouter();
  const [trending, setTrending] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTrendingSearches();
  }, []);

  const loadTrendingSearches = async () => {
    try {
      const data = await searchService.getTrendingSearches();
      setTrending(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load trending searches:", error);
      // Fallback to empty array on error
      setTrending([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchClick = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  if (isLoading) {
    return <div className="animate-pulse">Đang tải...</div>;
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        🔥 Đang xu hướng
      </h3>

      <div className="space-y-2">
        {trending.slice(0, 10).map((search, index) => (
          <button
            key={index}
            onClick={() => handleSearchClick(search)}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left group"
          >
            <span className="font-bold text-primary text-sm w-6">
              #{index + 1}
            </span>
            <div className="flex-1 flex items-center gap-2">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-slate-700 dark:text-slate-300 truncate">
                {search}
              </span>
            </div>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}