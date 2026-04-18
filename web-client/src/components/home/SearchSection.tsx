"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchService } from "@/config/services/search.service";
import type { SearchHistoryResponse } from "@/types/search.type";

export default function SearchSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryResponse[]>(
    [],
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load suggestions when component mounts
  useEffect(() => {
    loadSuggestions();
  }, []);

  // Load suggestions
  const loadSuggestions = async () => {
    try {
      const data = await searchService.getSearchSuggestions();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
      // Fallback to empty array on error
      setSuggestions([]);
    }
  };

  const handleSearch = async (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    try {
      setIsLoading(true);

      // Save search history
      await searchService.saveSearchHistory({
        searchQuery: trimmedQuery,
      });

      // Clear input and suggestions
      setSearchQuery("");
      setShowSuggestions(false);

      // Navigate to search results page
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
  };

  const loadRecentSearches = async () => {
    try {
      const data = await searchService.getRecentSearches();
      setRecentSearches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load recent searches:", error);
      setRecentSearches([]);
    }
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 || recentSearches.length > 0) {
      setShowSuggestions(true);
    }
    // Load recent searches when focusing
    if (recentSearches.length === 0) {
      loadRecentSearches();
    }
  };

  const handleDeleteRecent = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await searchService.deleteSearchHistory(id);
      setRecentSearches(recentSearches.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete search:", error);
    }
  };

  const handleClearAllRecent = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Xóa tất cả lịch sử tìm kiếm?")) {
      return;
    }

    try {
      await searchService.clearSearchHistory();
      setRecentSearches([]);
    } catch (error) {
      console.error("Failed to clear search history:", error);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  return (
    <section className="relative -mt-10 mx-auto max-w-3xl px-4 pb-12">
      <div className="rounded-xl border border-primary/5 bg-white p-2.5 shadow-xl dark:bg-slate-800">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative grow">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
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
            <input
              ref={inputRef}
              className="w-full rounded-lg border-none bg-slate-100 py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary dark:bg-slate-700"
              placeholder="Tìm kiếm đồ cũ, quần áo, nội thất..."
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              onFocus={handleInputFocus}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {/* Search Suggestions & Recent Dropdown */}
            {showSuggestions &&
              (suggestions.length > 0 || recentSearches.length > 0) && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  {/* Suggestions */}
                  {suggestions.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase sticky top-0 bg-slate-50 dark:bg-slate-800">
                        Gợi ý tìm kiếm
                      </div>
                      {suggestions
                        .filter(
                          (s) =>
                            searchQuery === "" ||
                            s.toLowerCase().includes(searchQuery.toLowerCase()),
                        )
                        .slice(0, 5)
                        .map((suggestion, index) => (
                          <button
                            key={`suggestion-${index}`}
                            className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            type="button"
                          >
                            <div className="flex items-center gap-2">
                              <svg
                                className="w-4 h-4 text-slate-400"
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
                              <span>{suggestion}</span>
                            </div>
                          </button>
                        ))}
                    </>
                  )}

                  {/* Divider */}
                  {suggestions.length > 0 && recentSearches.length > 0 && (
                    <div className="border-t border-slate-200 dark:border-slate-600"></div>
                  )}

                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase sticky top-0 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                        <span>Tìm kiếm gần đây</span>
                        <button
                          onClick={handleClearAllRecent}
                          className="text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          type="button"
                        >
                          Xóa tất cả
                        </button>
                      </div>
                      {recentSearches.slice(0, 8).map((recent) => (
                        <button
                          key={recent.id}
                          className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-sm flex items-center justify-between group"
                          onClick={() =>
                            handleSuggestionClick(recent.searchQuery)
                          }
                          type="button"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <svg
                              className="w-4 h-4 text-slate-400 shrink-0"
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
                            <span className="truncate">
                              {recent.searchQuery}
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteRecent(recent.id, e)}
                            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600 dark:hover:text-red-400 shrink-0"
                            type="button"
                            title="Xóa"
                          >
                            <svg
                              className="w-4 h-4"
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
                    </>
                  )}
                </div>
              )}
          </div>
          <button
            className="cursor-pointer rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => handleSearch(searchQuery)}
            disabled={isLoading || !searchQuery.trim()}
          >
            {isLoading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </div>
      </div>
    </section>
  );
}
