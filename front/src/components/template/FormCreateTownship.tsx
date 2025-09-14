"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastNotify } from "@/utils/helper";
import MyInput from "../atoms/MyInput";
import { add } from "@/app/actions/township/add";
import { gets as getProvincesAction } from "@/app/actions/province/gets";
import { get as getProvinceAction } from "@/app/actions/province/get";
import { SelectOption } from "../atoms/MyAsyncMultiSelect";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import MapClickHandler from "@/components/MapClickHandler";

// Dynamically import map components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
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
const SimpleDrawing = dynamic(() => import("@/components/SimpleDrawing"), {
  ssr: false,
});
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export const TownshipCreateSchema = z.object({
  name: z.string().min(1, "نام شهرستان الزامی است"),
  english_name: z.string().min(1, "نام انگلیسی شهرستان الزامی است"),
  population: z.coerce.number().min(0, "جمعیت نمی‌تواند منفی باشد"),
  provinceId: z.string().min(1, "انتخاب استان الزامی است"),
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
        .length(2, "مختصات مرکز شهرستان باید شامل طول و عرض جغرافیایی باشد"),
    },
    { required_error: "انتخاب مرکز شهرستان بر روی نقشه الزامی است" },
  ),
});

export type TownshipFormCreateSchemaType = z.infer<typeof TownshipCreateSchema>;

interface LatLng {
  lat: number;
  lng: number;
}

