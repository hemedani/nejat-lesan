"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface ChartNavigationProps {
  currentSection?: string;
  currentChart?: string;
}

const ChartNavigation: React.FC<ChartNavigationProps> = ({
  currentSection,
  currentChart,
}) => {
  const pathname = usePathname();

  // Main navigation items
  const mainNavigation: NavigationItem[] = [
    {
      id: "charts",
      label: "نمودارها",
      href: "/charts",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
    {
      id: "maps",
      label: "نقشه‌ها",
      href: "/maps",
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 4v10a1 1 0 00.293.707L6 18.414V5.586L3.707 3.293zM17.707 5.293L14 1.586v12.828l2.293 2.293A1 1 0 0018 16V6a1 1 0 00-.293-.707z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ];

  // Chart section navigation
  const chartSections: NavigationItem[] = [
    { id: "overall", label: "دید کلی", href: "/charts/overall" },
    { id: "temporal", label: "مقایسه زمانی", href: "/charts/temporal" },
    { id: "spatial", label: "مقایسه مکانی", href: "/charts/spatial" },
    { id: "trend", label: "روند رویداد", href: "/charts/trend" },
  ];

  // Chart-specific navigation for each section
  const getChartNavigation = (section: string): NavigationItem[] => {
    switch (section) {
      case "overall":
        return [
          {
            id: "road-defects",
            label: "نقص راه",
            href: "/charts/overall/road-defects",
          },
          {
            id: "monthly-holiday",
            label: "تحلیل ماهانه تعطیلات",
            href: "/charts/overall/monthly-holiday",
          },
          {
            id: "hourly-day-of-week",
            label: "تحلیل ساعتی روز هفته",
            href: "/charts/overall/hourly-day-of-week",
          },
          {
            id: "collision-analytics",
            label: "تحلیل انواع برخورد",
            href: "/charts/overall/collision-analytics",
          },
          {
            id: "accident-severity",
            label: "سهم شدت تصادفات",
            href: "/charts/overall/accident-severity",
          },
          {
            id: "area-usage-analytics",
            label: "سهم تصادفات به تفکیک کاربری محل",
            href: "/charts/overall/area-usage-analytics",
          },
          {
            id: "total-reason-analytics",
            label: "علل تامه تصادفات",
            href: "/charts/overall/total-reason-analytics",
          },
          {
            id: "human-reason-analytics",
            label: "عوامل انسانی مؤثر",
            href: "/charts/overall/human-reason-analytics",
          },
          {
            id: "vehicle-reason-analytics",
            label: "توزیع عامل وسیله نقلیه",
            href: "/charts/overall/vehicle-reason-analytics",
          },
          {
            id: "company-performance-analytics",
            label: "مقایسه عملکرد کمپانیهای سازنده خودرو",
            href: "/charts/overall/company-performance-analytics",
          },
        ];
      case "temporal":
        return [
          {
            id: "count-analytics",
            label: "شمار تصادفات",
            href: "/charts/temporal/count-analytics",
          },
          {
            id: "severity-analytics",
            label: "سهم تصادفات فوتی از شدید",
            href: "/charts/temporal/severity-analytics",
          },
          {
            id: "night-analytics",
            label: "تصادفات در شب",
            href: "/charts/temporal/night-analytics",
          },
          {
            id: "damage-analytics",
            label: "مقایسه زمانی صدمات",
            href: "/charts/temporal/damage-analytics",
          },
          {
            id: "collision-analytics",
            label: "نحوه و نوع برخورد",
            href: "/charts/temporal/collision-analytics",
          },
          {
            id: "total-reason-analytics",
            label: "علت تامه",
            href: "/charts/temporal/total-reason-analytics",
          },
          {
            id: "unlicensed-drivers-analytics",
            label: "کاربران فاقد گواهینامه",
            href: "/charts/temporal/unlicensed-drivers-analytics",
          },
        ];
      case "spatial":
        return [
          {
            id: "regional",
            label: "تحلیل منطقه‌ای",
            href: "/charts/spatial/regional",
          },
          {
            id: "hotspots",
            label: "نقاط داغ",
            href: "/charts/spatial/hotspots",
          },
          {
            id: "severity-analytics",
            label: "سهم شدت تصادفات",
            href: "/charts/spatial/severity-analytics",
          },
          {
            id: "light-analytics",
            label: "وضعیت روشنایی",
            href: "/charts/spatial/light-analytics",
          },
          {
            id: "collision-analytics",
            label: "نحوه و نوع برخورد",
            href: "/charts/spatial/collision-analytics",
          },
          {
            id: "single-vehicle-analytics",
            label: "تصادفات تک وسیله ای",
            href: "/charts/spatial/single-vehicle-analytics",
          },
        ];
      case "trend":
        return [
          {
            id: "monthly-trend",
            label: "روند ماهانه",
            href: "/charts/trend/monthly-trend",
          },
          {
            id: "yearly-trend",
            label: "روند سالانه",
            href: "/charts/trend/yearly-trend",
          },
        ];
      default:
        return [];
    }
  };

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const breadcrumbs = [{ label: "داشبورد", href: "/" }];

    if (pathname.includes("/charts")) {
      breadcrumbs.push({ label: "نمودارها", href: "/charts" });

      if (currentSection) {
        const sectionLabel =
          chartSections.find((s) => s.id === currentSection)?.label ||
          currentSection;
        breadcrumbs.push({
          label: sectionLabel,
          href: `/charts/${currentSection}`,
        });

        if (currentChart) {
          const chartLabel =
            getChartNavigation(currentSection).find(
              (c) => c.id === currentChart,
            )?.label || currentChart;
          breadcrumbs.push({
            label: chartLabel,
            href: `/charts/${currentSection}/${currentChart}`,
          });
        }
      }
    } else if (pathname.includes("/maps")) {
      breadcrumbs.push({ label: "نقشه‌ها", href: "/maps" });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const chartNavigation = currentSection
    ? getChartNavigation(currentSection)
    : [];

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Breadcrumbs */}
      <div className="px-6 py-3 border-b border-gray-100">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 space-x-reverse">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="w-5 h-5 text-gray-400 mx-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-sm font-medium text-gray-500">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Main Tab Navigation */}
      <div className="px-6">
        <nav className="flex space-x-8 space-x-reverse">
          {mainNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Chart Section Navigation */}
      {pathname.includes("/charts") && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <nav className="flex space-x-6 space-x-reverse">
            {chartSections.map((section) => {
              const isActive = pathname.startsWith(section.href);
              return (
                <Link
                  key={section.id}
                  href={section.href}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {section.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Chart-specific Navigation */}
      {currentSection && chartNavigation.length > 0 && (
        <div className="px-6 py-3 bg-gray-25 border-t border-gray-100">
          <nav className="flex space-x-4 space-x-reverse">
            <span className="text-sm font-medium text-gray-700 py-2">
              نمودارها:
            </span>
            {chartNavigation.map((chart) => {
              const isActive = pathname === chart.href;
              return (
                <Link
                  key={chart.id}
                  href={chart.href}
                  className={`py-2 px-3 rounded-md text-sm transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {chart.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
};

export default ChartNavigation;
