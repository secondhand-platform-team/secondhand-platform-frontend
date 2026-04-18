"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { message } from "antd";
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
  type ChildCategory,
} from "@/config/services/category.service";
import provinceService from "@/config/services/province.service";
import { itemService } from "@/config/services/item.service";
import type { ItemRequest } from "@/types/item.type";
import type { District, Province, Ward } from "@/types/province.type";
import { useAppSelector, useAppDispatch } from "@/stores/hooks";
import { fetchCurrentUser } from "@/stores/slices/auth.slice";
import PaymentRedirectModal from "@/components/payment/PaymentRedirectModal";

type TransactionType = "SELL" | "GIVE_AWAY";
type ConditionType = "NEW" | "LIKE_NEW" | "USED" | "FOR_PARTS";
type SubmitTransactionType = "SELL" | "GIVE_AWAY" | "FREE_SELL";

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

  // Get user from auth store
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const categoryLabel = categoryLabelMap[categoryKey] || "Danh mục";
  const freeSellRemaining = user?.freeSellUsed ?? user?.freeSellUse ?? 0;

  // State cho attributes từ API
  const [apiAttributes, setApiAttributes] = useState<CategoryAttribute[]>([]);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(true);
  const [attributeError, setAttributeError] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<ChildCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [detailedAddress, setDetailedAddress] = useState("");

  // Payment states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{
    transactionId: string;
    paymentUrl: string;
  } | null>(null);

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

  const buildAddress = ({
    detail,
    ward,
    district,
    city,
  }: {
    detail?: string;
    ward?: string;
    district?: string;
    city?: string;
  }) => [detail, ward, district, city].filter(Boolean).join(", ");

  // Load category attributes và category data từ API
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        setIsLoadingAttributes(true);
        setAttributeError(null);

        const attrs =
          await categoryService.getCategoryAttributes(subcategoryId);

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

        // Also load category data to get postingFee
        try {
          const response = await categoryService.getCategoryById(subcategoryId);
          const categoryInfo = response.data || response;
          const childCategory: ChildCategory = {
            categoryId: categoryInfo.id,
            name: categoryInfo.name,
            icon: categoryInfo.icon,
            postingFee: categoryInfo.postingFee ?? 0,
          };
          setCategoryData(childCategory);
        } catch {
          // Silently fail - category fee not loaded, user will still be able to post
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Lỗi tải attributes";
        setAttributeError(errorMsg);
      } finally {
        setIsLoadingAttributes(false);
      }
    };

    if (subcategoryId) {
      loadAttributes();
    }
  }, [subcategoryId]);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setIsLoadingLocation(true);
        const data = await provinceService.getProvinces();
        setProvinces(data);
      } catch {
        setSubmitError("Không tải được dữ liệu địa điểm. Vui lòng thử lại.");
      } finally {
        setIsLoadingLocation(false);
      }
    };

    loadProvinces();
  }, []);

  const handleCityChange = async (cityCode: string) => {
    const selectedProvince = provinces.find(
      (province) => String(province.code) === cityCode,
    );

    setFormData((prev) => {
      const nextCity = selectedProvince?.name || "";
      return {
        ...prev,
        location: {
          ...prev.location,
          city: nextCity,
          district: "",
          ward: "",
          address: buildAddress({ detail: detailedAddress, city: nextCity }),
        },
      };
    });

    setDistricts([]);
    setWards([]);

    if (!selectedProvince) return;

    try {
      setIsLoadingLocation(true);
      const provinceDetail = await provinceService.getProvinceWithDistricts(
        selectedProvince.code,
      );
      setDistricts(provinceDetail.districts || []);
    } catch {
      setSubmitError("Không tải được quận/huyện. Vui lòng thử lại.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleDistrictChange = async (districtCode: string) => {
    const selectedDistrict = districts.find(
      (district) => String(district.code) === districtCode,
    );

    setFormData((prev) => {
      const nextDistrict = selectedDistrict?.name || "";
      return {
        ...prev,
        location: {
          ...prev.location,
          district: nextDistrict,
          ward: "",
          address: buildAddress({
            detail: detailedAddress,
            district: nextDistrict,
            city: prev.location.city,
          }),
        },
      };
    });

    setWards([]);

    if (!selectedDistrict) return;

    try {
      setIsLoadingLocation(true);
      const districtDetail = await provinceService.getDistrictWithWards(
        selectedDistrict.code,
      );
      setWards(districtDetail.wards || []);
    } catch {
      setSubmitError("Không tải được phường/xã. Vui lòng thử lại.");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleWardChange = (wardCode: string) => {
    const selectedWard = wards.find((ward) => String(ward.code) === wardCode);
    setFormData((prev) => {
      const nextWard = selectedWard?.name || "";
      return {
        ...prev,
        location: {
          ...prev.location,
          ward: nextWard,
          address: buildAddress({
            detail: detailedAddress,
            ward: nextWard,
            district: prev.location.district,
            city: prev.location.city,
          }),
        },
      };
    });
  };

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

      const transactionTypeMap: Record<TransactionType, SubmitTransactionType> =
        {
          SELL: freeSellRemaining > 0 ? "FREE_SELL" : "SELL",
          GIVE_AWAY: "GIVE_AWAY",
        };

      const submitData: ItemRequest = {
        title: formData.title,
        description: formData.description,
        condition: formData.condition,
        categoryId: formData.subcategoryId,
        transactionType: transactionTypeMap[formData.transactionType],
        price: formData.transactionType === "SELL" ? formData.price : 0,
        location: formData.location,
        attributes,
      };

      // Send to backend with images
      const response = await itemService.createItem(
        submitData,
        formData.images.length > 0 ? formData.images : undefined,
      );

      const itemResponse = response as unknown as Record<string, unknown>;

      // Check if payment is required
      if (itemResponse?.paymentUrl && itemResponse?.transactionId) {
        // Show payment modal
        setPaymentInfo({
          transactionId: itemResponse.transactionId as string,
          paymentUrl: itemResponse.paymentUrl as string,
        });
        setIsPaymentModalOpen(true);
      } else {
        // Refresh user data to update freeSellUse
        await dispatch(fetchCurrentUser()).unwrap();
        message.success("✅ Đã tạo tin thành công!");
        router.push("/home");
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Lỗi không xác định";
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
              {(["SELL", "GIVE_AWAY"] as const).map((type) => (
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

          {/* Image Upload */}
          <div>
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Hình ảnh
            </label>

            {imagePreviews.length > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-3">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="group relative h-24 w-full">
                    <Image
                      src={preview}
                      alt="preview"
                      fill
                      className="rounded-lg border border-slate-200 object-cover"
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
                value={detailedAddress}
                onChange={(e) => {
                  const detail = e.target.value;
                  setDetailedAddress(detail);
                  setFormData((prev) => ({
                    ...prev,
                    location: {
                      ...prev.location,
                      address: buildAddress({
                        detail,
                        ward: prev.location.ward,
                        district: prev.location.district,
                        city: prev.location.city,
                      }),
                    },
                  }));
                }}
                placeholder="Số nhà, tên đường..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 transition focus:outline-none focus:ring-2 focus:ring-primary/20"
              />

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <select
                  value={String(
                    provinces.find((p) => p.name === formData.location.city)
                      ?.code || "",
                  )}
                  onChange={(e) => void handleCityChange(e.target.value)}
                  disabled={isLoadingLocation}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Chọn Tỉnh/Thành phố</option>
                  {provinces.map((province) => (
                    <option key={province.code} value={province.code}>
                      {province.name}
                    </option>
                  ))}
                </select>

                <select
                  value={String(
                    districts.find((d) => d.name === formData.location.district)
                      ?.code || "",
                  )}
                  onChange={(e) => void handleDistrictChange(e.target.value)}
                  disabled={!formData.location.city || isLoadingLocation}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Chọn Quận/Huyện</option>
                  {districts.map((district) => (
                    <option key={district.code} value={district.code}>
                      {district.name}
                    </option>
                  ))}
                </select>

                <select
                  value={String(
                    wards.find((w) => w.name === formData.location.ward)
                      ?.code || "",
                  )}
                  onChange={(e) => handleWardChange(e.target.value)}
                  disabled={!formData.location.district || isLoadingLocation}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Chọn Phường/Xã</option>
                  {wards.map((ward) => (
                    <option key={ward.code} value={ward.code}>
                      {ward.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700">
                {formData.location.address ||
                  "Địa chỉ sẽ hiển thị sau khi bạn chọn địa điểm"}
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
                        {formData.transactionType === "GIVE_AWAY" && (
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

          {/* GIVEAWAY notification */}
          {formData.transactionType === "GIVE_AWAY" && (
            <div className="rounded-xl bg-blue-50 p-4 border border-blue-200">
              <p className="text-sm text-blue-900 font-semibold">
                ✨ Đăng tin miễn phí
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Loại &quot;Cho miễn phí&quot; không tính vào số lượt đăng tin.
                Bạn có thể đăng không giới hạn.
              </p>
            </div>
          )}

          {/* Posting Fee Info - Only for SELL type */}
          {formData.transactionType === "SELL" && user && categoryData && (
            <div
              className={`rounded-xl p-4 border ${
                freeSellRemaining > 0
                  ? "bg-green-50 border-green-200"
                  : categoryData.postingFee && categoryData.postingFee > 0
                    ? "bg-orange-50 border-orange-200"
                    : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      freeSellRemaining > 0
                        ? "text-green-900"
                        : categoryData.postingFee && categoryData.postingFee > 0
                          ? "text-orange-900"
                          : "text-green-900"
                    }`}
                  >
                    {freeSellRemaining > 0
                      ? "✅ Đăng tin miễn phí"
                      : categoryData.postingFee && categoryData.postingFee > 0
                        ? "💰 Cần trả phí"
                        : "✅ Danh mục miễn phí"}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      freeSellRemaining > 0
                        ? "text-green-700"
                        : categoryData.postingFee && categoryData.postingFee > 0
                          ? "text-orange-700"
                          : "text-green-700"
                    }`}
                  >
                    {freeSellRemaining > 0
                      ? `Còn ${freeSellRemaining} lần đăng tin miễn phí`
                      : categoryData.postingFee && categoryData.postingFee > 0
                        ? `Cần trả ${categoryData.postingFee.toLocaleString("vi-VN")} VNĐ để đăng`
                        : "Danh mục này cho phép đăng tin miễn phí"}
                  </p>
                </div>
              </div>
            </div>
          )}

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
              {isSubmitting
                ? "Đang gửi..."
                : formData.transactionType === "GIVE_AWAY"
                  ? "Đăng tin (Miễn phí)"
                  : freeSellRemaining > 0
                    ? `Đăng tin (Miễn phí)`
                    : categoryData?.postingFee && categoryData.postingFee > 0
                      ? `Đăng tin (${categoryData.postingFee.toLocaleString("vi-VN")} VNĐ)`
                      : "Đăng tin"}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Redirect Modal */}
      {paymentInfo && (
        <PaymentRedirectModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPaymentInfo(null);
          }}
          paymentUrl={paymentInfo.paymentUrl}
          transactionId={paymentInfo.transactionId}
          itemTitle={formData.title}
        />
      )}
    </div>
  );
}
