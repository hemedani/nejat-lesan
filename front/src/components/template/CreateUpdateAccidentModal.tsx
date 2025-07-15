/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ModelName,
  ToastNotify,
  translateModelNameToPersian,
} from "@/utils/helper";
import { accidentSchema } from "@/types/declarations/selectInp";
import { useScrollLock } from "@/hooks/useScrollLock";

interface CreateUpdateAccidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  accidentToEdit?: accidentSchema | null;
  model: ModelName;
  add: (data: any) => Promise<any>;
  update: (_id: string, data: any) => Promise<any>;
}

// Define validation schema based on accidentSchema
const accidentFormSchema = z.object({
  seri: z.number().optional(),
  serial: z.number().optional(),
  date_of_accident: z.string().optional(),
  dead_count: z.number().min(0, "تعداد فوتی‌ها نمی‌تواند منفی باشد"),
  injured_count: z.number().min(0, "تعداد مجروحین نمی‌تواند منفی باشد"),
  has_witness: z.boolean().optional(),
  news_number: z.number().optional(),
  officer: z.string().optional(),
  province_id: z.string().optional(),
  city_id: z.string().optional(),
  type_id: z.string().optional(),
  collision_type_id: z.string().optional(),
});

type AccidentFormValues = z.infer<typeof accidentFormSchema>;

const CreateUpdateAccidentModal: React.FC<CreateUpdateAccidentModalProps> = ({
  isOpen,
  onClose,
  accidentToEdit,
  model,
  add,
  update,
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  const {
    register,
    handleSubmit,
    // reset,
    formState: { errors },
  } = useForm<AccidentFormValues>({
    resolver: zodResolver(accidentFormSchema),
    defaultValues: accidentToEdit
      ? {
          seri: accidentToEdit.seri,
          serial: accidentToEdit.serial,
          date_of_accident: accidentToEdit.date_of_accident
            ? new Date(accidentToEdit.date_of_accident)
                .toISOString()
                .split("T")[0]
            : undefined,
          dead_count: accidentToEdit.dead_count,
          injured_count: accidentToEdit.injured_count,
          has_witness: accidentToEdit.has_witness,
          news_number: accidentToEdit.news_number,
          officer: accidentToEdit.officer,
          province_id: accidentToEdit.province?._id,
          city_id: accidentToEdit.city?._id,
          type_id: accidentToEdit.type?._id,
          collision_type_id: accidentToEdit.collision_type?._id,
        }
      : {
          dead_count: 0,
          injured_count: 0,
          has_witness: false,
        },
  });

  const onSubmit = async (data: AccidentFormValues) => {
    setIsSubmitting(true);
    try {
      if (accidentToEdit?._id) {
        // Update existing accident
        const result = await update(accidentToEdit._id, data);
        if (result.success) {
          ToastNotify(
            "success",
            `${translateModelNameToPersian(model)} با موفقیت بروزرسانی شد`,
          );
          router.refresh();
          onClose();
        } else {
          ToastNotify(
            "error",
            `خطا در بروزرسانی ${translateModelNameToPersian(model)}: ${result.body?.message || "خطای نامشخص"}`,
          );
        }
      } else {
        // Create new accident
        const result = await add(data);
        if (result.success) {
          ToastNotify(
            "success",
            `${translateModelNameToPersian(model)} با موفقیت ایجاد شد`,
          );
          router.refresh();
          onClose();
        } else {
          ToastNotify(
            "error",
            `خطا در ایجاد ${translateModelNameToPersian(model)}: ${result.body?.message || "خطای نامشخص"}`,
          );
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      ToastNotify("error", "خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {accidentToEdit
                ? `ویرایش ${translateModelNameToPersian(model)}`
                : `ایجاد ${translateModelNameToPersian(model)} جدید`}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Serial Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  شماره سریال
                </label>
                <input
                  type="number"
                  {...register("serial", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.serial && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.serial.message}
                  </p>
                )}
              </div>

              {/* Seri Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  شماره سری
                </label>
                <input
                  type="number"
                  {...register("seri", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.seri && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.seri.message}
                  </p>
                )}
              </div>

              {/* Date of Accident */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاریخ تصادف
                </label>
                <input
                  type="date"
                  {...register("date_of_accident")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.date_of_accident && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.date_of_accident.message}
                  </p>
                )}
              </div>

              {/* Officer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  افسر
                </label>
                <input
                  type="text"
                  {...register("officer")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.officer && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.officer.message}
                  </p>
                )}
              </div>

              {/* Dead Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تعداد فوتی‌ها
                </label>
                <input
                  type="number"
                  {...register("dead_count", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.dead_count && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dead_count.message}
                  </p>
                )}
              </div>

              {/* Injured Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تعداد مجروحین
                </label>
                <input
                  type="number"
                  {...register("injured_count", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {errors.injured_count && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.injured_count.message}
                  </p>
                )}
              </div>

              {/* Has Witness */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="has_witness"
                  {...register("has_witness")}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="has_witness"
                  className="mr-2 block text-sm text-gray-700"
                >
                  دارای شاهد
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all duration-200"
                disabled={isSubmitting}
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-200 flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                )}
                {accidentToEdit ? "بروزرسانی" : "ایجاد"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateUpdateAccidentModal;
