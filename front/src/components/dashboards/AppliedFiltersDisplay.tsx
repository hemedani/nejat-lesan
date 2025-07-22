"use client";

import React from "react";
import {
  MapPinIcon,
  CalendarIcon,
  FilterIcon,
  CogIcon,
  UserIcon,
  UsersIcon,
  HomeIcon,
  CarIcon,
  AmbulanceIcon,
  SkullIcon,
  ShieldIcon,
  RoadIcon,
  SunIcon,
  CloudIcon,
  ThermometerIcon,
  EyeIcon,
} from "@/components/atoms/Icons";

// Import the filter state type
import { RoadDefectsFilterState } from "./ChartsFilterSidebar";

/**
 * Props interface for the AppliedFiltersDisplay component
 * @interface AppliedFiltersDisplayProps
 */
interface AppliedFiltersDisplayProps {
  /**
   * Filter state object containing all applied filters
   * Uses the comprehensive RoadDefectsFilterState interface
   */
  filters: RoadDefectsFilterState;
}

/**
 * AppliedFiltersDisplay Component
 *
 * A highly reusable and visually appealing component that displays currently active filters
 * on chart pages. The component is purely presentational and receives filter state as props.
 *
 * Features:
 * - Modern, clean design with gradient background and hover effects
 * - Dynamic rendering - only shows sections for filters that have values
 * - Categorized display with icons and emojis for better UX
 * - Responsive grid layout for different screen sizes
 * - Animated transitions and hover states
 * - Summary statistics showing total active filters
 *
 * @component
 * @param {AppliedFiltersDisplayProps} props - The component props
 * @param {RoadDefectsFilterState & {maxDamageSections?: string[]}} props.filters - Filter state object
 * @returns {React.ReactElement | null} The rendered component or null if no filters are applied
 *
 * @example
 * ```tsx
 * <AppliedFiltersDisplay
 *   filters={{
 *     province: ['تهران', 'اصفهان'],
 *     collisionType: ['برخورد وسیله نقلیه با شیء ثابت'],
 *     dateOfAccidentFrom: '1401-01-01',
 *     dateOfAccidentTo: '1401-12-29',
 *     vehicleSystem: ['سیستم ترمز'],
 *     driverSex: ['مرد', 'زن'],
 *     humanReasons: ['عدم رعایت حق تقدم']
 *   }}
 * />
 * ```
 */
