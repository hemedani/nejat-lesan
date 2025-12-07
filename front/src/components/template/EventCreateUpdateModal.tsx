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
  dates: z
    .array(
      z.object({
        start: z.string().min(1, "تاریخ شروع الزامی است"),
        end: z.string().min(1, "تاریخ پایان الزامی است"),
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
    dates: [string, string][];
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
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      dates: [{ start: "", end: "" }],
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

      // Convert the dates array of pairs to DateRange format
      const dateRanges = itemToEdit.dates.map(([start, end]) => ({
        start,
        end,
      }));
      // Set dates after component mounts
      setValue(
        "dates",
        dateRanges.length > 0 ? dateRanges : [{ start: "", end: "" }],
      );
    } else {
      // For new event, set empty values
      setValue("name", "");
      setValue("description", "");
      setValue("dates", [{ start: "", end: "" }]);
    }
  }, [isEdit, itemToEdit, setValue]);

  const onSubmit = async (data: EventFormValues) => {
    // Validate date ranges - ensuring end date is after start date
    const invalidRanges = data.dates.filter(
      (range) =>
        range.start && range.end && new Date(range.end) < new Date(range.start),
    );

    if (invalidRanges.length > 0) {
      setError("dates", {
        message: "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد",
      });
      return;
    }

    try {
      // Convert date ranges to array of arrays format for API - [[start1, end1], [start2, end2], ...]
      const dateArray: [string, string][] = [];
      data.dates.forEach((range) => {
        if (range.start && range.end) {
          dateArray.push([range.start, range.end]);
        }
      });

      if (isEdit && itemToEdit) {
        await update(
          itemToEdit._id,
          data.name,
          data.description || "",
          dateArray,
        );
        ToastNotify("success", "رویداد با موفقیت به‌روزرسانی شد");
      } else {
        const result = await add(data.name, data.description || "", dateArray);
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
                  بازه‌های تاریخی
                </h3>
                <button
                  type="button"
                  onClick={() => append({ start: "", end: "" })}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                >
                  + افزودن بازه جدید
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex flex-col sm:flex-row gap-4"
                  >
                    <div className="flex-1">
                      <MyDateInput
                        label={`تاریخ شروع ${index + 1}`}
                        name={`dates.${index}.start` as const}
                        control={control}
                        errMsg={errors?.dates?.[index]?.start?.message}
                        placeholder="تاریخ شروع را انتخاب کنید"
                        customShowDateFormat="YYYY/MM/DD"
                      />
                    </div>

                    <div className="flex-1">
                      <MyDateInput
                        label={`تاریخ پایان ${index + 1}`}
                        name={`dates.${index}.end` as const}
                        control={control}
                        errMsg={errors?.dates?.[index]?.end?.message}
                        placeholder="تاریخ پایان را انتخاب کنید"
                        customShowDateFormat="YYYY/MM/DD"
                      />
                    </div>

                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-red-500 hover:text-red-700 self-start sm:self-end"
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
