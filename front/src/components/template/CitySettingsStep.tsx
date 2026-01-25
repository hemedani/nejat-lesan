import React, { useCallback, useState } from "react";
import { UserFormData } from "./FormCreateUser";
import { SelectOption } from "../atoms/MyAsyncMultiSelect";
import { gets } from "@/app/actions/city/gets";
import dynamic from "next/dynamic";
import type { StylesConfig } from "react-select";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

interface CitySettingsStepProps {
  formData: UserFormData;
  setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
}

const CitySettingsStep: React.FC<CitySettingsStepProps> = ({ formData, setFormData }) => {
  const [selectedCity, setSelectedCity] = useState<SelectOption | null>(
    formData.citySettingId ? { value: formData.citySettingId, label: "" } : null,
  );

  const loadCitiesOptions = useCallback(async (inputValue?: string): Promise<SelectOption[]> => {
    const setParams: { limit: number; page: number; name?: string } = {
      limit: 20,
      page: 1,
    };
    if (inputValue) {
      setParams.name = inputValue;
    }
    try {
      const response = await gets({
        set: setParams,
        get: { _id: 1, name: 1 },
      });
      if (response && response.success) {
        return response.body.map((item: { _id: string; name: string }) => ({
          value: item._id,
          label: item.name,
        }));
      }
    } catch (error) {
      console.error("Error loading cities:", error);
    }
    return [];
  }, []);

  const handleCitySelect = useCallback(
    async (selectedOption: SelectOption | null) => {
      setSelectedCity(selectedOption);
      if (selectedOption) {
        setFormData((prev) => ({ ...prev, citySettingId: selectedOption.value }));
      } else {
        setFormData((prev) => ({ ...prev, citySettingId: undefined }));
      }
    },
    [setFormData],
  );

  // Memoized select styles for better performance
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: "48px",
      backgroundColor: "white",
      borderColor: "#cbd5e1",
      borderRadius: "12px",
      direction: "rtl",
      borderWidth: "1px",
      boxShadow: "none",
      transition: "all 0.2s ease-in-out",
      cursor: "pointer",
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "2px 16px",
      direction: "rtl",
    }),
    input: (provided) => ({
      ...provided,
      margin: "0",
      padding: "0",
      color: "#1e293b",
      direction: "rtl",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#94a3b8",
      fontSize: "14px",
      direction: "rtl",
      textAlign: "right",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#1e293b",
      direction: "rtl",
      textAlign: "right",
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#e2e8f0",
      borderRadius: "8px",
      margin: "2px",
      direction: "rtl",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#475569",
      fontSize: "13px",
      fontWeight: "500",
      padding: "4px 8px",
      direction: "rtl",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#64748b",
      borderRadius: "0 8px 8px 0",
      cursor: "pointer",
      transition: "all 0.2s ease-in-out",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: "#64748b",
      padding: "8px 12px",
      transition: "all 0.2s ease-in-out",
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: "#64748b",
      padding: "8px",
      cursor: "pointer",
      transition: "all 0.2s ease-in-out",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "white",
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      marginTop: "4px",
      overflow: "hidden",
      zIndex: 9999,
    }),
    menuList: (provided) => ({
      ...provided,
      padding: "8px",
      maxHeight: "200px",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#f1f5f9" : "transparent",
      color: state.isSelected ? "white" : "#1e293b",
      borderRadius: "8px",
      margin: "2px 0",
      padding: "12px 16px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: state.isSelected ? "500" : "400",
      direction: "rtl",
      textAlign: "right",
      transition: "all 0.15s ease-in-out",
    }),
  } as StylesConfig;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-700">تنظیمات کاربری</h3>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-slate-700 text-right">
          انتخاب شهر تحت مدیریت کاربر
        </label>
        <AsyncSelect
          cacheOptions
          defaultOptions
          value={selectedCity}
          loadOptions={loadCitiesOptions}
          onChange={(newValue) => handleCitySelect(newValue as SelectOption | null)}
          placeholder="شهر را انتخاب کنید"
          noOptionsMessage={() => "شهری یافت نشد"}
          loadingMessage={() => "در حال بارگذاری..."}
          isRtl={true}
          isClearable
          styles={selectStyles}
        />
      </div>
    </div>
  );
};

export default CitySettingsStep;
