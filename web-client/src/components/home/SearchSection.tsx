"use client";

export default function SearchSection() {
  return (
    <section className="relative -mt-12 mx-auto max-w-4xl px-4 pb-16">
      <div className="rounded-xl bg-white dark:bg-slate-800 p-3 shadow-2xl border border-[#4cae4f]/5">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-grow">
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
              className="w-full rounded-lg border-none bg-slate-100 dark:bg-slate-700 py-4 pl-12 pr-4 text-base focus:ring-2 focus:ring-[#4cae4f]"
              placeholder="Tìm kiếm đồ cũ, quần áo, nội thất..."
              type="text"
            />
          </div>
          <button className="rounded-lg bg-[#4cae4f] px-8 py-4 font-bold text-white hover:bg-[#4cae4f]/90 transition-all cursor-pointer">
            Tìm kiếm
          </button>
        </div>
      </div>
    </section>
  );
}
