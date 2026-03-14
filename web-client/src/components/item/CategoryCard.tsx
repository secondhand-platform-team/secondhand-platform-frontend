import type { LucideIcon } from "lucide-react";

type CategoryCardProps = {
  icon: LucideIcon;
  title: string;
  count: string;
};

export default function CategoryCard({ icon: Icon, title, count }: CategoryCardProps) {
  return (
    <article className="group rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_rgba(34,197,94,0.12)]">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 transition group-hover:bg-emerald-500 group-hover:text-white">
        <Icon size={24} />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{count}</p>
    </article>
  );
}