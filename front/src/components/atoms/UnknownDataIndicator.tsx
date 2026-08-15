"use client";

import React from "react";
import { formatNumber } from "@/utils/formatters";

interface UnknownDataItem {
  name: string;
  count: number;
}

interface UnknownDataIndicatorProps {
  items: UnknownDataItem[];
  total?: number;
  unknownLabel?: string;
  title?: string;
  description?: string;
  className?: string;
}

const formatPercent = (value: number) =>
  value.toLocaleString("fa-IR", { maximumFractionDigits: 1 });

const UnknownDataIndicator: React.FC<UnknownDataIndicatorProps> = ({
  items,
  total,
  unknownLabel = "نامشخص",
  title = "هشدار: داده‌های نامشخص",
  description,
  className = "",
}) => {
  if (!items || items.length === 0) return null;

  const unknownItem = items.find((item) => item.name === unknownLabel);

  if (!unknownItem || unknownItem.count <= 0) return null;

  const totalCount = total ?? items.reduce((sum, item) => sum + item.count, 0);
  const unknownCount = unknownItem.count;
  const knownCount = Math.max(0, totalCount - unknownCount);
  const unknownPercent = totalCount > 0 ? (unknownCount / totalCount) * 100 : 0;
  const knownPercent = 100 - unknownPercent;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-amber-200 overflow-hidden ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 pb-5">
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-800">{title}</h3>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {description ||
                `از مجموع ${formatNumber(totalCount)} مورد، ${formatNumber(unknownCount)} مورد (${formatPercent(
                  unknownPercent,
                )}%) بدون اطلاعات مشخص ثبت شده‌اند. این موضوع می‌تواند بر دقت تحلیل‌ها تأثیر بگذارد.`}
            </p>
          </div>
        </div>

        <div className="text-right sm:text-left sm:pl-6 flex-shrink-0">
          <div className="text-3xl font-extrabold text-amber-600">
            {formatPercent(unknownPercent)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            معادل {formatNumber(unknownCount)} مورد
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${knownPercent}%` }}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${unknownPercent}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-gray-600">داده‌های مشخص</span>
            <span className="font-bold text-emerald-600">{formatNumber(knownCount)}</span>
            <span className="text-gray-400">({formatPercent(knownPercent)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-gray-600">داده‌های نامشخص</span>
            <span className="font-bold text-amber-600">{formatNumber(unknownCount)}</span>
            <span className="text-gray-400">({formatPercent(unknownPercent)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnknownDataIndicator;