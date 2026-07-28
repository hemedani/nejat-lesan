"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { NavigationItem, isChartAccessible, getSectionCharts } from "@/utils/chartNavigation";

interface ChartNavigationProps {
  currentSection?: string;
  currentChart?: string;
}

const ChartNavigation: React.FC<ChartNavigationProps> = ({ currentSection, currentChart }) => {
  const pathname = usePathname();
  const { userLevel, enterpriseSettings } = useAuth();

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

  // Chart-specific navigation for each section, filtered by enterprise permissions
  const getChartNavigation = (section: string): NavigationItem[] => {
    const charts = getSectionCharts(section);
    if (userLevel === "Enterprise" && enterpriseSettings?.availableCharts) {
      return charts.filter((chart) => isChartAccessible(chart.id, userLevel, enterpriseSettings));
    }
    return charts;
  };

  // Chart section navigation - filtered based on enterprise permissions
  const chartSections: NavigationItem[] = [
    { id: "overall", label: "دید کلی", href: "/charts/overall" },
    { id: "temporal", label: "مقایسه زمانی", href: "/charts/temporal" },
    { id: "spatial", label: "مقایسه مکانی", href: "/charts/spatial" },
    { id: "trend", label: "روند رویداد", href: "/charts/trend" },
  ].filter((section) => {
    // For enterprise users, only show sections if they have access to at least one chart within that section
    if (userLevel === "Enterprise" && enterpriseSettings?.availableCharts) {
      const sectionCharts = getChartNavigation(section.id);
      return sectionCharts.some((chart) => isChartAccessible(chart.id, userLevel, enterpriseSettings));
    }
    return true;
  });

  // Map section navigation
  const mapSections: NavigationItem[] = [
    { id: "accidents", label: "نقشه تصادفات", href: "/maps/accidents" },
    // { id: "heatmap", label: "نقشه حرارتی", href: "/maps/heatmap" },
    // { id: "clusters", label: "تحلیل خوشه‌ای", href: "/maps/clusters" },
    // { id: "regional", label: "تحلیل منطقه‌ای", href: "/maps/regional" },
    { id: "comparison", label: "مقایسه نقشه‌ها", href: "/maps/comparison" },
  ];

  // Generate breadcrumbs
  const generateBreadcrumbs = () => {
    const breadcrumbs = [{ label: "داشبورد", href: "/" }];

    if (pathname.includes("/charts")) {
      breadcrumbs.push({ label: "نمودارها", href: "/charts" });

      if (currentSection) {
        const sectionLabel =
          chartSections.find((s) => s.id === currentSection)?.label || currentSection;
        breadcrumbs.push({
          label: sectionLabel,
          href: `/charts/${currentSection}`,
        });

        if (currentChart) {
          // Check if the current chart is accessible
          const isCurrentChartAccessible = isChartAccessible(currentChart, userLevel, enterpriseSettings);

          if (isCurrentChartAccessible) {
            const chartLabel =
              getChartNavigation(currentSection).find((c) => c.id === currentChart)?.label ||
              currentChart;
            breadcrumbs.push({
              label: chartLabel,
              href: `/charts/${currentSection}/${currentChart}`,
            });
          } else {
            // If the chart is not accessible, redirect or show an error
            // For now, we'll just not add the chart to breadcrumbs
          }
        }
      }
    } else if (pathname.includes("/maps")) {
      breadcrumbs.push({ label: "نقشه‌ها", href: "/maps" });

      // Extract current map section from pathname
      const mapSection = pathname.split("/maps/")[1]?.split("/")[0];
      if (mapSection) {
        const sectionLabel = mapSections.find((s) => s.id === mapSection)?.label || mapSection;
        breadcrumbs.push({
          label: sectionLabel,
          href: `/maps/${mapSection}`,
        });
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();
  const chartNavigation = currentSection ? getChartNavigation(currentSection) : [];

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Breadcrumbs */}
      <div className="px-6 py-3 border-b border-gray-100">
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 space-x-reverse">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <svg className="w-5 h-5 text-gray-400 mx-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {index === breadcrumbs.length - 1 ? (
                  <span className="text-sm font-medium text-gray-500">{crumb.label}</span>
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
          {mainNavigation
            .filter((item) => {
              // For enterprise users, only show charts tab if they have access to at least one chart
              if (
                item.id === "charts" &&
                userLevel === "Enterprise" &&
                enterpriseSettings?.availableCharts
              ) {
                // Check if there's at least one accessible chart across all sections
                const allSections = ["overall", "temporal", "spatial", "trend"];
                return allSections.some((section) => {
                  const sectionCharts = getChartNavigation(section);
                  return sectionCharts.length > 0; // If any charts are accessible in this section
                });
              }
              return true;
            })
            .map((item) => {
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

      {/* Map Section Navigation */}
      {pathname.includes("/maps") && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <nav className="flex space-x-6 space-x-reverse">
            {mapSections.map((section) => {
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
      {pathname.includes("/charts") && currentSection && chartNavigation.length > 0 && (
        <div className="px-6 py-3 bg-gray-25 border-t border-gray-100">
          <nav className="flex space-x-4 space-x-reverse">
            <span className="text-sm font-medium text-gray-700 py-2">نمودارها:</span>
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
