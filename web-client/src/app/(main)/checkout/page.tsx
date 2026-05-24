"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Spin, Radio, Select, App, Form } from "antd";
import {
  CreditCard,
  Truck,
  Wallet,
  ShieldCheck,
  ArrowLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Banknote,
} from "lucide-react";
import { useAppSelector } from "@/stores/hooks";
import { itemService } from "@/stores/slices/items.slice";
import { userService } from "@/stores/slices/auth.slice";
import { walletService } from "@/stores/slices/wallet.slice";
import { orderService } from "@/stores/slices/order.slice";
import type { ItemWithImages } from "@/types/item.type";
import type { Province, District, Ward } from "@/types/province.type";
import type { AddressType } from "@/types/user.type";
import provinceService from "@/services/province.service";


interface OrderResult {
  itemId: string;
  title: string;
  success: boolean;
  error?: string;
  paymentUrl?: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuth, loading: authLoading } = useAppSelector((s) => s.auth);
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<ItemWithImages[]>([]);
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  );
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("WALLET");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [orderResults, setOrderResults] = useState<OrderResult[] | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const formatPrice = (p: number) => p.toLocaleString("vi-VN") + "đ";

  // Support both ?itemId= (old) and ?itemIds= (new)
  const rawItemIds =
    searchParams.get("itemIds") || searchParams.get("itemId") || "";
  const itemIds = rawItemIds
    .split(",")
    .filter((id) => id.trim().length > 0);

  // Load items info
  const loadItems = useCallback(async () => {
    if (itemIds.length === 0) {
      router.push("/cart");
      return;
    }
    try {
      setLoading(true);
      const loadedItems = await Promise.all(
        itemIds.map(async (id) => {
          try {
            return await itemService.getItem(id);
          } catch {
            return null;
          }
        }),
      );

      const validItems = loadedItems.filter(
        (i): i is ItemWithImages => i !== null && i.status === "ACTIVE",
      );

      if (validItems.length === 0) {
        messageApi.error("Không có sản phẩm nào khả dụng");
        router.push("/cart");
        return;
      }

      setItems(validItems);
    } catch {
      messageApi.error("Không thể tải thông tin sản phẩm");
      router.push("/cart");
    } finally {
      setLoading(false);
    }
  }, [rawItemIds, router, messageApi]);

  // Load addresses
  const loadAddresses = useCallback(async () => {
    try {
      const data = await userService.getAddresses();
      setAddresses(data);
      const def = data.find((a) => a.main === 1);
      if (def) {
        setSelectedAddressId(def.id);
        setShowNewAddress(false);
      } else if (data.length > 0) {
        setSelectedAddressId(data[0].id);
        setShowNewAddress(false);
      } else {
        setShowNewAddress(true);
      }
    } catch {
      setShowNewAddress(true);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuth) {
      router.push("/home");
      return;
    }
    loadItems();
    loadAddresses();
    provinceService
      .getProvinces()
      .then(setProvinces)
      .catch(() => {});
    walletService
      .getWallet()
      .then((res) => setWalletBalance(res.balance))
      .catch(() => setWalletBalance(null));
  }, [isAuth, authLoading, router, loadItems, loadAddresses]);

  const onCityChange = async (cityName: string) => {
    form.setFieldValue("district", undefined);
    form.setFieldValue("ward", undefined);
    setWards([]);
    const p = provinces.find((x) => x.name === cityName);
    if (!p) return;
    try {
      const res = await provinceService.getProvinceWithDistricts(p.code);
      setDistricts(res.districts || []);
    } catch {
      setDistricts([]);
    }
  };

  const onDistrictChange = async (districtName: string) => {
    form.setFieldValue("ward", undefined);
    const d = districts.find((x) => x.name === districtName);
    if (!d) return;
    try {
      const res = await provinceService.getDistrictWithWards(d.code);
      setWards(res.wards || []);
    } catch {
      setWards([]);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.price ?? 0), 0);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    let receiverName = "";
    let receiverPhone = "";
    let shippingAddress = "";

    if (showNewAddress) {
      try {
        const vals = await form.validateFields();
        receiverName = vals.receiverName;
        receiverPhone = vals.receiverPhone;
        shippingAddress = `${vals.specifics}, ${vals.ward}, ${vals.district}, ${vals.province}`;
        try {
          await userService.createAddress({
            receiverName: vals.receiverName,
            receiverPhone: vals.receiverPhone,
            province: vals.province,
            district: vals.district,
            ward: vals.ward,
            specifics: vals.specifics,
            main: addresses.length === 0 ? 1 : 0,
          });
        } catch {}
      } catch {
        return;
      }
    } else {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (!addr) {
        messageApi.error("Vui lòng chọn địa chỉ giao hàng");
        return;
      }
      receiverName = addr.receiverName;
      receiverPhone = addr.receiverPhone;
      shippingAddress = `${addr.specifics}, ${addr.ward}, ${addr.district}, ${addr.province}`;
    }

    // Check wallet balance for WALLET payment
    if (paymentMethod === "WALLET") {
      try {
        const wallet = await walletService.getWallet();
        if (wallet.balance < total) {
          messageApi.error("Số dư ví không đủ, vui lòng nạp thêm tiền!");
          return;
        }
      } catch {
        messageApi.error("Không thể xác thực số dư ví.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const results: OrderResult[] = [];

      // Create orders sequentially (1 order per item)
      for (const item of items) {
        try {
          const res = await orderService.createOrder({
            receiverName,
            receiverPhone,
            shippingAddress,
            paymentMethod,
            itemId: item.itemId,
          });

          results.push({
            itemId: item.itemId,
            title: item.title,
            success: true,
            paymentUrl: res?.paymentUrl,
          });
        } catch (err: any) {
          results.push({
            itemId: item.itemId,
            title: item.title,
            success: false,
            error: err?.message || "Đặt hàng thất bại",
          });
        }
      }

      setOrderResults(results);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (successCount > 0 && failCount === 0) {
        messageApi.success(
          `Đặt ${successCount} đơn hàng thành công! Tiền đã tạm giữ (Escrow).`,
        );
      } else if (successCount > 0) {
        messageApi.warning(
          `${successCount} đơn thành công, ${failCount} đơn thất bại.`,
        );
      } else {
        messageApi.error("Tất cả đơn hàng đều thất bại.");
      }

      // If VNPAY and first order has paymentUrl, redirect
      if (paymentMethod === "VNPAY") {
        const firstSuccess = results.find(
          (r) => r.success && r.paymentUrl,
        );
        if (firstSuccess?.paymentUrl) {
          window.location.href = firstSuccess.paymentUrl;
          return;
        }
      }
    } catch (err: any) {
      messageApi.error(err?.message || "Đặt hàng thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Spin size="large" />
        <p className="text-slate-500 text-sm font-medium">
          Đang tải thông tin thanh toán...
        </p>
      </div>
    );
  }

  // Show order results after submission
  if (orderResults) {
    const successCount = orderResults.filter((r) => r.success).length;
    const failCount = orderResults.filter((r) => !r.success).length;

    return (
      <div className="bg-slate-50 min-h-screen pb-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-slate-100 text-center">
            {failCount === 0 ? (
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-10 h-10 text-amber-600" />
              </div>
            )}

            <h1 className="text-2xl font-black text-slate-900 mb-2">
              {failCount === 0
                ? "Đặt hàng thành công!"
                : `${successCount} / ${orderResults.length} đơn thành công`}
            </h1>
            <p className="text-slate-500 mb-8">
              {failCount === 0
                ? "Tiền đã được tạm giữ (Escrow). Bạn có thể theo dõi đơn hàng tại trang quản lý."
                : "Một số đơn hàng không thể tạo. Xem chi tiết bên dưới."}
            </p>

            {/* Results list */}
            <div className="space-y-3 mb-8 text-left">
              {orderResults.map((result) => (
                <div
                  key={result.itemId}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    result.success
                      ? "border-emerald-200 bg-emerald-50/50"
                      : "border-red-200 bg-red-50/50"
                  }`}
                >
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {result.title}
                    </p>
                    {result.error && (
                      <p className="text-xs text-red-500 mt-0.5">
                        {result.error}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${
                      result.success
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {result.success ? "Thành công" : "Thất bại"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard/orders"
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md inline-flex items-center justify-center gap-2"
              >
                Xem đơn hàng
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/home"
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all inline-flex items-center justify-center gap-2"
              >
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link
            href="/home"
            className="hover:text-emerald-600 transition-colors"
          >
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link
            href="/cart"
            className="hover:text-emerald-600 transition-colors"
          >
            Giỏ hàng
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-emerald-600 font-semibold">Thanh toán</span>
        </nav>

        <h1 className="text-2xl font-black text-slate-900 mb-8">
          Thanh toán đơn hàng
        </h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column */}
          <div className="flex-1 w-full space-y-6">
            {/* Shipping Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-emerald-600 mb-5 flex items-center gap-2">
                <Truck className="w-5 h-5" /> Thông tin vận chuyển
              </h2>

              {addresses.length > 0 && !showNewAddress ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddressId === addr.id
                          ? "border-emerald-500 bg-emerald-50/50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">
                            {addr.receiverName}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600">
                            {addr.receiverPhone}
                          </span>
                          {addr.main === 1 && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedAddressId === addr.id
                              ? "border-emerald-500"
                              : "border-slate-300"
                          }`}
                        >
                          {selectedAddressId === addr.id && (
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {addr.specifics}, {addr.ward}, {addr.district},{" "}
                        {addr.province}
                      </p>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowNewAddress(true)}
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 mt-2"
                  >
                    + Thêm địa chỉ mới
                  </button>
                </div>
              ) : (
                <Form form={form} layout="vertical" size="large">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-1">
                    <Form.Item
                      label={
                        <span className="font-semibold text-slate-700">
                          Họ và tên
                        </span>
                      }
                      name="receiverName"
                      rules={[
                        {
                          required: true,
                          message: "Nhập họ tên người nhận",
                        },
                      ]}
                    >
                      <Input
                        placeholder="Nhập họ và tên người nhận"
                        className="!rounded-xl"
                      />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span className="font-semibold text-slate-700">
                          Số điện thoại
                        </span>
                      }
                      name="receiverPhone"
                      rules={[
                        {
                          required: true,
                          message: "Nhập số điện thoại",
                        },
                      ]}
                    >
                      <Input
                        placeholder="Nhập số điện thoại"
                        className="!rounded-xl"
                      />
                    </Form.Item>
                  </div>
                  <Form.Item
                    label={
                      <span className="font-semibold text-slate-700">
                        Tỉnh / Thành phố
                      </span>
                    }
                    name="province"
                    rules={[
                      {
                        required: true,
                        message: "Chọn tỉnh/thành phố",
                      },
                    ]}
                  >
                    <Select
                      options={provinces.map((p) => ({
                        label: p.name,
                        value: p.name,
                      }))}
                      onChange={onCityChange}
                      placeholder="Chọn tỉnh/thành phố"
                      showSearch
                      optionFilterProp="label"
                      className="[&>.ant-select-selector]:!rounded-xl"
                    />
                  </Form.Item>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-1">
                    <Form.Item
                      label={
                        <span className="font-semibold text-slate-700">
                          Quận / Huyện
                        </span>
                      }
                      name="district"
                      rules={[
                        {
                          required: true,
                          message: "Chọn quận/huyện",
                        },
                      ]}
                    >
                      <Select
                        options={districts.map((d) => ({
                          label: d.name,
                          value: d.name,
                        }))}
                        onChange={onDistrictChange}
                        placeholder="Chọn quận/huyện"
                        showSearch
                        optionFilterProp="label"
                        className="[&>.ant-select-selector]:!rounded-xl"
                      />
                    </Form.Item>
                    <Form.Item
                      label={
                        <span className="font-semibold text-slate-700">
                          Phường / Xã
                        </span>
                      }
                      name="ward"
                    >
                      <Select
                        options={wards.map((w) => ({
                          label: w.name,
                          value: w.name,
                        }))}
                        placeholder="Chọn phường/xã"
                        showSearch
                        optionFilterProp="label"
                        className="[&>.ant-select-selector]:!rounded-xl"
                        disabled={wards.length === 0}
                      />
                    </Form.Item>
                  </div>
                  <Form.Item
                    label={
                      <span className="font-semibold text-slate-700">
                        Địa chỉ cụ thể
                      </span>
                    }
                    name="specifics"
                    rules={[
                      {
                        required: true,
                        message: "Nhập địa chỉ cụ thể",
                      },
                    ]}
                  >
                    <Input
                      placeholder="Số nhà, tên đường, phường/xã"
                      className="!rounded-xl"
                    />
                  </Form.Item>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddress(false)}
                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" /> Chọn từ địa chỉ đã lưu
                    </button>
                  )}
                </Form>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-emerald-600 mb-5 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Phương thức thanh toán
              </h2>
              <Radio.Group
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full space-y-3"
              >
                {[
                  {
                    value: "WALLET",
                    icon: <Wallet className="w-5 h-5 text-emerald-600" />,
                    label: "Thanh toán qua ví (Escrow)",
                    desc:
                      walletBalance !== null
                        ? `Số dư ví: ${formatPrice(walletBalance)} — Tiền tạm giữ đến khi bạn nhận hàng.`
                        : "Tiền tạm giữ (Escrow) đến khi bạn xác nhận nhận hàng.",
                  },
                  {
                    value: "VNPAY",
                    icon: <Banknote className="w-5 h-5 text-blue-600" />,
                    label: "Thanh toán qua VNPay",
                    desc:
                      items.length > 1
                        ? "Mỗi đơn hàng sẽ được thanh toán riêng qua VNPay."
                        : "Thanh toán trực tuyến qua cổng VNPay an toàn.",
                  },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === opt.value
                        ? "border-emerald-500 bg-emerald-50/50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <Radio value={opt.value} className="!mt-0" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                        {opt.icon}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">
                          {opt.label}
                        </p>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </Radio.Group>

              {/* Escrow explanation */}
              <div className="mt-4 p-4 bg-amber-50 rounded-xl text-sm text-amber-700">
                <p className="font-medium mb-1">🔒 Cơ chế Escrow bảo vệ:</p>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  <li>Tiền tạm giữ trong ví Escrow khi đặt hàng</li>
                  <li>
                    Chuyển cho người bán sau khi bạn xác nhận nhận hàng
                  </li>
                  <li>Hoàn tiền nếu có khiếu nại được chấp nhận</li>
                  <li>
                    Tự động chuyển cho người bán sau 3 ngày nếu không có phản
                    hồi
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-full lg:w-[380px] shrink-0 space-y-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-5">
                Tóm tắt đơn hàng
              </h2>

              {/* Items list */}
              <div className="space-y-4 mb-5 pb-5 border-b border-slate-100 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.itemId} className="flex gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                      <img
                        src={
                          item.images?.[0]?.imageUrl ||
                          "/icon-other/san-pham-khac.png"
                        }
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2">
                        {item.title}
                      </p>
                      <p className="text-sm font-bold text-emerald-600 mt-1">
                        {formatPrice(item.price ?? 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 text-sm mb-5">
                <div className="flex justify-between text-slate-600">
                  <span>Giá sản phẩm ({items.length} SP)</span>
                  <span className="font-semibold text-slate-800">
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-emerald-600">
                    Miễn phí
                  </span>
                </div>
                {items.length > 1 && (
                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Số đơn hàng sẽ tạo</span>
                    <span className="font-semibold">{items.length} đơn</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-end mb-6 pt-4 border-t border-slate-100">
                <span className="font-bold text-slate-800 text-base">
                  Tổng cộng
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  {formatPrice(total)}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30 text-base flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting ? (
                  <Spin size="small" />
                ) : (
                  <>
                    <span>
                      Đặt hàng{items.length > 1 ? ` (${items.length} đơn)` : ""}
                    </span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {items.length > 1 && (
                <p className="text-xs text-slate-400 text-center mt-3">
                  Mỗi sản phẩm sẽ tạo 1 đơn hàng riêng. Cái nào giao trước thì
                  xử lý trước.
                </p>
              )}

              {items.length === 1 && (
                <p className="text-xs text-slate-400 text-center mt-3">
                  Bằng cách nhấn đặt hàng, bạn đồng ý với điều khoản dịch vụ
                  của Chợ Đồ Cũ.
                </p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Escrow bảo vệ 100%
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tiền tạm giữ đến khi bạn nhận hàng và xác nhận. Hoàn tiền
                    nếu không đúng mô tả.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
