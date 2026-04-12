"use client";

import { useEffect, useState, useCallback } from "react";
import { Select, Spin } from "antd";
import { provinceService } from "@/config/services/province.service";
import type { Province, District, Ward } from "@/types/province.type";

interface LocationSelectorProps {
  value?: {
    city?: string;
    district?: string;
    ward?: string;
  };
  onChange?: (location: {
    city: string;
    district: string;
    ward: string;
  }) => void;
}

export default function LocationSelector({
  value = {},
  onChange,
}: LocationSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<string>(
    value?.city || "",
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    value?.district || "",
  );
  const [selectedWard, setSelectedWard] = useState<string>(value?.ward || "");

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const data = await provinceService.getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Error loading provinces:", error);
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!selectedProvince) {
        setDistricts([]);
        setSelectedDistrict("");
        setWards([]);
        setSelectedWard("");
        return;
      }

      try {
        setLoadingDistricts(true);
        const provinceCode = parseInt(selectedProvince);
        const data =
          await provinceService.getProvinceWithDistricts(provinceCode);
        setDistricts(data.districts || []);
        setSelectedDistrict("");
        setWards([]);
        setSelectedWard("");
      } catch (error) {
        console.error("Error loading districts:", error);
        setDistricts([]);
        setSelectedDistrict("");
        setWards([]);
        setSelectedWard("");
      } finally {
        setLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [selectedProvince]);

  // Load wards when district changes
  useEffect(() => {
    const loadWards = async () => {
      if (!selectedDistrict) {
        setWards([]);
        setSelectedWard("");
        return;
      }

      try {
        setLoadingWards(true);
        const districtCode = parseInt(selectedDistrict);
        const data = await provinceService.getDistrictWithWards(districtCode);
        setWards(data.wards || []);
        setSelectedWard("");
      } catch (error) {
        console.error("Error loading wards:", error);
        setWards([]);
        setSelectedWard("");
      } finally {
        setLoadingWards(false);
      }
    };

    loadWards();
  }, [selectedDistrict]);

  // Notify parent when location changes
  const handleChange = useCallback(
    (newProvince?: string, newDistrict?: string, newWard?: string) => {
      const finalProvince = newProvince ?? selectedProvince;
      const finalDistrict = newDistrict ?? selectedDistrict;
      const finalWard = newWard ?? selectedWard;

      if (onChange) {
        // Get the actual names from the lists
        const provinceName =
          provinces.find((p) => String(p.code) === finalProvince)?.name ||
          finalProvince;
        const districtName =
          districts.find((d) => String(d.code) === finalDistrict)?.name ||
          finalDistrict;
        const wardName =
          wards.find((w) => String(w.code) === finalWard)?.name || finalWard;

        onChange({
          city: provinceName,
          district: districtName,
          ward: wardName,
        });
      }
    },
    [
      selectedProvince,
      selectedDistrict,
      selectedWard,
      provinces,
      districts,
      wards,
      onChange,
    ],
  );

  const onProvinceChange = (value: string) => {
    setSelectedProvince(value);
    handleChange(value, "", "");
  };

  const onDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    handleChange(selectedProvince, value, "");
  };

  const onWardChange = (value: string) => {
    setSelectedWard(value);
    handleChange(selectedProvince, selectedDistrict, value);
  };

  const getProvinceLabel = () => {
    const province = provinces.find((p) => String(p.code) === selectedProvince);
    return province?.name || selectedProvince;
  };

  const getDistrictLabel = () => {
    const district = districts.find((d) => String(d.code) === selectedDistrict);
    return district?.name || selectedDistrict;
  };

  const getWardLabel = () => {
    const ward = wards.find((w) => String(w.code) === selectedWard);
    return ward?.name || selectedWard;
  };

  return (
    <div className="space-y-3">
      {/* City/Province */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Thành phố/Tỉnh *
        </label>
        <Select
          placeholder="Chọn thành phố/tỉnh"
          value={selectedProvince || undefined}
          onChange={onProvinceChange}
          loading={loadingProvinces}
          style={{ width: "100%" }}
          className="rounded-xl border border-slate-200"
          options={provinces.map((province) => ({
            label: province.name,
            value: String(province.code),
          }))}
        />
      </div>

      {/* District */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Quận/Huyện *
        </label>
        <Select
          placeholder="Chọn quận/huyện"
          value={selectedDistrict || undefined}
          onChange={onDistrictChange}
          loading={loadingDistricts}
          disabled={!selectedProvince || districts.length === 0}
          style={{ width: "100%" }}
          className="rounded-xl border border-slate-200"
          options={districts.map((district) => ({
            label: district.name,
            value: String(district.code),
          }))}
        />
      </div>

      {/* Ward */}
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Phường/Xã *
        </label>
        <Select
          placeholder="Chọn phường/xã"
          value={selectedWard || undefined}
          onChange={onWardChange}
          loading={loadingWards}
          disabled={!selectedDistrict || wards.length === 0}
          style={{ width: "100%" }}
          className="rounded-xl border border-slate-200"
          options={wards.map((ward) => ({
            label: ward.name,
            value: String(ward.code),
          }))}
        />
      </div>
    </div>
  );
}
