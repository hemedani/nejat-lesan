# Panel Unification — Design

**Date**: 2026-10-04
**Status**: approved
**Scope**: `front/src/app/{admin,orghead,unit-head,employee,patrol,patrol-manager,forms,user,charts,maps,org}/**`, `front/src/utils/**`, `front/src/components/{system,org,organisms,patrol,navigation}/**`

---

## 1. Problem

The panel layer has **one correct abstraction** and **three parallel systems that bypass it**.

The correct abstraction is a five-layer chain, built for exactly this purpose and documented in
`front/AGENTS.md`:

```
PANEL_DEFINITIONS → PANEL_NAV → PanelGuard → PanelScopeProvider → PanelShell → ScopedView
```

The three systems that bypass it:

| System | Where | Bypasses |
| --- | --- | --- |
| Legacy org workspace | `/org/[orgId]/*` (15 routes) + `OrgWorkspace` | `PANEL_NAV`, `PanelShell`, `PanelScopeProvider` |
| Admin sidebar | `components/organisms/adminSidebarConfig.ts` | `PANEL_NAV` entirely (own nav config, **no module-gate field**) |
| Chart/map routes | `/charts/**`, `/maps/**`, `/graph`, `/map` | `PanelGuard` entirely (**no auth gate at all**) |

### 1.1 The load-bearing failure: `/org/[orgId]/*` steals navigation

Every one of the twelve shared org components hardcodes `/org/${orgId}/…` inside its own links
and redirects — 43 template literals across 13 files:

| File | Occurrences |
| --- | --- |
| `components/org/OrgDashboardView.tsx` | 9 |
| `components/org/ProcessBuilder.tsx` | 4 |
| `components/org/UnitListView.tsx` | 3 |
| `components/org/ProcessListView.tsx` | 3 |
| `components/org/OrgChartView.tsx` | 3 |
| `components/org/UnitDetailView.tsx` | 2 |
| `components/org/UnitCreateView.tsx` | 2 |
| `components/org/PeopleListView.tsx` | 2 |
| `components/org/PeopleAddView.tsx` | 2 |
| `components/org/PeopleDetailView.tsx` | 1 |
| `components/org/OrgReportsView.tsx` | 1 (the `detailBase` default) |
| `components/org/OrgIncidentDetailView.tsx` | 1 (the `backHref` default) |
| `components/org/OrgIndexView.tsx` | 1 (`/admin/org` push target) |

Consequences, all user-visible:

