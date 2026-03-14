/* eslint-disable @next/next/no-img-element */

import { Heart, MapPin } from "lucide-react";

type ProductCardProps = {
  title: string;
  image: string;
  location: string;
  price: string;
  badge?: string;
};

export default function ProductCard({ title, image, location, price, badge }: ProductCardProps) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
      <div className="relative aspect-[1/1.05] overflow-hidden bg-slate-100">
        <img src={image} alt={title} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
        <button
          type="button"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm"
          aria-label={`Save ${title}`}
        >
          <Heart size={18} />
        </button>
        {badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-semibold text-white">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-base font-semibold text-slate-950">{title}</h3>
          <span className="whitespace-nowrap text-lg font-bold text-emerald-500">{price}</span>
        </div>
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
          <MapPin size={15} />
          {location}
        </p>
        <button
          type="button"
          className="mt-5 w-full rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500 hover:text-white"
        >
          Xem chi tiết
        </button>
      </div>
    </article>
  );
}