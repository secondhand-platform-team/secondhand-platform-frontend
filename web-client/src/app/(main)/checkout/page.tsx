"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input, Button, Spin, Radio, Select, App, Form } from "antd";
import { MapPin, CreditCard, Truck, Banknote, Wallet, ShieldCheck, ArrowLeft, ChevronRight } from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/stores/hooks";
import { type CartItemType, fetchMyCart } from "@/stores/slices/cart.slice";
import { itemService } from "@/stores/slices/items.slice";
import type { ItemWithImages } from "@/types/item.type";
import type { Province, District, Ward } from "@/types/province.type";
import provinceService from "@/services/province.service";
import http from "@/utils/api";

interface EnrichedCartItem extends CartItemType {
  product?: ItemWithImages;
}

interface AddressType {
  id: number;
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  specifics: string;
  main: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuth, loading: authLoading, user } = useAppSelector((s) => s.auth);
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedCartItem[]>([]);
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("WALLET");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const formatPrice = (p: number) => p.toLocaleString("vi-VN") + "đ";

  // Load cart items
  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      const cartData = await dispatch(fetchMyCart()).unwrap();
      if (cartData?.cartItems?.length > 0) {
        const items = await Promise.all(
          cartData.cartItems.map(async (item) => {
            try {
              const product = await itemService.getItem(item.itemId);
              return { ...item, product };
            } catch { return item; }
          })
        );
        setEnrichedItems(items);
      } else {
        setEnrichedItems([]);
        router.push("/cart");
      }
    } catch { router.push("/cart"); }
    finally { setLoading(false); }
  }, [dispatch, router]);

  // Load addresses
  const loadAddresses = useCallback(async () => {
    try {
      const data = await http.get<AddressType[]>("/auth/api/addresses");
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
    } catch { setShowNewAddress(true); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuth) { router.push("/home"); return; }
    loadCart();
    loadAddresses();
    provinceService.getProvinces().then(setProvinces).catch(() => {});
    
    // Tải số dư ví hiện tại của người mua
    http.get<any>("/core/api/wallet/me")
      .then((res) => setWalletBalance(res.balance))
      .catch(() => setWalletBalance(null));
  }, [isAuth, authLoading, router, loadCart, loadAddresses]);

  const onCityChange = async (cityName: string) => {
    form.setFieldValue("district", undefined);
    form.setFieldValue("ward", undefined);
    setWards([]);
    const p = provinces.find((x) => x.name === cityName);
    if (!p) return;
    try {
      const res = await provinceService.getProvinceWithDistricts(p.code);
      setDistricts(res.districts || []);
    } catch { setDistricts([]); }
  };

  const onDistrictChange = async (districtName: string) => {
    form.setFieldValue("ward", undefined);
    const d = districts.find((x) => x.name === districtName);
    if (!d) return;
    try {
      const res = await provinceService.getDistrictWithWards(d.code);
      setWards(res.wards || []);
    } catch { setWards([]); }
  };

  const subtotal = enrichedItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingFee = subtotal > 0 ? 35000 : 0;
  const total = subtotal + shippingFee;

  const handlePlaceOrder = async () => {
    let receiverName = "";
    let receiverPhone = "";
    let shippingAddress = "";

    if (showNewAddress) {
      try {
        const vals = await form.validateFields();
        receiverName = vals.receiverName;
        receiverPhone = vals.receiverPhone;
        shippingAddress = `${vals.specifics}, ${vals.ward}, ${vals.district}, ${vals.province}`;
        // Save address
        try {
          await http.post("/auth/api/addresses", {
            receiverName: vals.receiverName,
            receiverPhone: vals.receiverPhone,
            province: vals.province,
            district: vals.district,
            ward: vals.ward,
            specifics: vals.specifics,
            main: addresses.length === 0 ? 1 : 0,
          });
        } catch {}
      } catch { return; }
    } else {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (!addr) { messageApi.error("Vui lòng chọn địa chỉ giao hàng"); return; }
      receiverName = addr.receiverName;
      receiverPhone = addr.receiverPhone;
      shippingAddress = `${addr.specifics}, ${addr.ward}, ${addr.district}, ${addr.province}`;
    }

    const items = enrichedItems.map((item) => ({
      itemId: item.itemId,
      itemName: item.product?.title || "Sản phẩm",
      sellerId: item.product?.userId || "",
      price: item.price,
      quantity: item.quantity,
    }));

    if (paymentMethod === "WALLET") {
      try {
        setSubmitting(true);
        // Kiểm tra số dư ví realtime trước khi gửi request tạo order
        const wallet = await http.get<any>("/core/api/wallet/me");
        if (wallet.balance < total) {
          messageApi.error("Số dư ví không đủ, vui lòng nạp thêm tiền!");
          setSubmitting(false);
          return;
        }
      } catch {
        messageApi.error("Không thể xác thực số dư ví. Vui lòng thử lại!");
        setSubmitting(false);
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await http.post<any>("/order/api/orders", {
        receiverName, receiverPhone, shippingAddress, paymentMethod, items,
      });
      
      if (paymentMethod === "VNPAY") {
        if (res && res.paymentUrl) {
          messageApi.success("Đang chuyển hướng sang cổng thanh toán VNPay...");
          window.location.href = res.paymentUrl;
        } else {
          messageApi.error("Không nhận được liên kết thanh toán từ VNPay.");
        }
      } else {
        messageApi.success("Đặt hàng và thanh toán qua ví thành công!");
        router.push("/dashboard/orders");
      }
    } catch (err: any) {
      messageApi.error(err?.message || "Đặt hàng thất bại");
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <Spin size="large" />
        <p className="text-slate-500 text-sm font-medium">Đang tải thông tin thanh toán...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/home" className="hover:text-emerald-600 transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/cart" className="hover:text-emerald-600 transition-colors">Giỏ hàng</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-emerald-600 font-semibold">Thanh toán</span>
        </nav>

        <h1 className="text-2xl font-black text-slate-900 mb-8">Thanh toán đơn hàng</h1>

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
                          <span className="font-bold text-slate-800">{addr.receiverName}</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-600">{addr.receiverPhone}</span>
                          {addr.main === 1 && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                              Mặc định
                            </span>
                          )}
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedAddressId === addr.id ? "border-emerald-500" : "border-slate-300"
                        }`}>
                          {selectedAddressId === addr.id && (
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        {addr.specifics}, {addr.ward}, {addr.district}, {addr.province}
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
                    <Form.Item label={<span className="font-semibold text-slate-700">Họ và tên</span>} name="receiverName"
                      rules={[{ required: true, message: "Nhập họ tên người nhận" }]}>
                      <Input placeholder="Nhập họ và tên người nhận" className="!rounded-xl" />
                    </Form.Item>
                    <Form.Item label={<span className="font-semibold text-slate-700">Số điện thoại</span>} name="receiverPhone"
                      rules={[{ required: true, message: "Nhập số điện thoại" }]}>
                      <Input placeholder="Nhập số điện thoại" className="!rounded-xl" />
                    </Form.Item>
                  </div>
                  <Form.Item label={<span className="font-semibold text-slate-700">Tỉnh / Thành phố</span>} name="province"
                    rules={[{ required: true, message: "Chọn tỉnh/thành phố" }]}>
                    <Select options={provinces.map((p) => ({ label: p.name, value: p.name }))}
                      onChange={onCityChange} placeholder="Chọn tỉnh/thành phố" showSearch optionFilterProp="label"
                      className="[&>.ant-select-selector]:!rounded-xl" />
                  </Form.Item>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-1">
                    <Form.Item label={<span className="font-semibold text-slate-700">Quận / Huyện</span>} name="district"
                      rules={[{ required: true, message: "Chọn quận/huyện" }]}>
                      <Select options={districts.map((d) => ({ label: d.name, value: d.name }))}
                        onChange={onDistrictChange} placeholder="Chọn quận/huyện" showSearch optionFilterProp="label"
                        className="[&>.ant-select-selector]:!rounded-xl" />
                    </Form.Item>
                    <Form.Item label={<span className="font-semibold text-slate-700">Phường / Xã</span>} name="ward">
                      <Select options={wards.map((w) => ({ label: w.name, value: w.name }))}
                        placeholder="Chọn phường/xã" showSearch optionFilterProp="label"
                        className="[&>.ant-select-selector]:!rounded-xl" disabled={wards.length === 0} />
                    </Form.Item>
                  </div>
                  <Form.Item label={<span className="font-semibold text-slate-700">Địa chỉ cụ thể</span>} name="specifics"
                    rules={[{ required: true, message: "Nhập địa chỉ cụ thể" }]}>
                    <Input placeholder="Số nhà, tên đường, phường/xã" className="!rounded-xl" />
                  </Form.Item>
                  {addresses.length > 0 && (
                    <button type="button" onClick={() => setShowNewAddress(false)}
                      className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1">
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
              <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full space-y-3">
                {[
                  {
                    value: "WALLET",
                    icon: <Wallet className="w-5 h-5 text-emerald-600" />,
                    label: "Thanh toán qua ví Chợ Đồ Cũ",
                    desc: walletBalance !== null
                      ? `Số dư ví hiện tại: ${formatPrice(walletBalance)}`
                      : "Sử dụng số dư ví Chợ Đồ Cũ của bạn"
                  },
                  {
                    value: "VNPAY",
                    icon: <CreditCard className="w-5 h-5 text-blue-600" />,
                    label: "Thanh toán qua VNPay",
                    desc: "Thanh toán online qua thẻ ngân hàng hoặc mã QR"
                  },
                ].map((opt) => (
                  <label key={opt.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === opt.value ? "border-emerald-500 bg-emerald-50/50" : "border-slate-200 hover:border-slate-300"
                    }`}>
                    <Radio value={opt.value} className="!mt-0" />
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">{opt.icon}</div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{opt.label}</p>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </Radio.Group>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="w-full lg:w-[380px] shrink-0 space-y-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Tóm tắt đơn hàng</h2>
              <div className="space-y-4 mb-5 pb-5 border-b border-slate-100">
                {enrichedItems.map((item) => (
                  <div key={item.itemId} className="flex gap-3">
                    <div className="w-16 h-16 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                      <img src={item.product?.images?.[0]?.imageUrl || "/icon-other/san-pham-khac.png"}
                        alt={item.product?.title || "SP"} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 line-clamp-2">{item.product?.title || "Sản phẩm"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Số lượng: {item.quantity}</p>
                      <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2.5 text-sm mb-5">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính</span>
                  <span className="font-semibold text-slate-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển</span>
                  <span className="font-semibold text-slate-800">{formatPrice(shippingFee)}</span>
                </div>
              </div>
              <div className="flex justify-between items-end mb-6 pt-4 border-t border-slate-100">
                <span className="font-bold text-slate-800 text-base">Tổng cộng</span>
                <span className="text-2xl font-black text-emerald-600">{formatPrice(total)}</span>
              </div>
              <button onClick={handlePlaceOrder} disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-emerald-500/30 text-base flex items-center justify-center gap-2 disabled:opacity-60">
                {submitting ? <Spin size="small" /> : <><span>Đặt hàng</span><ChevronRight className="w-5 h-5" /></>}
              </button>
              <p className="text-xs text-slate-400 text-center mt-3">
                Bằng cách nhấn đặt hàng, bạn đồng ý với điều khoản dịch vụ của Chợ Đồ Cũ.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">Mua sắm an toàn</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Đơn hàng của bạn sẽ được bảo vệ 100% bởi chính sách người mua.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