1. **Navigation escapes the panel.** From `/orghead/people`, clicking a member navigates to
   `/org/<orgId>/people/<id>`. The user lands in a second, differently-chromed org UI with a
   different sidebar (`OrgWorkspace`'s bespoke `links[]`) and no panel scope.
2. **Six `/orghead` routes are unreachable**, because their `/org/[orgId]` twins are the ones
   wired up: `units/new`, `units/[unitId]`, `people/add`, `people/[userId]`, `processes/new`,
   `processes/[processId]`.
3. **The back button on `/orghead/reports/[reportId]` exits the panel.** The page passes no
   `backHref`, so `OrgIncidentDetailView.tsx:70` falls back to `` `/org/${orgId}/reports` ``.
   (`/unit-head/reports/[reportId]` passes it correctly — the inconsistency is the tell.)
4. **Two warehouse implementations.** `/org/[orgId]/inventory` renders `InventoryClient` (344
   lines); the three role panels render `WarehouseWorkspace`. Same five tabs, same six actions.
   `InventoryClient` has exactly one consumer.
5. **The whole legacy shell is gated on `incident_patrol`** (`OrgWorkspace.tsx:41-50`), so an org
   with patrol off cannot browse its own people or units — a gate the panels do not apply.
6. **`/org` admits UnitHead** (`isOrgLeader`), letting a unit head into a whole-org workspace.

### 1.2 `/forms` is gated in the sidebar but not at the route

`FormAuthorGuard` checks *role* only. Both nav entries check *role **and** `requiredModule:
"forms"`*. Three consequences:

- An Editor, Enterprise or Patrol user who types `/forms` gets a **silent redirect** to their
  default panel, with no explanation.
- An author whose org has `forms` **off** still gets the working editor by deep link, because the
  route never consults the module. The nav hides it; the URL serves it.
- When the module is off, the nav section disappears entirely (`filterPanelSections` drops empty
  sections, `panel-nav.ts:259`), so a user who knows the feature exists sees **no trace** of it
  and no pointer to `/admin/modules`.

Also: `ModuleGate.MODULE_NOTICES` has entries for `charts`, `incident_patrol`, `warehouse` but
**not `forms`**, so any `ModuleGate module="forms"` falls back to a generic string.

And `MODULE_KEYS` is **duplicated verbatim** in `components/orghead/OrgSettingsView.tsx:14` and
`components/system/ModuleConfigClient.tsx:19`, despite `front/AGENTS.md` placing it in
`utils/org.ts`. There is no `moduleKeyFor` anywhere in `front/` — the doc describes a function
that only exists on the backend (`back/src/app_modules/moduleConfig.ts:126`).

### 1.3 `/user` — the profile panel is fabricated

`PanelId` `"profile"` is registered (`panels.ts:120`) and it is the `getDefaultPanel` fallback for
any unmatched viewer. The route is 324 lines containing:

- a hardcoded name `احمد محمدی` and `ahmad.mohammadi@example.com`,
- a hardcoded role `کاربر عادی`, department `پلیس راهور`, join date, last login,
- four fabricated usage statistics (`reportsViewed: 156`, `timeSpent: "۱۲۳ ساعت"`),
- three fabricated activity entries.

It reads only `hasModule("charts")` from `useAuth()` and **ignores `userData` entirely**. It has
no `PanelGuard`, no layout, no `PanelShell`, and `PROFILE_NAV.sections` is `[]`. Its quick-access
cards link to `/admin` — which redirects an unauthorized user straight back out.

An authenticated user landing here is shown invented data about themselves.

### 1.4 Orphans and gaps

**Fully-built features with no link anywhere:**

| Route | Lines | Backend act |
| --- | --- | --- |
| `/charts/spatial/safety-index` | 707 | `spatialSafetyIndexAnalytics` |
| `/charts/overall/company-performance-analytics` | 962 | `companyPerformanceAnalytics` |
| `/charts/spatial/single-vehicle-analytics` | 621 | `spatialSingleVehicleAnalytics` |
| `/charts/temporal/damage-analytics` | 559 | `temporalDamageAnalytics` |

`spatialSafetyIndexAnalytics` is named as a flagship in `front/AGENTS.md`. For damage-analytics,
`app/charts/temporal/page.tsx:48-60` even defines a card for it that never renders, because the
page uses `getSectionCharts("temporal")` instead — dead metadata proving the omission was a bug,
not a decision.

**Dead routes:**

| Route | Reason |
| --- | --- |
| `/graph` | 100% `Math.random()` mock; its own footer says the data is sample-only |
| `/map` | Superseded by `/maps/accidents` (uses `mapAccidents` + zone GeoJSON + `ChartNavigation`) |
| `/test-upload` | Dev scratch page, no guard, no nav, no inbound reference |
| `/chatbot` | `ComingSoonPage` counting down to `2025-09-01` — already past, timer frozen at `00 00 00 00` |
| `/charts/spatial/hotspots` | `در حال توسعه` stub |
| `/charts/spatial/regional` | `در حال تvelop` stub (typo) |
| `/charts/trend/monthly-trend` | `در حال توسعه` stub |
| `/charts/trend/yearly-trend` | `در حال توسعه` stub |
| `/maps/heatmap`, `/maps/clusters`, `/maps/regional` | `در حال توسعه` stubs; nav entries commented out at `ChartNavigation.tsx:73-75` |

**`/charts`, `/maps`, `/graph` have no authentication guard.** `ModuleGate` only consults the
module feed, and `AuthContext.hasModule` returns `true` when `modulesKnown === false`
(`AuthContext.tsx:173`). An anonymous visitor reaches `/charts/overall`.

**`ware` cannot be created.** `app/actions/ware/` contains only `gets.ts` — no `add`, no
`update`, no `remove`, no page, no admin sidebar entry. The warehouse domain is permanently empty
and cannot be filled from the UI. `front/AGENTS.md` frames this as "empty panels may just be empty
collections"; the actual cause is that there is no way to create one.

**Manager can read announcements but has no link.** `announcement.gets` permits
`["Manager","Patrol"]`, but the only nav entry (`/employee/announcements`) sits inside
EMPLOYEE_NAV's `گشت و رخدادها` section, which is `allowedLevels: ["Patrol"]`.

**`/patrol/reports/[id]` and `/employee/reports/[reportId]` are near-verbatim duplicates** — same
`useParams`, same two parallel fetches, same projections, same `ReportDetail manager={false}`.

### 1.5 A backend bug that makes an org panel non-functional

`/orghead/reports` **lists** correctly: `OrgReportsView` → `getOversightList` →
`resolveOversightScope` → `getOrgReportBase`, which explicitly handles org leaders.

`/orghead/reports/[reportId]` and `/unit-head/reports/[reportId]` **always fail** for org leaders.
`OrgIncidentDetailView` fetches `accident.getReportReviewHistory`, whose fn calls `getReportScope`
— and that function **throws** for anything that is not Patrol/Manager/Ghost
(`back/src/accident/reportScope.ts:97`):

```ts
throw new Error("شما اجازه مشاهده گزارش‌ها را ندارید");
```

`incident_report/reviewHistory/reviewHistory.fn.ts:20` has the same defect. The frontend wraps both
fetches in `Promise.all`, so the rejection surfaces as a red error box on a page the org head
reached by legitimate navigation. `oversight/filters.ts:15-28` documents the correct helper and why
it exists; the review-history fns simply never adopted it.

---

## 2. Goals

| # | Goal | Measured by |
| --- | --- | --- |
| G1 | One org surface: `/orghead` | `find src/app/org -name page.tsx` returns exactly 1 (the forwarder) |
| G2 | No component hardcodes a panel URL | `rg '/org/\$\{' src/components` returns 0 |
| G3 | Every route reachable from its own panel's nav | new assertion in `panel-routing-test.py` |
| G4 | Nav gate and route gate agree, per feature | `/forms` off → nav hidden **and** route refused, with a reason |
| G5 | No authenticated surface shows fabricated data | `/user` reads `userData` only |
| G6 | Every route group requires authentication | `/charts`, `/maps` gated |
| G7 | Dead code removed | 15 routes + 2 duplicate components deleted |

## 3. Non-goals

- **No web form runner.** `getForPatrol` exists as a server action with zero callers; nothing in the
  browser can *fill* a form. That is a feature, not a panel defect. Deferred (F1).
- **No dark-theme unification.** `front/docs/superpowers/specs/2026-10-04-dark-theme-unification-design.md`
  is written and unstarted: 4 phases, a `@theme` token layer, 93 dependent files. Separate project.
- **No change to `getDefaultPanel` order or `PANEL_DEFINITIONS` access rules.** They are correct and
  covered by 48 passing assertions.
- **No change to `/admin` CRUD pages or their sidebar contents.**
- **No backend code changes in this project.** See §8 for the prompt that hands them off.

---

## 4. Architecture

```
                     ┌─────────────────────────────────────────────┐
   auth ────────────►│ PanelGuard  (PanelId → canAccessPanel)      │
                     └──────────────────┬──────────────────────────┘
                                        ▼
                     ┌─────────────────────────────────────────────┐
                     │ PanelScopeProvider  (roles[] → orgId/unitId)│
                     │   sessionStorage: lesan_panel_scope        │
                     └──────────────────┬──────────────────────────┘
                                        ▼
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
  PanelShell                     FormAuthorHeader              ChartNavigation
  PANEL_NAV[panel]               + ModuleGate "forms"          + ModuleGate "charts"
  + ScopePicker                  + AuthGate                    + AuthGate
        │                               │                               │
        └───────────────┬───────────────┴───────────────────────────────┘
                        ▼
                    ScopedView ──► page
```

**The single invariant this project enforces:**

> No component constructs a panel URL. Every link is either a `PANEL_NAV` href or a value from a
> route-builder module (`utils/org-routes.ts`, `utils/unit-head-routes.ts`).

That invariant is what makes the §1.1 bug class non-recurring. It is enforced by a grep in the
verification step, not by convention.

### 4.1 New module: `src/utils/org-routes.ts`

```ts
export const orgRoutes = {
  dashboard:  () => "/orghead",
  orgChart:   () => "/orghead/org-chart",
  units:      () => "/orghead/units",
  unitNew:    () => "/orghead/units/new",
  unit:       (unitId: string) => `/orghead/units/${unitId}`,
  people:     () => "/orghead/people",
  personNew:  () => "/orghead/people/add",
  person:     (userId: string) => `/orghead/people/${userId}`,
  processes:  () => "/orghead/processes",
  processNew: () => "/orghead/processes/new",
  process:    (processId: string) => `/orghead/processes/${processId}`,
  reports:    () => "/orghead/reports",
  report:     (reportId: string) => `/orghead/reports/${reportId}`,
  settings:   () => "/orghead/settings",
  warehouse:  () => "/orghead/warehouse",
} as const;
```

Pure, no React, `import type`-free. Transpilable by the existing `panel-routing-test.py` harness
alongside `panels.ts` and `panel-nav.ts`.

### 4.2 New module: `src/utils/unit-head-routes.ts`

`/unit-head` hosts two routes `/orghead` does not, and reuses two components with a different base.
Rather than reintroduce a `basePath` prop — the mechanism that let the bug hide — the two route
sets are separate modules and the shared components take a **required** route value:

```ts
export const unitHeadRoutes = {
  dashboard:  () => "/unit-head",
  members:    () => "/unit-head/members",
  orgChart:   () => "/unit-head/org-chart",
  reports:    () => "/unit-head/reports",
  report:     (reportId: string) => `/unit-head/reports/${reportId}`,
  warehouse:  () => "/unit-head/warehouse",
} as const;
```

### 4.3 Required instead of defaulted

`OrgReportsView`'s `detailBase?: string` and `OrgIncidentDetailView`'s `backHref?: string` become
**required**. They were introduced solely to override the hardcoded `/org/${orgId}` default, and
that default is exactly the bug. After this change a caller cannot reintroduce it.

`OrgIncidentDetailView`'s `orgId` prop is **removed**: after `backHref` becomes required, `orgId`
had exactly one use — the fallback at line 70.

---

## 5. Phases

### Phase 1 — route builders, repoint the shared components

Add the two route modules. Replace all 43 `/org/${…}` template literals in the twelve shared
components with builder calls. Make `detailBase` and `backHref` required and pass the builders at
the six call sites (three `OrgReportsView`, three `OrgIncidentDetailView`).

`OrgReportsView` also drops its now-dead URL construction but **keeps** `orgId` as a prop — it is
genuinely used for filter parsing and `getFormDefinitions`.

Nothing is deleted in this phase. It is behaviour-preserving apart from links no longer escaping.

### Phase 2 — delete the legacy workspace

Delete:

- `src/app/org/[orgId]/**` — 14 routes
- `src/app/org/layout.tsx`
- `src/components/org/OrgWorkspace.tsx` — 142 lines
- `src/components/org/OrgLanding.tsx` — 38 lines
- `src/components/org/inventory/InventoryClient.tsx` — 344 lines (`inventory/` becomes empty)

`src/app/org/page.tsx` is kept and reduced to a bare forwarder using `getDefaultPanel(viewer)` — it
stays as a bookmark-compatible entry point with no chrome of its own.

`OrgIndexView` (rendered by `/admin/org` via `AdminOrgPanel`) currently does
`router.push(\`/org/${org._id}\`)`. It becomes: `selectOrg(org._id)` from `usePanelScope()`, then
`router.push(orgRoutes.dashboard())`. This **preserves Ghost/Manager multi-organization browsing**
through the mechanism that already exists — `PanelScopeProvider`'s sessionStorage scope — instead of
through a parallel workspace. `AdminOrgPanel` also drops its own Ghost/Manager re-check, which
duplicates what `PanelGuard panel="admin"` already applied.

Net effect: the six currently-unreachable `/orghead` routes become reachable, and the org surface
has one chrome.

### Phase 3 — `/forms`: make the gate agree with itself

1. `FormAuthorGuard` gains `viewer.orgHasModule("forms")` alongside the role check, with the same
   super-bypass `PanelGuard` uses (`isSuperViewer` short-circuits before the module test). An
   Editor is redirected for the *stated* reason, not silently.
2. `utils/panel-nav.ts` gains a named export `formsNavSection()` so the ORGHEAD and UNIT_HEAD
   sections are one definition rather than two copies — the comment at `panel-nav.ts:71-73`
   explains why the gate matters and deserves one home.
3. `ModuleGate.MODULE_NOTICES` gains a `forms` entry naming the module and pointing at
   `/admin/modules`.
4. `MODULE_KEYS` moves to `utils/org.ts` beside `MODULE_LABELS`, exported once, `forms` **last**.
   Both consumers import it. The ordering constraint is load-bearing on the backend
   (`moduleKeyFor` returns on first match, `moduleConfig.ts:126-133`) and is recorded in a comment
   at the definition.

### Phase 4 — rebuild `/user`

Rewrite against `userData`. Sections:

- **حساب کاربری** — real `first_name`/`last_name`, `email`, `mobile`, `national_number`,
  `personnel_code`, `level` (via `LEVEL_LABELS`), account creation date.
- **نقش‌ها و محدوده** — real `roles[]`, each resolved to its org/unit name via
  `PanelScopeProvider`'s already-fetched `orgName`/`unitName`.
- **دسترسی‌ها** — real `modules` and `orgModules` from `useAuth()`, each of the four `ModuleKey`s
  shown with its `MODULE_LABELS` text and an on/off state.

The four fabricated statistics and three fabricated activities are **deleted outright**. There is no
backend source for them; inventing numbers on an authenticated surface is worse than an empty state.

Wrap the route in `PanelGuard panel="profile"` and give `PROFILE_NAV` the two content sections, so
the profile panel finally has a shell like every other panel.

### Phase 5 — orphans, dead routes, missing auth, missing links

**Wire up** the four built-but-orphan analytics in `utils/chartNavigation.ts::getSectionCharts()`:
`spatial/safety-index`, `spatial/single-vehicle-analytics`, `overall/company-performance-analytics`,
`temporal/damage-analytics`. Each needs an id, a Persian label and — where Enterprise
`availableCharts` applies — an entry in `navigationIdToPermissionKey`.

**Delete** `/graph`, `/map`, `/test-upload`, `/chatbot`, and the seven `در حال توسعه` stubs, plus
the three commented-out nav entries in `ChartNavigation.tsx:73-75`.

**Gate `/charts` and `/maps`.** Their layouts currently render only `ModuleGate`. Add an
authentication gate ahead of it so an anonymous visitor cannot reach a chart page. `/graph` is gone,
so `/graph/layout.tsx` goes with it.

**Add** `/employee/announcements` to `PATROL_MANAGER_NAV`, matching `announcement.gets`'s
`["Manager","Patrol"]`.

**Deduplicate** `/patrol/reports/[id]` and `/employee/reports/[reportId]` onto one shared component
under `components/patrol/`, parameterised by the level assertion.

### Phase 6 — org-leader report detail: hide the dead link (frontend only)

Backend changes are out of scope for this project, so the frontend stops sending org leaders into a
request the backend will reject:

- `OrgIncidentDetailView` fetches review history defensively — a failed history fetch yields an
  empty trail, not a failed page, so a future backend fix improves the surface without a frontend
  change.
- The oversight table's detail link is shown only when the viewer is Manager/Ghost; org leaders get
  the row's summary inline instead of a link that 403s. The condition comes from one exported
  predicate, not an inline level check.

The backend change that would make the link correct for everyone is specified in
`back/prompt/02-*.md` (§8) and is **not** performed here.

### Phase 7 — regression guard

Extend `.workbuddy-ai/tools/panel-routing-test.py`. Its `tsc` harness already transpiles
`panels.ts` + `panel-nav.ts`; `org-routes.ts` and `unit-head-routes.ts` are pure and drop into the
same harness. New assertions:

| # | Assertion | Catches |
| --- | --- | --- |
| R1 | every href in `PANEL_NAV` **and** `adminSidebarConfig` resolves to a real `page.tsx` on disk | dead links, typos |
| R2 | every `/orghead/*` and `/unit-head/*` route is reachable from its nav registry | the six current orphans |
| R3 | `orgRoutes.*()` outputs equal the matching `ORGHEAD_NAV` hrefs | link drift after a nav rename |
| R4 | `FormAuthorGuard` and the `/forms` nav entries agree on the module gate | §1.2 |
| R5 | `/charts` and `/maps` require authentication | §1.4 |
| R6 | `rg '/org/\$\{' src/components` returns nothing | G2, permanently |

R1 and R2 are filesystem checks, not runtime — they need no browser and no server.

---

## 6. Follow-ups (deliberately not in this project)

| # | Item | Why deferred |
| --- | --- | --- |
| F1 | Web form runner (`getForPatrol` has zero callers) | a feature, not a panel defect |
| F2 | Dark-theme unification | separate 4-phase spec, 93 files |
| F3 | `ware` create/edit UI | without it the warehouse stays empty; a feature, not a panel defect |
| F4 | `AdminNavGroup.requiredModule` (`adminSidebarConfig.ts:47-52` has no module field) | speculative until a gated admin group exists |
| F5 | `accident.get` has no `grantAccess` and no `preAct: [setUser]` (`back/src/accident/get/mod.ts`) | works by framework accident; a backend concern |
| F6 | Charts have no `PanelShell` — no sidebar, no scope picker | 33 routes; a larger consolidation than this project justifies |
| F7 | `docs/forms/04-backend-api.md` says 11 acts; 14 are registered | documentation drift |
| F8 | `.superpowers/sdd/…/final-package.md` claims `OrgAnalyticsPanel` was fixed; it was not — it still projects the removed `incident_type` (`docs/forms/08` §9 is the accurate doc) | documentation drift |

## 7. Files touched

| Path | Change | Phase |
| --- | --- | --- |
| `src/utils/org-routes.ts` | **new** | 1 |
| `src/utils/unit-head-routes.ts` | **new** | 1 |
| `src/components/org/OrgDashboardView.tsx` | 9 links → `orgRoutes` | 1 |
| `src/components/org/OrgChartView.tsx` | 3 links | 1 |
| `src/components/org/UnitListView.tsx` | 3 links | 1 |
| `src/components/org/UnitDetailView.tsx` | 2 links | 1 |
| `src/components/org/UnitCreateView.tsx` | 2 redirects | 1 |
| `src/components/org/PeopleListView.tsx` | 2 links | 1 |
| `src/components/org/PeopleAddView.tsx` | 2 redirects | 1 |
| `src/components/org/PeopleDetailView.tsx` | 1 redirect | 1 |
| `src/components/org/ProcessListView.tsx` | 3 links | 1 |
| `src/components/org/ProcessBuilder.tsx` | 4 redirects | 1 |
| `src/components/org/OrgReportsView.tsx` | `detailBase` required | 1 |
| `src/components/org/OrgIncidentDetailView.tsx` | `backHref` required, `orgId` removed | 1, 6 |
| `src/app/orghead/reports/page.tsx`, `.../[reportId]/page.tsx` | pass builders | 1 |
| `src/app/unit-head/reports/page.tsx`, `.../[reportId]/page.tsx` | pass builders | 1 |
| `src/app/org/[orgId]/**` + `src/app/org/layout.tsx` (15 files) | **delete** | 2 |
| `src/app/org/page.tsx` | reduce to a bare `getDefaultPanel` forwarder | 2 |
| `src/components/org/OrgWorkspace.tsx` | **delete** | 2 |
| `src/components/org/OrgLanding.tsx` | **delete** | 2 |
| `src/components/org/inventory/InventoryClient.tsx` | **delete** | 2 |
| `src/components/org/OrgIndexView.tsx` | `selectOrg` + `orgRoutes.dashboard()` | 2 |
| `src/components/org/AdminOrgPanel.tsx` | drop duplicated Ghost check | 2 |
| `src/components/org/forms/FormAuthorGuard.tsx` | module gate | 3 |
| `src/utils/panel-nav.ts` | `formsNavSection()`, `PROFILE_NAV` sections, `PATROL_MANAGER_NAV` announcements | 3, 4, 5 |
| `src/components/system/ModuleGate.tsx` | `forms` notice | 3 |
| `src/utils/org.ts` | `MODULE_KEYS` export | 3 |
| `src/components/orghead/OrgSettingsView.tsx` | import `MODULE_KEYS` | 3 |
| `src/components/system/ModuleConfigClient.tsx` | import `MODULE_KEYS` | 3 |
| `src/app/user/page.tsx` | **rewrite** | 4 |
| `src/app/user/layout.tsx` | **new** — guard + shell | 4 |
| `src/utils/chartNavigation.ts` | 4 new entries + permission keys | 5 |
| `src/components/navigation/ChartNavigation.tsx` | drop 3 commented entries | 5 |
| `src/app/{graph,map,test-upload,chatbot}/**` | **delete** | 5 |
| 7 stub pages under `charts/`, `maps/` | **delete** | 5 |
| `src/app/charts/layout.tsx`, `src/app/maps/layout.tsx` | add auth gate | 5 |
| `src/components/patrol/ReportDetailLoader.tsx` | **new** — shared detail | 5 |
| `src/app/patrol/reports/[id]/page.tsx`, `src/app/employee/reports/[reportId]/page.tsx` | use shared detail | 5 |
| `src/components/org/OversightTable.tsx` | conditional detail link | 6 |
| `.workbuddy-ai/tools/panel-routing-test.py` | assertions R1–R6 | 7 |
| `.workbuddy-ai/tools/panel-routing.test.mjs` | assertion bodies | 7 |
| `back/prompt/02-fix-review-history-scope-for-org-leaders.md` | **new** — backend handoff | 8 |
| `front/AGENTS.md` | correct the `moduleKeyFor` claim; document `org-routes.ts` | 7 |

## 8. Backend handoff

One backend change is required and is **not** performed here. It is written up as
`back/prompt/02-fix-review-history-scope-for-org-leaders.md`, following the format of the existing
`back/prompt/01-*.md`: symptom, root cause with file:line, the exact change, ambiguities to resolve
deliberately, verification commands, and constraints.

Summary of what it asks for: `back/src/accident/reviewHistory/reviewHistory.fn.ts:13` and
`back/src/incident_report/reviewHistory/reviewHistory.fn.ts:20` switch `getReportScope` →
`getOrgReportBase`, mirroring `back/src/incident_report/oversight/filters.ts:15-28`, which already
carries the comment explaining why the two helpers diverge.

## 9. Verification

Static, no server required:

```bash
cd front
rg '/org/\$\{' src/components                       # expect 0 matches          (G2)
find src/app/org -name page.tsx                     # expect exactly 1          (G1)
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit # expect 0 errors
pnpm lint
python3 ../.workbuddy-ai/tools/panel-routing-test.py # 48 existing + R1–R6
python3 ../.workbuddy-ai/tools/audit-frontend-actions.py
python3 ../.workbuddy-ai/tools/audit-module-acts.py
```

A clean typecheck does **not** prove reachability — that is why R1–R6 are filesystem assertions
rather than type assertions. Manual pass, per role, after the static checks:

| Role | Walk |
| --- | --- |
| OrgHead | `/orghead` → org-chart → click a unit → **stays in `/orghead`** → people → click a member → units/new → processes/new → reports → a report row |
| UnitHead | `/unit-head` → members → org-chart → reports → a report row (no 403, per §1.5) → warehouse |
| Patrol | `/patrol/dashboard` → reports → detail → `/employee/warehouse`, `/employee/map`, `/employee/announcements` |
| Manager | `/admin` → سازمان‌ها → pick an org → lands on `/orghead` scoped to it → فرم‌ساز → back to panel |
| Ghost | `/admin` → ماژول‌ها → toggle `forms` off → `/forms` **refused with a reason** → toggle on → builder loads |
| Enterprise | `/charts/overall` → the four newly-wired analytics reachable from the section index |
| any | `/charts/overall` while logged out → **redirected to `/login`** |
| any | `/user` → shows the signed-in user's real name and roles, no invented statistics |