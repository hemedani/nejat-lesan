/**
 * Every `/orghead` URL, in one place.
 *
 * The org surface used to exist twice: `/orghead` and the legacy
 * `/org/[orgId]/*` workspace. Twelve shared components hardcoded
 * `/org/${orgId}/…`, so clicking anything inside the panel navigated the user
 * *out* of it into a differently-chromed second UI — and the six detail routes
 * that only existed under `/orghead` were unreachable, because their legacy
 * twins were the wired-up ones.
 *
 * Nothing may construct an org URL by hand. Call the builder.
 * `.workbuddy-ai/tools/panel-routing-test.py` greps `src/components` for
 * `/org/${`, `detailBase="/` and `backHref="/` so this cannot regress.
 *
 * Scope: these builders cover the URLs **components** construct. Sidebar hrefs are
 * owned by `PANEL_NAV`, and `/orghead/reports` exists in the nav rather than as a
 * builder for exactly that reason — R1 already proves every nav href resolves.
 * A builder nothing calls would be dead code, so there are none.
 *
 * Pure and React-free so the test harness can transpile it standalone.
 */
export const orgRoutes = {
  dashboard: () => "/orghead",
  orgChart: () => "/orghead/org-chart",
  units: () => "/orghead/units",
  unitNew: () => "/orghead/units/new",
  unit: (unitId: string) => `/orghead/units/${unitId}`,
  people: () => "/orghead/people",
  personNew: () => "/orghead/people/add",
  person: (userId: string) => `/orghead/people/${userId}`,
  processes: () => "/orghead/processes",
  processNew: () => "/orghead/processes/new",
  process: (processId: string) => `/orghead/processes/${processId}`,
  reports: () => "/orghead/reports",
  warehouse: () => "/orghead/warehouse",
} as const;