"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import http from "@/utils/api";
import type { CategoryType } from "@/types/item/item.type";
import {
  Laptop, Shirt, Home, Car, Activity, Book, Gamepad2, Sparkles, Package, Box
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Icon mapping dựa trên tên danh mục (sử dụng icon vector để luôn nét và đồng bộ)
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  "Điện tử": Laptop,
  "Thời trang": Shirt,
  "Nhà cửa": Home,
  "Xe cộ": Car,
  "Phương tiện": Car,
  "Thể thao": Activity,
  "Sách": Book,
  "Đồ chơi": Gamepad2,
  "Mỹ phẩm": Sparkles,
  "Sản phẩm khác": Package,
};

function getIcon(category: CategoryType): LucideIcon {
  return CATEGORY_ICON_MAP[category.name] ?? Box;
}

export default function CategorySection() {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    http
      .get<CategoryType[]>("/core/api/categories/top-level")
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  const handleClick = (category: CategoryType) => {
    router.push(`/category/${category.categoryId}`);
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" id="categories">
        <h2 className="mb-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Danh mục nổi bật
        </h2>
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex w-36 sm:w-44 flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-800 p-6"
            >
              <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-20 rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" id="categories">
      <h2 className="mb-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        Danh mục nổi bật
      </h2>
      <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
        {categories.map((category) => {
          const Icon = getIcon(category);
          return (
            <div
              key={category.categoryId}
              onClick={() => handleClick(category)}
              className="group flex w-36 sm:w-44 cursor-pointer flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-white">
                <Icon className="w-8 h-8" strokeWidth={1.5} />
              </div>
              <span className="text-center text-sm font-semibold text-slate-700 transition-colors group-hover:text-primary dark:text-slate-300">
                {category.name}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
