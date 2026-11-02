"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { backfillCityZones } from "@/app/actions/city_zone/backfillCityZones";
import { gets as getCitiesAction } from "@/app/actions/city/gets";
import { ToastNotify } from "@/utils/helper";
import { useScrollLock } from "@/hooks/useScrollLock";
import { useSelectStyles } from "@/utils/select-styles";
import { formatNumber } from "@/utils/formatters";
import { SelectOption } from "../atoms/MyAsyncMultiSelect";

const AsyncSelect = dynamic(() => import("react-select/async"), { ssr: false });

type BackfillModel = "accident" | "incident_report" | "both";

interface BackfillSummary {
  scanned: number;
  matched: number;
  linked: number;
  unmatched: number;
  errors: number;
  dryRun: boolean;
  durationMs: number;
}

interface BackfillCityZonesModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  /** Pre-fill and lock the city scope when opened from a city card. */
  cityId?: string;
  cityName?: string;
}

const DEFAULT_LIMIT = 5000;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100000;

const MODEL_OPTIONS: { value: BackfillModel; label: string }[] = [
  { value: "both", label: "تصادفات و گزارش‌های رخداد" },
  { value: "accident", label: "فقط تصادفات" },
  { value: "incident_report", label: "فقط گزارش‌های رخداد" },
];

