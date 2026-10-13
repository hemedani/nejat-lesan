"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import L from "leaflet";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastNotify } from "@/utils/helper";
import MyInput from "../atoms/MyInput";
import { add } from "@/app/actions/city/add";
import { gets as getProvincesAction } from "@/app/actions/province/gets";
import { get as getProvinceAction } from "@/app/actions/province/get";
import { SelectOption } from "../atoms/MyAsyncMultiSelect";
import SelectBox from "../atoms/Select";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import GeoPointPicker, { type GeoPoint } from "@/components/maps/GeoPointPicker";
import GeoPolygonDrawer, { type GeoPolygon } from "@/components/maps/GeoPolygonDrawer";

// Dynamically import map components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const BasemapLayer = dynamic(
  () => import("@/components/maps/BasemapLayer"),
  { ssr: false },
);
const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export const CityCreateSchema = z.object({
  name: z.string().min(1, "نام شهر الزامی است"),
  english_name: z.string().min(1, "نام انگلیسی شهر الزامی است"),
  population: z.coerce.number().min(0, "جمعیت نمی‌تواند منفی باشد"),
  provinceId: z.string().min(1, "انتخاب استان الزامی است"),
  isCenter: z.boolean(),
  area: z.object(
    {
      type: z.literal("MultiPolygon"),
      coordinates: z
        .array(z.array(z.array(z.array(z.number()))))
        .refine((coords) => {
          if (coords.length === 0) return false;
          return coords.every((polygon) =>
            polygon.every((ring) => ring.length >= 4),
          );
        }, "باید حداقل یک منطقه با حداقل 3 نقطه ترسیم شود"),
    },
    { required_error: "ترسیم منطقه بر روی نقشه الزامی است" },
  ),
  center_location: z.object(
    {
      type: z.literal("Point"),
      coordinates: z
        .array(z.number())
        .length(2, "مختصات مرکز شهر باید شامل طول و عرض جغرافیایی باشد"),
    },
    { required_error: "انتخاب مرکز شهر بر روی نقشه الزامی است" },
  ),
});

export type CityFormCreateSchemaType = z.infer<typeof CityCreateSchema>;

interface LatLng {
  lat: number;
  lng: number;
}

