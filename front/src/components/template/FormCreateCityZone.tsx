"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastNotify } from "@/utils/helper";
import MyInput from "../atoms/MyInput";
import { add } from "@/app/actions/city_zone/add";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import { get as getCityAction } from "@/app/actions/city/get";
import { SelectOption } from "../atoms/MyAsyncMultiSelect";
import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamically import map components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const SimpleDrawing = dynamic(() => import("@/components/SimpleDrawing"), {
  ssr: false,
});
const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

export const CityZoneCreateSchema = z.object({
  name: z.string().min(1, "نام منطقه الزامی است"),
  cityId: z.string().min(1, "انتخاب شهر الزامی است"),
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
});

export type CityZoneFormCreateSchemaType = z.infer<typeof CityZoneCreateSchema>;

interface LatLng {
  lat: number;
  lng: number;
}

export const FormCreateCityZone = ({
  token,
  lesanUrl,
}: {
  token?: string;
  lesanUrl: string;
}) => {
  const router = useRouter();
  const [drawnPolygon, setDrawnPolygon] = useState<LatLng[] | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    32.4279, 53.688,
  ]);
  const [mapZoom, setMapZoom] = useState(6);
  const [selectedCity, setSelectedCity] = useState<SelectOption | null>(null);
  const [mapKey, setMapKey] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CityZoneFormCreateSchemaType>({
    resolver: zodResolver(CityZoneCreateSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      cityId: "",
      area: { type: "MultiPolygon", coordinates: [] },
    },
  });

  // Load cities options
  const loadCitiesOptions = async (
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
  };

  // Handle city selection
  const handleCitySelect = useCallback(
    async (selectedOption: SelectOption | null) => {
      setSelectedCity(selectedOption);
      if (selectedOption) {
        setValue("cityId", selectedOption.value, { shouldValidate: true });

        try {
          const cityDetails = await getCityAction(selectedOption.value, {
            _id: 1,
            name: 1,
            center_location: 1,
          });

          if (
            cityDetails &&
            cityDetails.success &&
            cityDetails.body.center_location
          ) {
            const coordinates = cityDetails.body.center_location.coordinates;
            if (coordinates && coordinates.length >= 2) {
              setMapCenter([coordinates[1], coordinates[0]]);
              setMapZoom(12);
              setMapKey((prev) => prev + 1);
            }
          }
        } catch (error) {
          console.error("Error getting city details:", error);
        }
      } else {
        setValue("cityId", "", { shouldValidate: true });
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
      setIsDrawingMode(false);
      trigger();
    },
    [setValue, trigger],
  );

  // Handle polygon deletion
  const handlePolygonDeleted = useCallback(() => {
    setDrawnPolygon(null);
    setValue(
      "area",
      { type: "MultiPolygon", coordinates: [] },
      { shouldValidate: true },
    );
    trigger();
  }, [setValue, trigger]);

  // Toggle drawing mode
  const toggleDrawingMode = () => {
    if (isDrawingMode) {
      setIsDrawingMode(false);
      // Clear any drawn polygon when cancelling drawing mode
      setDrawnPolygon(null);
      setValue(
        "area",
        { type: "MultiPolygon", coordinates: [] },
        { shouldValidate: true },
      );
      trigger();
    } else {
      setIsDrawingMode(true);
    }
  };

  // Form submission
  const onSubmit: SubmitHandler<CityZoneFormCreateSchemaType> = async (
    data,
  ) => {
    const createdCityZone = await add({
      name: data.name,
      area: data.area as {
        type: "MultiPolygon";
        coordinates: number[][][][];
      },
      cityId: data.cityId,
    });

    if (createdCityZone.success) {
      ToastNotify("success", "منطقه شهری با موفقیت ایجاد شد");
      router.replace("/admin/city-zone");
    } else {
      ToastNotify(
        "error",
        createdCityZone.body.message || "خطا در ایجاد منطقه شهری",
      );
    }
  };

  // Setup Leaflet
  useEffect(() => {
    if (typeof window === "undefined") return;

    const leafletCSS = document.createElement("link");
    leafletCSS.rel = "stylesheet";
    leafletCSS.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(leafletCSS);

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });
    });

    return () => {
      if (document.head.contains(leafletCSS)) {
        document.head.removeChild(leafletCSS);
      }
    };
  }, []);

  return (
    <div className="p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Fields */}
        <div className="bg-gray-100 p-6 border rounded-lg space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            اطلاعات منطقه شهری
          </h2>

          {/* Name Input */}
          <MyInput
            label="نام منطقه"
            register={register}
            name="name"
            errMsg={errors.name?.message}
          />

          {/* City Selection */}
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
                handleCitySelect(newValue as SelectOption | null)
              }
              placeholder="شهر را انتخاب کنید"
              noOptionsMessage={() => "شهری یافت نشد"}
              loadingMessage={() => "در حال بارگذاری..."}
              isRtl={true}
              isClearable
              styles={{
                control: (provided: any, state: any) => ({
                  ...provided,
                  minHeight: "48px",
                  backgroundColor: errors.cityId ? "#fef2f2" : "white",
                  borderColor: errors.cityId
                    ? state.isFocused
                      ? "#ef4444"
                      : "#fca5a5"
                    : state.isFocused
                      ? "#3b82f6"
                      : "#cbd5e1",
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
            {errors.cityId && (
              <span className="text-red-500 text-xs font-medium text-right mt-1">
                {errors.cityId.message}
              </span>
            )}
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-gray-100 p-6 border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              ترسیم منطقه بر روی نقشه
            </h2>
            <button
              type="button"
              onClick={toggleDrawingMode}
              className={`${
                isDrawingMode
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 01.553-.894L9 2l6 3 5.447-2.724A1 1 0 0121 3.382v10.764a1 1 0 01-.553.894L15 18l-6-3z"
                />
              </svg>
              {isDrawingMode ? "لغو ترسیم" : "شروع ترسیم"}
            </button>
          </div>

          {isDrawingMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                🖱️ کلیک چپ: اضافه کردن نقطه | راست کلیک: تمام کردن شکل | ESC:
                لغو
              </p>
            </div>
          )}

          <div className="h-96 rounded-lg overflow-hidden border border-gray-300">
            <MapContainer
              key={mapKey}
              center={mapCenter}
              zoom={mapZoom}
              className="h-full w-full"
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <SimpleDrawing
                isActive={isDrawingMode}
                onPolygonCreated={handlePolygonCreated}
                onPolygonDeleted={handlePolygonDeleted}
              />
            </MapContainer>
          </div>

          {errors.area && (
            <p className="text-red-500 text-sm mt-2 text-right">
              {errors.area.message}
            </p>
          )}

          {drawnPolygon && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                ✅ منطقه با موفقیت ترسیم شد ({drawnPolygon.length} نقطه)
              </p>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "در حال ایجاد..." : "ایجاد منطقه شهری"}
          </button>
        </div>
      </form>
    </div>
  );
};
