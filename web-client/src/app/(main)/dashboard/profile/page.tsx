"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Input, Form, Radio, DatePicker, Upload, Select, App, Modal, Popconfirm } from "antd";
import { CameraOutlined, UploadOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EnvironmentOutlined, StarOutlined, StarFilled } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import http from "@/utils/api";
import type { UserProfileApiResponseType } from "@/types/user.type";
import dayjs from "dayjs";
import { fetchCurrentUser } from "@/stores/slices/auth.slice";
import type { Province, District, Ward } from "@/types/province.type";
import provinceService from "@/services/province.service";

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

export default function ProfileSettingsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [addressForm] = Form.useForm();
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfileApiResponseType | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);

  // Address management state
  const [addresses, setAddresses] = useState<AddressType[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressType | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addrProvinces, setAddrProvinces] = useState<Province[]>([]);
  const [addrDistricts, setAddrDistricts] = useState<District[]>([]);
  const [addrWards, setAddrWards] = useState<Ward[]>([]);

  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvince(true);
      try {
        const provinceList = await provinceService.getProvinces();
        setProvinces(provinceList);
        setAddrProvinces(provinceList);
      } catch {
        messageApi.error("Không thể tải danh sách tỉnh/thành phố");
      } finally {
        setLoadingProvince(false);
      }
    };
    void loadProvinces();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await http.get<UserProfileApiResponseType>("/auth/api/profile");
        setProfile(res);
        form.setFieldsValue({
          fullName: res.user_profile?.fullName || "",
          phoneNumber: res.user?.phoneNumber || "",
          gender: res.user_profile?.gender || "MALE",
          dateOfBirth: res.user_profile?.dateOfBirth ? dayjs(res.user_profile.dateOfBirth) : undefined,
          bio: res.user_profile?.bio || "",
          city: res.user_profile?.city || undefined,
          district: res.user_profile?.district || undefined,
          ward: res.user_profile?.ward || undefined,
          address: res.user_profile?.address || "",
        });

        if (res.user_profile?.city) {
          onCityChange(res.user_profile.city, false);
        }
        if (res.user_profile?.district) {
          onDistrictChange(res.user_profile.district, false);
        }

      } catch (err) {
        messageApi.error("Lỗi khi tải thông tin hồ sơ");
      }
    };
    loadProfile();
  }, [form]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load addresses
  const loadAddresses = useCallback(async () => {
    try {
      const data = await http.get<AddressType[]>("/auth/api/addresses");
      setAddresses(data);
    } catch {}
  }, []);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  const onCityChange = async (cityName: string, resetDescendants = true) => {
    if (resetDescendants) {
      form.setFieldValue("district", undefined);
      form.setFieldValue("ward", undefined);
      setWards([]);
    }

    const selectedProvince = provinces.find((p) => p.name === cityName);
    // If provinces are not loaded yet, wait for them
    if (!selectedProvince) {
      try {
          const allProvs = await provinceService.getProvinces();
          const p = allProvs.find((x) => x.name === cityName);
          if (p) {
              setLoadingDistrict(true);
              const provinceWithDistricts = await provinceService.getProvinceWithDistricts(p.code);
              setDistricts(provinceWithDistricts.districts || []);
              setLoadingDistrict(false);
          }
      } catch {}
      return;
    }

    setLoadingDistrict(true);
    try {
      const provinceWithDistricts = await provinceService.getProvinceWithDistricts(selectedProvince.code);
      setDistricts(provinceWithDistricts.districts || []);
    } catch {
      setDistricts([]);
      if (resetDescendants) messageApi.error("Không thể tải danh sách quận/huyện");
    } finally {
      setLoadingDistrict(false);
    }
  };

  const onDistrictChange = async (districtName: string, resetDescendants = true) => {
    if (resetDescendants) {
      form.setFieldValue("ward", undefined);
    }
    const selectedDistrictData = districts.find((d) => d.name === districtName);
    if (!selectedDistrictData) {
      return;
    }

    try {
      const districtWithWards = await provinceService.getDistrictWithWards(selectedDistrictData.code);
      setWards(districtWithWards.wards || []);
    } catch {
      setWards([]);
      if (resetDescendants) messageApi.error("Không thể tải danh sách phường/xã");
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format("YYYY-MM-DD") : undefined,
      };
      await http.put("/auth/api/profile", payload);
      messageApi.success("Cập nhật thông tin thành công");
      dispatch(fetchCurrentUser());
    } catch (err) {
      messageApi.error("Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (info: any) => {
    const file = info.file?.originFileObj || info.file;
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await http.put("/auth/api/profile/avatar", formData);
      messageApi.success("Cập nhật ảnh đại diện thành công");
      dispatch(fetchCurrentUser());
      
      const res = await http.get<UserProfileApiResponseType>("/auth/api/profile");
      setProfile(res);
    } catch (err) {
      messageApi.error("Cập nhật ảnh đại diện thất bại");
    }
  };

  // Address modal handlers
  const onAddrCityChange = async (cityName: string) => {
    addressForm.setFieldValue("district", undefined);
    addressForm.setFieldValue("ward", undefined);
    setAddrWards([]);
    const p = addrProvinces.find((x) => x.name === cityName);
    if (!p) return;
    try {
      const res = await provinceService.getProvinceWithDistricts(p.code);
      setAddrDistricts(res.districts || []);
    } catch { setAddrDistricts([]); }
  };

  const onAddrDistrictChange = async (districtName: string) => {
    addressForm.setFieldValue("ward", undefined);
    const d = addrDistricts.find((x) => x.name === districtName);
    if (!d) return;
    try {
      const res = await provinceService.getDistrictWithWards(d.code);
      setAddrWards(res.wards || []);
    } catch { setAddrWards([]); }
  };

  const openAddressModal = (addr?: AddressType) => {
    if (addr) {
      setEditingAddress(addr);
      addressForm.setFieldsValue({
        receiverName: addr.receiverName,
        receiverPhone: addr.receiverPhone,
        province: addr.province,
        district: addr.district,
        ward: addr.ward,
        specifics: addr.specifics,
      });
      // Load districts and wards for the existing address
      if (addr.province) onAddrCityChange(addr.province);
      if (addr.district) {
        setTimeout(() => onAddrDistrictChange(addr.district), 500);
      }
    } else {
      setEditingAddress(null);
      addressForm.resetFields();
      setAddrDistricts([]);
      setAddrWards([]);
    }
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async () => {
    try {
      const vals = await addressForm.validateFields();
      setAddressLoading(true);
      const payload = {
        receiverName: vals.receiverName,
        receiverPhone: vals.receiverPhone,
        province: vals.province,
        district: vals.district,
        ward: vals.ward,
        specifics: vals.specifics,
        main: editingAddress ? editingAddress.main : (addresses.length === 0 ? 1 : 0),
      };

      if (editingAddress) {
        await http.put(`/auth/api/addresses/${editingAddress.id}`, payload);
        messageApi.success("Cập nhật địa chỉ thành công");
      } else {
        await http.post("/auth/api/addresses", payload);
        messageApi.success("Thêm địa chỉ thành công");
      }
      setAddressModalOpen(false);
      loadAddresses();
    } catch (err: any) {
      if (err?.errorFields) return; // form validation error
      messageApi.error("Lưu địa chỉ thất bại");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      await http.delete(`/auth/api/addresses/${id}`);
      messageApi.success("Xóa địa chỉ thành công");
      loadAddresses();
    } catch {
      messageApi.error("Xóa địa chỉ thất bại");
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await http.put(`/auth/api/addresses/${id}/set-default`);
      messageApi.success("Đã đặt làm địa chỉ mặc định");
      loadAddresses();
    } catch {
      messageApi.error("Không thể đặt mặc định");
    }
  };

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

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        {/* Background uốn lượn VIP */}
        <div className="absolute top-0 right-0 w-full h-48 sm:h-64 bg-emerald-500 rounded-b-[40%] sm:rounded-b-[50%] -translate-y-10 scale-110 opacity-10 pointer-events-none" />
        <div className="absolute top-0 left-[-20%] w-[140%] h-40 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-b-[50%] opacity-20 pointer-events-none" />

        <h2 className="text-2xl font-bold text-slate-800 mb-8 relative z-10">Hồ sơ của tôi</h2>
        
        <div className="flex flex-col lg:flex-row gap-12 relative z-10">
          <div className="flex flex-col items-center gap-5 w-full lg:w-1/3">
            <div className="w-44 h-44 rounded-full border-4 border-white shadow-xl overflow-hidden relative group bg-white">
              {(profile?.user_profile?.avatarUrl || user?.avatarUrl) ? (
                <img 
                  src={profile?.user_profile?.avatarUrl || user?.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-5xl font-black">
                  {(() => {
                    const name = (profile?.user_profile?.fullName || user?.fullName || "").trim();
                    if (name) {
                      const parts = name.split(/\s+/).filter(Boolean);
                      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                      return parts[0]?.[0]?.toUpperCase() || "U";
                    }
                    return user?.email?.[0]?.toUpperCase() || "U";
                  })()}
                </div>
              )}
              <Upload 
                showUploadList={false} 
                customRequest={handleAvatarUpload}
                accept="image/*"
              >
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                  <CameraOutlined className="text-3xl mb-2" />
                  <span className="text-sm font-semibold">Thay đổi ảnh</span>
                </div>
              </Upload>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-sm mb-3 font-medium">Định dạng JPEG, PNG tối đa 5MB</p>
              <Upload showUploadList={false} customRequest={handleAvatarUpload} accept="image/*">
                <Button icon={<UploadOutlined />} className="rounded-xl font-medium px-6">Tải ảnh lên</Button>
              </Upload>
            </div>
          </div>

          <div className="w-full lg:w-2/3">
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              size="large"
              className="w-full"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                <Form.Item label={<span className="font-semibold text-slate-700">Họ và tên</span>} name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                  <Input placeholder="Nguyễn Văn A" className="rounded-xl px-4" />
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-slate-700">Số điện thoại</span>} name="phoneNumber">
                  <Input placeholder="09xxxx" className="rounded-xl px-4" />
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-slate-700">Email liên hệ</span>} className="col-span-1 md:col-span-2">
                  <Input value={user?.email || ""} disabled className="rounded-xl bg-slate-50/80 text-slate-500 font-medium px-4" />
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-slate-700">Giới tính</span>} name="gender" className="col-span-1 md:col-span-2">
                  <Radio.Group className="flex gap-6">
                    <Radio value="MALE" className="font-medium text-slate-700">Nam</Radio>
                    <Radio value="FEMALE" className="font-medium text-slate-700">Nữ</Radio>
                    <Radio value="OTHER" className="font-medium text-slate-700">Khác</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-slate-700">Ngày sinh</span>} name="dateOfBirth">
                  <DatePicker className="w-full rounded-xl px-4" format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-slate-700">Tỉnh / Thành phố</span>} name="city">
                  <Select
                    options={provinceOptions}
                    loading={loadingProvince}
                    onChange={(val) => onCityChange(val)}
                    placeholder="Chọn Tỉnh/Thành phố"
                    className="[&>.ant-select-selector]:!rounded-xl"
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-slate-700">Quận / Huyện</span>} name="district">
                  <Select
                    options={districtOptions}
                    loading={loadingDistrict}
                    onChange={(val) => onDistrictChange(val)}
                    placeholder="Chọn Quận/Huyện"
                    className="[&>.ant-select-selector]:!rounded-xl"
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-slate-700">Phường / Xã</span>} name="ward">
                  <Select
                    options={wardOptions}
                    placeholder="Chọn Phường/Xã (nếu có)"
                    className="[&>.ant-select-selector]:!rounded-xl"
                    showSearch
                    optionFilterProp="label"
                    disabled={wardOptions.length === 0}
                  />
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-slate-700">Địa chỉ cụ thể</span>} name="address" className="col-span-1 md:col-span-2">
                  <Input placeholder="Số nhà, tên đường..." className="rounded-xl px-4" />
                </Form.Item>

                <Form.Item label={<span className="font-semibold text-slate-700">Giới thiệu bản thân</span>} name="bio" className="col-span-1 md:col-span-2">
                  <Input.TextArea placeholder="Vài nét về bạn..." rows={4} className="rounded-xl px-4 py-3" />
                </Form.Item>
              </div>

              <div className="flex justify-end mt-6">
                <Button type="primary" htmlType="submit" loading={loading} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 rounded-xl font-bold px-10 h-14 shadow-lg shadow-emerald-500/30 text-base">
                  Lưu thay đổi
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>

      {/* Address Management Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-b-[50%] opacity-10 pointer-events-none" />

        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <EnvironmentOutlined className="text-emerald-500" /> Sổ địa chỉ
          </h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openAddressModal()}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 rounded-xl font-bold shadow-lg shadow-emerald-500/20">
            Thêm địa chỉ
          </Button>
        </div>

        <div className="space-y-4 relative z-10">
          {addresses.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <EnvironmentOutlined className="text-4xl mb-3 block" />
              <p className="text-base font-medium">Bạn chưa có địa chỉ nào</p>
              <p className="text-sm mt-1">Thêm địa chỉ để thuận tiện khi mua hàng</p>
            </div>
          ) : (
            addresses.map((addr) => (
              <div key={addr.id} className={`p-5 rounded-2xl border-2 transition-all ${addr.main === 1 ? "border-emerald-300 bg-emerald-50/30" : "border-slate-200 bg-white"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800">{addr.receiverName}</span>
                      <span className="text-slate-300">|</span>
                      <span className="text-slate-600 text-sm">{addr.receiverPhone}</span>
                      {addr.main === 1 && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <StarFilled className="text-[10px]" /> Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{addr.specifics}, {addr.ward}, {addr.district}, {addr.province}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {addr.main !== 1 && (
                      <Button size="small" onClick={() => handleSetDefault(addr.id)} icon={<StarOutlined />}
                        className="!rounded-lg text-xs font-semibold">Đặt mặc định</Button>
                    )}
                    <Button size="small" onClick={() => openAddressModal(addr)} icon={<EditOutlined />}
                      className="!rounded-lg text-xs font-semibold">Sửa</Button>
                    <Popconfirm title="Xóa địa chỉ này?" onConfirm={() => handleDeleteAddress(addr.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                      <Button size="small" danger icon={<DeleteOutlined />} className="!rounded-lg text-xs font-semibold" />
                    </Popconfirm>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Address Modal */}
        <Modal
          title={<span className="text-lg font-bold">{editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}</span>}
          open={addressModalOpen}
          onCancel={() => setAddressModalOpen(false)}
          onOk={handleSaveAddress}
          confirmLoading={addressLoading}
          okText={editingAddress ? "Cập nhật" : "Thêm"}
          cancelText="Hủy"
          width={600}
          okButtonProps={{ className: "bg-emerald-500 hover:bg-emerald-600 border-0 rounded-xl font-bold" }}
          cancelButtonProps={{ className: "rounded-xl" }}
        >
          <Form form={addressForm} layout="vertical" size="large" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-1">
              <Form.Item label={<span className="font-semibold text-slate-700">Họ và tên người nhận</span>} name="receiverName"
                rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}>
                <Input placeholder="Nhập họ và tên" className="!rounded-xl" />
              </Form.Item>
              <Form.Item label={<span className="font-semibold text-slate-700">Số điện thoại</span>} name="receiverPhone"
                rules={[{ required: true, message: "Vui lòng nhập SĐT" }]}>
                <Input placeholder="Nhập số điện thoại" className="!rounded-xl" />
              </Form.Item>
            </div>
            <Form.Item label={<span className="font-semibold text-slate-700">Tỉnh / Thành phố</span>} name="province"
              rules={[{ required: true, message: "Chọn tỉnh/thành phố" }]}>
              <Select options={addrProvinces.map((p) => ({ label: p.name, value: p.name }))}
                onChange={onAddrCityChange} placeholder="Chọn tỉnh/thành phố" showSearch optionFilterProp="label"
                className="[&>.ant-select-selector]:!rounded-xl" />
            </Form.Item>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-1">
              <Form.Item label={<span className="font-semibold text-slate-700">Quận / Huyện</span>} name="district"
                rules={[{ required: true, message: "Chọn quận/huyện" }]}>
                <Select options={addrDistricts.map((d) => ({ label: d.name, value: d.name }))}
                  onChange={onAddrDistrictChange} placeholder="Chọn quận/huyện" showSearch optionFilterProp="label"
                  className="[&>.ant-select-selector]:!rounded-xl" />
              </Form.Item>
              <Form.Item label={<span className="font-semibold text-slate-700">Phường / Xã</span>} name="ward">
                <Select options={addrWards.map((w) => ({ label: w.name, value: w.name }))}
                  placeholder="Chọn phường/xã" showSearch optionFilterProp="label"
                  className="[&>.ant-select-selector]:!rounded-xl" disabled={addrWards.length === 0} />
              </Form.Item>
            </div>
            <Form.Item label={<span className="font-semibold text-slate-700">Địa chỉ cụ thể</span>} name="specifics"
              rules={[{ required: true, message: "Nhập địa chỉ cụ thể" }]}>
              <Input placeholder="Số nhà, tên đường..." className="!rounded-xl" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}