export const FormCreateCity = ({
  token,
  lesanUrl,
}: {
  token?: string;
  lesanUrl: string;
}) => {
  const router = useRouter();
  const [centerPoint, setCenterPoint] = useState<GeoPoint | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 32.4279, lng: 53.688 });
  const [mapZoom, setMapZoom] = useState(6);
  const [selectedProvince, setSelectedProvince] = useState<SelectOption | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CityFormCreateSchemaType>({
    resolver: zodResolver(CityCreateSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      english_name: "",
      provinceId: "",
      isCenter: false,
      area: { type: "MultiPolygon", coordinates: [] },
      center_location: { type: "Point", coordinates: [] },
    },
  });

  // نقشه از همین مقدارِ فرم می‌خواند، پس state موازیِ دیگری لازم نیست.
  const area = (watch("area") as GeoPolygon | undefined) ?? null;

  // Load provinces options
  const loadProvincesOptions = async (
    inputValue?: string,
  ): Promise<SelectOption[]> => {
    const setParams: { limit: number; page: number; name?: string } = {
      limit: 20,
      page: 1,
    };
    if (inputValue) {
      setParams.name = inputValue;
    }
    try {
      const response = await getProvincesAction({
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
    }
    return [];
  };

  // Handle province selection
  const handleProvinceSelect = useCallback(
    async (selectedOption: SelectOption | null) => {
      setSelectedProvince(selectedOption);
      if (selectedOption) {
        setValue("provinceId", selectedOption.value, { shouldValidate: true });

        try {
          const provinceDetails = await getProvinceAction(
            selectedOption.value,
            {
              _id: 1,
              name: 1,
              center_location: 1,
            },
          );

          if (
            provinceDetails &&
            provinceDetails.success &&
            provinceDetails.body.center_location
          ) {
            const coordinates =
              provinceDetails.body.center_location.coordinates;
            if (coordinates && coordinates.length >= 2) {
              setMapCenter({ lat: coordinates[1], lng: coordinates[0] });
              setMapZoom(8);
            }
          }
        } catch {
          // استان خوانده نشد؛ قاب پیش‌فرض ایران می‌ماند.
        }
      } else {
        setValue("provinceId", "", { shouldValidate: true });
        setMapCenter({ lat: 32.4279, lng: 53.688 });
        setMapZoom(6);
      }
    },
    [setValue],
  );

  const handleAreaChange = useCallback(
    (next: GeoPolygon) => {
      setValue("area", next, { shouldValidate: true });
      trigger("area");
    },
    [setValue, trigger],
  );

  const handleCenterChange = useCallback(
    (next: GeoPoint) => {
      setCenterPoint(next);
      setValue("center_location", next, { shouldValidate: true });
      trigger("center_location");
    },
    [setValue, trigger],
  );

  const clearArea = useCallback(() => {
    setValue("area", { type: "MultiPolygon", coordinates: [] });
    trigger("area");
  }, [setValue, trigger]);

  const clearCenterPoint = useCallback(() => {
    setCenterPoint(null);
    setValue("center_location", { type: "Point", coordinates: [] });
    trigger("center_location");
  }, [setValue, trigger]);

  // Form submission
  const onSubmit: SubmitHandler<CityFormCreateSchemaType> = async (data) => {
    const createdCity = await add({
      name: data.name,
      english_name: data.english_name,
      population: data.population,
      area: data.area as {
        type: "MultiPolygon";
        coordinates: number[][][][];
      },
      center_location: data.center_location as {
        type: "Point";
        coordinates: number[];
      },
      provinceId: data.provinceId,
      isCenter: data.isCenter,
    });

    if (createdCity.success) {
      ToastNotify("success", "شهر با موفقیت ایجاد شد");
      router.replace("/admin/city");
    } else {
      ToastNotify("error", createdCity.body.message || "خطا در ایجاد شهر");
    }
  };


  return (
    <div className="p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Fields */}
        <div className="bg-gray-100 p-6 border rounded-lg space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            اطلاعات شهر
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name Input */}
            <MyInput
              label="نام شهر"
              register={register}
              name="name"
              errMsg={errors.name?.message}
            />

            {/* English Name Input */}
            <MyInput
              label="نام انگلیسی شهر"
              register={register}
              name="english_name"
              errMsg={errors.english_name?.message}
            />

            {/* Population Input */}
            <MyInput
              label="جمعیت"
              register={register}
              name="population"
              type="number"
              errMsg={errors.population?.message}
            />
          </div>

          {/* Province Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700 text-right">
              انتخاب استان
            </label>
            <AsyncSelect
              cacheOptions
              defaultOptions
              value={selectedProvince}
              loadOptions={loadProvincesOptions}
              onChange={(newValue) =>
                handleProvinceSelect(newValue as SelectOption | null)
              }
              placeholder="استان را انتخاب کنید"
              noOptionsMessage={() => "استانی یافت نشد"}
              loadingMessage={() => "در حال بارگذاری..."}
              isRtl={true}
              isClearable
              styles={{
                control: (provided: Record<string, unknown>, state: { isFocused: boolean }) => ({
                  ...provided,
                  minHeight: "48px",
                  backgroundColor: errors.provinceId ? "#fef2f2" : "white",
                  borderColor: errors.provinceId
                    ? state.isFocused
                      ? "#ef4444"
                      : "#fca5a5"
                    : state.isFocused
                      ? "#3b82f6"
                      : "#cbd5e1",
                  borderRadius: "12px",
                  direction: "rtl",
                }),
                valueContainer: (provided: Record<string, unknown>) => ({
                  ...provided,
                  padding: "2px 16px",
                  direction: "rtl",
                }),
                placeholder: (provided: Record<string, unknown>) => ({
                  ...provided,
                  color: "#94a3b8",
                  direction: "rtl",
                  textAlign: "right",
                }),
                singleValue: (provided: Record<string, unknown>) => ({
                  ...provided,
                  color: "#1e293b",
                  direction: "rtl",
                  textAlign: "right",
                }),
                option: (
                  provided: Record<string, unknown>,
                  state: { isSelected: boolean; isFocused: boolean },
                ) => ({
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
            {errors.provinceId && (
              <span className="text-red-500 text-xs font-medium text-right mt-1">
                {errors.provinceId.message}
              </span>
            )}
          </div>

          {/* Is Center Checkbox */}
          <SelectBox
            label="مرکز استان"
            name="isCenter"
            setValue={(name, value) => setValue("isCenter", value === "true")}
            options={[
              { value: "true", label: "بله، این شهر مرکز استان است" },
              { value: "false", label: "خیر، این شهر مرکز استان نیست" },
            ]}
          />
        </div>

        {/* Errors render next to the control that caused them, inside each
            drawer's own `errorMessage` slot, instead of in separate red boxes
            floating above the map. */}
        <div className="bg-gray-100 p-6 border rounded-lg space-y-6">
          <GeoPolygonDrawer
            className="h-96 border border-gray-300 rounded-lg"
            errorMessage={errors.area?.message}
            fallbackCenter={mapCenter}
            fallbackZoom={6}
            label="محدودهٔ شهر"
            onChange={handleAreaChange}
            onClear={clearArea}
            tone="light"
            value={area}
          />

          <GeoPointPicker
            className="h-96 border border-gray-300 rounded-lg"
            errorMessage={errors.center_location?.message}
            fallbackCenter={mapCenter}
            fallbackZoom={6}
            label="مرکز شهر"
            onChange={handleCenterChange}
            onClear={clearCenterPoint}
            tone="light"
            value={centerPoint}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "در حال ایجاد..." : "ایجاد شهر"}
          </button>
        </div>
      </form>
    </div>
  );
};
