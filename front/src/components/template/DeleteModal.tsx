import React, { FC } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";

interface IProps {
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
  isVisible: boolean;
  isHardCascade: boolean;
  onHardCascadeChange: (value: boolean) => void;
}

export const DeleteModal: FC<IProps> = ({
  onConfirm,
  onCancel,
  message,
  isVisible,
  isHardCascade,
  onHardCascadeChange,
}) => {
  // Prevent background scrolling when modal is open
  useScrollLock(isVisible);

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-[2000] ${
        isVisible
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-lg max-w-sm w-full p-6 text-center transform transition-transform duration-300 ${
          isVisible ? "scale-100" : "scale-90"
        }`}
      >
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex items-center justify-start gap-2 mb-6">
          <p className="text-sm text-gray-800">
            آیا اسناد وابسته نیز حذف شوند؟
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onHardCascadeChange(true)}
              className={`px-2 py-1 text-xs border border-gray-900 rounded-lg text-black transition-all duration-300 ${
                !isHardCascade
                  ? "bg-white"
                  : "bg-red-500 border-none text-white hover:bg-red-600"
              }`}
            >
              بله
            </button>
            <button
              onClick={() => onHardCascadeChange(false)}
              className={`px-2 py-1 text-xs border border-gray-900 rounded-lg text-black transition-all duration-300 ${
                isHardCascade
                  ? "bg-white"
                  : "bg-red-500 border-none text-white hover:bg-red-600"
              }`}
            >
              خیر
            </button>
          </div>
        </div>

        {isHardCascade && (
          <p className="text-sm text-red-500 mb-6">
            {/* هشدار: اگر این گزینه فعال شود، تمامی موارد مرتبط حذف خواهند شد.
            مسئولیت این عملیات با شماست. */}
          </p>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={onCancel}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300"
          >
            لغو
          </button>
          <button
            onClick={onConfirm}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300"
          >
            تایید
          </button>
        </div>
      </div>
    </div>
  );
};