const FormCreateTownship = ({
  token, // eslint-disable-line @typescript-eslint/no-unused-vars
  lesanUrl, // eslint-disable-line @typescript-eslint/no-unused-vars
}: {
  token?: string;
  lesanUrl: string;
}) => {
  const router = useRouter();
  const [drawnPolygon, setDrawnPolygon] = useState<LatLng[] | null>(null);
  const [centerPoint, setCenterPoint] = useState<LatLng | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isCenterMode, setIsCenterMode] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    32.4279, 53.688,
  ]);
  const [mapZoom, setMapZoom] = useState(6);
  const [selectedProvince, setSelectedProvince] = useState<SelectOption | null>(
    null,
  );
  const [mapKey, setMapKey] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TownshipFormCreateSchemaType>({
    resolver: zodResolver(TownshipCreateSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      english_name: "",
      provinceId: "",
      area: { type: "MultiPolygon", coordinates: [] },
      center_location: { type: "Point", coordinates: [] },
    },
  });

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
      console.error("Error loading provinces:", error);
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
              setMapCenter([coordinates[1], coordinates[0]]);
              setMapZoom(8);
              setMapKey((prev) => prev + 1);
            }
          }
        } catch (error) {
          console.error("Error getting province details:", error);
        }
      } else {
        setValue("provinceId", "", { shouldValidate: true });
        setMapCenter([32.4279, 53.688]);
        setMapZoom(6);
        setMapKey((prev) => prev + 1);
      }
    },
    [setValue],
  );

  // Handle polygon creation
  const handlePolygonCreated = useCallback(
    (polygon: LatLng[]) => {
      setDrawnPolygon(polygon);
      const coordinates = polygon.map((point) => [point.lng, point.lat]);
      coordinates.push(coordinates[0]);

      const multiPolygon = {
        type: "MultiPolygon" as const,
        coordinates: [[coordinates]],
      };

      setValue("area", multiPolygon, { shouldValidate: true });
      trigger("area");
    },
    [setValue, trigger],
  );

  // Handle center point selection
  const handleCenterPointSelected = useCallback(
    (point: LatLng) => {
      setCenterPoint(point);
      const pointGeometry = {
        type: "Point" as const,
        coordinates: [point.lng, point.lat],
      };

      setValue("center_location", pointGeometry, { shouldValidate: true });
      trigger("center_location");
    },
    [setValue, trigger],
  );

  // Handle map click based on mode
  const handleMapClick = useCallback(
    (latlng: LatLng) => {
      if (isCenterMode) {
        handleCenterPointSelected(latlng);
        setIsCenterMode(false);
      }
    },
    [isCenterMode, handleCenterPointSelected],
  );

  // Submit form
  const onSubmit: SubmitHandler<TownshipFormCreateSchemaType> = async (
    data,
  ) => {
    try {
      const response = await add(data);

      if (response && response.success) {
        ToastNotify("success", "شهرستان با موفقیت ایجاد شد");
        router.push("/admin/township");
      } else {
        ToastNotify("error", response?.body?.message || "خطا در ایجاد شهرستان");
      }
    } catch (error) {
      console.error("Error creating township:", error);
      ToastNotify("error", "خطای غیرمنتظره در ایجاد شهرستان");
    }
  };

  // Clear polygon
  const clearPolygon = () => {
    setDrawnPolygon(null);
    setValue("area", { type: "MultiPolygon", coordinates: [] });
    trigger("area");
  };

  // Clear center point
  const clearCenterPoint = () => {
    setCenterPoint(null);
    setValue("center_location", { type: "Point", coordinates: [] });
    trigger("center_location");
  };

  useEffect(() => {
    // Set default Iran center - no need to import CSS here as it should be imported at app level
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MyInput
            label="نام شهرستان"
            register={register}
            name="name"
            errMsg={errors.name?.message}
          />

          <MyInput
            label="نام انگلیسی شهرستان"
            register={register}
            name="english_name"
            errMsg={errors.english_name?.message}
          />

          <MyInput
            label="جمعیت"
            type="number"
            register={register}
            name="population"
            errMsg={errors.population?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              استان <span className="text-red-500">*</span>
            </label>
            <AsyncSelect
              cacheOptions
              loadOptions={loadProvincesOptions}
              defaultOptions
              value={selectedProvince}
              onChange={(newValue) => handleProvinceSelect(newValue as any)}
              placeholder="جستجو و انتخاب استان..."
              noOptionsMessage={() => "استانی یافت نشد"}
              loadingMessage={() => "در حال بارگذاری..."}
              className="text-sm"
              styles={{
                control: (provided, state) => ({
                  ...provided,
                  minHeight: "42px",
                  borderColor: errors.provinceId
                    ? "#ef4444"
                    : provided.borderColor,
                  borderWidth: errors.provinceId ? "2px" : "1px",
                  boxShadow: state.isFocused
                    ? errors.provinceId
                      ? "0 0 0 1px #ef4444"
                      : "0 0 0 1px #3b82f6"
                    : "none",
                  "&:hover": {
                    borderColor: errors.provinceId ? "#ef4444" : "#d1d5db",
                  },
                }),
                placeholder: (provided) => ({
                  ...provided,
                  fontSize: "14px",
                }),
              }}
            />
            {errors.provinceId && (
              <p className="text-red-500 text-sm mt-1">
                {errors.provinceId.message}
              </p>
            )}
          </div>
        </div>

        {/* Map Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            تعیین منطقه و مرکز شهرستان بر روی نقشه
          </h3>

          {/* Map Controls */}
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                setIsDrawingMode(!isDrawingMode);
                setIsCenterMode(false);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isDrawingMode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isDrawingMode ? "خروج از حالت ترسیم" : "ترسیم منطقه"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCenterMode(!isCenterMode);
                setIsDrawingMode(false);
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isCenterMode
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {isCenterMode
                ? "خروج از حالت انتخاب مرکز"
                : "انتخاب مرکز شهرستان"}
            </button>

            {drawnPolygon && (
              <button
                type="button"
                onClick={clearPolygon}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                پاک کردن منطقه
              </button>
            )}

            {centerPoint && (
              <button
                type="button"
                onClick={clearCenterPoint}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                پاک کردن مرکز
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-2">راهنمای استفاده:</h4>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>• ابتدا استان مربوطه را انتخاب کنید</li>
              <li>
                • بر روی دکمه &quot;ترسیم منطقه&quot; کلیک کنید و مرزهای شهرستان
                را ترسیم کنید
              </li>
              <li>
                • بر روی دکمه &quot;انتخاب مرکز شهرستان&quot; کلیک کنید و نقطه
                مرکزی را انتخاب کنید
              </li>
              <li>• برای تکمیل ترسیم، آخرین نقطه را به اولین نقطه متصل کنید</li>
            </ul>
          </div>

          {/* Error Messages */}
          {errors.area && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{errors.area.message}</p>
            </div>
          )}

          {errors.center_location && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">
                {errors.center_location.message}
              </p>
            </div>
          )}

          {/* Map Container */}
          <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
            <MapContainer
              key={mapKey}
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              <MapClickHandler
                isActive={isCenterMode}
                onMapClick={(e: any) => handleMapClick(e.latlng)}
              />

              {isDrawingMode && (
                <SimpleDrawing
                  isActive={isDrawingMode}
                  onPolygonCreated={handlePolygonCreated}
                  onPolygonDeleted={() => clearPolygon()}
                />
              )}

              {drawnPolygon && (
                <Polygon
                  positions={drawnPolygon.map((point) => [
                    point.lat,
                    point.lng,
                  ])}
                  pathOptions={{
                    color: "blue",
                    fillColor: "lightblue",
                    fillOpacity: 0.3,
                    weight: 2,
                  }}
                />
              )}

              {centerPoint && (
                <Marker position={[centerPoint.lat, centerPoint.lng]} />
              )}
            </MapContainer>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6 border-t">
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isValid && !isSubmitting
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "در حال ایجاد..." : "ایجاد شهرستان"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormCreateTownship;
