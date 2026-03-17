"use client";

type Product = {
  title: string;
  image: string;
  price: string;
  location: string;
  isFree: boolean;
};

type FeaturedProductsSectionProps = {
  products: Product[];
};

export default function FeaturedProductsSection({
  products,
}: FeaturedProductsSectionProps) {
  return (
    <section className="bg-[#4cae4f]/5 py-16 dark:bg-[#4cae4f]/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">
            Sản phẩm nổi bật
          </h2>
          <a
            className="text-sm font-bold text-[#4cae4f] hover:underline cursor-pointer"
            href="#"
          >
            Xem tất cả
          </a>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.title}
              className="group relative flex flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-800 shadow-sm transition-all hover:shadow-xl cursor-pointer"
            >
              <div className="aspect-square w-full overflow-hidden bg-slate-200">
                <img
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  alt={product.title}
                  src={product.image}
                />
                {product.isFree && (
                  <div className="absolute left-3 top-3 rounded-lg bg-[#4cae4f] px-2 py-1 text-xs font-bold text-white uppercase">
                    Tặng miễn phí
                  </div>
                )}
                <button className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                  <img
                    src="/icon-other/favorite.png"
                    className="material-symbols-outlined text-xl"
                    alt="favorite"
                  />
                </button>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {product.title}
                </h3>
                <p className="mt-2 text-xl font-black text-[#4cae4f]">
                  {product.price}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs text-slate-500">
                  <img
                    src="/icon-other/location.png"
                    className="material-symbols-outlined text-sm"
                    alt="location"
                  />
                  <span>{product.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
