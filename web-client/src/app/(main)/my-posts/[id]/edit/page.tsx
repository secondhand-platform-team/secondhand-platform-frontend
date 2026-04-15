"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  message,
  Spin,
  Upload,
  Image as AntImage,
  Tag,
} from "antd";
import { ArrowLeft, Image as ImageIcon, Trash2 } from "lucide-react";
import {
  itemService,
  type ItemWithImages,
} from "@/config/services/item.service";
import { useAppSelector } from "@/stores/hooks";
import type { ItemRequest } from "@/types/item.type";
import type { UploadFile } from "antd";
import provinceService from "@/config/services/province.service";
import type { Province, District, Ward } from "@/types/province.type";

const conditionOptions = [
  { label: "Mới", value: "NEW" },
  { label: "Như mới", value: "LIKE_NEW" },
  { label: "Đã sử dụng", value: "USED" },
  { label: "Lấy linh kiện", value: "FOR_PARTS" },
];

const statusOptions = [
  { label: "Hoạt động", value: "ACTIVE" },
  { label: "Nháp", value: "DRAFT" },
  { label: "Đã đặt cọc", value: "RESERVED" },
  { label: "Đã bán", value: "SOLD" },
  { label: "Ẩn", value: "HIDDEN" },
];

interface EditFormData {
  title: string;
  description: string;
  price: number;
  condition: string;
  status: string;
  address: string;
  ward?: string;
  district?: string;
  city?: string;
}

