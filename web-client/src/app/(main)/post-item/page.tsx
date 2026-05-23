"use client";

import { ChevronRight, X } from "lucide-react";
import { useRouter } from "next/navigation";

const postCategories = [
  {
    id: "electronics",
    title: "Đồ điện tử",
    description: "Điện thoại, Laptop, Máy tính bảng, Linh kiện,...",
    icon: "/icon-other/do-dien-tu.png",
  },
  {
    id: "vehicles",
    title: "Xe cộ",
    description: "Ô tô, Xe máy, Xe đạp, Phụ tùng,...",
    icon: "/icon-other/xe-co.jpg",
  },
  {
    id: "household",
    title: "Nhà cửa & đời sống",
    description: "Đồ gia dụng, Nội thất, Bếp, Máy giặt,...",
    icon: "/icon-other/san-pham-khac.png",
  },
  {
    id: "fashion",
    title: "Thời trang & làm đẹp",
    description: "Quần áo, Giày dép, Túi xách, Phụ kiện,...",
    icon: "/icon-other/san-pham-khac.png",
  },
  {
    id: "hobby",
    title: "Giải trí & sở thích",
    description: "Đồ thể thao, Nhạc cụ, Đồ sưu tầm,...",
    icon: "/icon-other/san-pham-khac.png",
  },
];


export default function PostItemPage() {
  const router = useRouter();

  const handleSelectCategory = (categoryId: string) => {
    router.push(`/post-item/${categoryId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-3 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="relative border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-6 py-6">
          <button
            onClick={() => router.back()}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>

          <h1 className="text-center text-2xl font-bold text-slate-900">
            Đăng tin
          </h1>
        </div>

        <div className="px-6 pb-8 pt-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">
            Chọn danh mục
          </h2>

          <div className="grid gap-4">
            {postCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleSelectCategory(category.id)}
                className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg active:translate-y-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-amber-50 ring-1 ring-amber-100">
                    <img
                      src={category.icon}
                      alt={category.title}
                      className="h-10 w-10 object-contain"
                    />
                  </div>

                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {category.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      {category.description}
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={24}
                  className="shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
