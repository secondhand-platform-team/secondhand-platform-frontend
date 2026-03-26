"use client";

import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
  message,
} from "antd";
import {
  CircleHelp,
  Eye,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  MapPin,
  Rocket,
  Settings,
  SquarePen,
  Tag,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { createPost, fetchCategories } from "@/stores/slices/item.slice";
import type {
  ItemCondition,
  ItemStatus,
  TransactionType,
} from "@/types/item/item.type";
import Image from "next/image";

const BRAND_GREEN = "#4CAF50";
const BRAND_GREEN_DARK = "#3f9f46";
const BRAND_GREEN_SOFT = "#EAF6EC";
const BORDER_COLOR = "#E3E7ED";
const PAGE_BG = "#F2F4F7";

const conditionOptions: { label: string; value: ItemCondition }[] = [
  { label: "Mới", value: "NEW" },
  { label: "Mới (Chưa sử dụng)", value: "LIKE_NEW" },
  { label: "Đã sử dụng", value: "USED" },
  { label: "Thanh lý linh kiện", value: "FOR_PARTS" },
];

export default function PostNewPage() {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuth } = useAppSelector((state) => state.auth);
  const { categories, submitting } = useAppSelector((state) => state.item);
  const [freePost, setFreePost] = useState(false);

  useEffect(() => {
    if (!isAuth) {
      message.warning("Vui lòng đăng nhập hoặc đăng ký để đăng tin");
      router.replace("/home?auth=1");
    }
  }, [isAuth, router]);

  useEffect(() => {
    if (!isAuth) {
      return;
    }

    dispatch(fetchCategories());
  }, [dispatch, isAuth]);

  if (!isAuth) {
    return null;
  }

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.categoryId,
  }));

  const onFinish = async (values: {
    title: string;
    description: string;
    categoryId: string;
    condition: ItemCondition;
    status: ItemStatus;
    city: string;
    district: string;
    address: string;
    price?: number;
  }) => {
    const transactionType: TransactionType = freePost ? "GIVE_AWAY" : "SELL";
    const payload = {
      title: values.title,
      description: values.description,
      categoryId: values.categoryId,
      condition: values.condition,
      status: values.status,
      transactionType,
      price: freePost ? 1 : values.price || 0,
      location: {
        city: values.city,
        district: values.district,
        address: values.address,
      },
    };

    try {
      await dispatch(createPost(payload)).unwrap();
      message.success("Đăng tin thành công");
      router.push("/my-posts");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Không thể đăng tin");
    }
  };

  const blockStyle: CSSProperties = {
    background: "#fff",
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: 12,
    padding: 16,
  };

  return (
    <div style={{ background: PAGE_BG }} className="min-h-[calc(100vh-73px)] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 lg:flex-row">
        <aside className="w-full lg:w-[250px] lg:shrink-0">
          <div style={blockStyle}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Quản lý</p>
            <div className="space-y-2">
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                <LayoutGrid size={15} /> Tổng quan
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white"
                style={{ background: BRAND_GREEN }}
              >
                <SquarePen size={15} /> Đăng tin mới
              </button>
              <button
                onClick={() => router.push("/my-posts")}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <FileText size={15} /> Tin đang đăng
              </button>
              <button
                onClick={() => router.push("/favorites")}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <Tag size={15} /> Tin đã lưu
              </button>
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50">
                <Settings size={15} /> Cài đặt
              </button>
            </div>
          </div>

          <div
            className="mt-4 rounded-xl border px-3 py-4"
            style={{ background: BRAND_GREEN_SOFT, borderColor: "#D5EAD9" }}
          >
            <p className="mb-2 flex items-center gap-1 text-sm font-semibold" style={{ color: BRAND_GREEN_DARK }}>
              <CircleHelp size={14} /> Mẹo đăng tin nhanh
            </p>
            <p className="text-xs leading-relaxed text-slate-600">
              Sử dụng hình ảnh rõ nét và mô tả chi tiết giúp món đồ của bạn được tìm thấy nhanh hơn 40%.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          <Typography.Title level={2} className="!mb-1 !text-[36px] !font-extrabold !leading-tight !text-slate-900">
            Đăng tin rao bán
          </Typography.Title>
          <Typography.Paragraph className="!mb-4 !text-slate-500">
            Chia sẻ món đồ của bạn với cộng đồng, hoàn toàn miễn phí.
          </Typography.Paragraph>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ condition: "LIKE_NEW", status: "AVAILABLE", price: 0 }}
            requiredMark={false}
          >
            <div style={blockStyle}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon size={16} color={BRAND_GREEN} />
                  <span className="font-bold text-slate-800">Hình ảnh sản phẩm</span>
                </div>
                <span className="text-xs text-slate-400">Tối đa 6 ảnh</span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="flex h-[118px] flex-col items-center justify-center rounded-lg border border-dashed bg-slate-50 text-slate-400" style={{ borderColor: "#D6DCE5" }}>
                  <ImageIcon size={22} />
                  <span className="mt-2 text-xs">Tải ảnh lên</span>
                </div>
                <div className="h-[118px] overflow-hidden rounded-lg border" style={{ borderColor: BORDER_COLOR }}>
                  <Image
                    src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop"
                    alt="Ảnh minh họa sản phẩm"
                    width={800}
                    height={600}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="h-[118px] rounded-lg border bg-slate-100" style={{ borderColor: BORDER_COLOR }} />
                <div className="h-[118px] rounded-lg border bg-slate-100" style={{ borderColor: BORDER_COLOR }} />
              </div>
            </div>

            <div className="mt-4" style={blockStyle}>
              <div className="mb-3 flex items-center gap-2">
                <FileText size={16} color={BRAND_GREEN} />
                <span className="font-bold text-slate-800">Thông tin cơ bản</span>
              </div>

              <Form.Item
                name="title"
                label={<span className="text-xs font-semibold text-slate-600">Tiêu đề món đồ *</span>}
                rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
                className="!mb-3"
              >
                <Input placeholder="VD: iPhone 12 Pro Max 128GB màu Xanh" className="h-[40px]" />
              </Form.Item>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Form.Item
                  name="categoryId"
                  label={<span className="text-xs font-semibold text-slate-600">Danh mục *</span>}
                  rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
                  className="!mb-3"
                >
                  <Select options={categoryOptions} placeholder="Chọn danh mục" className="h-[40px]" />
                </Form.Item>

                <Form.Item
                  name="condition"
                  label={<span className="text-xs font-semibold text-slate-600">Tình trạng *</span>}
                  rules={[{ required: true, message: "Vui lòng chọn tình trạng" }]}
                  className="!mb-3"
                >
                  <Select options={conditionOptions} className="h-[40px]" />
                </Form.Item>
              </div>

              <div className="mb-1 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-slate-600">Giá bán</span>
                <div className="flex items-center gap-2">
                  <Switch checked={freePost} onChange={setFreePost} />
                  <span className="text-sm text-slate-500">Tặng miễn phí</span>
                </div>
              </div>

              <Form.Item
                name="price"
                rules={freePost ? [] : [{ required: true, message: "Vui lòng nhập giá" }]}
                className="!mb-3"
              >
                <InputNumber min={0} disabled={freePost} className="!h-[40px] !w-full" />
              </Form.Item>

              <Form.Item name="status" initialValue="AVAILABLE" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name="description"
                label={<span className="text-xs font-semibold text-slate-600">Mô tả chi tiết *</span>}
                rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
                className="!mb-0"
              >
                <Input.TextArea rows={4} placeholder="Mô tả về tình trạng sản phẩm, lý do bán, các phụ kiện đi kèm..." />
              </Form.Item>
            </div>

            <div className="mt-4" style={blockStyle}>
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={16} color={BRAND_GREEN} />
                <span className="font-bold text-slate-800">Địa điểm & Giao dịch</span>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Form.Item
                  name="city"
                  label={<span className="text-xs font-semibold text-slate-600">Tỉnh / Thành phố *</span>}
                  rules={[{ required: true, message: "Vui lòng nhập tỉnh/thành" }]}
                  className="!mb-3"
                >
                  <Input placeholder="Chọn Tỉnh/Thành phố" className="h-[40px]" />
                </Form.Item>

                <Form.Item
                  name="district"
                  label={<span className="text-xs font-semibold text-slate-600">Quận / Huyện *</span>}
                  rules={[{ required: true, message: "Vui lòng nhập quận/huyện" }]}
                  className="!mb-3"
                >
                  <Input placeholder="Chọn Quận/Huyện" className="h-[40px]" />
                </Form.Item>
              </div>

              <Form.Item
                name="address"
                label={<span className="text-xs font-semibold text-slate-600">Địa chỉ cụ thể</span>}
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}
                className="!mb-3"
              >
                <Input placeholder="Số nhà, tên đường, phường/xã..." className="h-[40px]" />
              </Form.Item>

              <div className="flex h-[94px] items-center justify-center rounded-lg border bg-slate-100" style={{ borderColor: BORDER_COLOR }}>
                <Button className="!rounded-md !border !border-[#CDE7D2] !bg-white !text-xs !font-semibold" style={{ color: BRAND_GREEN_DARK }}>
                  NHẤN ĐỂ CHỈNH VỊ TRÍ
                </Button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Button icon={<Eye size={16} />} className="!h-[48px] !rounded-[10px] !border !border-[#D8DDE5] !bg-white !font-semibold !text-slate-700">
                Xem trước
              </Button>
              <Button
                htmlType="submit"
                loading={submitting}
                icon={<Rocket size={16} />}
                className="!h-[48px] !rounded-[10px] !border-0 !font-semibold !text-white"
                style={{ background: BRAND_GREEN }}
              >
                Đăng tin ngay
              </Button>
            </div>
          </Form>
        </section>
      </div>
    </div>
  );
}