const BackfillCityZonesModal: React.FC<BackfillCityZonesModalProps> = ({
  isOpen,
  onClose,
  cityId,
  cityName,
}) => {
  const selectStyles = useSelectStyles(undefined, {
    minHeight: "48px",
    rtl: true,
  });
  const [selectedCity, setSelectedCity] = useState<SelectOption | null>(
    cityId && cityName ? { value: cityId, label: cityName } : null,
  );
  const [model, setModel] = useState<BackfillModel>("both");
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [dryRun, setDryRun] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState<BackfillSummary | null>(null);
  const router = useRouter();

  useScrollLock(isOpen);

  const loadCitiesOptions = useCallback(
    async (inputValue?: string): Promise<SelectOption[]> => {
      const setParams: { limit: number; page: number; name?: string } = {
        limit: 20,
        page: 1,
      };
      if (inputValue) {
        setParams.name = inputValue;
      }
      try {
        const response = await getCitiesAction({
          set: setParams,
          get: { _id: 1, name: 1 },
        });
        if (response && response.success) {
          return response.body.map((item: { _id: string; name: string }) => ({
            value: item._id,
            label: item.name,
          }));
        }
      } catch (error) {
        console.error("Error loading cities:", error);
      }
      return [];
    },
    [],
  );

  const handleBackfill = async () => {
    if (!Number.isFinite(limit) || limit < MIN_LIMIT || limit > MAX_LIMIT) {
      ToastNotify(
        "error",
        `حداکثر رکورد در هر مدل باید بین ${formatNumber(MIN_LIMIT)} و ${formatNumber(MAX_LIMIT)} باشد`,
      );
      return;
    }

    const effectiveCityId = cityId ?? selectedCity?.value;

    setIsProcessing(true);
    setSummary(null);
    try {
      const result = await backfillCityZones({
        set: {
          model,
          limit,
          dryRun,
          ...(effectiveCityId ? { cityId: effectiveCityId } : {}),
        },
        get: { summary: 1 },
      });

      if (result.success && result.body?.summary) {
        const data: BackfillSummary = result.body.summary;
        setSummary(data);

        if (!data.dryRun && data.linked > 0) {
          router.refresh();
        }

        ToastNotify(
          "success",
          data.dryRun
            ? "پیش‌نمایش انجام شد؛ هیچ تغییری ذخیره نشد"
            : `همگام‌سازی انجام شد؛ ${formatNumber(data.linked)} رکورد پیوند داده شد`,
        );
      } else {
        ToastNotify(
          "error",
          `خطا در همگام‌سازی مناطق: ${result.body?.message || "خطای نامشخص"}`,
        );
      }
    } catch (error) {
      console.error("Error backfilling city zones:", error);
      ToastNotify("error", "خطا در همگام‌سازی مناطق");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setSelectedCity(
      cityId && cityName ? { value: cityId, label: cityName } : null,
    );
    setModel("both");
    setLimit(DEFAULT_LIMIT);
    setDryRun(true);
    setIsProcessing(false);
    setSummary(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000]">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-line">
          <h2 className="text-xl font-semibold text-fg">
            {cityName
              ? `همگام‌سازی مناطق با تصادفات - ${cityName}`
              : "همگام‌سازی مناطق با تصادفات"}
          </h2>
          <button
            onClick={handleClose}
            className="text-fg-faint hover:text-fg-muted transition-colors"
            disabled={isProcessing}
            aria-label="بستن"
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

        <div className="p-6 space-y-4">
          <p className="text-sm text-fg-muted">
            این عملیات رکوردهایی را که هنوز به منطقه شهری متصل نشده‌اند، بر اساس
            موقعیت مکانی آن‌ها به منطقه متناظر پیوند می‌دهد. رکوردهای دارای منطقه
            تغییری نمی‌کنند و اجرای دوباره آن بی‌خطر است.
          </p>

          {cityId && cityName ? (
            <div className="p-3 bg-surface-sunken border border-line rounded-md">
              <p className="text-xs text-fg-faint mb-1">شهر انتخاب‌شده</p>
              <p className="text-sm font-medium text-fg">{cityName}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-fg-muted text-right">
                محدوده شهر (اختیاری)
              </label>
              <AsyncSelect
                cacheOptions
                defaultOptions
                value={selectedCity}
                loadOptions={loadCitiesOptions}
                onChange={(newValue) =>
                  setSelectedCity(newValue as SelectOption | null)
                }
                placeholder="همه شهرها"
                noOptionsMessage={() => "شهری یافت نشد"}
                loadingMessage={() => "در حال بارگذاری..."}
                isRtl={true}
                isClearable
                isDisabled={isProcessing}
                styles={selectStyles}
              />
              <p className="text-xs text-fg-faint">
                خالی گذاشتن این فیلد یعنی جست‌وجو در همه شهرها.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label
              htmlFor="backfill-model"
              className="text-sm font-medium text-fg-muted text-right"
            >
              نوع رکوردها
            </label>
            <select
              id="backfill-model"
              value={model}
              onChange={(event) =>
                setModel(event.target.value as BackfillModel)
              }
              disabled={isProcessing}
              className="w-full px-3 py-2 bg-surface-sunken border border-line rounded-md text-fg focus:outline-none focus:border-line-focus disabled:opacity-60"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="backfill-limit"
              className="text-sm font-medium text-fg-muted text-right"
            >
              حداکثر رکورد در هر مدل
            </label>
            <input
              id="backfill-limit"
              type="number"
              min={MIN_LIMIT}
              max={MAX_LIMIT}
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              disabled={isProcessing}
              className="w-full px-3 py-2 bg-surface-sunken border border-line rounded-md text-fg focus:outline-none focus:border-line-focus disabled:opacity-60"
            />
          </div>

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(event) => setDryRun(event.target.checked)}
              disabled={isProcessing}
              className="mt-1 w-4 h-4 accent-brand"
            />
            <span className="text-sm text-fg">
              فقط پیش‌نمایش (بدون ذخیره)
            </span>
          </label>

          {summary && (
            <div className="space-y-3">
              {summary.dryRun && (
                <div className="p-3 bg-warning-soft border border-warning-border rounded-md">
                  <p className="text-sm font-semibold text-warning-fg">
                    پیش‌نمایش — هیچ تغییری ذخیره نشد
                  </p>
                </div>
              )}

              <div className="p-4 bg-brand-soft border border-brand-border rounded-md space-y-2">
                <p className="text-sm font-semibold text-brand-fg">
                  خلاصه عملیات:
                </p>
                <div className="text-sm text-brand-fg space-y-1">
                  <p>• خوانده‌شده: {formatNumber(summary.scanned)}</p>
                  <p>• یافت‌شده در منطقه: {formatNumber(summary.matched)}</p>
                  <p>• پیوند داده‌شده: {formatNumber(summary.linked)}</p>
                  <p>• خارج از منطقه: {formatNumber(summary.unmatched)}</p>
                  <p>• خطا: {formatNumber(summary.errors)}</p>
                  <p>
                    • مدت اجرا: {formatNumber(summary.durationMs)} میلی‌ثانیه
                  </p>
                </div>
              </div>

              {summary.unmatched > 0 && (
                <p className="text-xs text-fg-muted">
                  رکوردهای خارج از هر منطقه بدون پیوند باقی می‌مانند و پس از
                  بارگذاری مناطق، در اجرای بعدی بررسی می‌شوند.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-line bg-canvas">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-fg bg-surface-sunken rounded-md hover:bg-line transition-colors"
            disabled={isProcessing}
          >
            انصراف
          </button>
          <button
            onClick={handleBackfill}
            className="px-4 py-2 bg-brand text-on-brand rounded-md hover:bg-brand-hover transition-colors disabled:bg-line-strong disabled:text-fg-muted disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isProcessing}
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
            ) : dryRun ? (
              "پیش‌نمایش"
            ) : (
              "اجرای همگام‌سازی"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackfillCityZonesModal;
