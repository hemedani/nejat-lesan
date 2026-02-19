"use client";
import React, { useState, useEffect, useCallback } from "react";
import { AppApi } from "@/services/api";
import { ToastNotify } from "@/utils/helper";
import { useScrollLock } from "@/hooks/useScrollLock";
import Select from "react-select";
import { updateCityRelations } from "@/app/actions/city/updateCityRelations";

interface ProvinceOption {
  _id: string;
  name: string;
}

interface CityData {
  _id: string;
  name: string;
  province?: {
    _id: string;
    name: string;
  } | null;
}

interface CityProvinceRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityId: string;
  cityName: string;
  token?: string;
  onSuccessAction: () => void;
}

const CityProvinceRelationModal: React.FC<CityProvinceRelationModalProps> = ({
  isOpen,
  onClose,
  cityId,
  cityName,
  token,
  onSuccessAction,
}) => {
  const [cityData, setCityData] = useState<CityData | undefined>(undefined);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  const fetchCityData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await AppApi().send(
        {
          service: "main",
          model: "city",
          act: "get",
          details: {
            set: {
              _id: cityId,
            },
            get: {
              _id: 1,
              name: 1,
              province: {
                _id: 1,
                name: 1,
              },
            },
          },
        },
        { token },
      );

      if (response.success && response.body) {
        const city = response.body[0];
        setCityData(city);

        if (city.province) {
          setSelectedProvince({
            value: city.province._id!,
            label: city.province.name,
          });
        } else {
          setSelectedProvince(null);
        }
      } else {
        setError("شهر یافت نشد");
        ToastNotify("error", "خطا در بارگذاری اطلاعات شهر");
      }
    } catch (err) {
      setError("خطا در بارگذاری اطلاعات");
      ToastNotify("error", "خطا در بارگذاری اطلاعات شهر");
      console.error("Error fetching city data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [cityId, token]);

  const fetchProvinces = useCallback(async () => {
    try {
      const response = await AppApi().send(
        {
          service: "main",
          model: "province",
          act: "gets",
          details: {
            set: {
              page: 1,
              limit: 100,
            },
            get: {
              _id: 1,
              name: 1,
            },
          },
        },
        { token },
      );

      if (response.success && response.body) {
        setProvinces(response.body);
      }
    } catch (err) {
      console.error("Error fetching provinces:", err);
    }
  }, [token]);

  // Fetch city data and provinces when modal opens
  useEffect(() => {
    if (isOpen && cityId) {
      fetchCityData();
      fetchProvinces();
    }
  }, [isOpen, cityId, fetchCityData, fetchProvinces]);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const provinceId = selectedProvince?.value || undefined;
      const result = await updateCityRelations(cityId, provinceId);

      if (result.success) {
        ToastNotify(
          "success",
          provinceId ? "استان شهر با موفقیت به‌روزرسانی شد" : "ارتباط شهر با استان حذف شد",
        );
        onSuccessAction();
        onClose();
      } else {
        ToastNotify("error", result.body?.message || "خطا در به‌روزرسانی ارتباط شهر");
      }
    } catch (err) {
      ToastNotify("error", "خطا در به‌روزرسانی ارتباط شهر");
      console.error("Error updating city relations:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setCityData(undefined);
    setSelectedProvince(null);
    setError(null);
    onClose();
  };

  const provinceOptions = provinces.map((province) => ({
    value: province._id,
    label: province.name,
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto m-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold text-gray-800">مدیریت ارتباط شهر با استان</h2>
            <p className="text-sm text-gray-500 mt-1">{cityName}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600">در حال بارگذاری اطلاعات شهر...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-red-600 font-medium">{error}</p>
                  <button
                    onClick={fetchCityData}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    تلاش مجدد
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-6">
              {/* Current Province Display */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">استان فعلی:</h3>
                <p className="text-gray-900">{cityData?.province?.name || "بدون استان"}</p>
              </div>

              {/* Province Selection */}
              <div>
                <label
                  htmlFor="province-select"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  انتخاب استان:
                </label>
                <Select
                  id="province-select"
                  options={provinceOptions}
                  value={selectedProvince}
                  onChange={(newValue) => setSelectedProvince(newValue)}
                  placeholder="استان را انتخاب کنید..."
                  classNamePrefix="react-select"
                  className="text-sm"
                  isClearable
                  noOptionsMessage={() => "استانی یافت نشد"}
                />
                <p className="text-xs text-gray-500 mt-2">
                  برای حذف ارتباط شهر با استان، گزینه را پاک کنید
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">توضیحات:</p>
                    <ul className="space-y-1 text-blue-700">
                      <li>• هر شهر می‌تواند به یک استان متصل باشد</li>
                      <li>• با انتخاب استان جدید، ارتباط قبلی حذف می‌شود</li>
                      <li>• می‌توانید شهر را بدون استان رها کنید</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white rounded-b-lg">
          <button
            onClick={handleClose}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            disabled={isSaving}
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CityProvinceRelationModal;
