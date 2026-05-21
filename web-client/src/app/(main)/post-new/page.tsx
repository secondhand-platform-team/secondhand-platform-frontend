"use client";

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag as AntTag,
  Typography,
  Upload,
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
import {
  createNewItem,
  deleteItemThunk,
  fetchCategories,
  fetchMyFavorites,
  fetchMyItems,
  toggleItemFavorite,
  updateItemStatusThunk,
} from "@/stores/slices/items.slice";
import type {
  ItemCondition,
  ItemResponse,
  ItemStatus,
  TransactionType,
} from "@/types/item.type";
import type { District, Province, Ward } from "@/types/province.type";
import type { UploadFile } from "antd/es/upload/interface";
import type { ColumnsType } from "antd/es/table";
import provinceService from "@/services/province.service";

const BRAND_GREEN = "#4CAF50";
const BRAND_GREEN_DARK = "#3f9f46";
const BRAND_GREEN_SOFT = "#EAF6EC";
const BORDER_COLOR = "#E3E7ED";
const PAGE_BG = "#F2F4F7";
const MAX_IMAGES = 6;
const MAX_FILE_SIZE_MB = 8;

type ManageTab = "overview" | "create" | "posts" | "favorites";

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
  const { categories, myPosts, myFavorites, loading } = useAppSelector(
    (state) => state.items,
  );
  const [activeTab, setActiveTab] = useState<ManageTab>("create");
  const [freePost, setFreePost] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);

  const selectedCity = Form.useWatch("city", form);
  const selectedDistrict = Form.useWatch("district", form);
  const selectedWard = Form.useWatch("ward", form);
  const selectedAddress = Form.useWatch("address", form);

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

    const loadProvinces = async () => {
      setLoadingProvince(true);
      try {
        const provinceList = await provinceService.getProvinces();
        setProvinces(provinceList);
      } catch {
        message.error("Không thể tải danh sách tỉnh/thành phố");
      } finally {
        setLoadingProvince(false);
      }
    };

    void loadProvinces();
  }, [dispatch, isAuth]);

  useEffect(() => {
    if (!isAuth) {
      return;
    }

    if (activeTab === "overview" || activeTab === "posts") {
      dispatch(fetchMyItems());
    }

    if (activeTab === "overview" || activeTab === "favorites") {
      dispatch(fetchMyFavorites());
    }
  }, [activeTab, dispatch, isAuth]);

  if (!isAuth) {
    return null;
  }

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.categoryId,
  }));

  const provinceOptions = provinces.map((province) => ({
    label: province.name,
    value: province.name,
  }));

  const districtOptions = districts.map((district) => ({
    label: district.name,
    value: district.name,
  }));

  const wardOptions = wards.map((ward) => ({
    label: ward.name,
    value: ward.name,
  }));

  const onCityChange = async (cityName: string) => {
    form.setFieldValue("district", undefined);
    form.setFieldValue("ward", undefined);
    setWards([]);

    const selectedProvince = provinces.find(
      (province) => province.name === cityName,
    );
    if (!selectedProvince) {
      setDistricts([]);
      return;
    }

    setLoadingDistrict(true);
    try {
      const provinceWithDistricts =
        await provinceService.getProvinceWithDistricts(selectedProvince.code);
      setDistricts(provinceWithDistricts.districts || []);
    } catch {
      setDistricts([]);
      message.error("Không thể tải danh sách quận/huyện");
    } finally {
      setLoadingDistrict(false);
    }
  };

  const onDistrictChange = async (districtName: string) => {
    form.setFieldValue("ward", undefined);
    const selectedDistrictData = districts.find(
      (district) => district.name === districtName,
    );
    if (!selectedDistrictData) {
      setWards([]);
      return;
    }

    try {
      const districtWithWards = await provinceService.getDistrictWithWards(
        selectedDistrictData.code,
      );
      setWards(districtWithWards.wards || []);
    } catch {
      setWards([]);
      message.error("Không thể tải danh sách phường/xã");
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Chỉ hỗ trợ tệp hình ảnh");
      return Upload.LIST_IGNORE;
    }

    const isValidSize = file.size / 1024 / 1024 < MAX_FILE_SIZE_MB;
    if (!isValidSize) {
      message.error(`Mỗi ảnh phải nhỏ hơn ${MAX_FILE_SIZE_MB}MB`);
      return Upload.LIST_IGNORE;
    }

    if (fileList.length >= MAX_IMAGES) {
      message.error(`Tối đa ${MAX_IMAGES} ảnh cho mỗi tin đăng`);
      return Upload.LIST_IGNORE;
    }

    return false;
  };

  const fullAddress = [
    selectedAddress,
    selectedWard,
    selectedDistrict,
    selectedCity,
  ]
    .filter(Boolean)
    .join(", ");

  const mapEmbedUrl = fullAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
    : "";

  const onFinish = async (values: {
    title: string;
    description: string;
    categoryId: string;
    condition: ItemCondition;
    status: ItemStatus;
    city: string;
    district: string;
    ward?: string;
    address: string;
    price?: number;
  }) => {
    if (fileList.length === 0) {
      message.error("Vui lòng tải lên ít nhất 1 hình ảnh");
      return;
    }

    const transactionType: TransactionType = freePost ? "GIVE_AWAY" : "SELL";
    const price = freePost ? 1 : Number(values.price || 0);

    if (!freePost && price <= 0) {
      message.error("Giá bán phải lớn hơn 0");
      return;
    }

    const payload = {
      title: values.title,
      description: values.description,
      categoryId: values.categoryId,
      condition: values.condition,
      status: values.status,
      transactionType,
      price,
      location: {
        city: values.city,
        district: values.district,
        ward: values.ward,
        address: values.address,
      },
      attributes: [],
      postingFee: 10000,
      paymentMethod: "WALLET" as const,
    };

    const images = fileList
      .map((file) => file.originFileObj)
      .filter((file): file is NonNullable<typeof file> => file !== undefined);

    try {
      await dispatch(createNewItem({ payload, images })).unwrap();
      // message.success("Đăng tin thành công");
      setActiveTab("posts");
      dispatch(fetchMyItems());
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Không thể đăng tin",
      );
    }
  };

  const onStatusChange = async (itemId: string, status: ItemStatus) => {
    try {
      await dispatch(updateItemStatusThunk({ itemId, status })).unwrap();
      message.success("Đã cập nhật trạng thái tin");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Cập nhật thất bại",
      );
    }
  };

  const onDeletePost = async (itemId: string) => {
    try {
      await dispatch(deleteItemThunk(itemId)).unwrap();
      message.success("Đã xóa tin đăng");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Xóa tin thất bại",
      );
    }
  };

  const onRemoveFavorite = async (itemId: string) => {
    try {
      await dispatch(
        toggleItemFavorite({ itemId, isFavorited: true }),
      ).unwrap();
      message.success("Đã bỏ yêu thích");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "Không thể bỏ yêu thích",
      );
    }
  };

  const statusColor: Record<string, string> = {
    AVAILABLE: "green",
    RESERVED: "orange",
    SOLD: "green",
    HIDDEN: "default",
    ACTIVE: "cyan",
  };

  const postStats = {
    total: myPosts.length,
    available: 0,
    reserved: 0,
    sold: 0,
    hidden: 0,
  };

  myPosts.forEach((post) => {
    if (post.status === "AVAILABLE") postStats.available += 1;
    if (post.status === "RESERVED") postStats.reserved += 1;
    if (post.status === "SOLD") postStats.sold += 1;
    if (post.status === "HIDDEN") postStats.hidden += 1;
  });

  const postColumns: ColumnsType<ItemResponse> = [
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text type="secondary">
            {record.categoryId}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (value: number) => `${value?.toLocaleString("vi-VN")} VND`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <AntTag color={statusColor[status] || "default"}>{status}</AntTag>
      ),
    },
    {
      title: "Cập nhật trạng thái",
      key: "statusAction",
      render: (_, record) => (
        <Select
          value={(record.status as ItemStatus) || "AVAILABLE"}
          style={{ minWidth: 140 }}
          onChange={(value) => onStatusChange(record.itemId, value)}
          options={[
            { label: "Hiển thị", value: "AVAILABLE" },
            { label: "Đã bán", value: "SOLD" },
            { label: "Đã giữ", value: "RESERVED" },
            { label: "Ẩn tin", value: "HIDDEN" },
          ]}
        />
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Popconfirm
          title="Xóa tin đăng này?"
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => onDeletePost(record.itemId)}
        >
          <Button danger>Xóa</Button>
        </Popconfirm>
      ),
    },
  ];

  const getMenuButtonStyle = (tab: ManageTab): CSSProperties | undefined => {
    if (activeTab !== tab) {
      return undefined;
    }

    return {
      background: BRAND_GREEN,
      color: "#ffffff",
    };
  };

  const blockStyle: CSSProperties = {
    background: "#fff",
    border: `1px solid ${BORDER_COLOR}`,
    borderRadius: 12,
    padding: 16,
  };

  return (
    <div
      style={{ background: PAGE_BG }}
      className="min-h-[calc(100vh-73px)] px-4 py-6 md:px-6 lg:px-8"
    >
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5 lg:flex-row">
        <aside className="w-full lg:w-[250px] lg:shrink-0">
          <div style={blockStyle}>
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
              Quản lý
            </p>
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("overview")}
                className="flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                style={getMenuButtonStyle("overview")}
              >
                <LayoutGrid size={15} /> Tổng quan
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className="flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                style={getMenuButtonStyle("create")}
              >
                <SquarePen size={15} /> Đăng tin mới
              </button>
              <button
                onClick={() => setActiveTab("posts")}
                className="flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                style={getMenuButtonStyle("posts")}
              >
                <FileText size={15} /> Tin đang đăng
              </button>
              <button
                onClick={() => setActiveTab("favorites")}
                className="flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                style={getMenuButtonStyle("favorites")}
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
            <p
              className="mb-2 flex items-center gap-1 text-sm font-semibold"
              style={{ color: BRAND_GREEN_DARK }}
            >
              <CircleHelp size={14} /> Mẹo đăng tin nhanh
            </p>
            <p className="text-xs leading-relaxed text-slate-600">
              Sử dụng hình ảnh rõ nét và mô tả chi tiết giúp món đồ của bạn được
              tìm thấy nhanh hơn 40%.
            </p>
          </div>
        </aside>

        <section className="min-w-0 flex-1">
          {activeTab === "overview" ? (
            <div>
              <Typography.Title
                level={2}
                className="!mb-1 !text-[32px] !font-extrabold !text-slate-900"
              >
                Tổng quan quản lý tin
              </Typography.Title>
              <Typography.Paragraph className="!mb-4 !text-slate-500">
                Tổng quan và xử lý tin đăng ngay tại đây, không chuyển trang.
              </Typography.Paragraph>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Card loading={loading}>
                  <Typography.Text type="secondary">
                    Tổng tin đăng
                  </Typography.Text>
                  <Typography.Title level={3} className="!mb-0">
                    {postStats.total}
                  </Typography.Title>
                </Card>
                <Card loading={loading}>
                  <Typography.Text type="secondary">
                    Đang hiển thị
                  </Typography.Text>
                  <Typography.Title level={3} className="!mb-0">
                    {postStats.available}
                  </Typography.Title>
                </Card>
                <Card loading={loading}>
                  <Typography.Text type="secondary">Tin đã lưu</Typography.Text>
                  <Typography.Title level={3} className="!mb-0">
                    {myFavorites.length}
                  </Typography.Title>
                </Card>
              </div>
            </div>
          ) : null}

          {activeTab === "posts" ? (
            <div>
              <Typography.Title
                level={2}
                className="!mb-1 !text-[32px] !font-extrabold !text-slate-900"
              >
                Tin đang đăng
              </Typography.Title>
              <Typography.Paragraph className="!mb-4 !text-slate-500">
                Đây là các tin do bạn đăng. Có thể sửa trạng thái và xóa tin.
              </Typography.Paragraph>

              <Card>
                {myPosts.length === 0 && !loading ? (
                  <Empty description="Bạn chưa có tin đăng nào" />
                ) : (
                  <Table
                    rowKey="itemId"
                    loading={loading}
                    dataSource={myPosts}
                    columns={postColumns}
                    pagination={{ pageSize: 8 }}
                  />
                )}
              </Card>
            </div>
          ) : null}

          {activeTab === "favorites" ? (
            <div>
              <Typography.Title
                level={2}
                className="!mb-1 !text-[32px] !font-extrabold !text-slate-900"
              >
                Tin đã lưu
              </Typography.Title>
              <Typography.Paragraph className="!mb-4 !text-slate-500">
                Tin đã lưu là tin bạn quan tâm, không phải tin do bạn đăng.
              </Typography.Paragraph>

              {myFavorites.length === 0 && !loading ? (
                <Card>
                  <Empty description="Bạn chưa có tin yêu thích nào" />
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {myFavorites.map((item) => (
                    <Card
                      key={item.itemId}
                      loading={loading}
                      title={item.title}
                      extra={
                        <AntTag color="gold">
                          {item.status || "AVAILABLE"}
                        </AntTag>
                      }
                      actions={[
                        <Button
                          type="text"
                          danger
                          onClick={() => onRemoveFavorite(item.itemId)}
                          key="remove"
                        >
                          Bỏ yêu thích
                        </Button>,
                      ]}
                    >
                      <Typography.Paragraph className="!mb-1">
                        Giá: {item.price?.toLocaleString("vi-VN")} VND
                      </Typography.Paragraph>
                      <Typography.Paragraph type="secondary" className="!mb-0">
                        {item.description || "Không có mô tả"}
                      </Typography.Paragraph>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "create" ? (
            <>
              <Typography.Title
                level={2}
                className="!mb-1 !text-[36px] !font-extrabold !leading-tight !text-slate-900"
              >
                Đăng tin rao bán
              </Typography.Title>
              <Typography.Paragraph className="!mb-4 !text-slate-500">
                Chia sẻ món đồ của bạn với cộng đồng, hoàn toàn miễn phí.
              </Typography.Paragraph>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  condition: "LIKE_NEW",
                  status: "AVAILABLE",
                  price: 0,
                }}
                requiredMark={false}
              >
                <div style={blockStyle}>
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon size={16} color={BRAND_GREEN} />
                      <span className="font-bold text-slate-800">
                        Hình ảnh sản phẩm
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">Tối đa 6 ảnh</span>
                  </div>

                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    beforeUpload={beforeUpload}
                    onChange={({ fileList: nextFileList }) =>
                      setFileList(nextFileList.slice(0, MAX_IMAGES))
                    }
                    onRemove={(file) => {
                      setFileList((prev) =>
                        prev.filter((f) => f.uid !== file.uid),
                      );
                    }}
                    multiple
                    accept="image/*"
                  >
                    {fileList.length >= MAX_IMAGES ? null : (
                      <div className="flex flex-col items-center text-slate-500">
                        <ImageIcon size={20} />
                        <span className="mt-1 text-xs">Tải ảnh lên</span>
                      </div>
                    )}
                  </Upload>
                </div>

                <div className="mt-4" style={blockStyle}>
                  <div className="mb-3 flex items-center gap-2">
                    <FileText size={16} color={BRAND_GREEN} />
                    <span className="font-bold text-slate-800">
                      Thông tin cơ bản
                    </span>
                  </div>

                  <Form.Item
                    name="title"
                    label={
                      <span className="text-xs font-semibold text-slate-600">
                        Tiêu đề món đồ *
                      </span>
                    }
                    rules={[
                      { required: true, message: "Vui lòng nhập tiêu đề" },
                      { min: 8, message: "Tiêu đề tối thiểu 8 ký tự" },
                      { max: 120, message: "Tiêu đề tối đa 120 ký tự" },
                    ]}
                    className="!mb-3"
                  >
                    <Input
                      placeholder="VD: iPhone 12 Pro Max 128GB màu Xanh"
                      className="h-[40px]"
                    />
                  </Form.Item>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Form.Item
                      name="categoryId"
                      label={
                        <span className="text-xs font-semibold text-slate-600">
                          Danh mục *
                        </span>
                      }
                      rules={[
                        { required: true, message: "Vui lòng chọn danh mục" },
                      ]}
                      className="!mb-3"
                    >
                      <Select
                        options={categoryOptions}
                        placeholder="Chọn danh mục"
                        className="h-[40px]"
                      />
                    </Form.Item>

                    <Form.Item
                      name="condition"
                      label={
                        <span className="text-xs font-semibold text-slate-600">
                          Tình trạng *
                        </span>
                      }
                      rules={[
                        { required: true, message: "Vui lòng chọn tình trạng" },
                      ]}
                      className="!mb-3"
                    >
                      <Select options={conditionOptions} className="h-[40px]" />
                    </Form.Item>
                  </div>

                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-600">
                      Giá bán
                    </span>
                    <div className="flex items-center gap-2">
                      <Switch checked={freePost} onChange={setFreePost} />
                      <span className="text-sm text-slate-500">
                        Tặng miễn phí
                      </span>
                    </div>
                  </div>

                  <Form.Item
                    name="price"
                    rules={
                      freePost
                        ? []
                        : [{ required: true, message: "Vui lòng nhập giá" }]
                    }
                    className="!mb-3"
                  >
                    <div className="relative">
                      <InputNumber
                        min={0}
                        disabled={freePost}
                        className="!h-[40px] !w-full !pr-14"
                        placeholder="Nhập giá bán"
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                        VND
                      </span>
                    </div>
                  </Form.Item>

                  <Form.Item name="status" initialValue="AVAILABLE" hidden>
                    <Input />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label={
                      <span className="text-xs font-semibold text-slate-600">
                        Mô tả chi tiết *
                      </span>
                    }
                    rules={[
                      { required: true, message: "Vui lòng nhập mô tả" },
                      { min: 20, message: "Mô tả tối thiểu 20 ký tự" },
                    ]}
                    className="!mb-0"
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="Mô tả về tình trạng sản phẩm, lý do bán, các phụ kiện đi kèm..."
                    />
                  </Form.Item>
                </div>

                <div className="mt-4" style={blockStyle}>
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin size={16} color={BRAND_GREEN} />
                    <span className="font-bold text-slate-800">
                      Địa điểm & Giao dịch
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Form.Item
                      name="city"
                      label={
                        <span className="text-xs font-semibold text-slate-600">
                          Tỉnh / Thành phố *
                        </span>
                      }
                      rules={[
                        { required: true, message: "Vui lòng chọn tỉnh/thành" },
                      ]}
                      className="!mb-3"
                    >
                      <Select
                        options={provinceOptions}
                        loading={loadingProvince}
                        onChange={onCityChange}
                        placeholder="Chọn Tỉnh/Thành phố"
                        className="h-[40px]"
                        showSearch
                        optionFilterProp="label"
                      />
                    </Form.Item>

                    <Form.Item
                      name="district"
                      label={
                        <span className="text-xs font-semibold text-slate-600">
                          Quận / Huyện *
                        </span>
                      }
                      rules={[
                        { required: true, message: "Vui lòng chọn quận/huyện" },
                      ]}
                      className="!mb-3"
                    >
                      <Select
                        options={districtOptions}
                        loading={loadingDistrict}
                        onChange={onDistrictChange}
                        placeholder="Chọn Quận/Huyện"
                        className="h-[40px]"
                        showSearch
                        optionFilterProp="label"
                      />
                    </Form.Item>
                  </div>

                  <Form.Item
                    name="ward"
                    label={
                      <span className="text-xs font-semibold text-slate-600">
                        Phường / Xã
                      </span>
                    }
                    className="!mb-3"
                  >
                    <Select
                      options={wardOptions}
                      placeholder="Chọn Phường/Xã (nếu có)"
                      className="h-[40px]"
                      showSearch
                      optionFilterProp="label"
                      disabled={wardOptions.length === 0}
                    />
                  </Form.Item>

                  <Form.Item
                    name="address"
                    label={
                      <span className="text-xs font-semibold text-slate-600">
                        Địa chỉ cụ thể *
                      </span>
                    }
                    rules={[
                      { required: true, message: "Vui lòng nhập địa chỉ" },
                    ]}
                    className="!mb-3"
                  >
                    <Input
                      placeholder="Số nhà, tên đường, phường/xã..."
                      className="h-[40px]"
                    />
                  </Form.Item>

                  <div
                    className="overflow-hidden rounded-lg border"
                    style={{ borderColor: BORDER_COLOR }}
                  >
                    {mapEmbedUrl ? (
                      <iframe
                        title="Bản đồ địa chỉ tin đăng"
                        src={mapEmbedUrl}
                        className="h-[260px] w-full border-0"
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                    ) : (
                      <div className="flex h-[160px] items-center justify-center bg-slate-100 text-sm text-slate-500">
                        Chọn địa chỉ để xem bản đồ
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <Button
                      href={
                        fullAddress
                          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
                          : undefined
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      disabled={!fullAddress}
                      className="!rounded-md !border !border-[#CDE7D2] !bg-white !text-xs !font-semibold"
                      style={{ color: BRAND_GREEN_DARK }}
                    >
                      MỞ GOOGLE MAPS
                    </Button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Button
                    icon={<Eye size={16} />}
                    className="!h-[48px] !rounded-[10px] !border !border-[#D8DDE5] !bg-white !font-semibold !text-slate-700"
                  >
                    Xem trước
                  </Button>
                  <Button
                    htmlType="submit"
                    loading={loading}
                    icon={<Rocket size={16} />}
                    className="!h-[48px] !rounded-[10px] !border-0 !font-semibold !text-white"
                    style={{ background: BRAND_GREEN }}
                  >
                    Đăng tin ngay
                  </Button>
                </div>
              </Form>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}
