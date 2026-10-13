"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ToastNotify } from "@/utils/helper";
import MyInput from "../atoms/MyInput";
import { update } from "@/app/actions/township/update";
import React, { useState, useEffect, useCallback } from "react";
import GeoPointPicker, { type GeoPoint } from "@/components/maps/GeoPointPicker";
import GeoPolygonDrawer, { type GeoPolygon } from "@/components/maps/GeoPolygonDrawer";

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
  // نمای نقشه مستقیماً از مقادیر فرم می‌آید: `LeafletSurface` فقط در بارگذاری
  // اولیه به آن نگاه می‌کند، پس حالتِ موازی لازم نیست و کلاسکی که قبلاً بین
  // فرم و نقشه پخش بود حذف شد.
  const [area, setArea] = useState<GeoPolygon | null>(null);
  const [centerPoint, setCenterPoint] = useState<GeoPoint | null>(null);

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

  // مقداردهی اولیه: فرم و نقشه از یک منبع می‌خوانند تا هرگز از هم جدا
  // نیفتند — قبلاً دو نسخه از همین داده در state و RHF نگه داشته می‌شد.
  useEffect(() => {
    if (townshipData) {
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

      reset(formData);

      const coords = townshipData.center_location?.coordinates;
      setCenterPoint(
        coords && coords.length >= 2
          ? { type: "Point", coordinates: [coords[0], coords[1]] }
          : null,
      );
      setArea(
        townshipData.area?.coordinates?.length
          ? (townshipData.area as GeoPolygon)
          : null,
      );

      // Force trigger validation after reset
      setTimeout(() => {
        trigger();
      }, 100);
    }
  }, [townshipData, reset, trigger]);

  // دو نقطه‌ی اتصال نقشه به فرم. هندسه همان‌طور که GeoJSON می‌خواهد
  // (`[lng, lat]`) می‌ماند و دستکاری نمی‌شود — جابه‌جایی مختصات داخل
  // `GeoPointPicker`/`GeoPolygonDrawer` انجام می‌گیرد.
  const handleAreaChange = useCallback(
    (next: GeoPolygon) => {
      setArea(next);
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
        ToastNotify("success", "شهرستان با موفقیت به‌روزرسانی شد");
        onSuccess();
      } else {
        ToastNotify(
          "error",
          response?.body?.message || "خطا در به‌روزرسانی شهرستان",
        );
      }
    } catch {
      ToastNotify("error", "خطای غیرمنتظره در به‌روزرسانی شهرستان");
    }
  };

  // پاک‌کردن باید فرم را هم خالی کند، وگرنه مقدارِ قبلی با «حذف» دوباره
  // فرستاده می‌شود.
  const clearArea = useCallback(() => {
    setArea(null);
    setValue("area", { type: "MultiPolygon", coordinates: [] });
    trigger("area");
  }, [setValue, trigger]);

  const clearCenterPoint = useCallback(() => {
    setCenterPoint(null);
    setValue("center_location", { type: "Point", coordinates: [] });
    trigger("center_location");
  }, [setValue, trigger]);

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

          {/* Errors are surfaced by each drawer's own `errorMessage` slot, so
              the two big red boxes that used to sit above the map are gone —
              the message is still shown, just next to the control it belongs
              to instead of floating above an unrelated block. */}

          <GeoPolygonDrawer
            className="h-96 border border-gray-300 rounded-lg"
            errorMessage={errors.area?.message}
            fallbackCenter={{ lat: 32.4279, lng: 53.688 }}
            fallbackZoom={8}
            label="محدودهٔ شهرستان"
            onChange={handleAreaChange}
            onClear={clearArea}
            tone="light"
            value={area}
          />

          <GeoPointPicker
            className="h-96 border border-gray-300 rounded-lg"
            errorMessage={errors.center_location?.message}
            fallbackCenter={{ lat: 32.4279, lng: 53.688 }}
            fallbackZoom={8}
            label="مرکز شهرستان"
            onChange={handleCenterChange}
            onClear={clearCenterPoint}
            tone="light"
            value={centerPoint}
          />
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
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${isValid && !isSubmitting
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
