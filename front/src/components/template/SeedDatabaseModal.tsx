"use client";

import { useState } from "react";
import { UploadImage } from "../molecules/UploadFile";
import { seed } from "@/app/actions/user/seed";
import { ToastNotify } from "@/utils/helper";
import { useRouter } from "next/navigation";
import { useScrollLock } from "@/hooks/useScrollLock";

interface SeedDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
}

const SeedDatabaseModal: React.FC<SeedDatabaseModalProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const [uploadedFileId, setUploadedFileId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  const handleSeedDatabase = async () => {
    if (!uploadedFileId) {
      ToastNotify("error", "لطفا ابتدا فایل JSON را آپلود کنید");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await seed({
        set: {
          fileID: uploadedFileId,
        },
        get: {
          ok: 1,
        },
      });

      if (result.success) {
        ToastNotify("success", "پایگاه داده با موفقیت بذرگذاری شد");
        onClose();
        router.refresh();
      } else {
        ToastNotify(
          "error",
          `خطا در بذرگذاری پایگاه داده: ${result.body?.message || "خطای نامشخص"}`,
        );
      }
    } catch (error) {
      console.error("Error seeding database:", error);
      ToastNotify("error", "خطا در بذرگذاری پایگاه داده");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setUploadedFileId("");
    setIsProcessing(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            بذرگذاری پایگاه داده
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isProcessing}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              لطفا فایل JSON حاوی داده‌های اولیه را آپلود کنید. فایل باید شامل
              اطلاعات مورد نیاز برای بذرگذاری پایگاه داده با فرمت استاندارد JSON
              باشد.
            </p>
            <UploadImage
              setUploadedImage={setUploadedFileId}
              token={token}
              inputName="seedDataFile"
              type="json"
            />
          </div>

          {uploadedFileId && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                ✓ فایل با موفقیت آپلود شد
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            disabled={isProcessing}
          >
            انصراف
          </button>
          <button
            onClick={handleSeedDatabase}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={!uploadedFileId || isProcessing}
          >
            {isProcessing ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
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
                در حال پردازش...
              </>
            ) : (
              "بذرگذاری پایگاه داده"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeedDatabaseModal;
