/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { ToastNotify } from "@/utils/helper";
import { formatJalaliDateTime, formatNumber } from "@/utils/formatters";
import LoadingSpinner from "@/components/atoms/LoadingSpinner";
import { getCreatedAtPeriods } from "@/app/actions/accident/getCreatedAtPeriods";

interface Period {
  from: number;
  to: number;
  count: number;
}

interface BatchDeleteByPeriodModalProps {
  isVisible: boolean;
  onClose: () => void;
  removeByCreatedAt: (data: {
    createdAt: number;
    hoursBefore?: number;
    hoursAfter?: number;
  }) => Promise<any>;
}

type Step = "loading" | "select" | "confirm";

const BatchDeleteByPeriodModal: React.FC<BatchDeleteByPeriodModalProps> = ({
  isVisible,
  onClose,
  removeByCreatedAt,
}) => {
  useScrollLock(isVisible);

  const [step, setStep] = useState<Step>("loading");
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      setStep("loading");
      setSelectedPeriod(null);
      setIsDeleting(false);
      setFetchError(null);

      getCreatedAtPeriods({
        set: { intervalMinutes: 10 },
        get: { periods: 1 },
      })
        .then((res: any) => {
          if (res.success && res.body?.periods) {
            setPeriods(res.body.periods);
            setStep("select");
          } else {
            setFetchError(res.body?.message || "خطا در دریافت اطلاعات");
            setStep("select");
          }
        })
        .catch(() => {
          setFetchError("خطا در ارتباط با سرور");
          setStep("select");
        });
    }
  }, [isVisible]);

  const handleDelete = useCallback(async () => {
    if (!selectedPeriod) return;
    setIsDeleting(true);

    const from = selectedPeriod.from;
    const to = selectedPeriod.to;
    const midpoint = Math.floor((from + to) / 2);
    const halfDurationHours = (to - from) / 2 / 3600000 + 0.01;

    try {
      const res = await removeByCreatedAt({
        createdAt: midpoint,
        hoursBefore: halfDurationHours,
        hoursAfter: halfDurationHours,
      });

      if (res.success) {
        const count = res.body?.deletedCount || 0;
        ToastNotify("success", `${formatNumber(count)} تصادف با موفقیت حذف شدند.`);
        onClose();
      } else {
        ToastNotify("error", res.body?.message || "خطا در حذف تصادفات");
      }
    } catch {
      ToastNotify("error", "خطا در ارتباط با سرور");
    } finally {
      setIsDeleting(false);
    }
  }, [selectedPeriod, removeByCreatedAt, onClose]);

  useEffect(() => {
    if (!isVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-t-2xl px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-white"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <h2 className="text-xl font-bold text-white">
                حذف دسته‌ای تصادفات
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
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
          {step !== "loading" && (
            <p className="text-red-100 text-sm mt-2 mr-9">
              {step === "select"
                ? "مرحله ۱ از ۲ - انتخاب بازه زمانی"
                : "مرحله ۲ از ۲ - تأیید حذف"}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === "loading" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <LoadingSpinner />
              <p className="text-gray-500 text-sm">در حال بارگذاری بازه‌های زمانی...</p>
            </div>
          )}

          {step === "select" && (
            <>
              {fetchError ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-red-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-700 font-medium">{fetchError}</p>
                  <button
                    onClick={() => {
                      setStep("loading");
                      setFetchError(null);
                      getCreatedAtPeriods({
                        set: { intervalMinutes: 10 },
                        get: { periods: 1 },
                      })
                        .then((res: any) => {
                          if (res.success && res.body?.periods) {
                            setPeriods(res.body.periods);
                            setStep("select");
                          } else {
                            setFetchError(res.body?.message || "خطا در دریافت اطلاعات");
                          }
                        })
                        .catch(() => {
                          setFetchError("خطا در ارتباط با سرور");
                          setStep("select");
                        });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    تلاش مجدد
                  </button>
                </div>
              ) : periods.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">
                    هیچ بازه زمانی برای نمایش وجود ندارد.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-gray-600 mb-4 text-sm">
                    لطفاً یک بازه زمانی را برای حذف دسته‌ای تصادفات انتخاب کنید:
                  </p>
                  <div
                    className={`space-y-3 ${
                      periods.length > 10
                        ? "max-h-96 overflow-y-auto pl-1"
                        : ""
                    }`}
                  >
                    {periods.map((period, index) => {
                      const isSelected =
                        selectedPeriod?.from === period.from &&
                        selectedPeriod?.to === period.to;
                      return (
                        <button
                          key={index}
                          onClick={() => setSelectedPeriod(period)}
                          className={`w-full text-right p-4 rounded-xl border-2 transition-all duration-200 ${
                            isSelected
                              ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-md"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3 w-3 text-white"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-800">
                                  {formatJalaliDateTime(new Date(period.from))}
                                </span>
                                <span className="text-xs text-gray-400">
                                  تا{" "}
                                  {formatJalaliDateTime(new Date(period.to))}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isSelected
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-50 text-red-600"
                              }`}
                            >
                              {formatNumber(period.count)} تصادف
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={onClose}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      انصراف
                    </button>
                    <button
                      onClick={() => setStep("confirm")}
                      disabled={!selectedPeriod}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedPeriod
                          ? "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      ادامه
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {step === "confirm" && selectedPeriod && (
            <div className="space-y-6">
              {/* Back button */}
              <button
                onClick={() => setStep("select")}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                بازگشت به لیست
              </button>

              {/* Selected period info */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-3">
                <h3 className="font-semibold text-gray-800 mb-3">
                  بازه زمانی انتخاب شده
                </h3>
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 mt-0.5 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">از:</p>
                    <p className="font-medium text-gray-800">
                      {formatJalaliDateTime(new Date(selectedPeriod.from))}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 mt-0.5 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">تا:</p>
                    <p className="font-medium text-gray-800">
                      {formatJalaliDateTime(new Date(selectedPeriod.to))}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400 mt-0.5 shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-600">تعداد تصادفات:</p>
                    <p className="font-bold text-red-600 text-lg">
                      {formatNumber(selectedPeriod.count)} تصادف
                    </p>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-red-500 shrink-0 mt-0.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-1">
                      هشدار!
                    </p>
                    <p className="text-sm text-red-600 leading-relaxed">
                      آیا مطمئن هستید؟ این عمل غیرقابل بازگشت است و تمامی
                      تصادفات این بازه زمانی به همراه اثرات جانبی حذف خواهند
                      شد.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setStep("select")}
                  className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  بازگشت
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      در حال حذف...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      تأیید و حذف
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchDeleteByPeriodModal;
