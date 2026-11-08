"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AccidentAdvancedSearch from "./AccidentAdvancedSearch";
import {
  countActiveFilters,
  readActiveFilterChips,
  removeFilterChip,
} from "@/utils/accidentFilters";

const PAGE_SIZE_OPTIONS = [20, 50, 100];

interface AccidentFilterBarProps {
  pageAddress: string;
  totalCount: number;
  filteredCount: number;
}

const AccidentFilterBar: React.FC<AccidentFilterBarProps> = ({
  pageAddress,
  totalCount,
  filteredCount,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const appliedSerial = searchParams.get("serial") ?? "";
  const [quickSerial, setQuickSerial] = useState(appliedSerial);

  useEffect(() => {
    setQuickSerial(appliedSerial);
  }, [appliedSerial]);

  const activeChips = useMemo(
    () => readActiveFilterChips(searchParams),
    [searchParams],
  );
  const activeFilterCount = useMemo(
    () => countActiveFilters(searchParams),
    [searchParams],
  );

  const limit = searchParams.get("limit") ?? "20";

  const pushWith = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.set("page", "1");
    const query = params.toString();
    router.push(query ? `${pageAddress}?${query}` : pageAddress);
  };

  const submitQuickSearch = (event: React.FormEvent) => {
    event.preventDefault();
    pushWith((params) => {
      const value = quickSerial.trim();
      if (value) params.set("serial", value);
      else params.delete("serial");
    });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    if (limit !== "20") params.set("limit", limit);
    const query = params.toString();
    router.push(query ? `${pageAddress}?${query}` : pageAddress);
  };

  return (
    <section className="space-y-3" aria-label="جستجو و فیلتر تصادفات">
      <div className="rounded-2xl border border-line bg-surface p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <form
            onSubmit={submitQuickSearch}
            className="relative flex-1"
            role="search"
          >
            <svg
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              />
            </svg>
            <input
              value={quickSerial}
              onChange={(event) => setQuickSerial(event.target.value)}
              placeholder="جستجوی سریع با سریال داخلی تصادف…"
              aria-label="جستجوی سریال داخلی تصادف"
              className="h-11 w-full rounded-xl border border-line bg-surface-sunken pr-10 pl-10 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint hover:border-line-strong focus:border-line-focus"
            />
            {quickSerial && (
              <button
                type="button"
                onClick={() => {
                  setQuickSerial("");
                  pushWith((params) => params.delete("serial"));
                }}
                aria-label="پاک کردن جستجوی سریال"
                className="absolute left-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-fg-faint transition-colors hover:bg-surface-hover hover:text-fg"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </form>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(true)}
              className="relative flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-on-brand shadow-sm transition-all hover:bg-brand-hover hover:shadow-md focus:outline-none focus:ring-2 focus:ring-line-focus focus:ring-offset-2 focus:ring-offset-surface lg:flex-none"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 6h16M7 12h10M10 18h4"
                />
              </svg>
              جستجوی پیشرفته
              {activeFilterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-bold">
                  {activeFilterCount.toLocaleString("fa-IR")}
                </span>
              )}
            </button>

            <label className="sr-only" htmlFor="accident-page-size">
              تعداد نتایج در هر صفحه
            </label>
            <select
              id="accident-page-size"
              value={limit}
              onChange={(event) =>
                pushWith((params) => params.set("limit", event.target.value))
              }
              className="h-11 rounded-xl border border-line bg-surface-sunken px-3 text-sm text-fg outline-none transition-colors hover:border-line-strong focus:border-line-focus"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {(size as number).toLocaleString("fa-IR")} در صفحه
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="text-xs font-medium text-fg-faint">
              فیلترهای فعال:
            </span>

            {activeChips.map((chip) => (
              <span
                key={`${chip.key}-${chip.value}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-surface-sunken py-1 pr-2.5 pl-1.5 text-xs"
              >
                <span className="shrink-0 text-fg-faint">{chip.label}:</span>
                <span className="max-w-[160px] truncate text-fg">
                  {chip.displayValue}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    pushWith((params) => removeFilterChip(params, chip))
                  }
                  aria-label={`حذف فیلتر ${chip.label} ${chip.displayValue}`}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-fg-faint transition-colors hover:bg-danger-soft hover:text-danger-fg"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </span>
            ))}

            <button
              type="button"
              onClick={clearAllFilters}
              className="mr-auto text-xs font-medium text-danger-fg underline-offset-4 transition-colors hover:underline"
            >
              پاک کردن همه
            </button>
          </div>
        )}
      </div>

      {activeFilterCount > 0 && (
        <p className="px-1 text-xs text-fg-faint">
          {filteredCount === totalCount
            ? "فیلترها روی نتایج اعمال شده‌اند."
            : `${filteredCount.toLocaleString("fa-IR")} تصادف از مجموع ${totalCount.toLocaleString("fa-IR")} تصادف با فیلترهای فعلی مطابقت دارد.`}
        </p>
      )}

      {isAdvancedOpen && (
        <AccidentAdvancedSearch
          pageAddress={pageAddress}
          onClose={() => setIsAdvancedOpen(false)}
        />
      )}
    </section>
  );
};

export default AccidentFilterBar;
