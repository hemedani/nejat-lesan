/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import Modal from "../molecules/Modal";
import MyInput from "../atoms/MyInput";
import { add } from "@/app/actions/event/add";
import { update } from "@/app/actions/event/update";
import { ToastNotify } from "@/utils/helper";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import MyDateInput from "../atoms/MyDateInput";

// Define form schema that matches backend expectations
const eventSchema = z.object({
  name: z
    .string()
    .min(1, "نام الزامی است")
    .min(2, "نام باید حداقل 2 کاراکتر باشد"),
  description: z
    .string()
    .max(500, "توضیحات نباید بیشتر از 500 کاراکتر باشد")
    .optional(),
  startEntireRange: z.string().optional(),
  endEntireRange: z.string().optional(),
  dates: z
    .array(
      z.object({
        from: z.string().min(1, "تاریخ شروع الزامی است"),
        to: z.string().min(1, "تاریخ پایان الزامی است"),
        startEntireRange: z.string().min(1, "تاریخ شروع کلی الزامی است"),
        endEntireRange: z.string().min(1, "تاریخ پایان کلی الزامی است"),
      }),
    )
    .min(1, "حداقل یک بازه تاریخی باید وارد شود"),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventCreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit: {
    _id: string;
    name: string;
    description: string;
    dates: Array<{
      from: string;
      to: string;
      startEntireRange: string;
      endEntireRange: string;
    }>;
  } | null;
  model: string;
  token?: string;
  lesanUrl: string;
  onSuccessAction: () => void;
}

const EventCreateUpdateModal: React.FC<EventCreateUpdateModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  onSuccessAction,
}) => {
  const isEdit = !!itemToEdit;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      startEntireRange: "",
      endEntireRange: "",
      dates: [{ from: "", to: "", startEntireRange: "", endEntireRange: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "dates",
  });

  useEffect(() => {
    if (isEdit && itemToEdit) {
      // Set form values
      setValue("name", itemToEdit.name);
      setValue("description", itemToEdit.description);

      // Set the dates array with all 4 fields
      const dateRangesWithAllFields = itemToEdit.dates.map((dateObj) => ({
        from: dateObj.from,
        to: dateObj.to,
        startEntireRange: dateObj.startEntireRange,
        endEntireRange: dateObj.endEntireRange,
      }));

      // Determine and set the overall range based on the earliest start and latest end of all ranges
      if (itemToEdit.dates && itemToEdit.dates.length > 0) {
        // Filter out invalid dates and convert to Date objects
        const validStartDates = itemToEdit.dates
          .map((d) => d.startEntireRange)
          .filter((dateStr): dateStr is string =>
            Boolean(dateStr && !isNaN(Date.parse(dateStr || ""))),
          )
          .map((dateStr) => new Date(dateStr));

        const validEndDates = itemToEdit.dates
          .map((d) => d.endEntireRange)
          .filter((dateStr): dateStr is string =>
            Boolean(dateStr && !isNaN(Date.parse(dateStr || ""))),
          )
          .map((dateStr) => new Date(dateStr));

        if (validStartDates.length > 0 && validEndDates.length > 0) {
          const earliestStart = new Date(
            Math.min(...validStartDates.map((date) => date.getTime())),
          );
          const latestEnd = new Date(
            Math.max(...validEndDates.map((date) => date.getTime())),
          );

          setValue(
            "startEntireRange",
            earliestStart.toISOString().split("T")[0],
          );
          setValue("endEntireRange", latestEnd.toISOString().split("T")[0]);
        }
      }

      // Set dates after component mounts
      setValue(
        "dates",
        dateRangesWithAllFields.length > 0
          ? dateRangesWithAllFields
          : [{ from: "", to: "", startEntireRange: "", endEntireRange: "" }],
      );
    } else {
      // For new event, set empty values
      setValue("name", "");
      setValue("description", "");
      setValue("startEntireRange", "");
      setValue("endEntireRange", "");
      setValue("dates", [
        { from: "", to: "", startEntireRange: "", endEntireRange: "" },
      ]);
    }
  }, [isEdit, itemToEdit, setValue]);

  // Update overall range when dates change
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name && name.startsWith("dates.")) {
        // If a date field changes
        const dates = value.dates;
        if (dates && dates.length > 0) {
          // Filter out invalid dates and convert to Date objects
          const validStartDates = dates
            .map((date) => date!.startEntireRange) // Get the startEntireRange string
            .filter((dateStr): dateStr is string =>
              Boolean(dateStr && !isNaN(Date.parse(dateStr))),
            ) // Filter valid date strings
            .map((dateStr) => new Date(dateStr)); // Convert to Date objects

          const validEndDates = dates
            .map((date) => date!.endEntireRange) // Get the endEntireRange string
            .filter((dateStr): dateStr is string =>
              Boolean(dateStr && !isNaN(Date.parse(dateStr))),
            ) // Filter valid date strings
            .map((dateStr) => new Date(dateStr)); // Convert to Date objects

          if (validStartDates.length > 0 && validEndDates.length > 0) {
            const earliestStart = new Date(
              Math.min(...validStartDates.map((date) => date.getTime())),
            );
            const latestEnd = new Date(
              Math.max(...validEndDates.map((date) => date.getTime())),
            );

            // Update the overall range fields
            setValue(
              "startEntireRange",
              earliestStart.toISOString().split("T")[0],
            );
            setValue("endEntireRange", latestEnd.toISOString().split("T")[0]);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setValue, watch]);

  const onSubmit = async (data: EventFormValues) => {
    // Validate individual date ranges - ensuring 'to' date is after 'from' date
    const invalidRanges = data.dates.filter((range) => {
      // Only validate if all fields have some content (not empty strings)
      if (
        !range.from ||
        !range.to ||
        !range.startEntireRange ||
        !range.endEntireRange
      )
        return false; // Don't mark as invalid if fields are empty, just skip
      const fromDate = new Date(range.from);
      const toDate = new Date(range.to);
      return (
        isNaN(fromDate.getTime()) ||
        isNaN(toDate.getTime()) ||
        toDate < fromDate
      );
    });

    // Validate that individual ranges are within their respective entire range
    for (const range of data.dates) {
      // Only validate if all fields have content (not empty strings)
      if (
        range.from &&
        range.to &&
        range.startEntireRange &&
        range.endEntireRange
      ) {
        // Validate that dates are valid
        const fromDate = new Date(range.from);
        const toDate = new Date(range.to);
        const startEntireRangeDate = new Date(range.startEntireRange);
        const endEntireRangeDate = new Date(range.endEntireRange);

        if (
          isNaN(fromDate.getTime()) ||
          isNaN(toDate.getTime()) ||
          isNaN(startEntireRangeDate.getTime()) ||
          isNaN(endEntireRangeDate.getTime())
        ) {
          setError("dates", {
            message: "تاریخ‌های وارد شده معتبر نیستند",
          });
          return;
        }

        // Create dates with just the date portion (year, month, day) for comparison
        const compareFromDate = new Date(
          fromDate.getFullYear(),
          fromDate.getMonth(),
          fromDate.getDate(),
        );
        const compareStartEntireRangeDate = new Date(
          startEntireRangeDate.getFullYear(),
          startEntireRangeDate.getMonth(),
          startEntireRangeDate.getDate(),
        );
        const compareToDate = new Date(
          toDate.getFullYear(),
          toDate.getMonth(),
          toDate.getDate(),
        );
        const compareEndEntireRangeDate = new Date(
          endEntireRangeDate.getFullYear(),
          endEntireRangeDate.getMonth(),
          endEntireRangeDate.getDate(),
        );

        if (compareFromDate.getTime() < compareStartEntireRangeDate.getTime()) {
          setError("startEntireRange", {
            message:
              "تاریخ شروع بازه نمی‌تواند قبل از تاریخ شروع کلی بازه باشد",
          });
          return;
        }

        if (compareToDate.getTime() > compareEndEntireRangeDate.getTime()) {
          setError("endEntireRange", {
            message:
              "تاریخ پایان بازه نمی‌تواند بعد از تاریخ پایان کلی بازه باشد",
          });
          return;
        }

        // Also validate that the range's overall range is valid
        if (
          compareEndEntireRangeDate.getTime() <
          compareStartEntireRangeDate.getTime()
        ) {
          setError("endEntireRange", {
            message: "تاریخ پایان کلی نمی‌تواند قبل از تاریخ شروع کلی باشد",
          });
          return;
        }
      }
    }

    if (invalidRanges.length > 0) {
      setError("dates", {
        message: "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد",
      });
      return;
    }

    try {
      // Prepare the new date structure for the API
      // At this point, all ranges should have all 4 values due to validation
      const dateObjects = data.dates.map((range) => ({
        from: range.from,
        to: range.to,
        startEntireRange: range.startEntireRange,
        endEntireRange: range.endEntireRange,
      }));

      if (isEdit && itemToEdit) {
        const result = await update(
          itemToEdit._id,
          data.name,
          data.description || "",
          dateObjects,
        );
        if (result.success) {
          ToastNotify("success", "رویداد با موفقیت به‌روزرسانی شد");
        } else {
          ToastNotify(
            "error",
            result.body?.message || "خطا در به‌روزرسانی رویداد",
          );
          return; // Don't proceed if there was an error
        }
      } else {
        const result = await add(
          data.name,
          data.description || "",
          dateObjects,
        );
        if (result.success) {
          ToastNotify("success", "رویداد جدید با موفقیت ایجاد شد");
        } else {
          ToastNotify("error", result.body?.message || "خطا در ایجاد رویداد");
          return; // Don't proceed if there was an error
        }
      }

      onSuccessAction();
    } catch (error: any) {
      ToastNotify("error", error.message || "خطایی در ذخیره اطلاعات رخ داد");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 w-full max-h-[70vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800 text-right">
          {isEdit ? "ویرایش رویداد" : "ایجاد رویداد جدید"}
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 flex-1 flex flex-col"
        >
          <div className="space-y-4">
            <MyInput
              className="w-full"
              errMsg={errors.name?.message}
              name="name"
              label="نام رویداد *"
              register={register}
              placeholder="نام رویداد را وارد کنید"
            />

            <MyInput
              className="w-full"
              errMsg={errors.description?.message}
              name="description"
              label="توضیحات"
              register={register}
              type="textarea"
              placeholder="توضیحات رویداد را وارد کنید"
            />
          </div>

          <div className="border-t border-gray-200 pt-6 flex-1">
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-gray-700">
                  بازه‌های تاریخی فعال
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    append({
                      from: "",
                      to: "",
                      startEntireRange: "",
                      endEntireRange: "",
                    });
                  }}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                >
                  + افزودن بازه جدید
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <MyDateInput
                          label={`تاریخ شروع ${index + 1}`}
                          name={`dates.${index}.from` as const}
                          control={control}
                          errMsg={errors?.dates?.[index]?.from?.message}
                          placeholder="تاریخ شروع را انتخاب کنید"
                          customShowDateFormat="YYYY/MM/DD"
                        />
                      </div>

                      <div>
                        <MyDateInput
                          label={`تاریخ پایان ${index + 1}`}
                          name={`dates.${index}.to` as const}
                          control={control}
                          errMsg={errors?.dates?.[index]?.to?.message}
                          placeholder="تاریخ پایان را انتخاب کنید"
                          customShowDateFormat="YYYY/MM/DD"
                        />
                      </div>

                      <div>
                        <MyDateInput
                          label={`شروع کلی بازه ${index + 1}`}
                          name={`dates.${index}.startEntireRange` as const}
                          control={control}
                          errMsg={
                            errors?.dates?.[index]?.startEntireRange?.message
                          }
                          placeholder="تاریخ شروع کلی را انتخاب کنید"
                          customShowDateFormat="YYYY/MM/DD"
                        />
                      </div>

                      <div>
                        <MyDateInput
                          label={`پایان کلی بازه ${index + 1}`}
                          name={`dates.${index}.endEntireRange` as const}
                          control={control}
                          errMsg={
                            errors?.dates?.[index]?.endEntireRange?.message
                          }
                          placeholder="تاریخ پایان کلی را انتخاب کنید"
                          customShowDateFormat="YYYY/MM/DD"
                        />
                      </div>
                    </div>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-500 hover:text-red-700 self-start"
                        title="حذف بازه"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {errors.dates && (
                <p className="text-red-500 text-xs mt-1 text-right">
                  {errors.dates.message || "لطفاً بازه تاریخی معتبر وارد کنید"}
                </p>
              )}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                لغو
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {isEdit ? "به‌روزرسانی" : "ایجاد"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default EventCreateUpdateModal;
