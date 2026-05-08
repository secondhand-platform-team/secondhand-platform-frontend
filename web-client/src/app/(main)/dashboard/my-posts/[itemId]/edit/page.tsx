"use client";
import type { ItemWithImages } from "@/types/item.type";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { message, Spin } from "antd";
import {
  CloseOutlined,
  PictureOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { itemService,  } from "@/stores/slices/items.slice";
import provinceService from "@/services/province.service";
import type { District, Province, Ward } from "@/types/province.type";
import { useAppSelector } from "@/stores/hooks";

type ConditionType = "NEW" | "LIKE_NEW" | "USED" | "FOR_PARTS";
type TransactionType = "SELL" | "GIVE_AWAY";

interface LocationData {
  address: string;
  ward?: string;
  district?: string;
  city?: string;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ itemId: string }>();
  const itemId = params?.itemId || "";
  const { isAuth, loading: authLoading } = useAppSelector((state) => state.auth);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<ItemWithImages | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [condition, setCondition] = useState<ConditionType>("USED");
  const [transactionType, setTransactionType] = useState<TransactionType>("SELL");
  const [location, setLocation] = useState<LocationData>({ address: "" });
  const [detailedAddress, setDetailedAddress] = useState("");

  // Location data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Existing images
  const [existingImages, setExistingImages] = useState<Array<{ imageId: string; imageUrl: string; isPrimary: boolean }>>([]);

  // New images to upload
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuth) {
      message.warning("Vui lòng đăng nhập");
      router.push("/home");
      return;
    }
    loadItem();
    loadProvinces();
  }, [isAuth, authLoading, itemId]);

  const loadItem = async () => {
    try {
      setPageLoading(true);
      const data = await itemService.getItem(itemId);
      setItem(data);
      setTitle(data.title || "");
      setDescription(data.description || "");
      setPrice(data.price ?? 0);
      setCondition((data.condition as ConditionType) || "USED");
      setTransactionType((data.transactionType as TransactionType) || "SELL");
      setExistingImages(data.images || []);

      if (data.location) {
        setLocation(data.location);
        setDetailedAddress(data.location.address?.split(",")[0]?.trim() || "");
      }
    } catch {
      message.error("Không thể tải thông tin sản phẩm");
      router.push("/dashboard/my-posts");
    } finally {
      setPageLoading(false);
    }
  };

  const loadProvinces = async () => {
    try {
      const data = await provinceService.getProvinces();
      setProvinces(data);
    } catch { }
  };

  const handleCityChange = async (cityCode: string) => {
    const selected = provinces.find((p) => String(p.code) === cityCode);
    setLocation((prev) => ({ ...prev, city: selected?.name || "", district: "", ward: "" }));
    setDistricts([]);
    setWards([]);
    if (!selected) return;
    try {
      const detail = await provinceService.getProvinceWithDistricts(selected.code);
      setDistricts(detail.districts || []);
    } catch { }
  };

  const handleDistrictChange = async (districtCode: string) => {
    const selected = districts.find((d) => String(d.code) === districtCode);
    setLocation((prev) => ({ ...prev, district: selected?.name || "", ward: "" }));
    setWards([]);
    if (!selected) return;
    try {
      const detail = await provinceService.getDistrictWithWards(selected.code);
      setWards(detail.wards || []);
    } catch { }
  };

  const handleWardChange = (wardCode: string) => {
    const selected = wards.find((w) => String(w.code) === wardCode);
    setLocation((prev) => ({ ...prev, ward: selected?.name || "" }));
  };

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setNewPreviews((prev) => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const errors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Tiêu đề không được để trống";
    if (transactionType === "SELL" && price <= 0) errs.price = "Giá phải lớn hơn 0";
    return errs;
  }, [title, transactionType, price]);

  const buildAddress = () => {
    return [detailedAddress, location.ward, location.district, location.city].filter(Boolean).join(", ");
  };

  const handleSave = async () => {
    if (Object.keys(errors).length > 0) {
      message.error("Vui lòng kiểm tra lại biểu mẫu");
      return;
    }

    setSaving(true);
    try {
      await itemService.updateItem(itemId, {
        title,
        description,
        price: transactionType === "SELL" ? price : 0,
        condition,
        transactionType,
        location: { ...location, address: buildAddress() },
      });

      message.success("Cập nhật tin đăng thành công!");
      router.push("/dashboard/my-posts");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Spin size="large" />
        <p className="text-sm text-slate-500">Đang tải thông tin sản phẩm...</p>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/my-posts")}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
            <ArrowLeftOutlined />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chỉnh sửa tin đăng</h1>
            <p className="text-sm text-slate-500 mt-0.5">ID: {itemId.substring(0, 8)}...</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-lg hover:shadow-emerald-500/30">
          {saving ? <Spin size="small" /> : <SaveOutlined />}
          Lưu thay đổi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-bold text-slate-800">Thông tin cơ bản</h2>

            {/* Transaction Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Loại giao dịch</label>
              <div className="flex gap-3">
                {(["SELL", "GIVE_AWAY"] as const).map((t) => (
                  <button key={t} onClick={() => setTransactionType(t)}
                    className={`flex-1 rounded-xl py-2.5 font-semibold transition text-sm ${transactionType === t ? "bg-emerald-500 text-white shadow-md" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                    {t === "SELL" ? "Bán" : "Cho miễn phí"}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề sản phẩm"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${errors.title ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:ring-emerald-200"}`} />
              {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
            </div>

            {/* Condition */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tình trạng</label>
              <select value={condition} onChange={(e) => setCondition(e.target.value as ConditionType)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-200">
                <option value="NEW">Mới 100%</option>
                <option value="LIKE_NEW">Như mới</option>
                <option value="USED">Đã sử dụng</option>
                <option value="FOR_PARTS">Bán linh kiện</option>
              </select>
            </div>

            {/* Price */}
            {transactionType === "SELL" && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Giá (VNĐ) *</label>
                <input type="number" value={price} min="0"
                  onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 ${errors.price ? "border-red-300 focus:ring-red-200" : "border-slate-200 focus:ring-emerald-200"}`} />
                {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price}</p>}
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mô tả chi tiết</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                rows={5} placeholder="Mô tả sản phẩm của bạn..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Địa điểm</h2>
            <input type="text" value={detailedAddress}
              onChange={(e) => setDetailedAddress(e.target.value)}
              placeholder="Số nhà, tên đường..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select value={String(provinces.find((p) => p.name === location.city)?.code || "")}
                onChange={(e) => void handleCityChange(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200">
                <option value="">Tỉnh/Thành phố</option>
                {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
              </select>
              <select value={String(districts.find((d) => d.name === location.district)?.code || "")}
                onChange={(e) => void handleDistrictChange(e.target.value)}
                disabled={!location.city}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50">
                <option value="">Quận/Huyện</option>
                {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
              </select>
              <select value={String(wards.find((w) => w.name === location.ward)?.code || "")}
                onChange={(e) => handleWardChange(e.target.value)}
                disabled={!location.district}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:opacity-50">
                <option value="">Phường/Xã</option>
                {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
              </select>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-2.5 text-sm text-slate-600">
              {buildAddress() || "Địa chỉ sẽ hiển thị sau khi bạn chọn"}
            </div>
          </div>
        </div>

        {/* Right Column - Images & Preview */}
        <div className="space-y-5">
          {/* Images Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Hình ảnh</h2>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Ảnh hiện tại</p>
                <div className="grid grid-cols-3 gap-2">
                  {existingImages.map((img, idx) => (
                    <div key={img.imageId || idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      {img.isPrimary && (
                        <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">Chính</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Image Previews */}
            {newPreviews.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Ảnh mới</p>
                <div className="grid grid-cols-3 gap-2">
                  {newPreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square group">
                      <img src={preview} alt="" className="w-full h-full object-cover rounded-xl border border-slate-200" />
                      <button onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                        <CloseOutlined style={{ fontSize: 10 }} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 transition hover:bg-slate-100">
              <PictureOutlined className="text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Tải thêm ảnh</span>
              <input type="file" multiple accept="image/*" onChange={handleNewImageUpload} className="hidden" />
            </label>
          </div>

          {/* Preview Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Xem trước</h2>
            <div className="space-y-3">
              <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden">
                {existingImages[0] ? (
                  <img src={existingImages[0].imageUrl} alt="" className="w-full h-full object-cover" />
                ) : newPreviews[0] ? (
                  <img src={newPreviews[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <PictureOutlined style={{ fontSize: 32 }} />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{title || "Tiêu đề sản phẩm"}</h3>
              <p className="text-lg font-black text-emerald-600">
                {transactionType === "GIVE_AWAY" ? "Miễn phí" : price > 0 ? price.toLocaleString("vi-VN") + "đ" : "—"}
              </p>
              <p className="text-xs text-slate-500 line-clamp-2">{description || "Mô tả..."}</p>
            </div>
          </div>

          {/* Save Button (mobile) */}
          <button onClick={handleSave} disabled={saving}
            className="w-full lg:hidden inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white px-6 py-3 rounded-xl font-bold transition-colors shadow-lg">
            {saving ? <Spin size="small" /> : <SaveOutlined />}
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
