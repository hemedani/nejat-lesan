"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { UploadImage } from "../molecules/UploadFile";
import { seedTrafficZones } from "@/app/actions/traffic_zone/seedTrafficZones";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import { ToastNotify } from "@/utils/helper";
import { useRouter } from "next/navigation";
import { useScrollLock } from "@/hooks/useScrollLock";
import { SelectOption } from "../atoms/MyAsyncMultiSelect";
import React, { useCallback } from "react";
import dynamic from "next/dynamic";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

interface SeedTrafficZonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  cityId?: string;
  cityName?: string;
}

interface SeedSummary {
  trafficZonesCreated?: number;
  airPollutionZonesCreated?: number;
  accidentsUpdated?: number;
  errors?: string[];
  dbQueries?: number;
  totalTime?: number;
}

const SeedTrafficZonesModal: React.FC<SeedTrafficZonesModalProps> = ({
  isOpen,
  onClose,
  token,
  cityId,
  cityName,
}) => {
  const [uploadedFileId, setUploadedFileId] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<SelectOption | null>(
    cityId && cityName ? { value: cityId, label: cityName } : null,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<SeedSummary | null>(null);
  const router = useRouter();

  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  // Load cities options
  const loadCitiesOptions = useCallback(
    async (inputValue?: string): Promise<SelectOption[]> => {
      const setParams: { limit: number; page: number; name?: string } = {
        limit: 20,
        page: 1,
      };
      if (inputValue) {
        setParams.name = inputValue;
      }
      try {
        const response = await getCitiesAction({
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
    },
    [],
  );

  const handleSeedZones = async () => {
    if (!selectedCity?.value) {
      ToastNotify("error", "لطفا ابتدا شهر را انتخاب کنید");
      return;
    }

    if (!uploadedFileId) {
      ToastNotify("error", "لطفا ابتدا فایل GeoJSON را آپلود کنید");
      return;
    }

    setIsProcessing(true);
    setSummary(null);
    try {
      const result = await seedTrafficZones(selectedCity.value, {
        set: {
          cityId: selectedCity.value,
          geoId: uploadedFileId,
        },
        get: {
          summary: 1,
        },
      });

      if (result.success && result.body?.summary) {
        const data = result.body.summary;
        setSummary(data);
        ToastNotify(
          "success",
          `مناطق شهر ${selectedCity.label} با موفقیت اضافه شد`,
        );
        router.refresh();
      } else {
        ToastNotify(
          "error",
          `خطا در اضافه کردن مناطق: ${result.body?.message || "خطای نامشخص"}`,
        );
      }
    } catch (error) {
      console.error("Error seeding traffic zones:", error);
      ToastNotify("error", "خطا در اضافه کردن مناطق");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setUploadedFileId("");
    setSelectedCity(null);
    setSummary(null);
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {cityName
              ? `افزودن مناطق ترافیک و آلودگی هوا - ${cityName}`
              : "افزودن مناطق ترافیک و آلودگی هوا"}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-700">
              ⚠️ توجه: اجرای دوباره این عملیات باعث ایجاد مناطق تکراری می‌شود.
              لطفا برای هر شهر فقط یک بار اجرا کنید.
            </p>
          </div>

          {/* City Selection - hidden when the city is preset (per-city seeding) */}
          {!cityId && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700 text-right">
                انتخاب شهر
              </label>
              <AsyncSelect
                cacheOptions
                defaultOptions
                value={selectedCity}
                loadOptions={loadCitiesOptions}
                onChange={(newValue) =>
                  setSelectedCity(newValue as SelectOption | null)
                }
                placeholder="شهر را انتخاب کنید"
                noOptionsMessage={() => "شهری یافت نشد"}
                loadingMessage={() => "در حال بارگذاری..."}
                isRtl={true}
                isClearable
                isDisabled={isProcessing}
                styles={{
                  control: (provided: any, state: any) => ({
                    ...provided,
                    minHeight: "48px",
                    borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1",
                    borderRadius: "12px",
                    direction: "rtl",
                  }),
                  valueContainer: (provided: any) => ({
                    ...provided,
                    padding: "2px 16px",
                    direction: "rtl",
                  }),
                  placeholder: (provided: any) => ({
                    ...provided,
                    color: "#94a3b8",
                    direction: "rtl",
                    textAlign: "right",
                  }),
                  singleValue: (provided: any) => ({
                    ...provided,
                    color: "#1e293b",
                    direction: "rtl",
                    textAlign: "right",
                  }),
                  option: (provided: any, state: any) => ({
                    ...provided,
                    backgroundColor: state.isSelected
                      ? "#3b82f6"
                      : state.isFocused
                        ? "#f1f5f9"
                        : "transparent",
                    color: state.isSelected ? "white" : "#1e293b",
                    direction: "rtl",
                    textAlign: "right",
                  }),
                }}
              />
            </div>
          )}

          <div>
            <p className="text-sm text-gray-600 mb-4">
              لطفا فایل GeoJSON شامل مناطق ترافیک و آلودگی هوا را آپلود کنید.
              فایل باید شامل اطلاعات جغرافیایی مناطق با فرمت استاندارد GeoJSON
              باشد.
            </p>
            <UploadImage
              setUploadedImage={setUploadedFileId}
              token={token}
              inputName="geoJsonFile"
              type="geo"
            />
          </div>

          {uploadedFileId && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                ✓ فایل با موفقیت آپلود شد
              </p>
            </div>
          )}

          {summary && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-2">
              <p className="text-sm font-semibold text-blue-800">
                خلاصه عملیات:
              </p>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• مناطق ترافیک ایجاد شده: {summary.trafficZonesCreated ?? 0}</p>
                <p>
                  • مناطق آلودگی هوا ایجاد شده:{" "}
                  {summary.airPollutionZonesCreated ?? 0}
                </p>
                <p>• تصادفات به‌روزرسانی شده: {summary.accidentsUpdated ?? 0}</p>
                {summary.errors && summary.errors.length > 0 && (
                  <div className="pt-1">
                    <p className="text-xs font-medium text-red-600">
                      خطاها ({summary.errors.length}):
                    </p>
                    <ul className="list-disc pr-4 text-xs text-red-600 space-y-1 mt-1">
                      {summary.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            disabled={isProcessing}
          >
            انصراف
          </button>
          <button
            onClick={handleSeedZones}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={!selectedCity?.value || !uploadedFileId || isProcessing}
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                در حال پردازش...
              </>
            ) : (
              "افزودن مناطق"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeedTrafficZonesModal;