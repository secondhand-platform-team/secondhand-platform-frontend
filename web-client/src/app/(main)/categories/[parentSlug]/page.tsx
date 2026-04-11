"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import {
    fetchProductsByParentAndChildrenSlug,
    fetchParentCategoryBySlug,
    fetchChildCategoriesByParentSlug,
} from "@/stores/slices/category.slide";
import { getCategoryIconBySlug } from "@/utils/category-icon";

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

export default function CategoryChildrenPage() {
    const dispatch = useAppDispatch();
    const params = useParams<{ parentSlug?: string }>();
    const parentSlug = params?.parentSlug;
    const { loading, selectedParent, childCategories, productsByParentAndChildren, error } = useAppSelector((state) => state.category);
    const [searchName, setSearchName] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");

    useEffect(() => {
        if (!parentSlug) {
            return;
        }

        dispatch(fetchParentCategoryBySlug(parentSlug));
        dispatch(fetchChildCategoriesByParentSlug(parentSlug));
        dispatch(fetchProductsByParentAndChildrenSlug(parentSlug));
    }, [dispatch, parentSlug]);

    const filteredProducts = useMemo(() => {
        const min = minPrice ? Number(minPrice) : 0;
        const max = maxPrice ? Number(maxPrice) : Number.POSITIVE_INFINITY;
        const keyword = searchName.trim().toLowerCase();

        return productsByParentAndChildren.filter((item) => {
            const matchesName = keyword ? item.title.toLowerCase().includes(keyword) : true;
            const matchesPrice = item.price >= min && item.price <= max;
            return matchesName && matchesPrice;
        });
    }, [maxPrice, minPrice, productsByParentAndChildren, searchName]);

    return (
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-medium text-primary">Danh mục</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{selectedParent?.name || "Danh mục"}</h1>
            <p className="mt-2 text-slate-600">Chọn danh mục con để xem sản phẩm phù hợp.</p>

            {loading ? <p className="mt-6 text-sm text-slate-500">Đang tải danh mục con...</p> : null}
            {error ? <p className="mt-6 text-sm text-red-500">{error}</p> : null}

            {!loading && childCategories.length === 0 ? (
                <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                    Danh mục này chưa có danh mục con.
                </div>
            ) : null}

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {childCategories
                    .filter((category) => Boolean(category.slug))
                    .map((category) => (
                        <Link
                            key={category.categoryId}
                            href={`/categories/${parentSlug}/${category.slug}`}
                            className="group flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-primary hover:shadow-md"
                        >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                                <img
                                    src={getCategoryIconBySlug(category.slug)}
                                    alt={category.name}
                                    className="h-9 w-9 object-contain"
                                />
                            </div>
                            <h2 className="text-center text-sm font-semibold text-slate-800">{category.name}</h2>
                        </Link>
                    ))}
            </div>

            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-slate-900">Sản phẩm trong danh mục này</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Bao gồm sản phẩm đăng ở danh mục cha và toàn bộ danh mục con.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
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

                {filteredProducts.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                        Không có sản phẩm phù hợp bộ lọc.
                    </div>
                ) : (
                    <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                )}
            </div>
        </section>
    );
}
