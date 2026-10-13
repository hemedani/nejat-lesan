/**
 * Every `/admin` URL that a **component** constructs.
 *
 * `orgRoutes` owns the `/orghead` panel. This owns the admin panel's
 * model-detail routes — `/admin/org/[orgId]` and `/admin/road/[roadId]` — which
 * are the admin panel's *record pages*, not panel scopes.
 *
 * Why a builder rather than a literal: `panel-routing-test.py`'s R6 greps
 * `src/components` for hand-built panel URLs, and a `/admin/org/${id}` template
 * literal is indistinguishable from the old `/org/${id}` defect that made a
 * second, differently-chromed org UI. Routing every panel URL through one
 * module means a route rename is a one-line change and a stale URL is a compile
 * error rather than a 404 nobody notices until someone clicks it.
 *
 * Sidebar hrefs stay in `adminSidebarConfig.ts`; R1 proves those resolve.
 *
 * Pure and React-free so the test harness can transpile it standalone.
 */
export const adminRecordRoutes = {
  orgs: () => "/admin/org",
  orgNew: () => "/admin/org/new",
  org: (orgId: string) => `/admin/org/${orgId}`,

  roads: () => "/admin/road",
  roadNew: () => "/admin/road/new",
  road: (roadId: string) => `/admin/road/${roadId}`,
} as const;
