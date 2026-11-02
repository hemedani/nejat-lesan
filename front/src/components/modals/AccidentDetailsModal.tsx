"use client";

import React, { useState } from "react";
import { accidentSchema } from "@/types/declarations/selectInp";
import { useScrollLock } from "@/hooks/useScrollLock";
import {
  AccidentFieldOption,
  DEFAULT_FIELD_KEYS,
} from "@/utils/accidentProjection";

interface AccidentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: accidentSchema[];
  isLoading?: boolean;
  fieldOptions: AccidentFieldOption[];
  selectedFields: Set<string>;
  onApplyFields: (keys: Set<string>) => void | Promise<void>;
  onResetFields: () => void | Promise<void>;
}

const AccidentDetailsModal: React.FC<AccidentDetailsModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading,
  fieldOptions,
  selectedFields,
  onApplyFields,
  onResetFields,
}) => {
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  // Pending checkbox selection. It is committed to the table only when the user
  // presses «اعمال», so headers never change ahead of their data.
  const [draftFields, setDraftFields] = useState<Set<string>>(
    () => new Set(selectedFields),
  );

  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  if (!isOpen) return null;

  const toggleFieldSelector = () => {
    if (!showFieldSelector) setDraftFields(new Set(selectedFields));
    setShowFieldSelector((v) => !v);
  };

  const toggleField = (key: string) => {
    setDraftFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allFieldsSelected =
    fieldOptions.length > 0 &&
    fieldOptions.every((option) => draftFields.has(option.key));

  const toggleAllFields = () => {
    setDraftFields(
      allFieldsSelected
        ? new Set()
        : new Set(fieldOptions.map((option) => option.key)),
    );
  };

  const handleApplyFields = async () => {
    setShowFieldSelector(false);
    await onApplyFields(draftFields);
  };

  const handleResetFields = async () => {
    setDraftFields(new Set(DEFAULT_FIELD_KEYS));
    setShowFieldSelector(false);
    await onResetFields();
  };

  // Format numbers with Persian digits
  const formatNumber = (value?: number | null) => {
    if (value == null) return "—";
    return value.toLocaleString("fa-IR");
  };

  // Format time from date
  const formatTime = (date?: Date | string | null) => {
    if (!date) return "";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date for display
  const formatDate = (date?: Date | string | null) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("fa-IR");
  };

  // Read a raw value from an accident by field key
  const getFieldValue = (accident: accidentSchema, key: string): unknown => {
    return (accident as unknown as Record<string, unknown>)[key];
  };

  // Get display name from a single embedded reference object
  const getObjectName = (value: unknown) => {
    const obj = value as { name?: string } | undefined;
    return obj?.name || "—";
  };

  // Join display names from an array of embedded reference objects
  const getNamesJoined = (value: unknown) => {
    const list = value as { name?: string }[] | undefined;
    if (!list || list.length === 0) return "—";
    return list.map((item) => item.name).filter(Boolean).join("، ");
  };

  // Plain text of a cell, shared by the table and the CSV export
  const formatCellText = (key: string, accident: accidentSchema): string => {
    const value = getFieldValue(accident, key);
    switch (key) {
      case "seri":
      case "serial":
      case "dead_count":
      case "injured_count":
        return formatNumber(value as number);
      case "location": {
        const coords = (value as { coordinates?: number[] } | undefined)?.coordinates;
        if (!coords || coords.length < 2) return "—";
        return `${formatNumber(coords[1])}، ${formatNumber(coords[0])}`;
      }
      case "date_of_accident": {
        const formatted = formatDate(value as Date | string);
        const time = formatTime(value as Date | string);
        return time ? `${formatted} ${time}` : formatted;
      }
      case "officer": {
        const officer = value as
          | { first_name?: string; last_name?: string; personnel_code?: string }
          | undefined;
        return (
          [officer?.first_name, officer?.last_name].filter(Boolean).join(" ") ||
          officer?.personnel_code ||
          "—"
        );
      }
      case "vehicle_dtos":
      case "pedestrian_dtos":
      case "attachments":
        return formatNumber((value as unknown[] | undefined)?.length);
      case "province":
      case "city":
      case "road":
      case "traffic_zone":
      case "city_zone":
      case "type":
      case "position":
      case "ruling_type":
      case "light_status":
      case "collision_type":
      case "road_situation":
      case "road_repair_type":
      case "shoulder_status":
        return getObjectName(value);
      case "area_usages":
      case "air_statuses":
      case "road_defects":
      case "human_reasons":
      case "vehicle_reasons":
      case "equipment_damages":
      case "road_surface_conditions":
        return getNamesJoined(value);
      default:
        return "—";
    }
  };

  // Render a single table cell, keeping the semantic colours of counts
  const renderCell = (key: string, accident: accidentSchema): React.ReactNode => {
    if (key === "dead_count") {
      return (
        <span className="text-danger-fg font-medium">
          {formatNumber(getFieldValue(accident, key) as number)}
        </span>
      );
    }
    if (key === "injured_count") {
      return (
        <span className="text-orange-600 font-medium">
          {formatNumber(getFieldValue(accident, key) as number)}
        </span>
      );
    }
    if (key === "date_of_accident") {
      const value = getFieldValue(accident, key) as Date | string;
      const time = formatTime(value);
      return (
        <>
          {formatDate(value)}
          {time && <span className="text-fg-faint mr-1">{time}</span>}
        </>
      );
    }
    return formatCellText(key, accident);
  };

  // Columns to display, in the field-option order
  const activeColumns = fieldOptions.filter((option) =>
    selectedFields.has(option.key),
  );

  const escapeCsv = (value: string) =>
    /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

  const handleExportCsv = () => {
    if (data.length === 0 || activeColumns.length === 0) return;
    const header = activeColumns.map((option) => option.label);
    const rows = data.map((accident) =>
      activeColumns.map((option) => formatCellText(option.key, accident)),
    );
    const csv =
      "\uFEFF" +
      [header, ...rows]
        .map((row) => row.map(escapeCsv).join(","))
        .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `accidents-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const totalDead = data.reduce((sum, acc) => sum + (acc.dead_count || 0), 0);
  const totalInjured = data.reduce(
    (sum, acc) => sum + (acc.injured_count || 0),
    0,
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
      <div className="bg-surface rounded-lg shadow-xl w-[95vw] max-w-[1600px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-fg">
              جزئیات تصادفات در منطقه انتخاب شده
            </h2>
            <p className="text-sm text-fg-muted mt-1">
              تعداد تصادفات: {data.length.toLocaleString("fa-IR")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-fg-faint hover:text-fg-muted transition-colors"
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
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Field Selector Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-canvas">
          <button
            onClick={toggleFieldSelector}
            className="flex items-center gap-2 text-sm font-medium text-brand-fg hover:text-brand-fg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
            {showFieldSelector ? "بستن انتخاب ستون‌ها" : "انتخاب ستون‌های جدول"}
          </button>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-fg-muted">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              در حال بارگذاری...
            </div>
          )}
        </div>

        {/* Field Selector Panel */}
        {showFieldSelector && (
          <div className="px-6 py-4 border-b bg-surface">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-fg-muted">
                ستون‌های مورد نظر را انتخاب کنید و دکمه «اعمال» را بزنید تا داده‌ها
                دوباره از سامانه دریافت شوند.
              </p>
              <button
                type="button"
                onClick={toggleAllFields}
                disabled={isLoading}
                className="shrink-0 text-sm font-medium text-brand-fg hover:underline disabled:text-fg-muted disabled:no-underline"
              >
                {allFieldsSelected ? "حذف انتخاب همه" : "انتخاب همه"}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {fieldOptions.map((option) => (
                <label
                  key={option.key}
                  className="flex items-center gap-2 text-sm text-fg cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={draftFields.has(option.key)}
                    onChange={() => toggleField(option.key)}
                    className="w-4 h-4 text-brand-fg rounded border-line-strong focus:ring-brand"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleApplyFields}
                disabled={isLoading}
                className="flex items-center gap-2 bg-brand text-on-brand px-4 py-2 rounded-lg hover:bg-brand-hover disabled:bg-line-strong disabled:text-fg-muted disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                اعمال و بارگذاری مجدد
              </button>
              <button
                onClick={handleResetFields}
                disabled={isLoading}
                className="flex items-center gap-2 bg-surface-sunken text-fg px-4 py-2 rounded-lg hover:bg-surface-sunken disabled:bg-line-strong disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                بازنشانی به پیش‌فرض
              </button>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="flex-1 overflow-auto px-6 pb-6 overscroll-contain">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-brand" />
              <p className="text-sm text-fg-muted">
                در حال دریافت جدول با ستون‌های انتخاب‌شده...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-fg-muted">تصادفی در این منطقه یافت نشد.</p>
            </div>
          ) : (
            <table className="w-full border-collapse border border-line-strong min-w-[1000px]">
              <thead>
                <tr className="bg-canvas sticky top-0 z-10">
                  {activeColumns.map((option) => (
                    <th
                      key={option.key}
                      className="border border-line-strong px-2 py-1.5 text-right text-xs font-medium text-fg whitespace-nowrap"
                    >
                      {option.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((accident, index) => (
                  <tr
                    key={`${accident._id}-${index}`}
                    className="hover:bg-surface-hover"
                  >
                    {activeColumns.map((option) => (
                      <td
                        key={option.key}
                        className="border border-line-strong px-2 py-1.5 text-xs text-fg whitespace-nowrap"
                      >
                        {renderCell(option.key, accident)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-canvas">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-fg-muted">
              مجموع تصادفات: {data.length.toLocaleString("fa-IR")} | مجموع فوتی:{" "}
              {totalDead.toLocaleString("fa-IR")} | مجموع مجروح:{" "}
              {totalInjured.toLocaleString("fa-IR")}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                disabled={isLoading || data.length === 0}
                className="flex items-center gap-2 bg-surface-sunken text-fg px-4 py-2 rounded-lg hover:bg-surface-hover disabled:bg-line-strong disabled:text-fg-muted disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
                  />
                </svg>
                خروجی CSV
              </button>
              <button
                onClick={onClose}
                className="bg-brand text-on-brand px-4 py-2 rounded-lg hover:bg-brand-hover transition-colors"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccidentDetailsModal;
