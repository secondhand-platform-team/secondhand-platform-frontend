"use client";

import { useState, useEffect } from "react";
import { Button, Input, Form, Radio, DatePicker, Upload, Select, App } from "antd";
import { CameraOutlined, UploadOutlined } from "@ant-design/icons";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import http from "@/utils/api";
import type { UserProfileApiResponseType } from "@/types/user.type";
import dayjs from "dayjs";
import { fetchCurrentUser } from "@/stores/slices/auth.slice";
import type { Province, District, Ward } from "@/types/province.type";
import provinceService from "@/services/province.service";

export default function ProfileSettingsPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfileApiResponseType | null>(null);

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);

  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvince(true);
      try {
        const provinceList = await provinceService.getProvinces();
        setProvinces(provinceList);
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
  );
}
