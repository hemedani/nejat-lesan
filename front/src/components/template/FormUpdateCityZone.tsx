"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import L from "leaflet";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastNotify } from "@/utils/helper";
import MyInput from "../atoms/MyInput";
import { update } from "@/app/actions/city_zone/update";
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
const Polygon = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polygon),
  { ssr: false },
);
const SimpleDrawing = dynamic(() => import("@/components/SimpleDrawing"), {
  ssr: false,
});

export const CityZoneUpdateSchema = z.object({
  name: z.string().min(1, "نام منطقه شهری الزامی است"),
  population: z.coerce.number().min(0, "جمعیت نمی‌تواند منفی باشد"),
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

export type CityZoneFormUpdateSchemaType = z.infer<typeof CityZoneUpdateSchema>;

interface LatLng {
  lat: number;
  lng: number;
}

interface CityZoneData {
  _id: string;
  name: string;
  population: number;
  area: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
}

export const FormUpdateCityZone = ({
  token,
  lesanUrl,
  cityZoneData,
  onSuccessAction,
}: {
  token?: string;
  lesanUrl: string;
  cityZoneData?: CityZoneData;
  onSuccessAction: () => void;
}) => {
  const router = useRouter();
  const [drawnPolygon, setDrawnPolygon] = useState<LatLng[] | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    32.4279, 53.688,
  ]);
  const [mapZoom, setMapZoom] = useState(6);
  const [mapKey, setMapKey] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CityZoneFormUpdateSchemaType>({
    resolver: zodResolver(CityZoneUpdateSchema),
    mode: "onChange",
    defaultValues: {
      name: cityZoneData?.name || "",
      population: cityZoneData?.population || 0,
      area: cityZoneData?.area || { type: "MultiPolygon", coordinates: [] },
    },
  });

  // Initialize map data from existing city zone data
  useEffect(() => {
    if (cityZoneData) {
      // Set form values
      setValue("name", cityZoneData.name || "");
      setValue("population", cityZoneData.population || 0);
      setValue(
        "area",
        cityZoneData.area || { type: "MultiPolygon", coordinates: [] },
      );

      // Set map polygon
      if (
        cityZoneData.area?.coordinates &&
        Array.isArray(cityZoneData.area.coordinates) &&
        cityZoneData.area.coordinates.length > 0
      ) {
        const firstPolygon = cityZoneData.area.coordinates[0];
        if (Array.isArray(firstPolygon) && firstPolygon.length > 0) {
          const firstRing = firstPolygon[0];
          if (Array.isArray(firstRing) && firstRing.length > 0) {
            try {
              const latLngArray = firstRing.map((coord: number[]) => {
                if (Array.isArray(coord) && coord.length >= 2) {
                  return {
                    lat: coord[1],
                    lng: coord[0],
                  };
                }
                throw new Error("Invalid coordinate format");
              });

              setDrawnPolygon(latLngArray);

              // Center map on the polygon
              if (latLngArray.length > 0) {
                const avgLat = latLngArray.reduce((sum, point) => sum + point.lat, 0) / latLngArray.length;
                const avgLng = latLngArray.reduce((sum, point) => sum + point.lng, 0) / latLngArray.length;
                setMapCenter([avgLat, avgLng]);
                setMapZoom(10);
              }
            } catch (error) {
              console.error("Error processing polygon coordinates:", error);
              setDrawnPolygon(null);
            }
          }
        }
      } else {
        setDrawnPolygon(null);
      }

      // Trigger form validation
      trigger();
    }
  }, [cityZoneData, setValue, trigger]);

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

  // Clear drawn polygon
  const clearDrawnPolygon = () => {
    setDrawnPolygon(null);
    setValue(
      "area",
      { type: "MultiPolygon", coordinates: [] },
      { shouldValidate: true },
    );
    trigger();
  };

  // Form submission
  const onSubmit: SubmitHandler<CityZoneFormUpdateSchemaType> = async (
    data,
  ) => {
    if (!cityZoneData?._id) {
      ToastNotify("error", "خطا: شناسه منطقه شهری موجود نیست");
      return;
    }

    const updatedCityZone = await update(
      cityZoneData._id,
      data.name,
      data.population,
      data.area as {
        type: "MultiPolygon";
        coordinates: number[][][][];
      },
    );

    if (updatedCityZone.success) {
      ToastNotify("success", "منطقه شهری با موفقیت ویرایش شد");
      onSuccessAction();
    } else {
      ToastNotify(
        "error",
        updatedCityZone.body.message || "خطا در ویرایش منطقه شهری",
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

  // Show loading state if no city zone data
  if (!cityZoneData) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">در حال بارگذاری اطلاعات منطقه شهری...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Fields */}
        <div className="bg-gray-100 p-6 border rounded-lg space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            ویرایش اطلاعات منطقه شهری
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name Input */}
            <MyInput
              label="نام منطقه شهری"
              register={register}
              name="name"
              errMsg={errors.name?.message}
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
        </div>

        {/* Map Section */}
        <div className="bg-gray-100 p-6 border rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-700">
              ویرایش منطقه شهری بر روی نقشه
            </h2>
            <div className="flex gap-2">
              {drawnPolygon && (
                <button
                  type="button"
                  onClick={clearDrawnPolygon}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  حذف منطقه
                </button>
              )}
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
                {isDrawingMode ? "لغو ترسیم" : "ویرایش منطقه"}
              </button>
            </div>
          </div>

          {isDrawingMode && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                🖱️ حالت ترسیم منطقه: کلیک چپ: اضافه کردن نقطه | راست کلیک:
                تمام کردن شکل | ESC: لغو
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
              {drawnPolygon && (
                <Polygon
                  positions={drawnPolygon}
                  pathOptions={{
                    color: "#3b82f6",
                    weight: 3,
                    opacity: 0.8,
                    fillOpacity: 0.2,
                    fillColor: "#3b82f6",
                  }}
                />
              )}
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

          <div className="mt-4 space-y-3">
            {drawnPolygon && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <p className="text-sm text-green-800 font-semibold">
                    منطقه شهری ترسیم شد
                  </p>
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  <p>• تعداد نقاط: {drawnPolygon.length}</p>
                  <p>• منطقه بر روی نقشه نمایش داده شده و آماده ثبت است</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "در حال ویرایش..." : "ویرایش منطقه شهری"}
          </button>
        </div>
      </form>
    </div>
  );
};
