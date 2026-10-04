/**
 * Every `/unit-head` URL, in one place. The mirror of `utils/org-routes.ts`.
 *
 * `/unit-head` renders two of the same components as `/orghead`
 * (`OrgChartView`, `OrgReportsView`, `OrgIncidentDetailView`) from a different
 * base. Those components take the base as a **required** prop fed by one of the
 * `*-routes` modules — never a defaulted literal, because a defaulted literal is
 * exactly how `/orghead` ended up pointing at `/org`.
 *
 * Scope: the URLs **components** construct. `/unit-head/org-chart` and the
 * reports detail live in `PANEL_NAV` rather than here — R1 proves those resolve.
 *
 * Pure and React-free so the test harness can transpile it standalone.
 */
export const unitHeadRoutes = {
  dashboard: () => "/unit-head",
  members: () => "/unit-head/members",
  reports: () => "/unit-head/reports",
  warehouse: () => "/unit-head/warehouse",
} as const;