"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchService } from "@/stores/slices/search.slice";
import type { SearchHistoryResponse } from "@/types/search.type";

const ANIMATED_PLACEHOLDERS = [
  "Tìm MacBook, iPhone, laptop cũ...",
  "Tìm sofa, bàn ghế, tủ kệ...",
  "Tìm xe đạp, xe máy, ô tô...",
  "Tìm quần áo, giày dép, túi xách...",
  "Tìm đồ gia dụng, máy giặt...",
  "Tìm sách, nhạc cụ, đồ chơi...",
];

export default function SearchSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchHistoryResponse[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animated placeholder typewriter effect
  useEffect(() => {
    let charIndex = 0;
    const currentText = ANIMATED_PLACEHOLDERS[placeholderIndex];
    let delaying = false;

    const type = () => {
      if (delaying) return;
      if (charIndex <= currentText.length) {
        setDisplayedPlaceholder(currentText.slice(0, charIndex));
        charIndex++;
        animFrameRef.current = setTimeout(type, 55);
      } else {
        delaying = true;
        animFrameRef.current = setTimeout(() => {
          delaying = false;
          setIsTyping(false);
          charIndex = currentText.length;
          erase();
        }, 1800);
      }
    };

    const erase = () => {
      if (charIndex >= 0) {
        setDisplayedPlaceholder(currentText.slice(0, charIndex));
        charIndex--;
        animFrameRef.current = setTimeout(erase, 30);
      } else {
        setPlaceholderIndex((prev) => (prev + 1) % ANIMATED_PLACEHOLDERS.length);
        setIsTyping(true);
      }
    };

    animFrameRef.current = setTimeout(type, 300);

    return () => {
      if (animFrameRef.current) clearTimeout(animFrameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholderIndex, isTyping]);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const data = await searchService.getSearchSuggestions();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    }
  };

  const handleSearch = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      router.push("/search");
      return;
    }
    try {
      setIsLoading(true);
      searchService.saveSearchHistory({ searchQuery: trimmedQuery }).catch(() => { });
      setSearchQuery("");
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    } catch {
      router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSuggestions(true);
  };

  const loadRecentSearches = async () => {
    try {
      const data = await searchService.getRecentSearches();
      setRecentSearches(Array.isArray(data) ? data : []);
    } catch {
      setRecentSearches([]);
    }
  };

  const handleInputFocus = () => {
    if (recentSearches.length === 0) {
      loadRecentSearches();
    }
    setShowSuggestions(true);
  };

  const handleDeleteRecent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await searchService.deleteSearchHistory(id);
      setRecentSearches(recentSearches.filter((s) => s.id !== id));
    } catch {
      // ignore
    }
  };

  const handleClearAllRecent = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Xóa tất cả lịch sử tìm kiếm?")) return;
    try {
      await searchService.clearSearchHistory();
      setRecentSearches([]);
    } catch {
      // ignore
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch(searchQuery);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) => searchQuery === "" || s.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <section className="relative -mt-10 mx-auto max-w-3xl px-4 pb-12">
      <div className="rounded-xl border border-primary/5 bg-white p-2.5 shadow-xl dark:bg-slate-800">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative grow">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              className="w-full rounded-lg border-none bg-slate-100 py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary dark:bg-slate-700 outline-none"
              placeholder={displayedPlaceholder || "Tìm kiếm đồ cũ..."}
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />

            {/* Dropdown */}
            {showSuggestions && (filteredSuggestions.length > 0 || recentSearches.length > 0) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {filteredSuggestions.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800">
                      Gợi ý tìm kiếm
                    </div>
                    {filteredSuggestions.map((suggestion, index) => (
                      <button
                        key={`suggestion-${index}`}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-sm"
                        onClick={() => handleSuggestionClick(suggestion)}
                        type="button"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <span>{suggestion}</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}

                {filteredSuggestions.length > 0 && recentSearches.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-600" />
                )}

                {recentSearches.length > 0 && (
                  <>
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                      <span>Tìm kiếm gần đây</span>
                      <button
                        onClick={handleClearAllRecent}
                        className="text-xs text-slate-400 hover:text-red-600 transition-colors"
                        type="button"
                      >
                        Xóa tất cả
                      </button>
                    </div>
                    {recentSearches.slice(0, 8).map((recent) => (
                      <button
                        key={recent.id}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors text-sm flex items-center justify-between group"
                        onClick={() => handleSuggestionClick(recent.searchQuery)}
                        type="button"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="truncate">{recent.searchQuery}</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteRecent(recent.id, e)}
                          className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-600 shrink-0"
                          type="button"
                          title="Xóa"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
            disabled={isLoading}
            type="button"
          >
            {isLoading ? "Đang tìm..." : "Tìm kiếm"}
          </button>
        </div>
      </div>
    </section>
  );
}