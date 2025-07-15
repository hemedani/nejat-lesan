/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  ModelName,
  ToastNotify,
  translateModelNameToPersian,
} from "@/utils/helper";
import MyInput from "@/components/atoms/MyInput";
import { zodResolver } from "@hookform/resolvers/zod";
import { useScrollLock } from "@/hooks/useScrollLock";

interface CreateUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: { _id: string; name: string } | null;
  model: ModelName;
  add: (name: string) => Promise<any>;
  update: (_id: string, name: string) => Promise<any>;
}

const itemSchema = z.object({
  name: z
    .string()
    .min(1, "نام برچسب الزامی است")
    .max(50, "حداکثر 50 کاراکتر مجاز است"),
});

type ItemFormValues = z.infer<typeof itemSchema>;

const CreateUpdateModal = ({
  isOpen,
  onClose,
  itemToEdit,
  model,
  update,
  add,
}: CreateUpdateModalProps): React.ReactElement => {
  const router = useRouter();

  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { name: itemToEdit?.name ? itemToEdit.name : "" },
  });

  useEffect(() => {
    if (itemToEdit) {
      reset({ name: itemToEdit.name });
    } else {
      reset({ name: "" });
    }
  }, [itemToEdit, reset]);

  const onSubmit = async (data: ItemFormValues) => {
    try {
      if (itemToEdit) {
        await update(itemToEdit._id, data.name);
        ToastNotify(
          "success",
          `${translateModelNameToPersian(model)} با موفقیت ویرایش شد`,
        );
      } else {
        await add(data.name);
        ToastNotify(
          "success",
          `${translateModelNameToPersian(model)} با موفقیت ایجاد شد`,
        );
      }
      router.refresh();
      reset();
      onClose();
    } catch (err) {
      ToastNotify("error", "خطا در انجام عملیات");
      console.error(err);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-500 z-[2000] ${
        isOpen ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div
        className={`bg-white p-6 rounded-lg shadow-lg w-1/3 transform transition-all duration-500 ${
          isOpen
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-90 opacity-0 translate-y-10"
        }`}
      >
        <h2 className="text-lg font-bold mb-4">
          {itemToEdit
            ? `ویرایش ${translateModelNameToPersian(model)}`
            : `ایجاد ${translateModelNameToPersian(model)} جدید`}
        </h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <MyInput
            className="w-full"
            errMsg={errors.name?.message}
            name="name"
            label={translateModelNameToPersian(model)}
            register={register}
          />

          <div className="flex justify-end mt-4 gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              بستن
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              {itemToEdit ? "ویرایش" : "ایجاد"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUpdateModal;
