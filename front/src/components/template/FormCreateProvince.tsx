"use client";
/* eslint-disable @typescript-eslint/no-unused-vars */
import L from "leaflet";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastNotify } from "@/utils/helper";
import MyInput from "../atoms/MyInput";
import { add } from "@/app/actions/province/add";
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

export const ProvinceCreateSchema = z.object({
  name: z.string().min(1, "نام استان الزامی است"),
  english_name: z.string().min(1, "نام انگلیسی استان الزامی است"),
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
        .length(2, "مختصات مرکز استان باید شامل طول و عرض جغرافیایی باشد"),
    },
    { required_error: "انتخاب مرکز استان بر روی نقشه الزامی است" },
  ),
});

export type ProvinceFormCreateSchemaType = z.infer<typeof ProvinceCreateSchema>;

interface LatLng {
  lat: number;
  lng: number;
}

export const FormCreateProvince = ({
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

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ProvinceFormCreateSchemaType>({
    resolver: zodResolver(ProvinceCreateSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      english_name: "",
      area: { type: "MultiPolygon", coordinates: [] },
      center_location: { type: "Point", coordinates: [] },
    },
  });

  // نقشه از همین مقدارِ فرم می‌خواند، پس state موازیِ دیگری لازم نیست.
  const area = (watch("area") as GeoPolygon | undefined) ?? null;

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
  const onSubmit: SubmitHandler<ProvinceFormCreateSchemaType> = async (
    data,
  ) => {
    const createdProvince = await add({
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
    });

    if (createdProvince.success) {
      ToastNotify("success", "استان با موفقیت ایجاد شد");
      router.replace("/admin/province");
    } else {
      ToastNotify(
        "error",
        createdProvince.body.message || "خطا در ایجاد استان",
      );
    }
  };


  return (
    <div className="p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Fields */}
        <div className="bg-gray-100 p-6 border rounded-lg space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            اطلاعات استان
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name Input */}
            <MyInput
              label="نام استان"
              register={register}
              name="name"
              errMsg={errors.name?.message}
            />

            {/* English Name Input */}
            <MyInput
              label="نام انگلیسی استان"
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
            label="محدودهٔ استان"
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
            label="مرکز استان"
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
            {isSubmitting ? "در حال ایجاد..." : "ایجاد استان"}
          </button>
        </div>
      </form>
    </div>
  );
};
