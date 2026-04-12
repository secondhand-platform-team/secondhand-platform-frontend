"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, MapPin, Tag } from "lucide-react";
import http from "@/utils/api";
import type { CategoryType, ItemResponseType } from "@/types/item/item.type";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
};

const formatDate = (date?: string) => {
  if (!date) {
    return "Không rõ";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
};

const getPrimaryImage = (
  images?: Array<{ imageUrl: string; isPrimary?: boolean }>,
) => {
  if (!images || images.length === 0) {
    return "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=1200&q=80";
  }

  const primary = images.find((img) => img.isPrimary);
  return primary?.imageUrl || images[0].imageUrl;
};

const getGallery = (item?: ItemResponseType | null) => {
  if (!item?.itemImageList || item.itemImageList.length === 0) {
    return [getPrimaryImage(undefined)];
  }

  return item.itemImageList.map((img) => img.imageUrl);
};

const formatLabel = (value?: string) => {
  if (!value) {
    return "Không rõ";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function ProductDetailPage() {
  const params = useParams<{ itemId?: string }>();
  const itemId = params?.itemId;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<ItemResponseType | null>(null);
  const [category, setCategory] = useState<CategoryType | null>(null);
  const [similarProducts, setSimilarProducts] = useState<ItemResponseType[]>(
    [],
  );
  const [activeImage, setActiveImage] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!itemId) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const detail = await http.get<ItemResponseType>(
          `core/api/items/${itemId}`,
        );
        const detailData = !Array.isArray(detail) ? detail : detail[0];
        setItem(detailData);

        let categoryData: CategoryType | null = null;
        try {
          const catResponse = await http.get<CategoryType>(
            `core/api/categories/${detailData.categoryId}`,
          );
          categoryData = !Array.isArray(catResponse) ? catResponse : catResponse[0];
          setCategory(categoryData);
        } catch {
          setCategory(null);
        }

        let productsInCategory: ItemResponseType[] = [];
        try {
          if (categoryData?.slug) {
            const response = await http.get<ItemResponseType[]>(
              `core/api/items/category/slug/${categoryData.slug}`,
            );
            productsInCategory = Array.isArray(response)
              ? response
              : response.data || [];
          } else {
            const response = await http.get<ItemResponseType[]>(
              `core/api/items/category/${detailData.categoryId}`,
            );
            productsInCategory = Array.isArray(response)
              ? response
              : response.data || [];
          }
        } catch {
          productsInCategory = [];
        }

        setSimilarProducts(
          productsInCategory
            .filter((product) => product.itemId !== detailData.itemId)
            .slice(0, 8),
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Không thể tải chi tiết sản phẩm",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [itemId]);

  const gallery = useMemo(() => getGallery(item), [item]);

  useEffect(() => {
    setActiveImage(gallery[0] || "");
  }, [gallery]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-sm text-slate-500">
          Đang tải chi tiết sản phẩm...
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-600">
          {error}
        </div>
      </section>
    );
  }

  if (!item) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Không tìm thấy sản phẩm.
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="text-sm text-slate-500">
        <Link href="/home" className="hover:text-primary">
          Trang chủ
        </Link>
        <span> / </span>
        {category?.slug ? (
          <Link
            href={`/categories/${category.slug}`}
            className="hover:text-primary"
          >
            {category.name}
          </Link>
        ) : (
          <span>{category?.name || "Danh mục"}</span>
        )}
        <span> / </span>
        <span className="font-medium text-slate-700">{item.title}</span>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            <img
              src={activeImage || getPrimaryImage(undefined)}
              alt={item.title}
              className="h-full w-full object-cover"
            />
          </div>

          {gallery.length > 1 ? (
            <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {gallery.map((image) => (
                <button
                  type="button"
                  key={image}
                  onClick={() => setActiveImage(image)}
                  className={`overflow-hidden rounded-xl border ${
                    activeImage === image
                      ? "border-primary"
                      : "border-slate-200"
                  }`}
                >
                  <img
                    src={image}
                    alt={item.title}
                    className="h-20 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-2xl font-bold text-slate-900">{item.title}</h1>
          <p className="mt-3 text-3xl font-extrabold text-primary">
            {formatPrice(item.price)}
          </p>

          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p className="inline-flex items-center gap-2">
              <Tag size={16} />
              Danh mục:{" "}
              <span className="font-medium text-slate-800">
                {category?.name || item.categoryId}
              </span>
            </p>
            <p className="inline-flex items-center gap-2">
              <MapPin size={16} />
              Địa điểm:{" "}
              {item.location?.district && item.location?.city
                ? `${item.location.district}, ${item.location.city}`
                : "Toàn quốc"}
            </p>
            <p className="inline-flex items-center gap-2">
              <CalendarDays size={16} />
              Đăng lúc: {formatDate(item.createdAt)}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
            <p>
              <span className="text-slate-500">Tình trạng:</span>{" "}
              <span className="font-medium text-slate-800">
                {formatLabel(item.condition)}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Loại giao dịch:</span>{" "}
              <span className="font-medium text-slate-800">
                {formatLabel(item.transactionType)}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Trạng thái:</span>{" "}
              <span className="font-medium text-slate-800">
                {formatLabel(item.status)}
              </span>
            </p>
            <p>
              <span className="text-slate-500">Mã người bán:</span>{" "}
              <span className="font-medium text-slate-800">
                {item.userId}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Mô tả sản phẩm
        </h2>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-slate-700">
          {item.description || "Người bán chưa bổ sung mô tả."}
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Thuộc tính chi tiết
        </h2>
        {!item.attributes || item.attributes.length === 0 ? (
          <p className="mt-3 text-slate-500">
            Sản phẩm chưa có thuộc tính bổ sung.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {item.attributes.map((attribute) => (
              <div
                key={attribute.code}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <p className="text-xs uppercase tracking-wide text-slate-500">
                  {attribute.code}
                </p>
                <p className="mt-1 font-medium text-slate-800">
                  {String(attribute.value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">
          Sản phẩm tương tự
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Các sản phẩm cùng danh mục với tin này.
        </p>

        {similarProducts.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            Chưa có sản phẩm tương tự trong danh mục.
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similarProducts.map((product) => (
              <Link
                key={product.itemId}
                href={`/products/${product.itemId}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-primary hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden bg-slate-100">
                  <img
                    src={getPrimaryImage(product.itemImageList)}
                    alt={product.title}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
                    {product.title}
                  </h3>
                  <p className="mt-2 text-base font-bold text-primary">
                    {formatPrice(product.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
