/**
 * Every `/employee` URL, in one place.
 *
 * The third panel whose components take a route base: `MyReportsView` hands
 * `detailBase` to the shared `ReportList`, and it used a string literal. Three
 * panels, three modules — one per panel — rather than a single module with a
 * `base` parameter, because a parameter invites the caller to pass the wrong one
 * and nothing would catch it.
 *
 * Pure and React-free so the test harness can transpile it standalone.
 */
export const employeeRoutes = {
  dashboard: () => "/employee",
  warehouse: () => "/employee/warehouse",
  reports: () => "/employee/reports",
  report: (reportId: string) => `/employee/reports/${reportId}`,
  map: () => "/employee/map",
  announcements: () => "/employee/announcements",
} as const;