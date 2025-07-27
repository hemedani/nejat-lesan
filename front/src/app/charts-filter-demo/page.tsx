"use client";

import React, { useState } from "react";
import ChartsFilterSidebar, {
  RoadDefectsFilterState,
} from "@/components/dashboards/ChartsFilterSidebar";

// Default enabled filters for demo (all filters enabled)
const DEFAULT_ENABLED_FILTERS: Array<keyof RoadDefectsFilterState> = [
  "seri",
  "serial",
  "dateOfAccidentFrom",
  "dateOfAccidentTo",
  "deadCountMin",
  "deadCountMax",
  "injuredCountMin",
  "injuredCountMax",
  "officer",
  "province",
  "city",
  "road",
  "trafficZone",
  "cityZone",
  "accidentType",
  "position",
  "rulingType",
  "lightStatus",
  "collisionType",
  "roadSituation",
  "roadRepairType",
  "shoulderStatus",
  "areaUsages",
  "airStatuses",
  "roadDefects",
  "humanReasons",
  "vehicleReasons",
  "roadSurfaceConditions",
  "vehicleSystem",
  "vehicleFaultStatus",
  "driverSex",
  "driverLicenceType",
  "driverInjuryType",
  "maxDamageSections",
];

// Configuration presets
const configPresets = {
  default: {
    disableSeverityFilter: false,
    disableCollisionTypeFilter: false,
    disableLightingFilter: false,
    lockToSevereAccidents: false,
  },
  roadDefects: {
    disableSeverityFilter: false,
    disableCollisionTypeFilter: false,
    disableLightingFilter: false,
    lockToSevereAccidents: true,
  },
  lightingAnalysis: {
    disableSeverityFilter: false,
    disableCollisionTypeFilter: true,
    disableLightingFilter: false,
    lockToSevereAccidents: false,
  },
  severityFocus: {
    disableSeverityFilter: true,
    disableCollisionTypeFilter: false,
    disableLightingFilter: false,
    lockToSevereAccidents: false,
  },
};

type ConfigPresetKey = keyof typeof configPresets;