type FormFieldName = keyof EditFormData;

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const itemId = params?.id || "";
  const { isAuth } = useAppSelector((state) => state.auth || {});

  const [form] = Form.useForm<EditFormData>();
  const [item, setItem] = useState<ItemWithImages | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");

  // Load item data
  useEffect(() => {
    if (!isAuth) {
      message.warning("Vui lòng đăng nhập");
      router.push("/home");
      return;
    }

    const loadItem = async () => {
      try {
        setLoading(true);
        const data = await itemService.getItem(itemId);
        setItem(data);

        form.setFieldsValue({
          title: data.title,
          description: data.description,
          price: data.price || 0,
          condition: data.condition,
          status: data.status || "DRAFT",
          address: data.location?.address || "",
          city: data.location?.city,
          district: data.location?.district,
          ward: data.location?.ward,
        });

        if (data.location?.city) {
          setSelectedCity(data.location.city);
        }
        if (data.location?.district) {
          setSelectedDistrict(data.location.district);
        }
      } catch (err) {
        message.error("Không thể tải dữ liệu tin đăng");
        router.push("/my-posts");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      loadItem();
    }
  }, [itemId, isAuth, router, form]);

  // Load provinces
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const data = await provinceService.getProvinces();
        setProvinces(data);

        // Load districts for selected city
        if (selectedCity) {
          const province = data.find((p) => p.name === selectedCity);
          if (province) {
            const provinceDetail =
              await provinceService.getProvinceWithDistricts(province.code);
            setDistricts(provinceDetail.districts || []);

            // Load wards for selected district
            if (selectedDistrict) {
              const district = provinceDetail.districts?.find(
                (d) => d.name === selectedDistrict,
              );
              if (district) {
                const districtDetail =
                  await provinceService.getDistrictWithWards(district.code);
                setWards(districtDetail.wards || []);
              }
            }
          }
        }
      } catch {
        message.error("Không thể tải danh sách địa điểm");
      }
    };

    loadProvinces();
  }, [selectedCity, selectedDistrict]);

  const handleCityChange = (city: string) => {
    setSelectedCity(city);
    setSelectedDistrict("");
    form.setFieldsValue({
      city,
      district: undefined,
      ward: undefined,
    });
  };

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district);
    form.setFieldsValue({
      district,
      ward: undefined,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setImagesToDelete((prev) => [...prev, imageId]);
  };

  const onFinish = async (values: EditFormData) => {
    try {
      setSubmitting(true);

      const updateData: Partial<ItemRequest> = {
        title: values.title,
        description: values.description,
        price: values.price,
        condition: values.condition,
        location: {
          address: values.address,
          city: values.city,
          district: values.district,
          ward: values.ward,
        },
      };

      // Call update API
      await itemService.updateItem(itemId, updateData);

      message.success("Cập nhật tin đăng thành công!");
      router.push("/my-posts");
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Không thể cập nhật tin đăng";
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card>
          <p className="text-red-600">Không tìm thấy tin đăng</p>
          <Button
            type="primary"
            onClick={() => router.push("/my-posts")}
            className="mt-4"
          >
            Quay lại
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="mx-auto max-w-4xl px-4">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Chỉnh sửa tin đăng
          </h1>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.submit();
          }}
        >
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Thông tin cơ bản
              </h2>
              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                autoComplete="off"
              >
                <Form.Item
                  label="Tiêu đề"
                  name="title"
                  rules={[
                    { required: true, message: "Vui lòng nhập tiêu đề" },
                    { min: 3, message: "Tiêu đề phải có ít nhất 3 ký tự" },
                  ]}
                >
                  <Input placeholder="Nhập tiêu đề tin đăng" size="large" />
                </Form.Item>

                <Form.Item
                  label="Mô tả"
                  name="description"
                  rules={[
                    { required: true, message: "Vui lòng nhập mô tả" },
                    { min: 10, message: "Mô tả phải có ít nhất 10 ký tự" },
                  ]}
                >
                  <Input.TextArea
                    placeholder="Mô tả chi tiết về sản phẩm"
                    rows={5}
                  />
                </Form.Item>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Tình trạng"
                    name="condition"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder="Chọn tình trạng"
                      options={conditionOptions}
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Trạng thái"
                    name="status"
                    rules={[{ required: true }]}
                  >
                    <Select
                      placeholder="Chọn trạng thái"
                      options={statusOptions}
                      size="large"
                    />
                  </Form.Item>
                </div>

                <Form.Item
                  label="Giá (₫)"
                  name="price"
                  rules={[
                    { required: true, message: "Vui lòng nhập giá" },
                    {
                      validator: (_, value) => {
                        if (value > 0) return Promise.resolve();
                        return Promise.reject(new Error("Giá phải lớn hơn 0"));
                      },
                    },
                  ]}
                >
                  <InputNumber
                    placeholder="Nhập giá"
                    size="large"
                    formatter={(value) =>
                      `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                    }
                    parser={(value) => parseInt(value!.replace(/,/g, ""), 10)}
                    min={0}
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <Form.Item label="Tỉnh/Thành phố" name="city">
                    <Select
                      placeholder="Chọn tỉnh/thành phố"
                      options={provinces.map((p) => ({
                        label: p.name,
                        value: p.name,
                      }))}
                      onChange={handleCityChange}
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item label="Quận/Huyện" name="district">
                    <Select
                      placeholder="Chọn quận/huyện"
                      options={districts.map((d) => ({
                        label: d.name,
                        value: d.name,
                      }))}
                      onChange={handleDistrictChange}
                      disabled={!selectedCity}
                      size="large"
                    />
                  </Form.Item>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <Form.Item label="Phường/Xã" name="ward">
                    <Select
                      placeholder="Chọn phường/xã"
                      options={wards.map((w) => ({
                        label: w.name,
                        value: w.name,
                      }))}
                      disabled={!selectedDistrict}
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item label="Địa chỉ chi tiết" name="address">
                    <Input placeholder="Ví dụ: 123 Đường ABC" size="large" />
                  </Form.Item>
                </div>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    loading={submitting}
                  >
                    Cập nhật tin đăng
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* Images */}
            <Card>
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Hình ảnh
              </h2>

              {/* Existing Images */}
              {item.images && item.images.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3 text-gray-700">
                    Ảnh hiện tại
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {item.images
                      .filter((img) => !imagesToDelete.includes(img.imageId))
                      .map((img) => (
                        <div key={img.imageId} className="relative group">
                          <AntImage
                            src={img.imageUrl}
                            alt="item"
                            preview
                            className="w-full h-32 object-cover rounded border"
                          />
                          {img.isPrimary && (
                            <Tag color="blue" className="absolute top-2 left-2">
                              Chính
                            </Tag>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img.imageId)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white rounded"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              <div>
                <h3 className="font-medium mb-3 text-gray-700">Thêm ảnh mới</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <ImageIcon size={32} className="text-gray-400 mb-2" />
                    <p className="text-gray-600">
                      Nhấn để chọn ảnh hoặc kéo thả
                    </p>
                  </label>
                </div>

                {imageFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imageFiles.map((file, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          className="w-full h-32 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(idx)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white rounded"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
