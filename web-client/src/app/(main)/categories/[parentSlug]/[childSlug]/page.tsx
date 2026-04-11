"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
    fetchChildCategoryBySlug,
    fetchParentCategoryBySlug,
    fetchProductsByCategorySlug,
} from "@/stores/slices/category.slide";

const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
};

const getPrimaryImage = (images?: Array<{ imageUrl: string; isPrimary?: boolean }>) => {
    if (!images || images.length === 0) {
        return "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80";
    }

    const primary = images.find((img) => img.isPrimary);
    return primary?.imageUrl || images[0].imageUrl;
};

export default function CategoryProductsPage() {
    const dispatch = useAppDispatch();
    const params = useParams<{ parentSlug?: string; childSlug?: string }>();
    const parentSlug = params?.parentSlug;
    const childSlug = params?.childSlug;
    const { loading, selectedParent, selectedChild, productsByCategory, error } = useAppSelector((state) => state.category);
    const [searchName, setSearchName] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    useEffect(() => {
        if (!parentSlug || !childSlug) {
            return;
        }

        dispatch(fetchParentCategoryBySlug(parentSlug));
        dispatch(fetchChildCategoryBySlug(childSlug));
        dispatch(fetchProductsByCategorySlug(childSlug));
    }, [dispatch, parentSlug, childSlug]);

    const filteredProducts = useMemo(() => {
        const min = minPrice ? Number(minPrice) : 0;
        const max = maxPrice ? Number(maxPrice) : Number.POSITIVE_INFINITY;
        const keyword = searchName.trim().toLowerCase();

        return productsByCategory.filter((item) => {
            const matchesName = keyword ? item.title.toLowerCase().includes(keyword) : true;
            const matchesPrice = item.price >= min && item.price <= max;
            return matchesName && matchesPrice;
        });
    }, [maxPrice, minPrice, productsByCategory, searchName]);

    return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="text-sm text-slate-500">
                <Link href="/home" className="hover:text-primary">Trang chủ</Link>
                <span> / </span>
                <Link href={`/categories/${selectedParent?.slug || ""}`} className="hover:text-primary">
                    {selectedParent?.name || "Danh mục"}
                </Link>
                <span> / </span>
                <span className="font-medium text-slate-700">{selectedChild?.name || "Sản phẩm"}</span>
            </div>

            <h1 className="mt-3 text-2xl font-bold text-slate-900">{selectedChild?.name || "Sản phẩm theo danh mục"}</h1>

            {loading ? <p className="mt-6 text-sm text-slate-500">Đang tải sản phẩm...</p> : null}
            {error ? <p className="mt-6 text-sm text-red-500">{error}</p> : null}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Lọc theo tên sản phẩm"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                    type="number"
                    min={0}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="Giá từ"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <input
                    type="number"
                    min={0}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Giá đến"
                    className="rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary"
                />
            </div>

            {!loading && filteredProducts.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                    Không có sản phẩm phù hợp bộ lọc.
                </div>
            ) : null}

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filteredProducts.map((item) => (
                    <article
                        key={item.itemId}
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                    >
                        <div className="aspect-square overflow-hidden bg-slate-100">
                            <img
                                src={getPrimaryImage(item.itemImageList)}
                                alt={item.title}
                                className="h-full w-full object-cover"
                            />
                        </div>

                        <div className="p-4">
                            <h3 className="line-clamp-2 text-base font-semibold text-slate-900">{item.title}</h3>
                            <p className="mt-2 text-lg font-bold text-primary">{formatPrice(item.price)}</p>
                            <p className="mt-2 inline-flex items-center gap-1 text-sm text-slate-500">
                                <MapPin size={14} />
                                {item.location?.district && item.location?.city
                                    ? `${item.location.district}, ${item.location.city}`
                                    : "Toàn quốc"}
                            </p>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
