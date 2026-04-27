"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastNotify } from "@/utils/helper";
import MyInput from "../atoms/MyInput";
import { update } from "@/app/actions/township/update";
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
const SimpleDrawing = dynamic(() => import("@/components/SimpleDrawing"), {
  ssr: false,
});

export const TownshipUpdateSchema = z.object({
  name: z.string().min(1, "نام شهرستان الزامی است"),
  english_name: z.string().min(1, "نام انگلیسی شهرستان الزامی است"),
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

export type TownshipFormUpdateSchemaType = z.infer<typeof TownshipUpdateSchema>;

interface LatLng {
  lat: number;
  lng: number;
}

interface TownshipData {
  _id: string;
  name: string;
  english_name: string;
  population: number;
  area: {
    type: "MultiPolygon";
    coordinates: number[][][][];
  };
  center_location: {
    type: "Point";
    coordinates: number[];
  };
}

interface FormUpdateTownshipProps {
  townshipData: TownshipData;
  token?: string;
  lesanUrl: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const FormUpdateTownship: React.FC<FormUpdateTownshipProps> = ({
  townshipData,
  token, // eslint-disable-line @typescript-eslint/no-unused-vars
  lesanUrl, // eslint-disable-line @typescript-eslint/no-unused-vars
  onSuccess,
  onCancel,
}) => {
  const [drawnPolygon, setDrawnPolygon] = useState<LatLng[] | null>(null);
  const [centerPoint, setCenterPoint] = useState<LatLng | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isCenterMode, setIsCenterMode] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    32.4279, 53.688,
  ]);
  const [mapZoom] = useState(8);
  const [mapKey, setMapKey] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TownshipFormUpdateSchemaType>({
    resolver: zodResolver(TownshipUpdateSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      english_name: "",
      population: 0,
      area: { type: "MultiPolygon", coordinates: [] },
      center_location: { type: "Point", coordinates: [] },
    },
  });

  // Initialize form and map data from existing township
  useEffect(() => {
    if (townshipData) {
      console.log("Populating form with township data:", townshipData);
      console.log("Form reset values:", {
        name: townshipData.name || "",
        english_name: townshipData.english_name || "",
        population: townshipData.population || 0,
      });

      // Reset form with new data
      const formData = {
        name: townshipData.name || "",
        english_name: townshipData.english_name || "",
        population: townshipData.population || 0,
        area: townshipData.area || { type: "MultiPolygon", coordinates: [] },
        center_location: townshipData.center_location || {
          type: "Point",
          coordinates: [],
        },
      };

      console.log("Calling form reset with:", formData);
      reset(formData);

      // Set center location
      if (townshipData.center_location?.coordinates?.length >= 2) {
        const coords = townshipData.center_location.coordinates;
        console.log("Setting center point:", coords);
        setCenterPoint({ lat: coords[1], lng: coords[0] });
        setMapCenter([coords[1], coords[0]]);
      }

      // Set polygon from area
      if (townshipData.area?.coordinates?.length > 0) {
        const firstPolygon = townshipData.area.coordinates[0];
        if (firstPolygon?.length > 0) {
          const firstRing = firstPolygon[0];
          const polygon = firstRing.slice(0, -1).map(([lng, lat]) => ({
            lat,
            lng,
          }));
          console.log("Setting polygon:", polygon);
          setDrawnPolygon(polygon);
        }
      }

      setMapKey((prev) => prev + 1);
      console.log("Form data populated and map refreshed");

      // Force trigger validation after reset
      setTimeout(() => {
        trigger();
        console.log("Form validation triggered");
      }, 100);
    } else {
      console.log("No township data available for form population");
    }
  }, [townshipData, reset, trigger]);

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
  const onSubmit: SubmitHandler<TownshipFormUpdateSchemaType> = async (
    data,
  ) => {
    try {
      const response = await update(
        townshipData._id,
        data.name,
        data.english_name,
        data.population,
        data.area,
        data.center_location,
      );

      if (response && response.success) {
        console.log("Township update successful:", response);
        ToastNotify("success", "شهرستان با موفقیت به‌روزرسانی شد");
        onSuccess();
      } else {
        console.error("Township update failed:", response);
        ToastNotify(
          "error",
          response?.body?.message || "خطا در به‌روزرسانی شهرستان",
        );
      }
    } catch (error) {
      console.error("Error updating township:", error);
      ToastNotify("error", "خطای غیرمنتظره در به‌روزرسانی شهرستان");
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
    <div className="bg-white rounded-lg p-6">
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
        </div>

        {/* Map Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            ویرایش منطقه و مرکز شهرستان بر روی نقشه
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
              {isDrawingMode ? "خروج از حالت ترسیم" : "ترسیم مجدد منطقه"}
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
              {isCenterMode ? "خروج از حالت انتخاب مرکز" : "تغییر مرکز شهرستان"}
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
              <li>
                • برای تغییر منطقه، بر روی دکمه &quot;ترسیم مجدد منطقه&quot;
                کلیک کنید
              </li>
              <li>
                • برای تغییر مرکز، بر روی دکمه &quot;تغییر مرکز شهرستان&quot;
                کلیک کنید و نقطه جدید را انتخاب کنید
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
                <BasemapLayer />

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

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 rounded-lg font-medium bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isValid && !isSubmitting
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? "در حال به‌روزرسانی..." : "به‌روزرسانی شهرستان"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormUpdateTownship;
