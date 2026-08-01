"use client";

import React, { useState } from "react";
import { accidentSchema } from "@/types/declarations/selectInp";
import { useScrollLock } from "@/hooks/useScrollLock";
import { AccidentFieldOption } from "@/utils/accidentProjection";

interface AccidentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: accidentSchema[];
  isLoading?: boolean;
  fieldOptions: AccidentFieldOption[];
  selectedFields: Set<string>;
  onToggleField: (key: string) => void;
  onApplyFields: () => void;
  onResetFields: () => void;
}

const AccidentDetailsModal: React.FC<AccidentDetailsModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading,
  fieldOptions,
  selectedFields,
  onToggleField,
  onApplyFields,
  onResetFields,
}) => {
  const [showFieldSelector, setShowFieldSelector] = useState(false);

  // Prevent background scrolling when modal is open
  useScrollLock(isOpen);

  if (!isOpen) return null;

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

  // Render a single table cell for the given field key
  const renderCell = (key: string, accident: accidentSchema): React.ReactNode => {
    const value = getFieldValue(accident, key);
    switch (key) {
      case "_id":
        return (value as string) || "—";
      case "seri":
      case "serial":
      case "news_number":
        return formatNumber(value as number);
      case "location": {
        const coords = (value as { coordinates?: number[] } | undefined)?.coordinates;
        if (!coords || coords.length < 2) return "—";
        return `${formatNumber(coords[1])}، ${formatNumber(coords[0])}`;
      }
      case "date_of_accident": {
        const formatted = formatDate(value as Date | string);
        const time = formatTime(value as Date | string);
        return (
          <>
            {formatted}
            {time && <span className="text-gray-400 mr-1">{time}</span>}
          </>
        );
      }
      case "dead_count":
        return (
          <span className="text-red-600 font-medium">
            {formatNumber(value as number)}
          </span>
        );
      case "injured_count":
        return (
          <span className="text-orange-600 font-medium">
            {formatNumber(value as number)}
          </span>
        );
      case "has_witness":
        return value ? "بله" : "خیر";
      case "officer":
        return (value as string) || "—";
      case "completion_date":
      case "createdAt":
      case "updatedAt":
        return formatDate(value as Date | string);
      case "vehicle_dtos":
      case "pedestrian_dtos":
      case "attachments":
        return formatNumber((value as unknown[] | undefined)?.length);
      case "province":
      case "city":
      case "township":
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

  // Columns to display, in the field-option order
  const activeColumns = fieldOptions.filter((option) =>
    selectedFields.has(option.key),
  );

  const totalDead = data.reduce((sum, acc) => sum + (acc.dead_count || 0), 0);
  const totalInjured = data.reduce(
    (sum, acc) => sum + (acc.injured_count || 0),
    0,
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100000] p-4">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] max-w-[1600px] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              جزئیات تصادفات در منطقه انتخاب شده
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              تعداد تصادفات: {data.length.toLocaleString("fa-IR")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
        <div className="flex items-center justify-between px-6 py-3 border-b bg-gray-50">
          <button
            onClick={() => setShowFieldSelector((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
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
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              در حال بارگذاری...
            </div>
          )}
        </div>

        {/* Field Selector Panel */}
        {showFieldSelector && (
          <div className="px-6 py-4 border-b bg-white">
            <p className="text-sm text-gray-600 mb-3">
              ستون‌های مورد نظر را انتخاب کنید و دکمه «اعمال» را بزنید تا داده‌ها
              دوباره از سامانه دریافت شوند.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {fieldOptions.map((option) => (
                <label
                  key={option.key}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedFields.has(option.key)}
                    onChange={() => onToggleField(option.key)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={onApplyFields}
                disabled={isLoading}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
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
                onClick={onResetFields}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                بازنشانی به پیش‌فرض
              </button>
            </div>
          </div>
        )}

        {/* Table Container */}
        <div className="flex-1 overflow-auto px-6 pb-6 overscroll-contain">
          {data.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">تصادفی در این منطقه یافت نشد.</p>
            </div>
          ) : (
            <table className="w-full border-collapse border border-gray-300 min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 sticky top-0 z-10">
                  {activeColumns.map((option) => (
                    <th
                      key={option.key}
                      className="border border-gray-300 px-2 py-1.5 text-right text-xs font-medium text-gray-900 whitespace-nowrap"
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
                    className="hover:bg-gray-50"
                  >
                    {activeColumns.map((option) => (
                      <td
                        key={option.key}
                        className="border border-gray-300 px-2 py-1.5 text-xs text-gray-900 whitespace-nowrap"
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
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              مجموع تصادفات: {data.length.toLocaleString("fa-IR")} | مجموع فوتی:{" "}
              {totalDead.toLocaleString("fa-IR")} | مجموع مجروح:{" "}
              {totalInjured.toLocaleString("fa-IR")}
            </div>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccidentDetailsModal;