const AppliedFiltersDisplay: React.FC<AppliedFiltersDisplayProps> = ({
  filters,
}) => {
  // Check if there are any filters applied
  const hasFilters = Object.entries(filters).some(([, value]) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });

  // If no filters are applied, don't render anything
  if (!hasFilters) {
    return null;
  }

  /**
   * Renders a filter section with title, icon, and values as styled pills
   * @param {string} title - The display title for the filter section
   * @param {React.ReactNode} icon - The icon component to display
   * @param {string[] | undefined} values - Array of filter values to display
   * @param {string} colorClass - Tailwind CSS classes for styling the pills
   * @returns {React.ReactElement | null} The rendered filter section or null if no values
   */
  const renderFilterSection = (
    title: string,
    icon: React.ReactNode,
    values: string[] | undefined,
    colorClass: string,
  ) => {
    if (!values || values.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          {icon}
          <span>{title}</span>
        </h4>
        <div className="flex flex-wrap gap-1">
          {values.map((value, index) => (
            <span
              key={index}
              className={`inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default ${colorClass}`}
            >
              {value}
            </span>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Renders the date range filter section
   * @returns {React.ReactElement | null} The rendered date range section or null if no dates
   */
  const renderDateRange = () => {
    if (!filters.dateOfAccidentFrom && !filters.dateOfAccidentTo) return null;

    return (
      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <span>📅 بازه زمانی</span>
        </h4>
        <div className="flex flex-wrap gap-1">
          <span className="inline-block bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default">
            {filters.dateOfAccidentFrom || "ابتدا"} -{" "}
            {filters.dateOfAccidentTo || "انتها"}
          </span>
        </div>
      </div>
    );
  };

  /**
   * Renders a count range filter section (e.g., casualty counts)
   * @param {string} title - The display title for the count range
   * @param {React.ReactNode} icon - The icon component to display
   * @param {number | undefined} minValue - Minimum value of the range
   * @param {number | undefined} maxValue - Maximum value of the range
   * @param {string} colorClass - Tailwind CSS classes for styling the pill
   * @returns {React.ReactElement | null} The rendered count range section or null if no values
   */
  const renderCountRange = (
    title: string,
    icon: React.ReactNode,
    minValue: number | undefined,
    maxValue: number | undefined,
    colorClass: string,
  ) => {
    if (minValue === undefined && maxValue === undefined) return null;

    return (
      <div className="space-y-2">
        <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700">
          {icon}
          <span>{title}</span>
        </h4>
        <div className="flex flex-wrap gap-1">
          <span
            className={`inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default ${colorClass}`}
          >
            {minValue ?? 0} - {maxValue ?? "∞"}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-blue-200 hover:scale-110">
          <FilterIcon className="w-4 h-4 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 tracking-tight">
          🔍 فیلترهای اعمال شده
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
        {/* Core Accident Details */}
        {filters.seri && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FilterIcon className="w-4 h-4 text-blue-500" />
              <span>📄 سری</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              <span className="inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default bg-blue-100 text-blue-800">
                {filters.seri}
              </span>
            </div>
          </div>
        )}

        {filters.serial && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <FilterIcon className="w-4 h-4 text-blue-500" />
              <span>🔢 سریال</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              <span className="inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default bg-blue-100 text-blue-800">
                {filters.serial}
              </span>
            </div>
          </div>
        )}

        {filters.officer && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <UserIcon className="w-4 h-4 text-blue-500" />
              <span>👮 افسر</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              <span className="inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default bg-blue-100 text-blue-800">
                {filters.officer}
              </span>
            </div>
          </div>
        )}

        {/* Geographic Filters */}
        {renderFilterSection(
          "📍 استان",
          <MapPinIcon className="w-4 h-4 text-purple-500" />,
          filters.province,
          "bg-purple-100 text-purple-800",
        )}

        {renderFilterSection(
          "🏙️ شهر",
          <HomeIcon className="w-4 h-4 text-indigo-500" />,
          filters.city,
          "bg-indigo-100 text-indigo-800",
        )}

        {renderFilterSection(
          "🛣️ جاده",
          <CogIcon className="w-4 h-4 text-slate-500" />,
          filters.road,
          "bg-slate-100 text-slate-800",
        )}

        {/* Date Range */}
        {renderDateRange()}

        {/* Time Range */}
        {(filters.timeOfAccidentFrom || filters.timeOfAccidentTo) && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <span>⏰ بازه زمانی</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              <span className="inline-block bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default">
                {filters.timeOfAccidentFrom || "ابتدا"} -{" "}
                {filters.timeOfAccidentTo || "انتها"}
              </span>
            </div>
          </div>
        )}

        {/* Collision and Damage Filters */}
        {renderFilterSection(
          "🚗 نوع برخورد",
          <CogIcon className="w-4 h-4 text-red-500" />,
          filters.collisionType,
          "bg-red-100 text-red-800",
        )}

        {renderFilterSection(
          "🔧 بخش‌های آسیب‌دیده",
          <CogIcon className="w-4 h-4 text-yellow-500" />,
          filters.maxDamageSections,
          "bg-yellow-100 text-yellow-800",
        )}

        {renderFilterSection(
          "📋 نوع تصادف",
          <FilterIcon className="w-4 h-4 text-emerald-500" />,
          filters.accidentType,
          "bg-emerald-100 text-emerald-800",
        )}

        {/* Environmental Conditions */}
        {renderFilterSection(
          "💡 وضعیت نور",
          <CogIcon className="w-4 h-4 text-amber-500" />,
          filters.lightStatus,
          "bg-amber-100 text-amber-800",
        )}

        {renderFilterSection(
          "🌤️ وضعیت هوا",
          <CogIcon className="w-4 h-4 text-sky-500" />,
          filters.airStatuses,
          "bg-sky-100 text-sky-800",
        )}

        {renderFilterSection(
          "🏘️ کاربری منطقه",
          <UsersIcon className="w-4 h-4 text-green-500" />,
          filters.areaUsages,
          "bg-green-100 text-green-800",
        )}

        {renderFilterSection(
          "🛤️ وضعیت سطح جاده",
          <CogIcon className="w-4 h-4 text-stone-500" />,
          filters.roadSurfaceConditions,
          "bg-stone-100 text-stone-800",
        )}

        {renderFilterSection(
          "🚧 نقص جاده",
          <CogIcon className="w-4 h-4 text-gray-500" />,
          filters.roadDefects,
          "bg-gray-100 text-gray-800",
        )}

        {renderFilterSection(
          "🛣️ وضعیت جاده",
          <CogIcon className="w-4 h-4 text-gray-600" />,
          filters.roadSituation,
          "bg-gray-50 text-gray-700",
        )}

        {/* Reason-based Filters */}
        {renderFilterSection(
          "🧠 عوامل انسانی",
          <FilterIcon className="w-4 h-4 text-pink-500" />,
          filters.humanReasons,
          "bg-pink-100 text-pink-800",
        )}

        {renderFilterSection(
          "🔧 عوامل وسیله نقلیه",
          <CogIcon className="w-4 h-4 text-orange-500" />,
          filters.vehicleReasons,
          "bg-orange-100 text-orange-800",
        )}

        {/* Vehicle Filters */}
        {renderFilterSection(
          "🚗 سیستم وسیله نقلیه",
          <CarIcon className="w-4 h-4 text-teal-500" />,
          filters.vehicleSystem,
          "bg-teal-100 text-teal-800",
        )}

        {renderFilterSection(
          "⚠️ وضعیت خرابی وسیله",
          <CarIcon className="w-4 h-4 text-red-600" />,
          filters.vehicleFaultStatus,
          "bg-red-50 text-red-700",
        )}

        {renderFilterSection(
          "🚙 نوع وسیله نقلیه",
          <CarIcon className="w-4 h-4 text-blue-500" />,
          filters.vehicleType,
          "bg-blue-100 text-blue-800",
        )}

        {renderFilterSection(
          "🎨 رنگ وسیله نقلیه",
          <CarIcon className="w-4 h-4 text-violet-500" />,
          filters.vehicleColor,
          "bg-violet-100 text-violet-800",
        )}

        {renderFilterSection(
          "🛡️ شرکت بیمه",
          <ShieldIcon className="w-4 h-4 text-cyan-500" />,
          filters.vehicleInsuranceCo,
          "bg-cyan-100 text-cyan-800",
        )}

        {renderFilterSection(
          "🛡️ بیمه بدنه",
          <ShieldIcon className="w-4 h-4 text-cyan-600" />,
          filters.vehicleBodyInsuranceCo,
          "bg-cyan-50 text-cyan-700",
        )}

        {renderFilterSection(
          "📄 نوع گواهینامه",
          <FilterIcon className="w-4 h-4 text-indigo-500" />,
          filters.vehicleLicenceType,
          "bg-indigo-100 text-indigo-800",
        )}

        {renderFilterSection(
          "🔢 نوع پلاک",
          <FilterIcon className="w-4 h-4 text-slate-500" />,
          filters.vehiclePlaqueType,
          "bg-slate-100 text-slate-800",
        )}

        {renderFilterSection(
          "🚗 کاربری پلاک",
          <FilterIcon className="w-4 h-4 text-slate-600" />,
          filters.vehiclePlaqueUsage,
          "bg-slate-50 text-slate-700",
        )}

        {renderFilterSection(
          "➡️ جهت حرکت",
          <CarIcon className="w-4 h-4 text-emerald-500" />,
          filters.vehicleMotionDirection,
          "bg-emerald-100 text-emerald-800",
        )}

        {renderFilterSection(
          "🔧 آسیب تجهیزات",
          <CarIcon className="w-4 h-4 text-yellow-600" />,
          filters.vehicleEquipmentDamage,
          "bg-yellow-50 text-yellow-700",
        )}

        {renderFilterSection(
          "🛠️ نوع تعمیر جاده",
          <RoadIcon className="w-4 h-4 text-amber-600" />,
          filters.roadRepairType,
          "bg-amber-50 text-amber-700",
        )}

        {/* Driver Filters */}
        {renderFilterSection(
          "👤 جنسیت راننده",
          <UserIcon className="w-4 h-4 text-purple-500" />,
          filters.driverSex,
          "bg-purple-100 text-purple-800",
        )}

        {renderFilterSection(
          "📜 نوع گواهینامه راننده",
          <FilterIcon className="w-4 h-4 text-indigo-600" />,
          filters.driverLicenceType,
          "bg-indigo-50 text-indigo-700",
        )}

        {renderFilterSection(
          "🏥 نوع مصدومیت راننده",
          <UserIcon className="w-4 h-4 text-rose-500" />,
          filters.driverInjuryType,
          "bg-rose-100 text-rose-800",
        )}

        {renderFilterSection(
          "⚠️ وضعیت تقصیر راننده",
          <UserIcon className="w-4 h-4 text-red-500" />,
          filters.driverFaultStatus,
          "bg-red-100 text-red-800",
        )}

        {renderFilterSection(
          "🎂 سن راننده",
          <UserIcon className="w-4 h-4 text-blue-500" />,
          filters.driverAge,
          "bg-blue-100 text-blue-800",
        )}

        {renderFilterSection(
          "🪑 موقعیت راننده",
          <UserIcon className="w-4 h-4 text-green-500" />,
          filters.driverPosition,
          "bg-green-100 text-green-800",
        )}

        {renderFilterSection(
          "⚖️ نوع حکم راننده",
          <FilterIcon className="w-4 h-4 text-gray-500" />,
          filters.driverRulingType,
          "bg-gray-100 text-gray-800",
        )}

        {/* Road Infrastructure */}
        {renderFilterSection(
          "🛣️ نوع جاده",
          <RoadIcon className="w-4 h-4 text-stone-500" />,
          filters.roadType,
          "bg-stone-100 text-stone-800",
        )}

        {renderFilterSection(
          "📏 عرض جاده",
          <RoadIcon className="w-4 h-4 text-stone-600" />,
          filters.roadWidth,
          "bg-stone-50 text-stone-700",
        )}

        {renderFilterSection(
          "⛰️ شیب جاده",
          <RoadIcon className="w-4 h-4 text-gray-500" />,
          filters.roadSlope,
          "bg-gray-100 text-gray-800",
        )}

        {renderFilterSection(
          "🌀 پیچ جاده",
          <RoadIcon className="w-4 h-4 text-gray-600" />,
          filters.roadCurve,
          "bg-gray-50 text-gray-700",
        )}

        {renderFilterSection(
          "🚥 تابلوی جاده",
          <FilterIcon className="w-4 h-4 text-yellow-500" />,
          filters.roadSign,
          "bg-yellow-100 text-yellow-800",
        )}

        {renderFilterSection(
          "🚧 نرده جاده",
          <RoadIcon className="w-4 h-4 text-orange-500" />,
          filters.roadBarrier,
          "bg-orange-100 text-orange-800",
        )}

        {renderFilterSection(
          "💡 روشنایی جاده",
          <SunIcon className="w-4 h-4 text-amber-500" />,
          filters.roadLighting,
          "bg-amber-100 text-amber-800",
        )}

        {renderFilterSection(
          "🛤️ شانه جاده",
          <RoadIcon className="w-4 h-4 text-slate-500" />,
          filters.roadShoulder,
          "bg-slate-100 text-slate-800",
        )}

        {renderFilterSection(
          "🛤️ وضعیت شانه",
          <RoadIcon className="w-4 h-4 text-slate-600" />,
          filters.shoulderStatus,
          "bg-slate-50 text-slate-700",
        )}

        {renderFilterSection(
          "🚦 منطقه ترافیکی",
          <FilterIcon className="w-4 h-4 text-red-500" />,
          filters.trafficZone,
          "bg-red-100 text-red-800",
        )}

        {renderFilterSection(
          "🏙️ منطقه شهری",
          <HomeIcon className="w-4 h-4 text-indigo-500" />,
          filters.cityZone,
          "bg-indigo-100 text-indigo-800",
        )}

        {/* Time and Weather */}
        {renderFilterSection(
          "🗓️ فصل",
          <CalendarIcon className="w-4 h-4 text-green-500" />,
          filters.seasonality,
          "bg-green-100 text-green-800",
        )}

        {renderFilterSection(
          "📅 روز هفته",
          <CalendarIcon className="w-4 h-4 text-blue-500" />,
          filters.dayOfWeek,
          "bg-blue-100 text-blue-800",
        )}

        {filters.isHoliday !== undefined && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <CalendarIcon className="w-4 h-4 text-purple-500" />
              <span>🎉 تعطیلی</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              <span className="inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default bg-purple-100 text-purple-800">
                {filters.isHoliday ? "تعطیل" : "غیر تعطیل"}
              </span>
            </div>
          </div>
        )}

        {renderFilterSection(
          "🌤️ وضعیت آب و هوا",
          <CloudIcon className="w-4 h-4 text-sky-500" />,
          filters.weatherCondition,
          "bg-sky-100 text-sky-800",
        )}

        {renderFilterSection(
          "👁️ میزان دید",
          <EyeIcon className="w-4 h-4 text-gray-500" />,
          filters.visibility,
          "bg-gray-100 text-gray-800",
        )}

        {renderFilterSection(
          "🌡️ دما",
          <ThermometerIcon className="w-4 h-4 text-red-500" />,
          filters.temperature,
          "bg-red-100 text-red-800",
        )}

        {renderFilterSection(
          "🌧️ بارندگی",
          <CloudIcon className="w-4 h-4 text-blue-500" />,
          filters.precipitation,
          "bg-blue-100 text-blue-800",
        )}

        {/* Casualty Count Ranges */}
        {renderCountRange(
          "☠️ تعداد فوتی",
          <SkullIcon className="w-4 h-4 text-black" />,
          filters.deadCountMin,
          filters.deadCountMax,
          "bg-black text-white",
        )}

        {renderCountRange(
          "🚑 تعداد مصدوم",
          <AmbulanceIcon className="w-4 h-4 text-rose-500" />,
          filters.injuredCountMin,
          filters.injuredCountMax,
          "bg-rose-100 text-rose-800",
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-blue-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="font-medium">تعداد فیلترهای فعال:</span>
          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full transition-all duration-200 hover:bg-blue-100">
            {
              Object.entries(filters).filter(([, value]) => {
                if (value === undefined || value === null) return false;
                if (Array.isArray(value)) return value.length > 0;
                return true;
              }).length
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppliedFiltersDisplay;
