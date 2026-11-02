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
} from "@/components/atoms/Icons";

// Import the filter state type
import { ChartFilterState } from "./ChartsFilterSidebar";
import { formatDate } from "@/utils/formatters";
import { useGlobalChartFilters } from "@/context/GlobalChartFiltersContext";

/**
 * Props interface for the AppliedFiltersDisplay component
 * @interface AppliedFiltersDisplayProps
 */
interface AppliedFiltersDisplayProps {
  /**
   * Filter state object containing all applied filters
   * Uses the comprehensive ChartFilterState interface
   */
  filters: ChartFilterState;
  /**
   * Whether to show a global filters indicator badge
   */
  showGlobalIndicator?: boolean;
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
 * @param {ChartFilterState} props.filters - Filter state object
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
  showGlobalIndicator = true,
}) => {
  const { hasGlobalFilters, globalFilterCount } = useGlobalChartFilters();
  // Check if there are any filters applied
  const hasFilters = Object.entries(filters).some(([, value]) => {
    if (value === undefined || value === null) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim() !== "";
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
        <h4 className="flex items-center gap-2 text-sm font-medium text-fg mb-2">
          {icon}
          <span>{title}</span>
        </h4>
        <div className="flex flex-wrap gap-1">
          {values.map((value, index) => (
            <span
              key={index}
              title={value}
              data-tooltip={value}
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
        <h4 className="flex items-center gap-2 text-sm font-medium text-fg">
          <CalendarIcon className="w-4 h-4 text-fg-muted" />
          <span>📅 بازه زمانی</span>
        </h4>
        <div className="flex flex-wrap gap-1">
          <span className="inline-block tint-orange bg-tint-strong text-tint-fg text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default">
            {filters.dateOfAccidentFrom
              ? formatDate(filters.dateOfAccidentFrom)
              : "ابتدا"}{" "}
            -{" "}
            {filters.dateOfAccidentTo
              ? formatDate(filters.dateOfAccidentTo)
              : "انتها"}
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
        <h4 className="flex items-center gap-2 text-sm font-medium text-fg">
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
    <div className="tint-brand bg-tint-soft border border-brand-border rounded-xl p-6 shadow-sm mb-6 animate-in fade-in-50 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-brand-soft rounded-full flex items-center justify-center transition-all duration-200 hover:bg-tint-strong hover:scale-110">
          <FilterIcon className="w-4 h-4 text-brand-fg" />
        </div>
        <h3 className="text-lg font-semibold text-fg tracking-tight">
          فیلترهای اعمال شده
        </h3>
        {/* GLOBAL FILTERS: Badge when global filters are active */}
        {showGlobalIndicator && hasGlobalFilters && (
          <span className="inline-flex items-center gap-1 tint-indigo bg-tint-strong text-tint-fg text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {globalFilterCount} فیلتر عمومی
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
        {/* Core Accident Details */}
        {filters.seri && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-fg mb-2">
              <FilterIcon className="w-4 h-4 tint-blue text-tint-fg" />
              <span>📄 سری</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              <span className="inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default bg-brand-soft text-brand-fg">
                {filters.seri}
              </span>
            </div>
          </div>
        )}

        {filters.serial && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-fg mb-2">
              <FilterIcon className="w-4 h-4 tint-blue text-tint-fg" />
              <span>🔢 سریال</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              <span className="inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default bg-brand-soft text-brand-fg">
                {filters.serial}
              </span>
            </div>
          </div>
        )}

        {filters.officer && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-fg mb-2">
              <UserIcon className="w-4 h-4 tint-blue text-tint-fg" />
              <span>👮 افسر</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              <span className="inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default bg-brand-soft text-brand-fg">
                {filters.officer}
              </span>
            </div>
          </div>
        )}

        {/* Geographic Filters */}
        {renderFilterSection(
          "📍 استان",
          <MapPinIcon className="w-4 h-4 tint-purple text-tint-fg" />,
          filters.province,
          "tint-purple bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "🏙️ شهر",
          <HomeIcon className="w-4 h-4 tint-indigo text-tint-fg" />,
          filters.city,
          "tint-indigo bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "🛣️ جاده",
          <CogIcon className="w-4 h-4 text-fg-faint" />,
          filters.road,
          "bg-surface-sunken text-fg",
        )}

        {/* Date Range */}
        {renderDateRange()}

        {/* Collision and Damage Filters */}
        {renderFilterSection(
          "🚗 نوع برخورد",
          <CogIcon className="w-4 h-4 tint-red text-tint-fg" />,
          filters.collisionType,
          "bg-danger-soft text-danger-fg",
        )}

        {renderFilterSection(
          "🔧 بخش‌های آسیب‌دیده",
          <CogIcon className="w-4 h-4 tint-yellow text-tint-fg" />,
          filters.vehicleMaxDamageSections,
          "tint-yellow bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "📋 نوع تصادف",
          <FilterIcon className="w-4 h-4 tint-emerald text-tint-fg" />,
          filters.accidentType,
          "tint-emerald bg-tint-strong text-tint-fg",
        )}

        {/* Environmental Conditions */}
        {renderFilterSection(
          "💡 وضعیت نور",
          <CogIcon className="w-4 h-4 tint-amber text-tint-fg" />,
          filters.lightStatus,
          "tint-warning bg-tint-soft text-tint-fg",
        )}

        {renderFilterSection(
          "🌤️ وضعیت هوا",
          <CogIcon className="w-4 h-4 tint-sky text-tint-fg" />,
          filters.airStatuses,
          "tint-sky bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "🏘️ کاربری منطقه",
          <UsersIcon className="w-4 h-4 tint-green text-tint-fg" />,
          filters.areaUsages,
          "bg-success-soft text-success-fg",
        )}

        {renderFilterSection(
          "🛤️ وضعیت سطح جاده",
          <CogIcon className="w-4 h-4 text-fg-faint" />,
          filters.roadSurfaceConditions,
          "bg-surface-sunken text-fg",
        )}

        {renderFilterSection(
          "🚧 نقص جاده",
          <CogIcon className="w-4 h-4 text-fg-muted" />,
          filters.roadDefects,
          "bg-surface-sunken text-fg",
        )}

        {renderFilterSection(
          "🛣️ وضعیت جاده",
          <CogIcon className="w-4 h-4 text-fg-muted" />,
          filters.roadSituation,
          "bg-canvas text-fg",
        )}

        {/* Reason-based Filters */}
        {renderFilterSection(
          "🧠 عوامل انسانی",
          <FilterIcon className="w-4 h-4 tint-pink text-tint-fg" />,
          filters.humanReasons,
          "tint-pink bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "🔧 عوامل وسیله نقلیه",
          <CogIcon className="w-4 h-4 tint-orange text-tint-fg" />,
          filters.vehicleReasons,
          "tint-orange bg-tint-strong text-tint-fg",
        )}

        {/* Vehicle Filters */}
        {renderFilterSection(
          "🚗 سیستم وسیله نقلیه",
          <CarIcon className="w-4 h-4 tint-teal text-tint-fg" />,
          filters.vehicleSystem,
          "tint-teal bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "⚠️ وضعیت خرابی وسیله",
          <CarIcon className="w-4 h-4 text-danger-fg" />,
          filters.vehicleFaultStatus,
          "bg-danger-soft text-danger-fg",
        )}

        {renderFilterSection(
          "🎨 رنگ وسیله نقلیه",
          <CarIcon className="w-4 h-4 tint-violet text-tint-fg" />,
          filters.vehicleColor,
          "tint-violet bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "🛡️ شرکت بیمه",
          <ShieldIcon className="w-4 h-4 tint-cyan text-tint-fg" />,
          filters.vehicleInsuranceCo,
          "tint-cyan bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "🛡️ بیمه بدنه",
          <ShieldIcon className="w-4 h-4 tint-cyan text-tint-fg" />,
          filters.vehicleBodyInsuranceCo,
          "tint-cyan bg-tint-soft text-tint-fg",
        )}

        {renderFilterSection(
          "🔢 نوع پلاک",
          <FilterIcon className="w-4 h-4 text-fg-faint" />,
          filters.vehiclePlaqueType,
          "bg-surface-sunken text-fg",
        )}

        {renderFilterSection(
          "🚗 کاربری پلاک",
          <FilterIcon className="w-4 h-4 text-fg-faint" />,
          filters.vehiclePlaqueUsage,
          "bg-canvas text-fg-muted",
        )}

        {renderFilterSection(
          "➡️ جهت حرکت",
          <CarIcon className="w-4 h-4 tint-emerald text-tint-fg" />,
          filters.vehicleMotionDirection,
          "tint-emerald bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "🔧 آسیب تجهیزات",
          <CarIcon className="w-4 h-4 tint-yellow text-tint-fg" />,
          filters.equipmentDamages,
          "tint-yellow bg-tint-soft text-tint-fg",
        )}

        {renderFilterSection(
          "🛠️ نوع تعمیر جاده",
          <RoadIcon className="w-4 h-4 text-warning-fg" />,
          filters.roadRepairType,
          "bg-warning-soft text-warning-fg",
        )}

        {/* Driver Filters */}
        {renderFilterSection(
          "👤 جنسیت راننده",
          <UserIcon className="w-4 h-4 tint-purple text-tint-fg" />,
          filters.driverSex,
          "tint-purple bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "📜 نوع گواهینامه راننده",
          <FilterIcon className="w-4 h-4 tint-indigo text-tint-fg" />,
          filters.driverLicenceType,
          "tint-indigo bg-tint-soft text-tint-fg",
        )}

        {renderFilterSection(
          "🏥 نوع مصدومیت راننده",
          <UserIcon className="w-4 h-4 tint-rose text-tint-fg" />,
          filters.driverInjuryType,
          "tint-rose bg-tint-strong text-tint-fg",
        )}

        {/* Road Infrastructure */}
        {renderFilterSection(
          "🛤️ وضعیت شانه",
          <RoadIcon className="w-4 h-4 text-fg-faint" />,
          filters.shoulderStatus,
          "bg-canvas text-fg-muted",
        )}

        {renderFilterSection(
          "🚦 منطقه ترافیکی",
          <FilterIcon className="w-4 h-4 tint-red text-tint-fg" />,
          filters.trafficZone,
          "bg-danger-soft text-danger-fg",
        )}

        {renderFilterSection(
          "🏙️ منطقه شهری",
          <HomeIcon className="w-4 h-4 tint-indigo text-tint-fg" />,
          filters.cityZone,
          "tint-indigo bg-tint-strong text-tint-fg",
        )}

        {renderFilterSection(
          "🌫️ منطقه آلودگی هوا",
          <HomeIcon className="w-4 h-4 tint-sky text-tint-fg" />,
          filters.airPollutionZone,
          "tint-sky bg-tint-strong text-tint-fg",
        )}

        {/* Casualty Count Ranges */}
        {renderCountRange(
          "☠️ تعداد فوتی",
          <SkullIcon className="w-4 h-4 text-fg" />,
          filters.deadCountMin,
          filters.deadCountMax,
          "bg-fg text-canvas",
        )}

        {renderCountRange(
          "🚑 تعداد مصدوم",
          <AmbulanceIcon className="w-4 h-4 tint-rose text-tint-fg" />,
          filters.injuredCountMin,
          filters.injuredCountMax,
          "tint-rose bg-tint-strong text-tint-fg",
        )}

        {/* Pagination Controls */}
        {filters.limit !== undefined && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-fg mb-2">
              <FilterIcon className="w-4 h-4 tint-indigo text-tint-fg" />
              <span>📊 تعداد نتایج</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              <span className="inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default tint-indigo bg-tint-strong text-tint-fg">
                {filters.limit}
              </span>
            </div>
          </div>
        )}

        {filters.skip !== undefined && (
          <div className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-fg mb-2">
              <FilterIcon className="w-4 h-4 tint-cyan text-tint-fg" />
              <span>⏭️ رد کردن نتایج</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              <span className="inline-block text-xs px-3 py-1 rounded-full font-medium transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default tint-cyan bg-tint-strong text-tint-fg">
                {filters.skip}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-brand-border">
        <div className="flex items-center justify-between text-sm text-fg-muted">
          <span className="font-medium">تعداد فیلترهای فعال:</span>
          <span className="font-bold text-brand-fg bg-brand-soft px-2 py-1 rounded-full transition-all duration-200 hover:bg-brand-soft">
            {
              Object.entries(filters).filter(([, value]) => {
                if (value === undefined || value === null) return false;
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === "string") return value.trim() !== "";
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
