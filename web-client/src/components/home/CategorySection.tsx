"use client";

type Category = {
  icon: string;
  title: string;
};

type CategorySectionProps = {
  categories: Category[];
};

export default function CategorySection({ categories }: CategorySectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8" id="categories">
      <h2 className="mb-6 text-xl font-bold tracking-tight sm:text-2xl">
        Danh mục nổi bật
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {categories.map((category) => (
          <div
            key={category.title}
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
              {category.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
