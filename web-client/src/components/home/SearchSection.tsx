"use client";

export default function SearchSection() {
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
              className="w-full rounded-lg border-none bg-slate-100 py-3 pl-11 pr-4 text-sm focus:ring-2 focus:ring-primary dark:bg-slate-700"
              placeholder="Tìm kiếm đồ cũ, quần áo, nội thất..."
              type="text"
            />
          </div>
          <button className="cursor-pointer rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90">
            Tìm kiếm
          </button>
        </div>
      </div>
    </section>
  );
}
