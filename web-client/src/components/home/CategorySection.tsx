"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Category = {
  slug: string;
  icon: string;
  name: string;
};

type CategorySectionProps = {
  categories: Category[];
};

export default function CategorySection({ categories }: CategorySectionProps) {
  const CATEGORIES_PER_ROW = 6;
  const INITIAL_ROWS = 3;
  const EXPAND_ROWS_PER_CLICK = 2;
  const INITIAL_CATEGORY_CELLS = INITIAL_ROWS * CATEGORIES_PER_ROW - 1;
  const EXPAND_STEP = EXPAND_ROWS_PER_CLICK * CATEGORIES_PER_ROW;

  const [visibleCount, setVisibleCount] = useState(INITIAL_CATEGORY_CELLS);

  const canShowMore = categories.length > visibleCount;
  const canCollapse = visibleCount > INITIAL_CATEGORY_CELLS;

  const visibleCategories = useMemo(() => {
    if (!canShowMore && categories.length <= INITIAL_ROWS * CATEGORIES_PER_ROW) {
      return categories;
    }

    return categories.slice(0, visibleCount);
  }, [canShowMore, categories, visibleCount]);

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + EXPAND_STEP, categories.length));
  };

  const handleCollapse = () => {
    setVisibleCount(INITIAL_CATEGORY_CELLS);
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" id="categories">
      <h2 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl">
        Danh mục nổi bật
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {visibleCategories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="group flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-primary/10 bg-white p-5 transition-all hover:border-primary hover:shadow-md dark:bg-slate-800"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-all group-hover:bg-primary">
              <img
                src={category.icon}
                alt=""
                className=" object-contain transition-all group-hover:brightness-0 group-hover:invert"
              />
            </div>
            <span className="text-center text-sm font-semibold">
              {category.name}
            </span>
          </Link>
        ))}

        {canShowMore ? (
          <button
            type="button"
            onClick={handleShowMore}
            className="group flex items-center justify-center rounded-xl border border-dashed border-primary/50 bg-white p-5 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-primary/5 dark:bg-slate-800"
          >
            Xem thêm
          </button>
        ) : null}

        {canCollapse ? (
          <button
            type="button"
            onClick={handleCollapse}
            className="group flex items-center justify-center rounded-xl border border-dashed border-slate-400 bg-white p-5 text-sm font-semibold text-slate-700 transition-all hover:border-slate-500 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200"
          >
            Thu gọn
          </button>
        ) : null}
      </div>
    </section>
  );
}
