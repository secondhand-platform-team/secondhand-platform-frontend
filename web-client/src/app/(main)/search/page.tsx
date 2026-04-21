"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { itemService, type ItemWithImages, type PageResponse } from "@/config/services/item.service";
import provinceService from "@/config/services/province.service";
import type { Province, District, Ward } from "@/types/province.type";
import http from "@/utils/api";
import type { CategoryType } from "@/types/item/item.type";
import { MapPin, Heart, ChevronLeft, ChevronRight, SlidersHorizontal, X, ChevronDown, Search } from "lucide-react";

const CONDITIONS = [
  { value: "", label: "Tất cả" },
  { value: "NEW", label: "Mới" },
  { value: "LIKE_NEW", label: "Như mới" },
  { value: "USED", label: "Đã sử dụng" },
  { value: "FOR_PARTS", label: "Hỏng / linh kiện" },
];

const TRANSACTION_TYPES = [
  { value: "", label: "Tất cả" },
  { value: "SELL", label: "Bán" },
  { value: "GIVE_AWAY", label: "Cho tặng" },
  { value: "FREE_SELL", label: "Miễn phí" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "price_asc", label: "Giá tăng dần" },
  { value: "price_desc", label: "Giá giảm dần" },
];

function formatPrice(price: number | null | undefined): string {
  if (price == null || price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "đ";
}

function getImageUrl(item: ItemWithImages): string {
  const img = item.itemImageList?.find((i) => i.isPrimary) ?? item.itemImageList?.[0];
  return img?.imageUrl ?? "/icon-other/san-pham-khac.png";
}

function getLocation(item: ItemWithImages): string {
  if (!item.location) return "Toàn quốc";
  const parts = [item.location.district, item.location.city].filter(Boolean);
  return parts.join(", ") || "Toàn quốc";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return minutes + " phút trước";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + " giờ trước";
  return Math.floor(hours / 24) + " ngày trước";
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<ItemWithImages[]>([]);
  const [pageInfo, setPageInfo] = useState<Omit<PageResponse<ItemWithImages>, "content"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryType[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);

  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("categoryId") ? [searchParams.get("categoryId")!] : []
  );
  const [activeTabCategory, setActiveTabCategory] = useState(searchParams.get("categoryId") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [condition, setCondition] = useState(searchParams.get("condition") ?? "");
  const [transactionType, setTransactionType] = useState(searchParams.get("transactionType") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [district, setDistrict] = useState(searchParams.get("district") ?? "");
  const [ward, setWard] = useState(searchParams.get("ward") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "newest");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 0));

  const [pendingCategories, setPendingCategories] = useState<string[]>(selectedCategories);
  const [pendingMinPrice, setPendingMinPrice] = useState(minPrice);
  const [pendingMaxPrice, setPendingMaxPrice] = useState(maxPrice);
  const [pendingCondition, setPendingCondition] = useState(condition);
  const [pendingTransactionType, setPendingTransactionType] = useState(transactionType);
  const [pendingCity, setPendingCity] = useState(city);
  const [pendingDistrict, setPendingDistrict] = useState(district);
  const [pendingWard, setPendingWard] = useState(ward);

  const PAGE_SIZE = 12;

  // Animated placeholder for search input
  const SEARCH_PLACEHOLDERS = [
    "Tìm MacBook, iPhone, laptop cũ...",
    "Tìm sofa, bàn ghế, tủ kệ...",
    "Tìm xe đạp, xe máy, ô tô...",
    "Tìm quần áo, giày dép, túi xách...",
    "Tìm đồ gia dụng, máy giặt, tủ lạnh...",
    "Tìm sách, nhạc cụ, đồ sưu tầm...",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const selectedPendingCategoryId = pendingCategories[0] ?? "";
  const featuredFilterCategories = React.useMemo(() => categories.slice(0, 6), [categories]);
  const selectableCategories = React.useMemo(() => {
    const parentIds = new Set(allCategories.map((c) => c.parentId).filter(Boolean));
    const leafCategories = allCategories.filter((c) => !parentIds.has(c.categoryId));
    const source = leafCategories.length > 0 ? leafCategories : allCategories;
    return [...source].sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [allCategories]);
  const categoryNameMap = React.useMemo(
    () => new Map(selectableCategories.map((cat) => [cat.categoryId, cat.name])),
    [selectableCategories]
  );
  const selectedPendingCategoryName = categoryNameMap.get(selectedPendingCategoryId) ?? "";

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [SEARCH_PLACEHOLDERS.length]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(0);
  };

  // Load categories and provinces on mount
  useEffect(() => {
    Promise.all([
      http.get<CategoryType[]>("/core/api/categories/top-level"),
      http.get<CategoryType[]>("/core/api/categories"),
    ])
      .then(([topLevel, all]) => {
        setCategories(Array.isArray(topLevel) ? topLevel : []);
        setAllCategories(Array.isArray(all) ? all : []);
      })
      .catch(() => {
        setCategories([]);
        setAllCategories([]);
      });
    provinceService.getProvinces().then(setProvinces).catch(() => {});
  }, []);

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (selectedCategories.length > 0) params.set("categoryId", selectedCategories[0]);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (condition) params.set("condition", condition);
    if (transactionType) params.set("transactionType", transactionType);
    if (city) params.set("city", city);
    if (district) params.set("district", district);
    if (ward) params.set("ward", ward);
    params.set("sort", sort);
    params.set("page", String(page));
    return params.toString();
  }, [keyword, selectedCategories, minPrice, maxPrice, condition, transactionType, city, district, ward, sort, page]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const effectiveCategoryId = selectedCategories.length > 0 ? selectedCategories[0] : undefined;
      const response = await itemService.searchItems({
        q: keyword || undefined,
        categoryId: effectiveCategoryId || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        condition: condition || undefined,
        transactionType: transactionType || undefined,
        city: city || undefined,
        district: district || undefined,
        ward: ward || undefined,
        page,
        size: PAGE_SIZE,
        sort,
      });
      setItems(response.content);
      const { content: _, ...rest } = response;
      setPageInfo(rest);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword, selectedCategories, activeTabCategory, minPrice, maxPrice, condition, transactionType, city, district, ward, page, sort]);

  useEffect(() => {
    fetchItems();
    router.replace("/search?" + buildQueryString(), { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchItems]);

  const handleApplyFilters = () => {
    setSelectedCategories(pendingCategories);
    setActiveTabCategory(pendingCategories[0] ?? "");
    setMinPrice(pendingMinPrice);
    setMaxPrice(pendingMaxPrice);
    setCondition(pendingCondition);
    setTransactionType(pendingTransactionType);
    setCity(pendingCity);
    setDistrict(pendingDistrict);
    setWard(pendingWard);
    setPage(0);
    setShowMobileFilter(false);
  };

  const handleClearFilters = () => {
    setSelectedCategories([]); setPendingCategories([]);
    setMinPrice(""); setPendingMinPrice("");
    setMaxPrice(""); setPendingMaxPrice("");
    setCondition(""); setPendingCondition("");
    setTransactionType(""); setPendingTransactionType("");
    setCity(""); setPendingCity("");
    setDistrict(""); setPendingDistrict("");
    setWard(""); setPendingWard("");
    setActiveTabCategory("");
    setPage(0);
  };

  const totalPages = pageInfo?.totalPages ?? 0;
  const totalElements = pageInfo?.totalElements ?? 0;

  const getPaginationPages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) { for (let i = 0; i < totalPages; i++) pages.push(i); }
    else {
      pages.push(0);
      if (page > 3) pages.push("...");
      for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
      if (page < totalPages - 4) pages.push("...");
      pages.push(totalPages - 1);
    }
    return pages;
  };

  const pendingLocationParts = [pendingWard, pendingDistrict, pendingCity].filter(Boolean);
  const pendingLocationLabel = pendingLocationParts.length > 0 ? pendingLocationParts.join(", ") : "Toàn quốc";
  const applyPricePreset = (min: string, max: string) => {
    setPendingMinPrice(min);
    setPendingMaxPrice(max);
  };

  const FilterSidebarContent = () => (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Bộ lọc</h3>
        <button onClick={handleClearFilters} className="text-sm text-primary hover:underline font-medium" type="button">Xóa lọc</button>
      </div>

      <div>
        <h4 className="mb-2.5 font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          Danh mục
        </h4>
        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPendingCategories([])}
              className={"rounded-full px-3 py-1 text-xs font-medium border transition-colors " +
                (selectedPendingCategoryId === ""
                  ? "bg-primary text-white border-primary"
                  : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary")}
            >
              Tất cả
            </button>
            {featuredFilterCategories.map((cat) => (
              <button
                key={cat.categoryId}
                type="button"
                onClick={() => setPendingCategories([cat.categoryId])}
                className={"rounded-full px-3 py-1 text-xs font-medium border transition-colors " +
                  (selectedPendingCategoryId === cat.categoryId
                    ? "bg-primary text-white border-primary"
                    : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary")}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <SearchableCombobox
            label="Tìm danh mục khác"
            placeholder="Nhập tên danh mục..."
            value={selectedPendingCategoryName}
            onChange={(val) => setPendingCategories(val ? [val] : [])}
            options={selectableCategories.map((cat) => ({ label: cat.name, value: cat.categoryId }))}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-2.5 font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Khoảng giá (VND)
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Từ"
            value={pendingMinPrice}
            onChange={(e) => setPendingMinPrice(e.target.value.replace(/\D/g, ""))}
            className="w-1/2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Đến"
            value={pendingMaxPrice}
            onChange={(e) => setPendingMaxPrice(e.target.value.replace(/\D/g, ""))}
            className="w-1/2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => applyPricePreset("", "1000000")} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-primary hover:text-primary">Dưới 1 triệu</button>
          <button type="button" onClick={() => applyPricePreset("1000000", "3000000")} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-primary hover:text-primary">1 - 3 triệu</button>
          <button type="button" onClick={() => applyPricePreset("3000000", "5000000")} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-primary hover:text-primary">3 - 5 triệu</button>
          <button type="button" onClick={() => applyPricePreset("5000000", "10000000")} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-primary hover:text-primary">5 - 10 triệu</button>
          <button type="button" onClick={() => applyPricePreset("10000000", "")} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-primary hover:text-primary">Trên 10 triệu</button>
          <button type="button" onClick={() => applyPricePreset("", "")} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:border-primary hover:text-primary">Bỏ chọn</button>
        </div>
      </div>

      <div>
        <h4 className="mb-2.5 font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
          <MapPin className="w-4 h-4" />Địa điểm
        </h4>
        <button type="button" onClick={() => setShowLocationModal(true)}
          className={"w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm hover:border-primary transition-colors " + (pendingCity ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700")}>
          <MapPin className={"w-3.5 h-3.5 shrink-0 " + (pendingCity ? "text-primary" : "text-slate-400")} />
          <span className={"flex-1 text-left truncate " + (pendingCity ? "text-primary font-medium" : "text-slate-400")}>{pendingLocationLabel}</span>
          {pendingCity ? (
            <span role="button" onClick={(e) => { e.stopPropagation(); setPendingCity(""); setPendingDistrict(""); setPendingWard(""); }}
              className="text-slate-400 hover:text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></span>
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
        </button>
      </div>

      <div>
        <h4 className="mb-2.5 font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Tình trạng
        </h4>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button key={c.value} type="button" onClick={() => setPendingCondition(pendingCondition === c.value ? "" : c.value)}
              className={"rounded-full px-3 py-1 text-xs font-medium border transition-colors " + (pendingCondition === c.value ? "bg-primary text-white border-primary" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary")}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2.5 font-semibold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          Hình thức
        </h4>
        <div className="flex flex-wrap gap-2">
          {TRANSACTION_TYPES.map((t) => (
            <button key={t.value} type="button" onClick={() => setPendingTransactionType(pendingTransactionType === t.value ? "" : t.value)}
              className={"rounded-full px-3 py-1 text-xs font-medium border transition-colors " + (pendingTransactionType === t.value ? "bg-primary text-white border-primary" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleApplyFilters} className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors" type="button">
        Áp dụng
      </button>
    </div>
  );

  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
            <Link href="/home" className="hover:text-primary">Trang chủ</Link>
            <span>›</span>
            <span className="text-slate-700 dark:text-slate-300">Tất cả sản phẩm</span>
          </nav>

          {/* Search input box */}
          <form onSubmit={handleSearchSubmit} className="mb-5">
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-12 pr-32 py-3.5 text-sm text-slate-800 dark:text-slate-100 shadow-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => { setSearchInput(""); setKeyword(""); setPage(0); }}
                  className="absolute right-24 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
              >
                Tìm kiếm
              </button>
            </div>
          </form>

          <div className="mb-5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {keyword ? "Kết quả tìm kiếm: \"" + keyword + "\"" : "Khám phá sản phẩm"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Tìm thấy {totalElements.toLocaleString("vi-VN")} sản phẩm đang được rao bán</p>
          </div>

          <div className="mb-5 flex flex-col sm:flex-row sm:items-center gap-3">
            <button onClick={() => setShowMobileFilter(true)} className="lg:hidden flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 shrink-0" type="button">
              <SlidersHorizontal className="w-4 h-4" />Bộ lọc
            </button>

            <div className="flex gap-2 overflow-x-auto pb-1 flex-1" style={{ scrollbarWidth: "none" }}>
              <button key="" type="button" onClick={() => { setActiveTabCategory(""); setSelectedCategories([]); setPendingCategories([]); setPage(0); }}
                className={"shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors " + (activeTabCategory === "" ? "bg-primary text-white border-primary" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary")}>
                Tất cả
              </button>
              {categories.map((cat) => (
                <button key={cat.categoryId} type="button" onClick={() => { setActiveTabCategory(cat.categoryId); setSelectedCategories([cat.categoryId]); setPendingCategories([cat.categoryId]); setPage(0); }}
                  className={"shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors " + (activeTabCategory === cat.categoryId ? "bg-primary text-white border-primary" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary")}>
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-slate-500 hidden sm:inline whitespace-nowrap">Sắp xếp:</span>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(0); }} className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary outline-none">
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-6">
            <div className="hidden lg:block w-64 shrink-0">
              <div className="sticky top-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
                <FilterSidebarContent />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="animate-pulse rounded-xl bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
                      <div className="aspect-square bg-slate-200 dark:bg-slate-700" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">Không tìm thấy sản phẩm</h3>
                  <p className="text-slate-500 text-sm mb-4">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm</p>
                  <button onClick={handleClearFilters} className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primary/90" type="button">Xóa bộ lọc</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <article key={item.itemId} className="group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-sm hover:shadow-lg transition-all cursor-pointer">
                      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
                        <img src={getImageUrl(item)} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).src = "/icon-other/san-pham-khac.png"; }} />
                        {(item.transactionType === "GIVE_AWAY" || item.price === 0) && (<span className="absolute left-2 top-2 rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">MIỄN PHÍ</span>)}
                        {item.condition === "NEW" && <span className="absolute left-2 top-2 rounded-md bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">MỚI</span>}
                        <button type="button" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-400 hover:text-red-500 transition-colors"><Heart className="w-4 h-4" /></button>
                      </div>
                      <div className="flex flex-1 flex-col p-3">
                        <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 dark:text-slate-100">{item.title}</h3>
                        <p className="mt-1.5 text-base font-black text-primary">{formatPrice(item.price)}</p>
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-slate-500 min-w-0">
                            <MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{getLocation(item)}</span>
                          </div>
                          <span className="text-xs text-slate-400 shrink-0 ml-1">{item.createdAt ? timeAgo(item.createdAt) : ""}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1">
                  <button onClick={() => { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page === 0} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed" type="button"><ChevronLeft className="w-4 h-4" /></button>
                  {getPaginationPages().map((p, i) =>
                    p === "..." ? <span key={"e" + i} className="flex h-9 w-9 items-center justify-center text-slate-400 text-sm">...</span>
                    : <button key={p} onClick={() => { setPage(p as number); window.scrollTo({ top: 0, behavior: "smooth" }); }} className={"flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium " + (page === p ? "bg-primary text-white border border-primary" : "border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50")} type="button">{(p as number) + 1}</button>
                  )}
                  <button onClick={() => { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }} disabled={page >= totalPages - 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed" type="button"><ChevronRight className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showMobileFilter && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilter(false)} />
          <div className="relative ml-auto h-full w-80 max-w-full overflow-y-auto bg-white dark:bg-slate-800 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Bộ lọc</h3>
              <button onClick={() => setShowMobileFilter(false)} type="button" className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <FilterSidebarContent />
          </div>
        </div>
      )}

      {showLocationModal && (
        <LocationModal
          onClose={() => setShowLocationModal(false)}
          onApply={(c, d, w) => { setPendingCity(c); setPendingDistrict(d); setPendingWard(w); setShowLocationModal(false); }}
          initialCity={pendingCity}
          initialDistrict={pendingDistrict}
          initialWard={pendingWard}
          provinces={provinces}
        />
      )}
    </>
  );
}

// --- Searchable combobox ---
function SearchableCombobox({
  label, placeholder, value, onChange, options, disabled, loading,
}: {
  label: string; placeholder: string; value: string;
  onChange: (val: string) => void;
  options: { label: string; value: string }[];
  disabled?: boolean; loading?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = (opt: { label: string; value: string }) => {
    setQuery(opt.label);
    onChange(opt.value);
    setOpen(false);
  };

  const handleClear = () => { setQuery(""); onChange(""); setOpen(false); };

  return (
    <div ref={ref} className="relative">
      <p className="mb-1.5 text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</p>
      <div className={"flex items-center rounded-xl border bg-white dark:bg-slate-700 px-3 py-2.5 gap-2 " + (disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary") + " border-slate-200 dark:border-slate-600"}>
        <input
          type="text"
          value={loading ? "Đang tải..." : query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => !disabled && setOpen(true)}
          disabled={disabled || loading}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-w-0"
        />
        {query && !disabled && (
          <button type="button" onClick={handleClear} className="text-slate-400 hover:text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
        )}
        <ChevronDown className={"w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform " + (open ? "rotate-180" : "")} />
      </div>
      {open && !disabled && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg">
          {filtered.map((opt) => (
            <li key={opt.value}
              onMouseDown={(e) => { e.preventDefault(); handleSelect(opt); }}
              className={"px-4 py-2.5 text-sm cursor-pointer hover:bg-primary/10 hover:text-primary " + (opt.value === value ? "bg-primary/5 font-semibold text-primary" : "text-slate-700 dark:text-slate-300")}>
              {opt.label}
            </li>
          ))}
        </ul>
      )}
      {open && !disabled && filtered.length === 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg px-4 py-3 text-sm text-slate-400">Không tìm thấy</div>
      )}
    </div>
  );
}

function LocationModal({ onClose, onApply, initialCity, initialDistrict, initialWard, provinces }: {
  onClose: () => void;
  onApply: (city: string, district: string, ward: string) => void;
  initialCity: string;
  initialDistrict: string;
  initialWard: string;
  provinces: Province[];
}) {
  const [selProvince, setSelProvince] = useState(initialCity || "");
  const [selDistrict, setSelDistrict] = useState(initialDistrict || "");
  const [selWard, setSelWard] = useState(initialWard || "");
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  useEffect(() => {
    if (!selProvince) { setDistricts([]); setSelDistrict(""); setSelWard(""); return; }
    const found = provinces.find((p) => p.name === selProvince);
    if (!found) return;
    setLoadingDistricts(true);
    setSelDistrict(""); setSelWard(""); setWards([]);
    provinceService.getProvinceWithDistricts(found.code)
      .then((p) => setDistricts(p.districts ?? []))
      .catch(() => setDistricts([]))
      .finally(() => setLoadingDistricts(false));
  }, [selProvince, provinces]);

  useEffect(() => {
    if (!selDistrict) { setWards([]); setSelWard(""); return; }
    const found = districts.find((d) => d.name === selDistrict);
    if (!found) return;
    setLoadingWards(true);
    setSelWard("");
    provinceService.getDistrictWithWards(found.code)
      .then((d) => setWards(d.wards ?? []))
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selDistrict]);

  const provinceOptions = provinces.map((p) => ({ label: p.name, value: p.name }));
  const districtOptions = districts.map((d) => ({ label: d.name, value: d.name }));
  const wardOptions = wards.map((w) => ({ label: w.name, value: w.name }));

  const previewParts = [selWard, selDistrict, selProvince].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Chọn địa điểm</h3>
          <button onClick={onClose} type="button" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <SearchableCombobox
            label="Tỉnh / Thành phố"
            placeholder="Toàn quốc"
            value={selProvince}
            onChange={setSelProvince}
            options={provinceOptions}
          />
          <SearchableCombobox
            label="Quận / Huyện"
            placeholder={selProvince ? "Tất cả quận/huyện" : "Chọn tỉnh trước"}
            value={selDistrict}
            onChange={setSelDistrict}
            options={districtOptions}
            disabled={!selProvince}
            loading={loadingDistricts}
          />
          <SearchableCombobox
            label="Phường / Xã"
            placeholder={selDistrict ? "Tất cả phường/xã" : "Chọn quận/huyện trước"}
            value={selWard}
            onChange={setSelWard}
            options={wardOptions}
            disabled={!selDistrict}
            loading={loadingWards}
          />
          {previewParts.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-primary/5 px-3 py-2">
              <MapPin className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
              <span className="text-xs text-primary font-medium leading-relaxed">{previewParts.join(", ")}</span>
            </div>
          )}
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={() => onApply("", "", "")} type="button" className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Toàn quốc</button>
          <button onClick={() => onApply(selProvince, selDistrict, selWard)} type="button" className="flex-2 flex-grow rounded-xl bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors">Áp dụng</button>
        </div>
      </div>
    </div>
  );
}
