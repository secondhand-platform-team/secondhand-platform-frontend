"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  X,
  Image as ImageIcon,
  Trash2,
  AlertCircle,
  Loader,
} from "lucide-react";
import {
  categoryService,
  type CategoryAttribute,
} from "@/config/services/category.service";
import { itemService, type ItemRequest } from "@/config/services/item.service";

type TransactionType = "SELL" | "GIVEAWAY";
type ConditionType = "NEW" | "LIKE_NEW" | "USED" | "FOR_PARTS";

interface AttributeValue {
  code: string;
  value: unknown;
  dataType: string;
}

interface LocationData {
  address: string;
  ward?: string;
  district?: string;
  city?: string;
}

interface FormData {
  title: string;
  description: string;
  transactionType: TransactionType;
  condition: ConditionType;
  price: number;
  subcategoryId: string;
  attributes: AttributeValue[];
  location: LocationData;
  images: File[];
}

const categoryLabelMap: Record<string, string> = {
  vehicles: "Xe cộ",
  electronics: "Đồ điện tử",
  others: "Sản phẩm khác",
};

export default function PostItemFormPage() {
  const router = useRouter();
  const params = useParams<{ category: string; subcategory: string }>();
  const categoryKey = params?.category || "";
  const subcategoryId = params?.subcategory || "";

  const categoryLabel = categoryLabelMap[categoryKey] || "Danh mục";

  // State cho attributes từ API
  const [apiAttributes, setApiAttributes] = useState<CategoryAttribute[]>([]);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(true);
  const [attributeError, setAttributeError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    transactionType: "SELL",
    condition: "NEW",
    price: 0,
    subcategoryId: subcategoryId,
    attributes: [],
    location: {
      address: "",
      ward: "",
      district: "",
      city: "",
    },
    images: [],
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Load category attributes từ API
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        setIsLoadingAttributes(true);
        setAttributeError(null);

        const attrs =
          await categoryService.getCategoryAttributes(subcategoryId);

        console.log("Loaded attributes:", attrs);

        setApiAttributes(attrs);

        // Initialize form attributes từ API
        setFormData((prev) => ({
          ...prev,
          attributes: attrs.map((attr: CategoryAttribute) => ({
            code: attr.code,
            value: "",
            dataType: attr.dataType,
          })),
        }));
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Lỗi tải attributes";
        setAttributeError(errorMsg);
        console.error("Failed to load attributes:", error);
      } finally {
        setIsLoadingAttributes(false);
      }
    };

    if (subcategoryId) {
      loadAttributes();
    }
  }, [subcategoryId]);

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!formData.title.trim()) errs.title = "Tiêu đề không được để trống";
    if (formData.transactionType === "SELL" && formData.price <= 0) {
      errs.price = "Giá phải lớn hơn 0";
    }
    return errs;
  }, [formData.title, formData.transactionType, formData.price]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData((prev) => ({ ...prev, images: [...prev.images, ...files] }));

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAttribute = (code: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.map((attr) =>
        attr.code === code ? { ...attr, value } : attr,
      ),
    }));
  };

  const removeAttribute = (code: string) => {
    setFormData((prev) => ({
      ...prev,
      attributes: prev.attributes.filter((attr) => attr.code !== code),
    }));
  };

  const renderAttributeField = (attr: CategoryAttribute, value: unknown) => {
    // Parse optionsJson if it exists
    let options: Array<{ label: string; value: string }> = [];
    if (attr.optionsJson) {
      try {
        options = JSON.parse(attr.optionsJson);
      } catch (e) {
        console.error("Failed to parse options:", e);
      }
    }

    const valueStr = String(value || "");

    const commonProps = {
      value: valueStr,
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
      ) => updateAttribute(attr.code, e.target.value),
      className:
        "rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20",
      placeholder: attr.required ? `${attr.name} (bắt buộc)` : attr.name,
    };

    switch (attr.dataType) {
      case "TEXT":
        return <input type="text" {...commonProps} />;

      case "NUMBER":
        return (
          <input
            type="number"
            {...commonProps}
            min={attr.minValueNumber}
            max={attr.maxValueNumber}
          />
        );

      case "DATE":
        return <input type="date" {...commonProps} />;

      case "TEXTAREA":
        return (
          <textarea
            {...commonProps}
            rows={3}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        );

      case "SELECT":
        return (
          <select {...commonProps}>
            <option value="">-- Chọn {attr.name} --</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      default:
        return <input type="text" {...commonProps} />;
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(errors).length > 0) {
      setSubmitError("Vui lòng kiểm tra lại biểu mẫu");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Map attributes with code and value
      const attributes = formData.attributes.map((attr) => ({
        code: attr.code,
        value: attr.value,
      }));

      // Map transactionType: SELL → SELL, GIVEAWAY → GIVEWAY
      const transactionTypeMap: Record<TransactionType, "SELL" | "GIVEWAY"> = {
        SELL: "SELL",
        GIVEAWAY: "GIVEWAY",
      };

      const submitData: ItemRequest = {
        title: formData.title,
        description: formData.description,
        condition: formData.condition,
        categoryId: formData.subcategoryId,
        transactionType: transactionTypeMap[formData.transactionType],
        price: formData.transactionType === "SELL" ? formData.price : null,
        location: formData.location,
        attributes,
      };

      console.log("Form submitted with data:", submitData);
      console.log("Images to upload:", formData.images);

      // Send to backend with images
      const response = await itemService.createItem(
        submitData,
        formData.images.length > 0 ? formData.images : undefined,
      );

      console.log("Item created successfully:", response);

      // Navigate to home or item detail page
      alert("✅ Đã tạo tin thành công!");
      router.push("/home");
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Lỗi không xác định";
      console.error("Error submitting form:", error);
      setSubmitError(`❌ Lỗi: ${errorMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-6">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Đăng tin</h1>
            <p className="mt-1 text-slate-600">{categoryLabel}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-slate-600 transition hover:bg-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form Card */}
        <div className="space-y-6 rounded-3xl bg-white p-6 shadow-md ring-1 ring-slate-200 sm:p-8">
          {/* Error loading attributes */}
          {attributeError && (
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle size={20} className="shrink-0 text-red-600" />
              <div>
                <p className="font-medium text-red-900">
                  Lỗi tải thông tin danh mục
                </p>
                <p className="text-sm text-red-700">{attributeError}</p>
              </div>
            </div>
          )}

          {/* Error submitting form */}
          {submitError && (
            <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
              <AlertCircle size={20} className="shrink-0 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Lỗi gửi tin</p>
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          )}

          {/* Transaction Type */}
          <div>
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Loại giao dịch
            </label>
            <div className="flex gap-3">
              {(["SELL", "GIVEAWAY"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, transactionType: type }))
                  }
                  className={`flex-1 rounded-xl py-3 px-4 font-semibold transition ${
                    formData.transactionType === type
                      ? "bg-primary text-white"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {type === "SELL" ? "Bán" : "Cho miễn phí"}
                </button>
              ))}
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Tình trạng sản phẩm *
            </label>
            <select
              value={formData.condition}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  condition: e.target.value as ConditionType,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="NEW">Như mới</option>
              <option value="LIKE_NEW">Gần như mới</option>
              <option value="USED">Đã sử dụng</option>
              <option value="FOR_PARTS">Bán linh kiện</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Tiêu đề *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Nhập tiêu đề sản phẩm"
              className={`w-full rounded-xl border px-4 py-2.5 transition focus:outline-none focus:ring-2 ${
                errors.title
                  ? "border-red-300 focus:ring-red-200"
                  : "border-slate-200 focus:ring-primary/20"
              }`}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Price (conditional) */}
          {formData.transactionType === "SELL" && (
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Giá (VNĐ) *
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: Math.max(0, parseInt(e.target.value) || 0),
                  }))
                }
                placeholder="0"
                min="0"
                className={`w-full rounded-xl border px-4 py-2.5 transition focus:outline-none focus:ring-2 ${
                  errors.price
                    ? "border-red-300 focus:ring-red-200"
                    : "border-slate-200 focus:ring-primary/20"
                }`}
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price}</p>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Mô tả sản phẩm của bạn..."
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Địa điểm
            </label>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.location.address}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    location: { ...prev.location, address: e.target.value },
                  }))
                }
                placeholder="Địa chỉ cụ thể"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={formData.location.ward || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location, ward: e.target.value },
                    }))
                  }
                  placeholder="Phường/Xã"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  value={formData.location.district || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location, district: e.target.value },
                    }))
                  }
                  placeholder="Quận/Huyện"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <input
                  type="text"
                  value={formData.location.city || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: { ...prev.location, city: e.target.value },
                    }))
                  }
                  placeholder="Thành phố"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Attributes */}
          <div>
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Thông tin chi tiết
            </label>

            {isLoadingAttributes ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <Loader size={20} className="animate-spin mr-2" />
                <span>Đang tải...</span>
              </div>
            ) : apiAttributes.length > 0 ? (
              <div className="space-y-3 mb-4">
                {apiAttributes
                  .filter((attr) =>
                    formData.attributes.some((a) => a.code === attr.code),
                  )
                  .map((attr) => {
                    const currentValue =
                      formData.attributes.find((a) => a.code === attr.code)
                        ?.value || "";

                    return (
                      <div key={attr.code} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                            {attr.name}
                            {attr.required && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          {renderAttributeField(attr, currentValue)}
                        </div>
                        {formData.transactionType === "GIVEAWAY" && (
                          <button
                            type="button"
                            onClick={() => removeAttribute(attr.code)}
                            className="mt-7 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                            title="Xoá thông tin này"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-4">
                Không có thông tin chi tiết cho danh mục này
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Hình ảnh
            </label>

            {imagePreviews.length > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="group relative">
                    <img
                      src={preview}
                      alt="preview"
                      className="h-24 w-full rounded-lg border border-slate-200 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 transition hover:bg-slate-100">
              <ImageIcon size={20} className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">
                Tải ảnh lên
              </span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-slate-200 px-6 py-3 font-semibold text-slate-900 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={Object.keys(errors).length > 0 || isSubmitting}
              className="flex-1 rounded-xl bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader size={18} className="animate-spin" />}
              {isSubmitting ? "Đang gửi..." : "Đăng tin"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
