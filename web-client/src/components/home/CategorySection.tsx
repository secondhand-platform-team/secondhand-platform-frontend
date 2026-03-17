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
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold tracking-tight mb-8">
        Danh mục nổi bật
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {categories.map((category) => (
          <div
            key={category.title}
            className="group flex flex-col items-center gap-3 rounded-xl border border-[#4cae4f]/10 bg-white dark:bg-slate-800 p-6 transition-all hover:shadow-md hover:border-[#4cae4f] cursor-pointer"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#4cae4f]/10 text-[#4cae4f] transition-all group-hover:bg-[#4cae4f]">
              <img
                src={category.icon}
                alt=""
                className=" object-contain transition-all group-hover:brightness-0 group-hover:invert"
              />
            </div>
            <span className="text-sm font-bold text-center">
              {category.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