const ChartsFilterDemoPage: React.FC = () => {
  const [activePreset, setActivePreset] = useState<ConfigPresetKey>("default");
  const [appliedFilters, setAppliedFilters] =
    useState<RoadDefectsFilterState | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Handle filter application
  const handleApplyFilters = (filters: RoadDefectsFilterState) => {
    setAppliedFilters(filters);
    console.log("Applied Filters:", filters);
  };

  // Preset descriptions
  const presetDescriptions = {
    default: "پیکربندی پیش‌فرض - همه فیلترها فعال",
    roadDefects: "تحلیل نقایص راه - قفل تصادفات شدید",
    lightingAnalysis: "تحلیل روشنایی - نوع برخورد غیرفعال",
    severityFocus: "تمرکز بر شدت - فیلتر شدت غیرفعال",
  };

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              نمایش فیلتر ساید بار نجات
            </h1>
            <p className="text-gray-600">
              نمایش قابلیت‌های مختلف کامپوننت فیلتر برای سیستم تحلیل ایمنی
              ترافیک
            </p>
          </div>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                clipRule="evenodd"
              />
            </svg>
            {showSidebar ? "مخفی کردن ساید بار" : "نمایش ساید بار"}
          </button>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        {/* Control Panel */}
        <div className="w-96 bg-white border-l border-gray-200 p-6 min-h-screen">
          {/* Preset Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              انتخاب پیکربندی:
            </h2>
            <div className="space-y-3">
              {Object.entries(presetDescriptions).map(([key, description]) => (
                <button
                  key={key}
                  onClick={() => setActivePreset(key as ConfigPresetKey)}
                  className={`w-full text-right p-3 rounded-lg border-2 transition-all text-sm ${
                    activePreset === key
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium">{description}</div>
                  <div className="text-xs opacity-75 mt-1 font-mono">{key}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Configuration */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              وضعیت فیلترها:
            </h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">فیلتر شدت:</span>
                <span
                  className={`text-sm font-bold ${
                    configPresets[activePreset].disableSeverityFilter
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {configPresets[activePreset].disableSeverityFilter
                    ? "❌ غیرفعال"
                    : "✅ فعال"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">نوع برخورد:</span>
                <span
                  className={`text-sm font-bold ${
                    configPresets[activePreset].disableCollisionTypeFilter
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {configPresets[activePreset].disableCollisionTypeFilter
                    ? "❌ غیرفعال"
                    : "✅ فعال"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">روشنایی:</span>
                <span
                  className={`text-sm font-bold ${
                    configPresets[activePreset].disableLightingFilter
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {configPresets[activePreset].disableLightingFilter
                    ? "❌ غیرفعال"
                    : "✅ فعال"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">قفل شدید:</span>
                <span
                  className={`text-sm font-bold ${
                    configPresets[activePreset].lockToSevereAccidents
                      ? "text-orange-600"
                      : "text-gray-600"
                  }`}
                >
                  {configPresets[activePreset].lockToSevereAccidents
                    ? "🔒 فعال"
                    : "🔓 غیرفعال"}
                </span>
              </div>
            </div>
          </div>

          {/* Applied Filters Summary */}
          {appliedFilters && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                خلاصه فیلترها:
              </h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  {appliedFilters.dateOfAccidentFrom &&
                    appliedFilters.dateOfAccidentTo && (
                      <div>
                        <span className="font-medium text-green-800">
                          بازه زمانی:{" "}
                        </span>
                        <span className="text-green-700">
                          {appliedFilters.dateOfAccidentFrom} تا{" "}
                          {appliedFilters.dateOfAccidentTo}
                        </span>
                      </div>
                    )}
                  {appliedFilters.province &&
                    appliedFilters.province.length > 0 && (
                      <div>
                        <span className="font-medium text-green-800">
                          استان:{" "}
                        </span>
                        <span className="text-green-700">
                          {appliedFilters.province.join(", ")}
                        </span>
                      </div>
                    )}
                  {appliedFilters.city && appliedFilters.city.length > 0 && (
                    <div>
                      <span className="font-medium text-green-800">شهر: </span>
                      <span className="text-green-700">
                        {appliedFilters.city.join(", ")}
                      </span>
                    </div>
                  )}
                  {(appliedFilters.deadCountMin ||
                    appliedFilters.injuredCountMin) && (
                    <div>
                      <span className="font-medium text-green-800">
                        شدت تصادف:{" "}
                      </span>
                      <span className="text-green-700">
                        {appliedFilters.deadCountMin &&
                          `حداقل ${appliedFilters.deadCountMin} فوتی`}
                        {appliedFilters.deadCountMin &&
                          appliedFilters.injuredCountMin &&
                          " - "}
                        {appliedFilters.injuredCountMin &&
                          `حداقل ${appliedFilters.injuredCountMin} مجروح`}
                      </span>
                    </div>
                  )}
                  {appliedFilters.roadDefects &&
                    appliedFilters.roadDefects.length > 0 && (
                      <div>
                        <span className="font-medium text-green-800">
                          نقایص راه:{" "}
                        </span>
                        <span className="text-green-700">
                          {appliedFilters.roadDefects.join(", ")}
                        </span>
                      </div>
                    )}
                  <div className="mt-3 pt-2 border-t border-green-200">
                    <div className="text-xs text-green-600">
                      ✅ فیلترها اعمال شدند - جزئیات کامل در کنسول
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Chart Area */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-sm p-8 h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-6">
                  <svg
                    className="w-24 h-24 mx-auto"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  منطقه نمایش نمودار
                </h2>
                <p className="text-gray-600 mb-6">
                  پیکربندی فعلی:{" "}
                  <span className="font-semibold text-blue-600">
                    {presetDescriptions[activePreset]}
                  </span>
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 inline-block">
                  <h3 className="font-semibold text-blue-900 mb-3">
                    مشخصات پیکربندی
                  </h3>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span>فیلتر شدت:</span>
                      <span
                        className={
                          configPresets[activePreset].disableSeverityFilter
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {configPresets[activePreset].disableSeverityFilter
                          ? "❌"
                          : "✅"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>نوع برخورد:</span>
                      <span
                        className={
                          configPresets[activePreset].disableCollisionTypeFilter
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {configPresets[activePreset].disableCollisionTypeFilter
                          ? "❌"
                          : "✅"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>روشنایی:</span>
                      <span
                        className={
                          configPresets[activePreset].disableLightingFilter
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {configPresets[activePreset].disableLightingFilter
                          ? "❌"
                          : "✅"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>قفل شدید:</span>
                      <span
                        className={
                          configPresets[activePreset].lockToSevereAccidents
                            ? "text-orange-600"
                            : "text-gray-600"
                        }
                      >
                        {configPresets[activePreset].lockToSevereAccidents
                          ? "🔒"
                          : "🔓"}
                      </span>
                    </div>
                  </div>
                </div>

                {!showSidebar && (
                  <div className="mt-6">
                    <button
                      onClick={() => setShowSidebar(true)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      نمایش ساید بار فیلتر
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          {showSidebar && (
            <ChartsFilterSidebar
              config={configPresets[activePreset]}
              onApplyFilters={handleApplyFilters}
              enabledFilters={DEFAULT_ENABLED_FILTERS}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChartsFilterDemoPage;
