export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export interface EnterpriseSettings {
  availableCharts?: {
    [key: string]: {
      [filter: string]: boolean;
    };
  };
}

// Mapping from navigation IDs to enterprise permission keys
const navigationIdToPermissionKey: Record<string, string> = {
  "road-defects": "roadDefectsAnalytics",
  "accident-severity": "accidentSeverityAnalytics",
  "collision-analytics": "collisionAnalytics",
  "area-usage-analytics": "areaUsageAnalytics",
  "human-reason-analytics": "humanReasonAnalytics",
  "vehicle-reason-analytics": "vehicleReasonAnalytics",
  "total-reason-analytics": "totalReasonAnalytics",
  "monthly-holiday": "monthlyHolidayAnalytics",
  "hourly-day-of-week": "hourlyDayOfWeekAnalytics",
  "count-analytics": "temporalCountAnalytics",
  "severity-analytics-temporal": "temporalSeverityAnalytics",
  "night-analytics": "temporalNightAnalytics",
  "collision-analytics-temporal": "temporalCollisionAnalytics",
  "total-reason-analytics-temporal": "temporalTotalReasonAnalytics",
  "unlicensed-drivers-analytics": "temporalUnlicensedDriversAnalytics",
  "severity-analytics-spatial": "spatialSeverityAnalytics",
  "light-analytics": "spatialLightAnalytics",
  "collision-analytics-spatial": "spatialCollisionAnalytics",
  "severity-analytics-trend": "eventSeverityAnalytics",
  "collision-analytics-trend": "eventCollisionAnalytics",
  "total-reason-analytics-overall": "totalReasonAnalytics",
};

export function isChartAccessible(
  chartId: string,
  userLevel?: string | null,
  enterpriseSettings?: EnterpriseSettings | null,
): boolean {
  if (userLevel !== "Enterprise" || !enterpriseSettings?.availableCharts) {
    return true;
  }
  const permissionKey = navigationIdToPermissionKey[chartId] || chartId;
  return !!enterpriseSettings.availableCharts?.[permissionKey];
}

export function getSectionCharts(section: string): NavigationItem[] {
  switch (section) {
    case "overall":
      return [
        { id: "road-defects", label: "نقص راه", href: "/charts/overall/road-defects" },
        { id: "monthly-holiday", label: "تحلیل ماهانه تعطیلات", href: "/charts/overall/monthly-holiday" },
        { id: "hourly-day-of-week", label: "تحلیل ساعتی روز هفته", href: "/charts/overall/hourly-day-of-week" },
        { id: "collision-analytics", label: "تحلیل انواع برخورد", href: "/charts/overall/collision-analytics" },
        { id: "accident-severity", label: "سهم شدت تصادفات", href: "/charts/overall/accident-severity" },
        { id: "area-usage-analytics", label: "سهم تصادفات به تفکیک کاربری محل", href: "/charts/overall/area-usage-analytics" },
        { id: "total-reason-analytics-overall", label: "علل تامه تصادفات", href: "/charts/overall/total-reason-analytics" },
        { id: "human-reason-analytics", label: "عوامل انسانی مؤثر", href: "/charts/overall/human-reason-analytics" },
        { id: "vehicle-reason-analytics", label: "توزیع عامل وسیله نقلیه", href: "/charts/overall/vehicle-reason-analytics" },
      ];
    case "temporal":
      return [
        { id: "count-analytics", label: "شمار تصادفات", href: "/charts/temporal/count-analytics" },
        { id: "severity-analytics-temporal", label: "سهم تصادفات فوتی از شدید", href: "/charts/temporal/severity-analytics" },
        { id: "night-analytics", label: "تصادفات در شب", href: "/charts/temporal/night-analytics" },
        { id: "collision-analytics-temporal", label: "نحوه و نوع برخورد", href: "/charts/temporal/collision-analytics" },
        { id: "total-reason-analytics-temporal", label: "علت تامه", href: "/charts/temporal/total-reason-analytics" },
        { id: "unlicensed-drivers-analytics", label: "کاربران فاقد گواهینامه", href: "/charts/temporal/unlicensed-drivers-analytics" },
      ];
    case "spatial":
      return [
        { id: "severity-analytics-spatial", label: "سهم شدت تصادفات", href: "/charts/spatial/severity-analytics" },
        { id: "light-analytics", label: "وضعیت روشنایی", href: "/charts/spatial/light-analytics" },
        { id: "collision-analytics-spatial", label: "نحوه و نوع برخورد", href: "/charts/spatial/collision-analytics" },
      ];
    case "trend":
      return [
        { id: "severity-analytics-trend", label: "سهم شدت تصادفات", href: "/charts/trend/severity-analytics" },
        { id: "collision-analytics-trend", label: "نحوه و نوع برخورد", href: "/charts/trend/collision-analytics" },
      ];
    default:
      return [];
  }
}
