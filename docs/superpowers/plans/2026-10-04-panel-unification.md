# Panel Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the three navigation systems that bypass the panel abstraction into one, so no page can navigate a user out of their own panel, no feature is invisible, and no authenticated surface shows invented data.

**Architecture:** Twelve shared org components hardcode `/org/${orgId}/…` in ~43 places, so any drill-down from `/orghead` ejects the user into a parallel legacy workspace — which makes 6 `/orghead` routes unreachable. This plan introduces two pure route-builder modules (`utils/org-routes.ts`, `utils/unit-head-routes.ts`), repoints every component at them, deletes the legacy `/org/[orgId]/*` workspace (15 routes), then fixes `/forms` gating, the fabricated `/user` page, orphan routes and missing auth gates. A static assertion suite in `.workbuddy-ai/tools/panel-routing-test.py` makes the bug class non-recurring.

**Tech Stack:** Next.js 15.3.8 App Router, React 19, TypeScript 5, Tailwind CSS 4, `pnpm`, `tsc`, a hand-rolled Node assertion harness driven by Python.

**Spec:** `docs/superpowers/specs/2026-10-04-panel-unification-design.md`

## Global Constraints

- **Never write a panel URL as a string literal inside a component.** Every link is a `PANEL_NAV` href or a `orgRoutes` / `unitHeadRoutes` builder call. This is the invariant the whole project enforces (spec §4).
- **RTL and Persian copy.** All user-facing strings are Persian. Use the `formatNumber` helper from `@/utils/formatters` for digits; existing code uses `.toLocaleString("fa-IR")` inline in org components — match the surrounding file.
- **`pnpm`, never `npm` or `yarn`.**
- **Backend access rules are fixed and must not be worked around.** Verified against `back/`:
  - `accident.getReportScope` handles only Patrol and Manager/Ghost and **throws** for OrgHead/UnitHead (`back/src/accident/reportScope.ts:97`). `accident.getReportReviewHistory` uses it, so org-leader report detail 403s. `back/prompt/02-*.md` is the fix; **this plan does not touch `back/` code.**
  - `incident_report.gets` and `get` are `grantAccess({ levels: ["Manager", "Patrol"] })` — OrgHead/UnitHead cannot use them.
  - `incident_report.getOversightList` / `getOversightStats` have **no** `grantAccess` and resolve scope via `resolveOversightScope` → `getOrgReportBase`, which **does** support org leaders.
  - `announcement.gets` is `["Manager","Patrol"]`; `markRead` is `["Patrol"]`.
- **No new npm dependencies.** Check `package.json` before assuming a library exists.
- **No `console.log`** and no unused variables in committed code.
- **Delete rather than deprecate.** No commented-out nav entries, no `TODO` shims.
- **Server actions only** for backend calls — never a direct client-side fetch.
- **Verification baseline** (must be green before and after):
  ```bash
  cd front && rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
  cd front && pnpm lint
  python3 .workbuddy-ai/tools/panel-routing-test.py
  python3 .workbuddy-ai/tools/audit-frontend-actions.py
  python3 .workbuddy-ai/tools/audit-module-acts.py
  ```

---

## File Structure

**New files**

| File | Responsibility |
| --- | --- |
| `front/src/utils/org-routes.ts` | The only place that knows an `/orghead` URL. Pure, no React. |
| `front/src/utils/unit-head-routes.ts` | The only place that knows a `/unit-head` URL. Pure, no React. |
| `front/src/app/user/layout.tsx` | `PanelGuard panel="profile"` + `PanelShell` for the profile panel. |
| `front/src/components/patrol/ReportDetailLoader.tsx` | One report-detail fetch+render shared by the patrol and employee panels. |
| `back/prompt/02-fix-review-history-scope-for-org-leaders.md` | Backend handoff (documentation only, no code change). |

**Deleted files**

`front/src/app/org/[orgId]/**` (14 routes) · `front/src/app/org/layout.tsx` · `front/src/components/org/OrgWorkspace.tsx` · `front/src/components/org/OrgLanding.tsx` · `front/src/components/org/inventory/InventoryClient.tsx` · `front/src/app/graph/**` · `front/src/app/map/**` · `front/src/app/test-upload/**` · `front/src/app/chatbot/**` · 7 chart/map stub pages.

**Key modified files**

`utils/panel-nav.ts` (adds `formsNavSection()`, `PROFILE_NAV` sections, manager announcements) · `components/system/ModuleGate.tsx` (adds the `forms` notice) · `utils/org.ts` (gains the single `MODULE_KEYS`) · `utils/chartNavigation.ts` (4 new analytics) · `components/org/OrgReportsView.tsx` + `OrgIncidentDetailView.tsx` (`detailBase`/`backHref` become **required**) · `components/org/forms/FormAuthorGuard.tsx` (gains the module gate) · `.workbuddy-ai/tools/panel-routing.test.mjs` (assertions R1–R6).

---

## Task 1: Route-builder modules, with the invariant under test

Establishes the two pure modules every later task depends on, and puts the "no hardcoded panel URL" rule into the assertion suite so it cannot regress.

**Files:**
- Create: `front/src/utils/org-routes.ts`
- Create: `front/src/utils/unit-head-routes.ts`
- Modify: `.workbuddy-ai/tools/panel-routing-test.py`
- Modify: `.workbuddy-ai/tools/panel-routing.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  // front/src/utils/org-routes.ts
  export const orgRoutes: {
    dashboard(): string; orgChart(): string; units(): string; unitNew(): string;
    unit(unitId: string): string; people(): string; personNew(): string;
    person(userId: string): string; processes(): string; processNew(): string;
    process(processId: string): string; reports(): string; report(reportId: string): string;
    settings(): string; warehouse(): string;
  }
  // front/src/utils/unit-head-routes.ts
  export const unitHeadRoutes: {
    dashboard(): string; members(): string; orgChart(): string;
    reports(): string; report(reportId: string): string; warehouse(): string;
  }
  ```

- [ ] **Step 1: Add the failing assertion — R6, no hardcoded panel URLs**

Append to `.workbuddy-ai/tools/panel-routing.test.mjs`, immediately before the report block:

```js
// ------------------------------------------------------- route-builder invariant
// Every org/unit URL a component renders must come from a route builder. This is
// the assertion that would have caught the original defect: twelve components
// hardcoded `/org/${orgId}/…`, so drilling down from `/orghead` ejected the user
// into the legacy workspace and six `/orghead` routes were unreachable.
eq("orgRoutes.dashboard()", orgRoutes.dashboard(), "/orghead");
eq("orgRoutes.orgChart()", orgRoutes.orgChart(), "/orghead/org-chart");
eq("orgRoutes.units()", orgRoutes.units(), "/orghead/units");
eq("orgRoutes.unitNew()", orgRoutes.unitNew(), "/orghead/units/new");
eq("orgRoutes.unit(id)", orgRoutes.unit("u1"), "/orghead/units/u1");
eq("orgRoutes.people()", orgRoutes.people(), "/orghead/people");
eq("orgRoutes.personNew()", orgRoutes.personNew(), "/orghead/people/add");
eq("orgRoutes.person(id)", orgRoutes.person("p1"), "/orghead/people/p1");
eq("orgRoutes.processes()", orgRoutes.processes(), "/orghead/processes");
eq("orgRoutes.processNew()", orgRoutes.processNew(), "/orghead/processes/new");
eq("orgRoutes.process(id)", orgRoutes.process("x1"), "/orghead/processes/x1");
eq("orgRoutes.reports()", orgRoutes.reports(), "/orghead/reports");
eq("orgRoutes.report(id)", orgRoutes.report("r1"), "/orghead/reports/r1");
eq("orgRoutes.settings()", orgRoutes.settings(), "/orghead/settings");
eq("orgRoutes.warehouse()", orgRoutes.warehouse(), "/orghead/warehouse");

eq("unitHeadRoutes.dashboard()", unitHeadRoutes.dashboard(), "/unit-head");
eq("unitHeadRoutes.members()", unitHeadRoutes.members(), "/unit-head/members");
eq("unitHeadRoutes.orgChart()", unitHeadRoutes.orgChart(), "/unit-head/org-chart");
eq("unitHeadRoutes.reports()", unitHeadRoutes.reports(), "/unit-head/reports");
eq("unitHeadRoutes.report(id)", unitHeadRoutes.report("r1"), "/unit-head/reports/r1");
eq("unitHeadRoutes.warehouse()", unitHeadRoutes.warehouse(), "/unit-head/warehouse");
```

and extend the import at the top of the file:

```js
import { orgRoutes } from "./org-routes.js";
import { unitHeadRoutes } from "./unit-head-routes.js";
```

- [ ] **Step 2: Add R6 as a source grep in the Python driver**

In `.workbuddy-ai/tools/panel-routing-test.py`, replace the `tsc` argument list so the two new pure modules are transpiled too:

```python
    subprocess.run(
        [
            str(TSC),
            "src/utils/panels.ts",
            "src/utils/panel-nav.ts",
            "src/utils/org-routes.ts",
            "src/utils/unit-head-routes.ts",
            "--outDir", str(out),
            "--target", "es2020",
            "--module", "esnext",
            "--moduleResolution", "bundler",
            "--skipLibCheck",
            "--noEmitOnError", "false",
        ],
        cwd=FRONT,
        check=False,
        capture_output=True,
        text=True,
    )
```

Then, after the existing "transpile produced no output" abort, add the source-level invariant check:

```python
    # R6 — the invariant the whole project rests on: no component constructs a
    # panel URL by hand. This covers three shapes, because each type-checks
    # cleanly and fails only when a user clicks: a `/org/${orgId}/…` template
    # literal (the original defect), a `detailBase="/orghead"` prop, and a
    # `backHref="/org/..."` prop.
    offenders = []
    # Two shapes of the same mistake. The template literal is the original defect;
    # the string-literal prop is how it kept reappearing, because
    # `detailBase="/orghead"` type-checks fine and only fails at navigation time.
    banned = ("/org/${", 'detailBase="/', "backHref=\"/")
    for path in (FRONT / "src" / "components").rglob("*.tsx"):
        text = path.read_text(encoding="utf-8")
        for lineno, line in enumerate(text.splitlines(), start=1):
            if any(b in line for b in banned):
                offenders.append(f"{path.relative_to(FRONT)}:{lineno}: {line.strip()}")
    if offenders:
        print("R6 FAILED — a panel URL is constructed by hand:")
        for o in offenders:
            print(f"  x {o}")
        sys.exit(1)
    print("R6 ok — no hand-built panel URLs in src/components")
```

- [ ] **Step 3: Run the harness to verify R6 fails**

```bash
python3 .workbuddy-ai/tools/panel-routing-test.py
```

Expected: `R6 FAILED` listing the 13 offending files. (The JS assertions will also fail because the two modules do not exist yet — that is expected.)

- [ ] **Step 4: Create `front/src/utils/org-routes.ts`**

```ts
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
 * Nothing may construct an org URL by hand. Call the builder. `panel-routing-test.py`
 * greps `src/components` for `/org/${` so this cannot regress.
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
  report: (reportId: string) => `/orghead/reports/${reportId}`,
  settings: () => "/orghead/settings",
  warehouse: () => "/orghead/warehouse",
} as const;
```

- [ ] **Step 5: Create `front/src/utils/unit-head-routes.ts`**

```ts
/**
 * Every `/unit-head` URL, in one place. The mirror of `utils/org-routes.ts`.
 *
 * `/unit-head` renders two of the same components as `/orghead` (`OrgChartView`,
 * `OrgReportsView`, `OrgIncidentDetailView`) from a different base. Those
 * components take the base as a **required** prop fed by one of these two
 * modules — never a defaulted literal, because a defaulted literal is exactly
 * how `/orghead` ended up pointing at `/org`.
 *
 * Pure and React-free so the test harness can transpile it standalone.
 */
export const unitHeadRoutes = {
  dashboard: () => "/unit-head",
  members: () => "/unit-head/members",
  orgChart: () => "/unit-head/org-chart",
  reports: () => "/unit-head/reports",
  report: (reportId: string) => `/unit-head/reports/${reportId}`,
  warehouse: () => "/unit-head/warehouse",
} as const;
```

- [ ] **Step 6: Run the harness to verify the builders pass but R6 still fails**

```bash
python3 .workbuddy-ai/tools/panel-routing-test.py
```

Expected: the 20 new builder assertions pass; `R6 FAILED` still lists the 13 files. Tasks 2–5 clear R6.

- [ ] **Step 7: Commit**

```bash
git add front/src/utils/org-routes.ts front/src/utils/unit-head-routes.ts .workbuddy-ai/tools/panel-routing-test.py .workbuddy-ai/tools/panel-routing.test.mjs
git commit -m ":sparkles: feat(panels): Add org and unit-head route builders

Twelve shared org components hardcoded /org/\${orgId}/..., so any drill-down
from /orghead ejected the user into the legacy workspace. Centralize every URL
in two pure modules and put the invariant under test: the harness now greps
src/components and transpiles both builders.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Repoint `OrgDashboardView` and `OrgChartView`

**Files:**
- Modify: `front/src/components/org/OrgDashboardView.tsx`
- Modify: `front/src/components/org/OrgChartView.tsx`

**Interfaces:**
- Consumes: `orgRoutes` from `@/utils/org-routes` (Task 1).
- Produces: nothing new; both keep their existing `{ orgId }` props.

- [ ] **Step 1: Repoint `OrgDashboardView.tsx`**

Add the import after the existing `@/utils/org` import:

```ts
import { orgRoutes } from "@/utils/org-routes";
```

Then apply these eight replacements. Note line 135: it points at `/org/${orgId}/inventory`, which under `/orghead` is `warehouse`, not `inventory` — that mismatch only became visible because the link never worked from this panel.

| Line | Before | After |
| --- | --- | --- |
| 74 | `` href={`/org/${orgId}/units/new`} `` | `` href={orgRoutes.unitNew()} `` |
| 77 | `` href={`/org/${orgId}/org-chart`} `` | `` href={orgRoutes.orgChart()} `` |
| 110 | `` href={`/org/${orgId}/units/new`} `` | `` href={orgRoutes.unitNew()} `` |
| 116 | `` href={`/org/${orgId}/org-chart`} `` | `` href={orgRoutes.orgChart()} `` |
| 120 | `` href={`/org/${orgId}/units`} `` | `` href={orgRoutes.units()} `` |
| 124 | `` href={`/org/${orgId}/people`} `` | `` href={orgRoutes.people()} `` |
| 129 | `` href={`/org/${orgId}/processes`} `` | `` href={orgRoutes.processes()} `` |
| 135 | `` href={`/org/${orgId}/inventory`} `` | `` href={orgRoutes.warehouse()} `` |
| 141 | `` href={`/org/${orgId}/reports`} `` | `` href={orgRoutes.reports()} `` |

- [ ] **Step 2: Repoint `OrgChartView.tsx`**

Add the import after the `@/utils/org` import:

```ts
import { orgRoutes } from "@/utils/org-routes";
```

Three replacements:

| Line | Before | After |
| --- | --- | --- |
| 79 | `` href={`/org/${orgId}/units/new`} `` | `` href={orgRoutes.unitNew()} `` |
| 115 | `` href={`/org/${orgId}/units/new`} `` | `` href={orgRoutes.unitNew()} `` |
| 176 | `` href={`/org/${orgId}/units/${node._id}`} `` | `` href={orgRoutes.unit(node._id)} `` |

- [ ] **Step 3: Verify both files are clean of the old form**

```bash
rg '/org/\$\{' src/components/org/OrgDashboardView.tsx src/components/org/OrgChartView.tsx
```

Expected: no output.

- [ ] **Step 4: Typecheck**

```bash
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
```

Expected: 0 errors. `orgId` is still a used prop in both files, so no unused-variable error.

- [ ] **Step 5: Commit**

```bash
git add front/src/components/org/OrgDashboardView.tsx front/src/components/org/OrgChartView.tsx
git commit -m ":bug: fix(panels): Keep org dashboard and chart inside /orghead

Every link and redirect was a hardcoded /org/\${orgId}/..., so drilling down
from /orghead navigated the user into the legacy workspace. The inventory link
also pointed at a route that does not exist under /orghead; it now resolves to
/orghead/warehouse.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Repoint the unit trio

`UnitListView`, `UnitDetailView`, `UnitCreateView` — the units slice. Together they cover 7 of the 43 literals and the `units/new` + `units/[unitId]` pair that was unreachable from `/orghead`.

**Files:**
- Modify: `front/src/components/org/UnitListView.tsx`
- Modify: `front/src/components/org/UnitDetailView.tsx`
- Modify: `front/src/components/org/UnitCreateView.tsx`

**Interfaces:**
- Consumes: `orgRoutes` from `@/utils/org-routes` (Task 1).

- [ ] **Step 1: Repoint `UnitListView.tsx` (3 sites)**

Add `import { orgRoutes } from "@/utils/org-routes";` alongside the other `@/utils` imports.

| Line | Before | After |
| --- | --- | --- |
| 75 | `` href={`/org/${orgId}/units/new`} `` | `` href={orgRoutes.unitNew()} `` |
| 114 | `` router.push(`/org/${orgId}/units/${unit._id}`) `` | `` router.push(orgRoutes.unit(unit._id)) `` |
| 134 | `` href={`/org/${orgId}/units/${unit._id}`} `` | `` href={orgRoutes.unit(unit._id)} `` |

- [ ] **Step 2: Repoint `UnitDetailView.tsx` (2 sites)**

| Line | Before | After |
| --- | --- | --- |
| 210 | `` router.push(`/org/${orgId}/units`) `` | `` router.push(orgRoutes.units()) `` |
| 232 | `` href={`/org/${orgId}/org-chart`} `` | `` href={orgRoutes.orgChart()} `` |

- [ ] **Step 3: Repoint `UnitCreateView.tsx` (2 sites)**

| Line | Before | After |
| --- | --- | --- |
| 132 | `` router.push(`/org/${orgId}/units/${(response.body as { _id: string })._id}`) `` | `` router.push(orgRoutes.unit((response.body as { _id: string })._id)) `` |
| 174 | `` router.push(`/org/${orgId}/units`) `` | `` router.push(orgRoutes.units()) `` |

- [ ] **Step 4: Verify and typecheck**

```bash
rg '/org/\$\{' src/components/org/UnitListView.tsx src/components/org/UnitDetailView.tsx src/components/org/UnitCreateView.tsx
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
```

Expected: no grep output, 0 type errors. If any of the three files no longer uses its `orgId` prop after the rewrite, remove `orgId` from the destructured props — do **not** leave it unused.

- [ ] **Step 5: Commit**

```bash
git add front/src/components/org/UnitListView.tsx front/src/components/org/UnitDetailView.tsx front/src/components/org/UnitCreateView.tsx
git commit -m ":bug: fix(panels): Route unit list, detail and create through orgRoutes

Makes /orghead/units/new and /orghead/units/[unitId] reachable from the panel
instead of only existing as dead routes under the legacy workspace.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
---

## Task 4: Repoint the people trio

`PeopleListView`, `PeopleAddView`, `PeopleDetailView` — covers 5 literals and the `people/add` + `people/[userId]` pair that was unreachable.

**Files:**
- Modify: `front/src/components/org/PeopleListView.tsx`
- Modify: `front/src/components/org/PeopleAddView.tsx`
- Modify: `front/src/components/org/PeopleDetailView.tsx`

**Interfaces:**
- Consumes: `orgRoutes` from `@/utils/org-routes` (Task 1).

- [ ] **Step 1: Repoint `PeopleListView.tsx` (2 sites)**

Add `import { orgRoutes } from "@/utils/org-routes";` alongside the other `@/utils` imports.

| Line | Before | After |
| --- | --- | --- |
| 113 | `` href={`/org/${orgId}/people/add`} `` | `` href={orgRoutes.personNew()} `` |
| 147 | `` router.push(`/org/${orgId}/people/${member._id}`) `` | `` router.push(orgRoutes.person(member._id)) `` |

- [ ] **Step 2: Repoint `PeopleAddView.tsx` (2 sites)**

| Line | Before | After |
| --- | --- | --- |
| 158 | `` router.push(`/org/${orgId}/people/${(response.body as { _id: string })._id}`) `` | `` router.push(orgRoutes.person((response.body as { _id: string })._id)) `` |
| 217 | `` router.push(`/org/${orgId}/people`) `` | `` router.push(orgRoutes.people()) `` |

- [ ] **Step 3: Repoint `PeopleDetailView.tsx` (1 site)**

| Line | Before | After |
| --- | --- | --- |
| 170 | `` router.push(`/org/${orgId}/people`) `` | `` router.push(orgRoutes.people()) `` |

- [ ] **Step 4: Verify and typecheck**

```bash
rg '/org/\$\{' src/components/org/PeopleListView.tsx src/components/org/PeopleAddView.tsx src/components/org/PeopleDetailView.tsx
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
```

Expected: no grep output, 0 type errors. `PeopleDetailView` uses `orgId` for its data fetches as well as the back link, so the prop stays.

- [ ] **Step 5: Commit**

```bash
git add front/src/components/org/PeopleListView.tsx front/src/components/org/PeopleAddView.tsx front/src/components/org/PeopleDetailView.tsx
git commit -m ":bug: fix(panels): Route people list, add and detail through orgRoutes

Makes /orghead/people/add and /orghead/people/[userId] reachable from the panel
instead of only existing as dead routes under the legacy workspace.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Repoint the processes pair

`ProcessListView` (3 sites) and `ProcessBuilder` (4 sites) — the last of the twelve shared components with hardcoded URLs.

**Files:**
- Modify: `front/src/components/org/ProcessListView.tsx`
- Modify: `front/src/components/org/ProcessBuilder.tsx`

**Interfaces:**
- Consumes: `orgRoutes` from `@/utils/org-routes` (Task 1).

- [ ] **Step 1: Repoint `ProcessListView.tsx` (3 sites)**

Add `import { orgRoutes } from "@/utils/org-routes";` alongside the other `@/utils` imports.

| Line | Before | After |
| --- | --- | --- |
| 85 | `` href={`/org/${orgId}/processes/new`} `` | `` href={orgRoutes.processNew()} `` |
| 135 | `` router.push(`/org/${orgId}/processes/${process._id}`) `` | `` router.push(orgRoutes.process(process._id)) `` |
| 137 | `` router.push(`/org/${orgId}/processes/${process._id}`) `` | `` router.push(orgRoutes.process(process._id)) `` |

- [ ] **Step 2: Repoint `ProcessBuilder.tsx` (4 sites)**

| Line | Before | After |
| --- | --- | --- |
| 133 | `` router.replace(`/org/${orgId}/processes/${id}`) `` | `` router.replace(orgRoutes.process(id)) `` |
| 137 | `` router.replace(`/org/${orgId}/processes`) `` | `` router.replace(orgRoutes.processes()) `` |
| 144 | `` router.replace(`/org/${orgId}/processes`) `` | `` router.replace(orgRoutes.processes()) `` |
| 166 | `` href={`/org/${orgId}/processes`} `` | `` href={orgRoutes.processes()} `` |

- [ ] **Step 3: Verify and typecheck**

```bash
rg '/org/\$\{' src/components/org/ProcessListView.tsx src/components/org/ProcessBuilder.tsx
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
```

Expected: no grep output, 0 type errors. `ProcessBuilder` still uses `orgId` in its act calls, so the prop stays.

- [ ] **Step 4: Commit**

```bash
git add front/src/components/org/ProcessListView.tsx front/src/components/org/ProcessBuilder.tsx
git commit -m ":bug: fix(panels): Route process list and builder through orgRoutes

Makes /orghead/processes/new and /orghead/processes/[processId] reachable from
the panel instead of only existing as dead routes under the legacy workspace.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Make the shared base a required prop, not a default

The last two hardcoded URLs are the *defaults* of `detailBase` and `backHref`. Those props were introduced only to override them — which is why the defect survived every link fix: a caller that forgets the prop silently gets a `/org/…` URL. Making them required removes the failure mode.

This task also fixes the report-detail back button that currently navigates out of `/orghead`, and drops the now-dead `orgId` prop from `OrgIncidentDetailView`.

**Files:**
- Modify: `front/src/components/org/OrgReportsView.tsx`
- Modify: `front/src/components/org/OrgIncidentDetailView.tsx`
- Modify: `front/src/app/orghead/reports/page.tsx`
- Modify: `front/src/app/orghead/reports/[reportId]/page.tsx`
- Modify: `front/src/app/unit-head/reports/page.tsx`
- Modify: `front/src/app/unit-head/reports/[reportId]/page.tsx`

**Interfaces:**
- Consumes: `orgRoutes`, `unitHeadRoutes` (Task 1).
- Produces:
  ```ts
  // OrgReportsView — detailBase is now required
  { orgId: string; detailBase: string; heading?: string; subtitle?: string }
  // OrgIncidentDetailView — orgId removed, backHref now required
  { reportId: string; backHref: string }
  ```

- [ ] **Step 1: `OrgReportsView.tsx` — make `detailBase` required**

Replace the prop type block (lines 48-58) with:

```tsx
  orgId,
  detailBase,
  heading,
  subtitle,
}: {
  orgId: string;
  /**
   * Route prefix the report rows link into — `orgRoutes.reports()` or
   * `unitHeadRoutes.reports()`.
   *
   * Required, and deliberately not defaulted. It used to fall back to
   * `/org/${orgId}`, which meant a caller that forgot it silently navigated out
   * of the panel; that fallback is the reason the back button on
   * `/orghead/reports/[id]` pointed at the legacy workspace.
   */
  detailBase: string;
  heading?: string;
  subtitle?: string;
}) {
```

Then in the inner component's own prop type (lines 73-79), make `detailBase` required as well:

```tsx
  orgId: string;
  detailBase: string;
  heading?: string;
  subtitle?: string;
}) {
```

Finally, at the `OversightTable` call site (line 296), drop the fallback:

```tsx
        <OversightTable
          rows={rows}
          detailBase={detailBase}
          selected={selected}
          onToggle={toggle}
          onTogglePage={togglePage}
        />
```

- [ ] **Step 2: `OrgIncidentDetailView.tsx` — drop `orgId`, require `backHref`**

Replace the signature (lines 15-24):

```tsx
export function OrgIncidentDetailView({
  reportId,
  backHref,
}: {
  reportId: string;
  /**
   * Where the "back to reports" link points — `orgRoutes.reports()` or
   * `unitHeadRoutes.reports()`.
   *
   * Required. It defaulted to `/org/${orgId}/reports`, so the OrgHead report
   * detail page navigated *out* of its own panel on back-press.
   */
  backHref: string;
}) {
```

And the link itself (line 70):

```tsx
          href={backHref}
```

Add next to the other imports:

```ts
import { orgRoutes } from "@/utils/org-routes";
```

`orgRoutes` is not yet referenced in this file — Task 6 does not need it here, so **omit that import** unless you also apply the Task 11 change to this file. Do not add an unused import.

- [ ] **Step 3: Update the four call sites**

`src/app/orghead/reports/page.tsx` — add the import and pass `detailBase`:

```tsx
import { orgRoutes } from "@/utils/org-routes";
...
        <OrgReportsView
          orgId={orgId}
          detailBase={orgRoutes.dashboard()}
          heading={...}
          subtitle={...}
        />
```

**`detailBase` is the panel *root*, not the reports page.** `OversightTable`'s
`detailHref` appends `/reports/${row._id}`, so it must be handed `/orghead` and
nothing more. Passing `orgRoutes.reports()` would build
`/orghead/reports/reports/<id>`. This page currently passes the literal
`detailBase="/orghead"` — replace it.

Keep the file's existing `heading` / `subtitle` values untouched — read them from the file rather than inventing new copy.

`src/app/orghead/reports/[reportId]/page.tsx` — replace the whole file:

```tsx
"use client";

import { useParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { OrgIncidentDetailView } from "@/components/org/OrgIncidentDetailView";
import { orgRoutes } from "@/utils/org-routes";

export default function OrgHeadReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = params?.reportId;

  return (
    <ScopedView>
      {() => (
        <OrgIncidentDetailView reportId={String(reportId)} backHref={orgRoutes.reports()} />
      )}
    </ScopedView>
  );
}
```

Note the `ScopedView` render prop no longer destructures `orgId` — the detail view does not need it.

`src/app/unit-head/reports/page.tsx` — add `import { unitHeadRoutes } from "@/utils/unit-head-routes";` and pass `detailBase={unitHeadRoutes.dashboard()}`. It currently passes the literal `detailBase="/unit-head"` — replace that too, for the same reason.

`src/app/unit-head/reports/[reportId]/page.tsx` — replace the whole file:

```tsx
"use client";

import { useParams } from "next/navigation";
import { ScopedView } from "@/components/system/ScopedView";
import { OrgIncidentDetailView } from "@/components/org/OrgIncidentDetailView";
import { unitHeadRoutes } from "@/utils/unit-head-routes";

export default function UnitHeadReportDetailPage() {
  const params = useParams<{ reportId: string }>();
  const reportId = params?.reportId;

  return (
    <ScopedView require="unit">
      {() => (
        <OrgIncidentDetailView
          reportId={String(reportId)}
          backHref={unitHeadRoutes.reports()}
        />
      )}
    </ScopedView>
  );
}
```

- [ ] **Step 4: Fix the two `/org/[orgId]` call sites that will no longer typecheck**

The legacy routes still pass `orgId` and omit `detailBase`. They are deleted in Task 7; until then, make them compile by passing the builders:

`src/app/org/[orgId]/reports/page.tsx`:

```tsx
      <OrgReportsView orgId={orgId} detailBase={`/org/${orgId}`} />
```

`src/app/org/[orgId]/reports/[reportId]/page.tsx` — replace the `<OrgIncidentDetailView …>` call with:

```tsx
      <OrgIncidentDetailView reportId={reportId} backHref={`/org/${orgId}/reports`} />
```

Task 7 deletes both files, so these two edits are throwaway — they exist only to keep the tree green between commits.

- [ ] **Step 5: Verify**

```bash
rg '/org/\$\{' src/components src/app/orghead src/app/unit-head
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
python3 .workbuddy-ai/tools/panel-routing-test.py
```

Expected: grep finds nothing outside `src/app/org`; 0 type errors; R6 passes with **0 offenders** (all 13 component files are now clean) and all builder assertions pass.

- [ ] **Step 6: Commit**

```bash
git add front/src/components/org/OrgReportsView.tsx front/src/components/org/OrgIncidentDetailView.tsx front/src/app/orghead/reports front/src/app/unit-head/reports front/src/app/org
git commit -m ":bug: fix(panels): Require an explicit base on shared org report views

detailBase and backHref defaulted to /org/\${orgId}, so a caller that forgot
them navigated out of the panel — which is why the back button on
/orghead/reports/[id] pointed at the legacy workspace. Both are now required and
fed by a route builder, and OrgIncidentDetailView no longer takes orgId.

Completes the route-builder migration: R6 now greps zero offenders.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Delete the legacy `/org` workspace

Removes the parallel org UI — 15 routes and ~640 lines — and re-points `/admin/org`'s org picker at `/orghead` through the existing scope mechanism, so Ghost/Manager keep multi-org browsing.

**Files:**
- Delete: `src/app/org/[orgId]/**` (14 route files + `layout.tsx`)
- Delete: `src/app/org/layout.tsx`
- Delete: `src/components/org/OrgWorkspace.tsx`
- Delete: `src/components/org/OrgLanding.tsx`
- Delete: `src/components/org/inventory/InventoryClient.tsx`
- Modify: `src/app/org/page.tsx`
- Modify: `src/components/org/OrgIndexView.tsx`
- Modify: `src/components/org/AdminOrgPanel.tsx`
- Modify: `.workbuddy-ai/tools/panel-routing.test.mjs`

**Interfaces:**
- Consumes: `orgRoutes` (Task 1), `usePanelScope().selectOrg` (existing).
- Produces: `/admin/org` navigates to `/orghead` with the chosen org in scope.

- [ ] **Step 1: Confirm `InventoryClient` has no other consumer, then delete**

```bash
rg -n 'InventoryClient' src --no-heading
```

Expected: exactly two hits — its own file and `src/app/org/[orgId]/inventory/page.tsx`, which this task deletes. If any other consumer exists, stop and report it rather than deleting.

- [ ] **Step 2: Delete the legacy files**

```bash
rm -rf src/app/org/\[orgId\] src/app/org/layout.tsx \
       src/components/org/OrgWorkspace.tsx \
       src/components/org/OrgLanding.tsx \
       src/components/org/inventory
```

- [ ] **Step 3: Replace `src/app/org/page.tsx` with a bare forwarder**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePanelViewer } from "@/hooks/usePanelViewer";
import { getDefaultPanel } from "@/utils/panels";
import { PageSkeleton } from "@/components/patrol/ui";

/**
 * `/org` — a bookmark-compatible forwarder, nothing more.
 *
 * The org workspace used to live here at `/org/[orgId]/*` with its own sidebar,
 * twelve shared components hardcoded to point back into it, and every drill-down
 * from `/orghead` ejected the user into it. That workspace is gone; the single
 * org surface is `/orghead`, scoped from `user.roles[]`.
 *
 * This route survives only so an old link lands somewhere sensible.
 */
export default function OrgForwardPage() {
  const viewer = usePanelViewer();
  const router = useRouter();
  const target = getDefaultPanel(viewer);

  useEffect(() => {
    router.replace(target);
  }, [target, router]);

  return <PageSkeleton blocks={[220, 260]} />;
}
```

`getDefaultPanel` is pure and safe to call before `authReady` — it returns `/admin` for a logged-out Ghost-less viewer, and `PanelGuard` on the destination settles the rest. No `authReady` gate is needed here.

- [ ] **Step 4: Re-point `OrgIndexView` at `/orghead`**

Add the imports:

```ts
import { usePanelScope } from "@/components/system/PanelScopeProvider";
import { orgRoutes } from "@/utils/org-routes";
```

Inside `OrgIndexView`, after `const router = useRouter();` (line 39), add:

```ts
  const { selectOrg } = usePanelScope();
```

Then replace the org button's `onClick` (line 146). Change

```tsx
              <button onClick={() => router.push(`/org/${org._id}`)} className="flex flex-1 flex-col text-right">
```

to

```tsx
              <button
                onClick={() => {
                  // Set the panel scope, then enter the panel. This is how
                  // Ghost/Manager browse across organizations: the org lives in
                  // `PanelScopeProvider`'s sessionStorage, not in the URL.
                  selectOrg(org._id);
                  router.push(orgRoutes.dashboard());
                }}
                className="flex flex-1 flex-col text-right"
              >
```

- [ ] **Step 5: `OrgIndexView` must render inside a scope provider**

`/admin/layout.tsx` currently has no `PanelScopeProvider`, so `usePanelScope()` throws. There is **no `AdminShell` component** — the admin layout inlines its own shell `<div>` around `AdminSidebar`. Insert the provider between `PanelGuard` and that `<div>`, leaving the shell markup untouched:

```tsx
import { AdminSidebar } from "@/components/organisms/SideBar";
import { PanelGuard } from "@/components/system/PanelGuard";
import { PanelScopeProvider } from "@/components/system/PanelScopeProvider";
import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PanelGuard panel="admin">
      {/* OrgIndexView calls usePanelScope().selectOrg() to hand the chosen
          organization to the org panel, which needs a provider above it. */}
      <PanelScopeProvider>
        <div className="admin-shell flex h-[calc(100vh-4rem)] overflow-hidden">
          <AdminSidebar />
          <div className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6">{children}</div>
        </div>
      </PanelScopeProvider>
    </PanelGuard>
  );
}
```

Note this is a bare `PanelScopeProvider` with no `prefer` prop: the admin panel
spans organizations, so it must not bias toward an org or a unit scope.

- [ ] **Step 6: Simplify `AdminOrgPanel.tsx`**

Its Ghost/Manager re-check duplicates what `PanelGuard panel="admin"` already applied. Replace the whole file:

```tsx
"use client";

import { OrgIndexView } from "@/components/org/OrgIndexView";

/**
 * `/admin/org` — the organization picker.
 *
 * The Ghost/Manager check that used to live here was a duplicate of
 * `PanelGuard panel="admin"`, which every `/admin` route already passes through.
 * `OrgIndexView` is not exported from any other surface, so nothing else needs
 * a gate.
 */
export function AdminOrgPanel() {
  return <OrgIndexView />;
}
```

- [ ] **Step 7: Add the R2 assertion — every panel route is reachable from its nav**

In `.workbuddy-ai/tools/panel-routing.test.mjs`, extend the route-builder block with the reachability table, derived from the nav registries themselves:

```js
// R2 — a nav href and its detail routes must agree with each other, or a
// drill-down lands on a page no sidebar links to. The six `/orghead` detail
// routes this catches were unreachable because their `/org/[orgId]` twins were
// the wired-up ones.
const orgNavIds = filterPanelSections(PANEL_NAV.orghead.sections, mk("OrgHead")).flatMap((s) => s.items.map((i) => i.href));
const orgDetailRoutes = [
  "/orghead/units/new",
  "/orghead/people/add",
  "/orghead/processes/new",
];
for (const route of orgDetailRoutes) {
  const parent = "/" + route.split("/").slice(1, 3).join("/");
  eq(`orghead nav links the parent of ${route}`, orgNavIds.includes(parent), true);
}
eq(
  "orghead nav has no link into the deleted legacy workspace",
  orgNavIds.some((h) => h.startsWith("/org/")),
  false,
);
const unitNavIds = filterPanelSections(PANEL_NAV["unit-head"].sections, mk("UnitHead")).flatMap((s) => s.items.map((i) => i.href));
eq(
  "unit-head nav has no link into the deleted legacy workspace",
  unitNavIds.some((h) => h.startsWith("/org/")),
  false,
);
```

- [ ] **Step 8: Add R1 — every nav href resolves to a real `page.tsx`**

In `.workbuddy-ai/tools/panel-routing-test.py`, after the R6 block, add a filesystem check that reads the two nav registries textually (they are TSX-importing modules, so a runtime walk is not available in this harness):

```python
    # R1 — every href in the nav registries must resolve to a real page. A typo or
    # a stale entry type-checks cleanly and 404s only when a user clicks it.
    import re

    page_dirs = set()
    app_dir = FRONT / "src" / "app"
    for page in app_dir.rglob("page.tsx"):
        rel = page.relative_to(app_dir).parent
        parts = [] if str(rel) == "." else rel.parts
        if parts and parts[0].startswith("("):
            parts = parts[1:]
        if any(p.startswith("[") for p in parts):
            continue  # dynamic segment — checked by its static siblings below
        prefix = "/" + "/".join(parts)
        page_dirs.add(prefix.rstrip("/") or "/")

    def hrefs_in(path):
        out = set()
        for m in re.finditer(r'href:\s*"([^"]+)"', path.read_text(encoding="utf-8")):
            out.add(m.group(1))
        return out

    nav_sources = [
        FRONT / "src" / "utils" / "panel-nav.ts",
        FRONT / "src" / "components" / "organisms" / "adminSidebarConfig.ts",
    ]
    dead = []
    for src in nav_sources:
        for href in hrefs_in(src):
            if not href.startswith("/"):
                continue
            if href in page_dirs:
                continue
            # A nav entry may point at a parent of a dynamic route; accept it when
            # a directory tree exists for it.
            if (app_dir / href.lstrip("/")).exists():
                continue
            dead.append(f"{src.name}: {href}")
    if dead:
        print("R1 FAILED — nav hrefs with no matching route:")
        for d in sorted(dead):
            print(f"  x {d}")
        sys.exit(1)
    print(f"R1 ok — {len(nav_sources)} nav registries, no dead hrefs")
```

- [ ] **Step 9: Run the full verification**

```bash
python3 .workbuddy-ai/tools/panel-routing-test.py
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
pnpm lint
rg -n 'OrgWorkspace|OrgLanding|InventoryClient' src || echo "no dangling references"
```

Expected: all assertions pass including R1, R2 and R6; 0 type errors; lint clean; no dangling references.

- [ ] **Step 10: Commit**

```bash
git add -A front/src/app/org front/src/components/org .workbuddy-ai/tools
git commit -m ":boom: refactor(panels): Delete the legacy /org/[orgId] workspace

Fifteen routes, OrgWorkspace's bespoke sidebar, OrgLanding and the duplicate
InventoryClient are gone. /admin/org now selects the org through
PanelScopeProvider and enters /orghead, so Ghost/Manager keep multi-org browsing
without a second org UI. Adds R1 (no dead nav hrefs) and R2 (no nav link into
the deleted workspace).

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Make `/forms` gate the route the same way it gates the nav

The sidebar checks `requiredModule: "forms"`; the route does not. So an Editor typing `/forms` gets a silent redirect, and an author whose org has `forms` off still gets a working editor by deep link. This aligns the two and gives the off state a real message.

**Files:**
- Modify: `front/src/components/org/forms/FormAuthorGuard.tsx`
- Modify: `front/src/utils/panel-nav.ts`
- Modify: `front/src/components/system/ModuleGate.tsx`
- Modify: `front/src/app/forms/layout.tsx`

**Interfaces:**
- Consumes: `usePanelViewer().orgHasModule` (existing), `PANEL_NAV` (existing).
- Produces:
  ```ts
  // utils/panel-nav.ts — new export
  export function formsNavSection(): PanelNavSection;
  ```

- [ ] **Step 1: Write the failing assertion — R4, nav and route agree**

Append to `.workbuddy-ai/tools/panel-routing.test.mjs`, after the existing `/forms` block:

```js
// R4 — the nav entry and the route guard must consult the same gate. They
// disagreed: the nav hid `/forms` when the module was off, but the guard let any
// author straight in. `canAuthorForms` now takes the module into account, so an
// author without the module is refused exactly like the sidebar implies.
eq(
  "canAuthorForms refuses a Manager when the forms module is off",
  canAuthorForms(mk("Manager", [], ["charts"])),
  false,
);
eq(
  "canAuthorForms allows a Manager when the forms module is on",
  canAuthorForms(mk("Manager", [], ["charts", "forms"])),
  true,
);
eq(
  "canAuthorForms allows Ghost even with no modules (Ghost is exempt)",
  canAuthorForms(makePanelViewer({ level: "Ghost", roles: [], modules: [] })),
  true,
);
eq(
  "canAuthorForms still refuses a Patrol officer",
  canAuthorForms(mk("Patrol", [], ALL)),
  false,
);
eq(
  "formsNavSection is the single definition both panels use",
  ORGHEAD_NAV.sections.includes(formsNavSection()) || ORGHEAD_NAV.sections.some((s) => s.label === formsNavSection().label),
  true,
);
```

Extend the import at the top of the file:

```js
import { canAuthorForms } from "./form-author-guard.js";
import { filterPanelSections, formsNavSection, isNavItemActive, ORGHEAD_NAV, PANEL_NAV } from "./panel-nav.js";
```

- [ ] **Step 2: Run the harness to verify it fails**

```bash
python3 .workbuddy-ai/tools/panel-routing-test.py
```

Expected: the transpile aborts — `canAuthorForms` is not exported from `panel-nav.js`.

- [ ] **Step 3: Add the module check to `FormAuthorGuard.tsx`**

Replace the `canAuthorForms` function:

```ts
/**
 * Who may author an incident form.
 *
 * The builder writes `form_definition` documents, which the backend also gates —
 * this is the client-side half, so a deep link does not simply render the editor
 * for a role that could not save anything.
 *
 * The `forms` module is part of the answer, not just the role. Both nav entries
 * that link here declare `requiredModule: "forms"`, so a sidebar that hides the
 * link while the route serves it is a contradiction the user experiences as a
 * bug: the feature exists, the menu says no, and the URL says yes.
 *
 * Ghost is exempt, matching `PanelGuard` and `makePanelViewer` — module gating
 * never locks the installation's own administrator out of his own tools.
 */
export function canAuthorForms(viewer: PanelViewer): boolean {
	if (isSuperViewer(viewer)) return true;
	if (!viewer.orgHasModule("forms")) return false;
	if (AUTHOR_LEVELS.includes(viewer.level)) return true;
	const roles = getRoleNames(viewer.roles);
	return AUTHOR_ROLES.some((name) => roles.includes(name));
}
```

- [ ] **Step 4: Give `/forms` an off-state message**

Add the `forms` entry to `MODULE_NOTICES` in `front/src/components/system/ModuleGate.tsx`:

```ts
const MODULE_NOTICES: Partial<Record<ModuleKey, string>> = {
  charts: "ماژول تحلیل و نمودار تصادفات برای این نصب/سازمان فعال نیست.",
  incident_patrol: "ماژول ثبت و مدیریت رخداد (گشت) برای این نصب/سازمان فعال نیست.",
  warehouse: "ماژول مدیریت انبار برای این نصب/سازمان فعال نیست.",
  forms: "ماژول «فرم‌ساز پویا» برای این سازمان فعال نیست. فعال‌سازی آن با مدیر نصب (Ghost) از بخش «ماژول‌ها» انجام می‌شود.",
};
```

- [ ] **Step 5: Wrap the `/forms` layout in `ModuleGate`**

Read `src/app/forms/layout.tsx`, then wrap the guard's children so the off state renders the amber notice instead of an unexplained blank:

```tsx
      <FormAuthorGuard>
        <ModuleGate module="forms" scoped>
          <PanelScopeProvider prefer="organization">
            <FormAuthorHeader />
            {children}
          </PanelScopeProvider>
        </ModuleGate>
      </FormAuthorGuard>
```

`scoped` is required: the builder is licensed **per organization**, so this must consult `orgHasModule`, not the installation feed.

- [ ] **Step 6: Extract `formsNavSection()` in `panel-nav.ts`**

The ORGHEAD and UNIT_HEAD navs each declare their own copy of the section. Replace both with the shared builder, declared above `ORGHEAD_NAV`:

```ts
/**
 * The «فرم‌ساز» section, shared by the org-head and unit-head panels.
 *
 * Authoring is an organizational capability, so it is licensed as `forms` rather
 * than as part of `incident_patrol`: turning the form engine off must not hide
 * the patrol console, and turning patrol off must not disable the builder. The
 * gate matches `FORMS_SCHEMAS` in `back/src/app_modules/moduleConfig.ts`.
 *
 * One definition, because two copies is how the two panels drifted before, and
 * because `FormAuthorGuard` must agree with both.
 */
export function formsNavSection(): PanelNavSection {
  return {
    label: "فرم‌ساز",
    requiredModule: "forms",
    items: [{ href: "/forms", label: "فرم‌های پویا", icon: "clipboard" }],
  };
}
```

In `ORGHEAD_NAV`, replace the inline section with `formsNavSection(),` — keep the comment above it, since it explains the licensing decision. Do the same in `UNIT_HEAD_NAV`.

- [ ] **Step 7: Transpile the guard into the harness**

The guard is a React component, so it cannot be imported by the Node test. Move the predicate into a pure module both can reach. Create `front/src/utils/form-access.ts`:

```ts
import type { PanelViewer } from "@/utils/panels";
import { getRoleNames, isSuperViewer } from "@/utils/panels";
import type { RoleName, UserLevel } from "@/types/auth";

/**
 * Who may author an incident form — role **and** module.
 *
 * Extracted from `components/org/forms/FormAuthorGuard.tsx` so the assertion
 * harness can test it: the guard is a React component and cannot be imported
 * into Node, which is exactly why this rule had no test and drifted out of sync
 * with the nav entry that points at it.
 *
 * The `forms` module is part of the answer, not just the role. Both nav entries
 * that link here declare `requiredModule: "forms"`, so a sidebar that hides the
 * link while the route serves it is a contradiction the user experiences as a
 * bug: the feature exists, the menu says no, and the URL says yes.
 *
 * Ghost is exempt, matching `PanelGuard` and `makePanelViewer`.
 */
const AUTHOR_LEVELS: UserLevel[] = ["Ghost", "Manager", "OrgHead", "UnitHead"];
const AUTHOR_ROLES: RoleName[] = ["OrgHead", "UnitHead"];

export function canAuthorForms(viewer: PanelViewer): boolean {
  if (isSuperViewer(viewer)) return true;
  if (!viewer.orgHasModule("forms")) return false;
  if (AUTHOR_LEVELS.includes(viewer.level)) return true;
  const roles = getRoleNames(viewer.roles);
  return AUTHOR_ROLES.some((name) => roles.includes(name));
}
```

Then reduce `FormAuthorGuard.tsx` to the route component, re-exporting the predicate so existing importers keep working:

```ts
import { canAuthorForms } from "@/utils/form-access";
export { canAuthorForms } from "@/utils/form-access";
```

and delete the `AUTHOR_LEVELS`, `AUTHOR_ROLES` constants and the old function body from that file.

Update the harness import in `.workbuddy-ai/tools/panel-routing.test.mjs` to read from the new pure module, and add it to the `tsc` list in `panel-routing-test.py`:

```python
            "src/utils/form-access.ts",
```

- [ ] **Step 8: Verify**

```bash
python3 .workbuddy-ai/tools/panel-routing-test.py
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
pnpm lint
```

Expected: R4 assertions pass; all pre-existing assertions still pass; 0 type errors.

- [ ] **Step 9: Commit**

```bash
git add front/src/components/org/forms/FormAuthorGuard.tsx front/src/utils/form-access.ts front/src/utils/panel-nav.ts front/src/components/system/ModuleGate.tsx front/src/app/forms/layout.tsx .workbuddy-ai/tools
git commit -m ":bug: fix(forms): Gate the /forms route on the forms module

The sidebar hid /forms when the module was off while the route served it to any
author, and an Editor with no path to it got a silent redirect. The guard now
consults the same module the nav does, the off state explains itself, and the
predicate moves to a pure module so R4 can assert the two agree.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: One `MODULE_KEYS`

It is duplicated verbatim in two components, and `front/AGENTS.md` documents a `moduleKeyFor` resolver in `utils/org.ts` that exists only on the backend. Single definition, `forms` last, doc corrected.

**Files:**
- Modify: `front/src/utils/org.ts`
- Modify: `front/src/components/orghead/OrgSettingsView.tsx`
- Modify: `front/src/components/system/ModuleConfigClient.tsx`
- Modify: `front/AGENTS.md`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  // utils/org.ts
  export const MODULE_KEYS: ModuleKey[];
  ```

- [ ] **Step 1: Add the failing assertion**

Append to `.workbuddy-ai/tools/panel-routing.test.mjs`, in the route-builder block:

```js
// `forms` must stay last. `moduleKeyFor` on the backend returns on the FIRST
// matching key, and `incident_patrol` registers a `incident_report.*` wildcard
// that would otherwise shadow `form_definition` — the gate would never run. The
// frontend list has no resolver, but it must mirror the backend's order or the
// two licensing UIs disagree about what is licensed.
eq("MODULE_KEYS order", MODULE_KEYS, ["charts", "incident_patrol", "warehouse", "forms"]);
eq("MODULE_KEYS covers every ModuleKey", MODULE_KEYS.length, Object.keys(MODULE_LABELS).length);
```

Add to the imports:

```js
import { MODULE_KEYS, MODULE_LABELS } from "./org.js";
```

`utils/org.ts` transpiles standalone — its two `import type` lines are erased, so the
emitted JS has no imports at all. Add it to the `tsc` list in `panel-routing-test.py`:

```python
            "src/utils/org.ts",
```

- [ ] **Step 2: Run the harness to verify it fails**

```bash
python3 .workbuddy-ai/tools/panel-routing-test.py
```

Expected: the transpile aborts — `MODULE_KEYS` is not yet exported from `org.js`.

- [ ] **Step 3: Declare it in `utils/org.ts`**

Add it to `front/src/utils/org.ts`, directly above the existing `MODULE_LABELS`:

```ts
/**
 * The four licensable modules, in the order the backend expects.
 *
 * **`forms` is last on purpose.** `moduleKeyFor` in
 * `back/src/app_modules/moduleConfig.ts` iterates `MODULE_KEYS` and returns on the
 * first match. `incident_patrol` registers whole-schema wildcards including
 * `incident_report.*`, so a `forms` key registered earlier would be shadowed and
 * the `form_definition` gate would never run — authoring would stay reachable
 * with the module switched off.
 *
 * This list has no resolver of its own; it mirrors the backend's order so the two
 * licensing screens cannot disagree about what is licensed.
 */
export const MODULE_KEYS: ModuleKey[] = ["charts", "incident_patrol", "warehouse", "forms"];
```

- [ ] **Step 4: Point both consumers at it**

In `front/src/components/orghead/OrgSettingsView.tsx`, delete line 14:

```ts
const MODULE_KEYS: ModuleKey[] = ["charts", "incident_patrol", "warehouse", "forms"];
```

and add the import:

```ts
import { MODULE_KEYS } from "@/utils/org";
```

`OrgSettingsView` already imports `MODULE_LABELS`-adjacent helpers from `@/utils/org`? If it does, merge into that existing import statement rather than adding a second one from the same module.

Remove `ModuleKey` from that file's type imports if nothing else uses it.

Do the same in `front/src/components/system/ModuleConfigClient.tsx` (delete line 19, add the import, merging with any existing `@/utils/org` import).

- [ ] **Step 5: Correct the documentation**

In `front/AGENTS.md`, the "Dynamic form authoring" section states that `forms` "is also the **last** key in `MODULE_KEYS`, because `moduleKeyFor` returns on the first match" and that the list is "Mirrored in `types/auth.ts` (`ModuleKey`) and `utils/org.ts` (`MODULE_LABELS`)". Both statements are wrong about the frontend: `moduleKeyFor` does not exist in `front/` at all, and `MODULE_KEYS` was duplicated into two components rather than living in `utils/org.ts`.

Replace that paragraph with:

```
`forms` is its own module key, not part of `incident_patrol`. Authoring is an
organizational capability: licensing it must not break filing a report, and disabling
it must not disable patrol. It is also the **last** key in `MODULE_KEYS`, which lives
in `utils/org.ts` — the backend's `moduleKeyFor` returns on the first match, so
an `incident_patrol` whole-schema wildcard registered first would shadow
`form_definition` and the gate would never run. The frontend list has no resolver of
its own; it mirrors the backend's order so the two licensing screens agree. Labels are
in `utils/org.ts` (`MODULE_LABELS`); the key union is in `types/auth.ts` (`ModuleKey`).
```

- [ ] **Step 6: Verify**

```bash
rg -n 'MODULE_KEYS' src --no-heading
python3 .workbuddy-ai/tools/panel-routing-test.py
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
```

Expected: `MODULE_KEYS` is declared **once** (in `utils/org.ts`) and imported by the two consumers; assertions pass; 0 type errors.

- [ ] **Step 7: Commit**

```bash
git add front/src/utils/org.ts front/src/components/orghead/OrgSettingsView.tsx front/src/components/system/ModuleConfigClient.tsx front/AGENTS.md .workbuddy-ai/tools
git commit -m ":recycle: refactor(modules): Declare MODULE_KEYS once

It was duplicated verbatim in OrgSettingsView and ModuleConfigClient. Single
source in utils/org.ts beside MODULE_LABELS, which is where AGENTS.md already
said it lived, with the load-bearing ordering constraint documented at the
definition and asserted in the harness.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Rebuild `/user` — stop showing invented data

`/user` is the `profile` panel and the `getDefaultPanel` fallback for any unmatched viewer. It currently shows a hardcoded name, a hardcoded email, four fabricated usage statistics and three fabricated activity entries, while ignoring `userData` entirely — and its quick-access cards link to `/admin`, which bounces an unauthorized viewer straight back out.

**Files:**
- Create: `front/src/app/user/layout.tsx`
- Modify: `front/src/app/user/page.tsx` (full rewrite)
- Modify: `front/src/utils/panel-nav.ts`

**Interfaces:**
- Consumes: `useAuth()` (`userData`, `userLevel`, `enabledModules`, `orgEnabledModules`, `modulesKnown`, `isGhost`), `usePanelScope()`, `LEVEL_LABELS` from `@/utils/panels`, `MODULE_LABELS` + `MODULE_KEYS` from `@/utils/org`.
- Produces: `PROFILE_NAV.sections` gains two entries (see below).

- [ ] **Step 1: Give the profile panel a shell**

Create `front/src/app/user/layout.tsx`. Read `front/src/app/employee/layout.tsx` first and mirror its exact import paths and composition — the profile panel needs the same guard and shell as every other panel, which is precisely what it was missing:

```tsx
import { PanelGuard } from "@/components/system/PanelGuard";
import { PanelScopeProvider } from "@/components/system/PanelScopeProvider";
import { PanelShell } from "@/components/system/PanelShell";

/**
 * The profile panel's chrome.
 *
 * `/user` had no layout at all, so the one panel every unmatched viewer is
 * redirected to was the only one rendering without a guard, a scope provider or a
 * sidebar — and it did so with hardcoded placeholder data. Same three layers as
 * every other panel: guard, scope, shell.
 *
 * `scopeKind="organization"`: the roles section resolves org names from the scope
 * provider, and every level except a level-less viewer has an organization.
 */
export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <PanelGuard panel="profile">
      <PanelScopeProvider>
        <PanelShell panel="profile" scopeKind="organization">
          {children}
        </PanelShell>
      </PanelScopeProvider>
    </PanelGuard>
  );
}
```

- [ ] **Step 2: Fill `PROFILE_NAV`**

In `front/src/utils/panel-nav.ts`, `PROFILE_NAV.sections` is `[]`, which makes `PanelShell`'s `hasSidebar` false. Replace the empty array with two sections pointing at the same route — the profile is a single page, so the sidebar's job here is identity and orientation, not navigation:

```ts
export const PROFILE_NAV: PanelNav = {
  storageKey: "profile",
  brand: { label: "پنل کاربری", description: "اطلاعات حساب", icon: "user" },
  sections: [
    { label: "حساب", items: [{ href: "/user", label: "اطلاعات حساب", icon: "user" }] },
    {
      label: "دسترسی‌ها",
      items: [
        { href: "/user", label: "ماژول‌های فعال", icon: "settings" },
        { href: "/user", label: "نقش‌ها و محدوده", icon: "users" },
      ],
    },
  ],
};
```

`isNavItemActive` marks all three active at once, which is honest for a single-page panel. Note the brand description stays as it was rather than being reworded — the change here is the sections, not the copy.

- [ ] **Step 3: Rewrite the page against real data**

Replace `front/src/app/user/page.tsx` in full. The fabricated statistics and activities are **deleted, not reworded** — there is no backend source for them, and inventing numbers on an authenticated surface is worse than showing nothing:

```tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { usePanelScope } from "@/components/system/PanelScopeProvider";
import { LEVEL_LABELS } from "@/utils/panels";
import { MODULE_KEYS, MODULE_LABELS } from "@/utils/org";
import type { ModuleKey } from "@/types/auth";

/**
 * The profile panel.
 *
 * This page used to render a hardcoded name and email, four invented usage
 * statistics (`reportsViewed: 156`, `timeSpent: "۱۲۳ ساعت"`) and three invented
 * activity entries, while reading only `hasModule("charts")` from auth and
 * ignoring `userData` entirely. It is the `getDefaultPanel` fallback, so an
 * authenticated user with no matching role landed on a page of fiction about
 * themselves.
 *
 * Everything below comes from a real source or is not shown. There is no
 * endpoint for usage statistics or an activity feed, so those sections are gone
 * rather than reworded — an empty state would be a promise the backend does not
 * keep, and a number would be a lie.
 */

const ROLE_LABELS: Record<string, string> = {
  Ghost: "دسترسی کامل مدیریتی",
  Manager: "مدیر سامانه",
  OrgHead: "سرپرست سازمان",
  UnitHead: "سرپرست واحد",
  Officer: "کارمند",
  Editor: "ویرایشگر داده",
  Enterprise: "کاربر سازمانی",
  Patrol: "مأمور گشت",
};

const SCOPE_LABELS: Record<string, string> = {
  organization: "سازمان",
  unit: "واحد",
};

function displayName(first?: string, last?: string): string {
  return [first, last].filter(Boolean).join(" ").trim() || "کاربر";
}

export default function UserProfilePage() {
  const { userData, userLevel, enabledModules, orgEnabledModules, modulesKnown, isGhost } = useAuth();
  const { orgName, unitName } = usePanelScope();

  const roles = userData?.roles ?? [];

  // An unknown feed degrades to "everything on" — the same rule the guards use.
  // Reporting "on" for a module we have not heard about is the safe direction:
  // it matches what the backend would actually allow.
  const orgActive = isGhost || !modulesKnown || (orgEnabledModules.length > 0 ? orgEnabledModules : enabledModules);

  const levelLabel = userLevel ? LEVEL_LABELS[userLevel] : "—";

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-white/10 bg-gradient-to-l from-blue-950/70 via-slate-900 to-slate-900 p-5 shadow-xl sm:p-6">
        <h1 className="text-2xl font-bold text-white">{displayName(userData?.first_name, userData?.last_name)}</h1>
        <p className="mt-1 text-sm text-slate-400">{levelLabel}</p>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="ایمیل" value={userData?.email} ltr />
          <Field label="موبایل" value={userData?.mobile} ltr />
          <Field label="کد ملی" value={userData?.national_number} ltr />
          <Field label="کد پرسنلی" value={userData?.personnel_code} ltr />
        </dl>
      </header>

      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-white">نقش‌ها و محدوده</h2>
        {roles.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">هیچ نقش سازمانی یا واحدی برای این حساب ثبت نشده است.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {roles.map((role) => {
              const scopeName = role.scopeType === "unit" ? unitName : orgName;
              return (
                <li
                  key={`${role.roleId}-${role.scopeType ?? "none"}-${role.scopeId ?? "none"}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[.02] px-3 py-2.5"
                >
                  <span className="text-sm text-slate-200">
                    {ROLE_LABELS[role.name] ?? role.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {role.scopeType
                      ? `${SCOPE_LABELS[role.scopeType] ?? role.scopeType}: ${scopeName ?? "—"}`
                      : "بدون محدوده"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-white">ماژول‌های فعال</h2>
        <p className="mt-1 text-xs text-slate-500">
          وضعیت ماژول‌هایی که برای سازمان شما فعال است. تغییر این موارد در اختیار مدیر نصب است.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {MODULE_KEYS.map((key: ModuleKey) => (
            <li
              key={key}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.02] px-3 py-2.5"
            >
              <span className="text-xs text-slate-300">{MODULE_LABELS[key]}</span>
              <span
                className={
                  orgActive.includes(key)
                    ? "rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-200"
                    : "rounded-full border border-white/10 bg-white/[.04] px-2 py-0.5 text-[11px] text-slate-500"
                }
              >
                {orgActive.includes(key) ? "فعال" : "غیرفعال"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({ label, value, ltr }: { label: string; value?: string; ltr?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`mt-1 text-sm text-slate-200 ${ltr ? "truncate" : ""}`} dir={ltr ? "ltr" : undefined}>
        {value || "—"}
      </dd>
    </div>
  );
}
```

- [ ] **Step 4: Verify no invented data survives**

```bash
rg -n 'احمد محمدی|ahmad.mohammadi|reportsViewed|timeSpent|recentActivities' src/app/user/page.tsx
```

Expected: no output.

- [ ] **Step 5: Verify the panel is now guarded and reachable**

```bash
ls src/app/user/
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
pnpm lint
python3 .workbuddy-ai/tools/panel-routing-test.py
```

Expected: `layout.tsx` and `page.tsx` only; 0 type errors; lint clean; all assertions pass.

- [ ] **Step 6: Commit**

```bash
git add front/src/app/user front/src/utils/panel-nav.ts
git commit -m ":recycle: fix(profile): Show the signed-in user, not invented data

/user is the getDefaultPanel fallback for any unmatched viewer and rendered a
hardcoded name, email, four fabricated usage statistics and three fabricated
activity entries while ignoring userData. Rewritten against real auth and scope
state, with a PanelGuard + PanelScopeProvider + PanelShell layout so it finally
has the chrome every other panel has.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Wire the four orphaned analytics

Four fully-built analytics have no link anywhere — reachable only by typing a URL. `spatialSafetyIndexAnalytics` is named as a flagship in `front/AGENTS.md`. For damage-analytics, `app/charts/temporal/page.tsx:48-60` already defines a card that never renders, which proves the omission was a bug rather than a decision.

**Files:**
- Modify: `front/src/utils/chartNavigation.ts`
- Delete: `front/src/app/charts/spatial/hotspots/page.tsx`
- Delete: `front/src/app/charts/spatial/regional/page.tsx`
- Delete: `front/src/app/charts/trend/monthly-trend/page.tsx`
- Delete: `front/src/app/charts/trend/yearly-trend/page.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: four new `NavigationItem` ids, each with a `navigationIdToPermissionKey` entry.

- [ ] **Step 1: Confirm the four routes exist and are real**

```bash
ls src/app/charts/spatial/safety-index src/app/charts/spatial/single-vehicle-analytics \
   src/app/charts/overall/company-performance-analytics src/app/charts/temporal/damage-analytics
rg -ln 'در حال توسعه|در حال تvelop' src/app/charts
```

Expected: four `page.tsx` files present; four stub files listed (these are the ones to delete).

- [ ] **Step 2: Write the failing assertion**

Append to `.workbuddy-ai/tools/panel-routing.test.mjs`:

```js
// Every analytics act the backend exposes should be reachable from its section's
// index. Four were not: safety-index, single-vehicle-analytics,
// company-performance-analytics and damage-analytics are fully built pages that
// no navigation listed, so they were reachable only by typing a URL. The
// temporal index even defined a card for damage-analytics that never rendered,
// because the page renders getSectionCharts() instead.
const EXPECTED_SECTION_HREFS = {
  overall: [
    "/charts/overall/road-defects",
    "/charts/overall/monthly-holiday",
    "/charts/overall/hourly-day-of-week",
    "/charts/overall/collision-analytics",
    "/charts/overall/accident-severity",
    "/charts/overall/area-usage-analytics",
    "/charts/overall/total-reason-analytics",
    "/charts/overall/human-reason-analytics",
    "/charts/overall/vehicle-reason-analytics",
    "/charts/overall/company-performance-analytics",
  ],
  temporal: [
    "/charts/temporal/count-analytics",
    "/charts/temporal/severity-analytics",
    "/charts/temporal/night-analytics",
    "/charts/temporal/collision-analytics",
    "/charts/temporal/total-reason-analytics",
    "/charts/temporal/unlicensed-drivers-analytics",
    "/charts/temporal/damage-analytics",
  ],
  spatial: [
    "/charts/spatial/severity-analytics",
    "/charts/spatial/light-analytics",
    "/charts/spatial/collision-analytics",
    "/charts/spatial/safety-index",
    "/charts/spatial/single-vehicle-analytics",
  ],
  trend: ["/charts/trend/severity-analytics", "/charts/trend/collision-analytics"],
};
for (const [section, expected] of Object.entries(EXPECTED_SECTION_HREFS)) {
  eq(`${section} section hrefs`, getSectionCharts(section).map((c) => c.href), expected);
}
```

Add the import:

```js
import { getSectionCharts } from "./chart-navigation.js";
```

- [ ] **Step 3: Run the harness to verify it fails**

```bash
python3 .workbuddy-ai/tools/panel-routing-test.py
```

Expected: the transpile aborts — `chart-navigation.js` does not exist yet.

- [ ] **Step 4: Transpile the chart registry into the harness**

`utils/chartNavigation.ts` declares `icon?: React.ReactNode` in its interface, so the emitted JS has no React import and runs standalone. Add it to the `tsc` list in `panel-routing-test.py`:

```python
            "src/utils/chartNavigation.ts",
```

The emitted file is named after the source, so the import in the test must be `./chartNavigation.js`.

- [ ] **Step 5: Add the four entries to `getSectionCharts`**

In `front/src/utils/chartNavigation.ts`, append to the `overall` case:

```ts
        { id: "company-performance-analytics", label: "عملکرد شرکت‌های بیمه", href: "/charts/overall/company-performance-analytics" },
```

append to the `temporal` case:

```ts
        { id: "damage-analytics-temporal", label: "تحلیل خسارت", href: "/charts/temporal/damage-analytics" },
```

and append to the `spatial` case:

```ts
        { id: "safety-index", label: "شاخص ایمنی", href: "/charts/spatial/safety-index" },
        { id: "single-vehicle-analytics", label: "تحلیل تک‌وسیله‌ای", href: "/charts/spatial/single-vehicle-analytics" },
```

Ids are suffixed where a bare name would collide with another section's entry — `damage-analytics-temporal` follows the existing `severity-analytics-temporal` convention, `safety-index` and `single-vehicle-analytics` are already unique.

- [ ] **Step 6: Add the Enterprise permission keys**

An Enterprise viewer only sees a chart whose `availableCharts` entry is true, so an entry with no permission mapping falls back to looking up the chart's own id. Extend `navigationIdToPermissionKey`:

```ts
  "company-performance-analytics": "companyPerformanceAnalytics",
  "damage-analytics-temporal": "temporalDamageAnalytics",
  "safety-index": "spatialSafetyIndexAnalytics",
  "single-vehicle-analytics": "spatialSingleVehicleAnalytics",
```

- [ ] **Step 7: Delete the four stub pages**

```bash
rm src/app/charts/spatial/hotspots/page.tsx \
   src/app/charts/spatial/regional/page.tsx \
   src/app/charts/trend/monthly-trend/page.tsx \
   src/app/charts/trend/yearly-trend/page.tsx
rmdir src/app/charts/spatial/hotspots src/app/charts/spatial/regional \
      src/app/charts/trend/monthly-trend src/app/charts/trend/yearly-trend 2>/dev/null
```

Then remove the dead metadata in `app/charts/temporal/page.tsx` — the `temporalCharts` array at lines 48-60 is shadowed by the `getSectionCharts("temporal")` call the page renders. Delete the array and pass `getSectionCharts("temporal")`, so the index has one source instead of two that disagree.

- [ ] **Step 8: Verify**

```bash
rg -n 'در حال توسعه|در حال تvelop' src/app/charts || echo "no chart stubs left"
python3 .workbuddy-ai/tools/panel-routing-test.py
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
```

Expected: no stubs left; the five section assertions pass; 0 type errors.

- [ ] **Step 9: Commit**

```bash
git add -A front/src/utils/chartNavigation.ts front/src/app/charts .workbuddy-ai/tools
git commit -m ":sparkles: fix(charts): Wire the four orphaned analytics into nav

spatial/safety-index, spatial/single-vehicle-analytics,
overall/company-performance-analytics and temporal/damage-analytics are fully
built pages that no navigation listed. Adds them to getSectionCharts with their
Enterprise permission keys, and deletes four در حال توسعه stubs plus the dead
metadata array the temporal index never rendered.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: Require authentication on `/charts` and `/maps`

`ModuleGate` consults only the module feed, and `AuthContext.hasModule` returns `true` when `modulesKnown === false` — which is exactly the state an anonymous visitor is in. So `/charts/overall` is reachable while logged out. This is a security hole, not cosmetics.

**Files:**
- Create: `front/src/components/system/AuthGate.tsx`
- Modify: `front/src/app/charts/layout.tsx`
- Modify: `front/src/app/maps/layout.tsx`
- Modify: `.workbuddy-ai/tools/panel-routing-test.py`

**Interfaces:**
- Consumes: `useAuth()` → `{ isAuthenticated, authReady }`.
- Produces:
  ```tsx
  // components/system/AuthGate.tsx
  export function AuthGate({ children }: { children: React.ReactNode });
  ```

- [ ] **Step 1: Write the failing assertion — R5**

In `.workbuddy-ai/tools/panel-routing-test.py`, after the R6 block, add:

```python
    # R5 — every route group that renders data must require authentication.
    # `/charts` and `/maps` had only a ModuleGate, and `AuthContext.hasModule`
    # returns true while the module feed is unknown — which is precisely the
    # state an anonymous visitor is in. So an unauthenticated request reached
    # every chart page.
    for layout in ("charts", "maps", "admin", "orghead", "unit-head", "employee", "patrol", "org"):
        path = FRONT / "src" / "app" / layout / "layout.tsx"
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        guarded = "AuthGate" in text or "PanelGuard" in text or "FormAuthorGuard" in text
        if not guarded:
            print(f"R5 FAILED — src/app/{layout}/layout.tsx has no auth gate")
            sys.exit(1)
    print("R5 ok — every layout that renders data requires authentication")
```

- [ ] **Step 2: Run the harness to verify it fails**

```bash
python3 .workbuddy-ai/tools/panel-routing-test.py
```

Expected: `R5 FAILED — src/app/charts/layout.tsx has no auth gate`.

- [ ] **Step 3: Create `AuthGate`**

`PanelGuard` cannot be reused here: it takes a `PanelId` and would deny a Manager access to `/charts`, which is a legitimate surface for them. This is authentication without authorization.

Create `front/src/components/system/AuthGate.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * Authentication without authorization.
 *
 * `PanelGuard` answers "may this viewer open this panel", which is the wrong
 * question for `/charts` and `/maps`: those are module surfaces that every level
 * may read, not panels. What they were missing was the *first* question — is
 * anyone signed in at all.
 *
 * They previously had only a `ModuleGate`, and `AuthContext.hasModule` returns
 * `true` while the module feed is unknown, which is exactly the state an
 * anonymous visitor is in. So every chart page was reachable logged out.
 *
 * Waits for `authReady` before redirecting, or a page refresh bounces an
 * authenticated user to `/login` before the session has been read.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) router.replace("/login");
  }, [authReady, isAuthenticated, router]);

  if (!authReady || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-7 w-7 animate-spin rounded-full border-2 border-blue-400/70 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
```

- [ ] **Step 4: Apply it to both layouts**

Replace `front/src/app/charts/layout.tsx` in full:

```tsx
import { AuthGate } from "@/components/system/AuthGate";
import { ModuleGate } from "@/components/system/ModuleGate";

/**
 * Charts require authentication, then the `charts` module.
 *
 * The order matters: `ModuleGate` alone cannot be the only gate, because
 * `hasModule` returns true while the module feed is unknown — the state an
 * anonymous visitor is in.
 */
export default function ChartsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <ModuleGate module="charts">{children}</ModuleGate>
    </AuthGate>
  );
}
```

Replace `front/src/app/maps/layout.tsx` in full — read it first and keep its existing `ModuleGate` usage:

```tsx
import { AuthGate } from "@/components/system/AuthGate";
import { ModuleGate } from "@/components/system/ModuleGate";

/** Maps are a module surface like charts, and had the same missing auth gate. */
export default function MapsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <ModuleGate module="charts">{children}</ModuleGate>
    </AuthGate>
  );
}
```

- [ ] **Step 5: Verify**

```bash
python3 .workbuddy-ai/tools/panel-routing-test.py
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
pnpm lint
```

Expected: R5 passes; all prior assertions still pass; 0 type errors.

- [ ] **Step 6: Commit**

```bash
git add front/src/components/system/AuthGate.tsx front/src/app/charts/layout.tsx front/src/app/maps/layout.tsx .workbuddy-ai/tools/panel-routing-test.py
git commit -m ":lock: fix(charts): Require authentication on /charts and /maps

Both layouts had only a ModuleGate, and AuthContext.hasModule returns true
while the module feed is unknown — precisely the state an anonymous visitor is
in — so every chart page was reachable logged out. Adds AuthGate, which asks
whether anyone is signed in without imposing a panel role, since charts are a
module surface every level may read.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Delete the dead routes, and give Manager its announcements link

Four routes with no inbound reference anywhere, none of them real product. Plus one missing link: `announcement.gets` permits Manager, but the only nav entry to announcements is inside EMPLOYEE_NAV's `گشت و رخدادها` section, which is `allowedLevels: ["Patrol"]`.

**Files:**
- Delete: `front/src/app/graph/**`
- Delete: `front/src/app/map/**`
- Delete: `front/src/app/test-upload/**`
- Delete: `front/src/app/chatbot/**`
- Delete: `front/src/app/maps/heatmap/page.tsx`
- Delete: `front/src/app/maps/clusters/page.tsx`
- Delete: `front/src/app/maps/regional/page.tsx`
- Modify: `front/src/components/navigation/ChartNavigation.tsx`
- Modify: `front/src/utils/panel-nav.ts`
- Modify: `front/src/app/user/page.tsx` (drop the `/chatbot` quick-access card, removed in Task 10's rewrite — verify only)

**Interfaces:**
- Consumes: nothing.
- Produces: one new `PATROL_MANAGER_NAV` item.

- [ ] **Step 1: Prove each route has no inbound reference before deleting**

```bash
for r in graph map test-upload chatbot; do echo "== /$r =="; rg -n "href=\"/$r|href=\{`/$r|push\(\"/$r|\"/$r/" src --no-heading | rg -v "^src/app/$r/" || echo "  no inbound reference"; done
rg -n 'maps/(heatmap|clusters|regional)' src --no-heading | rg -v '^src/app/maps/(heatmap|clusters|regional)/' || echo "== map stubs: no inbound reference =="
```

Expected: every route reports "no inbound reference". If any route *does* have one, stop and report it rather than deleting.

- [ ] **Step 2: Delete**

```bash
rm -rf src/app/graph src/app/map src/app/test-upload src/app/chatbot
rm src/app/maps/heatmap/page.tsx src/app/maps/clusters/page.tsx src/app/maps/regional/page.tsx
rmdir src/app/maps/heatmap src/app/maps/clusters src/app/maps/regional 2>/dev/null
```

Rationale for each, in case a reviewer asks: `/graph` is 100% `Math.random()` mock data and its own footer says so; `/map` is the predecessor of `/maps/accidents`; `/test-upload` is a dev scratch page with no guard; `/chatbot` is a countdown to `2025-09-01`, already past, so its timer is frozen at `00 00 00 00`; the three map pages are `در حال توسعه` stubs whose nav entries are already commented out.

- [ ] **Step 3: Remove the commented-out nav entries**

In `front/src/components/navigation/ChartNavigation.tsx`, delete lines 73-75 from `mapSections`:

```ts
    // { id: "heatmap", label: "نقشه حرارتی", href: "/maps/heatmap" },
    // { id: "clusters", label: "تحلیل خوشه‌ای", href: "/maps/clusters" },
    // { id: "regional", label: "تحلیل منطقه‌ای", href: "/maps/regional" },
```

A commented-out nav entry for a page that no longer exists is a trap for the next reader: it looks like a roadmap and is indistinguishable from a pending feature.

- [ ] **Step 4: Give Manager the announcements link**

In `front/src/utils/panel-nav.ts`, `PATROL_MANAGER_NAV` has one section with two items. Append the entry:

```ts
      {
        href: "/employee/announcements",
        label: "اطلاعیه‌ها",
        icon: "bell",
        allowedLevels: ["Manager"],
      },
```

`announcement.gets` is `grantAccess({ levels: ["Manager", "Patrol"] })`, so a Manager can already read them — they just had no way to navigate there. `allowedLevels` is redundant for this panel's `levels` gate (which is already Manager/Ghost) but is stated explicitly because the item points at `/employee/*`, and without it a future panel reuse would leak the link.

- [ ] **Step 5: Confirm `/chatbot` has no remaining reference**

Task 10 rewrote `/user` and dropped its quick-access cards, which held the only inbound link to `/chatbot`. Verify:

```bash
rg -n 'chatbot' src --no-heading || echo "no references"
```

Expected: no references.

- [ ] **Step 6: Verify**

```bash
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
pnpm lint
python3 .workbuddy-ai/tools/panel-routing-test.py
python3 .workbuddy-ai/tools/audit-frontend-actions.py
```

Expected: 0 type errors; lint clean; all assertions pass including R1 (which now has fewer hrefs to check).

- [ ] **Step 7: Commit**

```bash
git add -A front/src/app front/src/components/navigation front/src/utils
git commit -m ":fire: cleanup(routes): Delete four dead routes and three map stubs

/graph is 100% Math.random() mock data, /map is superseded by /maps/accidents,
/test-upload is an unguarded dev scratch page, and /chatbot is a countdown to a
date already past. Also removes the commented-out nav entries that pointed at
them, and gives Manager the announcements link its backend access already allows.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Stop sending org leaders into a request the backend rejects

`/orghead/reports` **lists** correctly — `getOversightList` resolves scope through `resolveOversightScope` → `getOrgReportBase`, which handles org leaders. The **detail** page does not: `OrgIncidentDetailView` fetches `accident.getReportReviewHistory`, whose fn calls `getReportScope`, and that **throws** for anything but Patrol/Manager/Ghost (`back/src/accident/reportScope.ts:97`).

Because both fetches are in one `Promise.all`, the rejection surfaces as a red error box on a page the org head reached by legitimate navigation. The backend fix is handed off in Task 16; this task makes the frontend honest about it.

**Files:**
- Modify: `front/src/components/org/OrgIncidentDetailView.tsx`
- Modify: `front/src/components/org/OversightTable.tsx`
- Modify: `front/src/components/org/OrgReportsView.tsx`

**Interfaces:**
- Consumes: `useAuth().userLevel` (existing).
- Produces:
  ```ts
  // components/org/OversightTable.tsx
  export const canOpenReportDetail: (level: string | null) => boolean;
  ```

- [ ] **Step 1: Make the history fetch non-fatal**

In `front/src/components/org/OrgIncidentDetailView.tsx`, replace the `load` callback. The report itself is readable by an org leader (`accident.get` has no `grantAccess`); only the history call is scoped. Losing the audit trail is a degradation; losing the page is a bug.

```tsx
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const reportResponse = await get(reportId, reportDetailProjection as never);
      setReport(unwrapApiResponse<PatrolReport>(reportResponse));

      // Fetched separately, and never allowed to fail the page.
      //
      // `accident.getReportReviewHistory` resolves its scope through
      // `getReportScope`, which handles only Patrol and Manager/Ghost and
      // **throws** for OrgHead/UnitHead. The org-head report console is built for
      // exactly those roles, so in `Promise.all` its rejection turned a page the
      // org head reached by legitimate navigation into an error box.
      //
      // The report itself is readable by them — `accident.get` carries no
      // `grantAccess`. So a refused history yields an empty trail, and the
      // backend fix in `back/prompt/02-*.md` improves this surface without
      // another frontend change.
      try {
        const historyResponse = await getReportReviewHistory({
          set: { reportId, page: 1, limit: 100 },
          get: historyProjection as never,
        });
        setHistory(unwrapApiResponse<ReviewHistoryItem[]>(historyResponse) || []);
      } catch {
        setHistory([]);
      }
    } catch (cause) {
      setError(getPatrolErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  }, [reportId]);
```

- [ ] **Step 2: Hide the link that cannot work**

In `front/src/components/org/OversightTable.tsx`, add the predicate above `detailHref`:

```ts
/**
 * Whether this viewer may open a report's detail page.
 *
 * The oversight *list* is scoped by `resolveOversightScope`, which handles org
 * leaders via `getOrgReportBase`. The *detail* fetch is not: `accident.get` has no
 * `grantAccess` and so succeeds, but `accident.getReportReviewHistory` uses
 * `getReportScope`, which throws for OrgHead/UnitHead. Offering org leaders a link
 * that cannot resolve is worse than showing them the row inline.
 *
 * One predicate, not an inline level check at each of the four call sites —
 * `fixReviewHistoryScope` in `back/prompt/02-*.md` is the backend fix, and when it
 * lands this returns `true` for everyone.
 */
export const canOpenReportDetail = (level: string | null): boolean =>
  level === "Manager" || level === "Ghost";
```

- [ ] **Step 3: Thread it through the table**

`OversightTable` takes `detailBase: string`. Change it to `detailBase?: string` and render the identifier as plain text when absent:

```ts
  detailBase?: string;
```

`detailHref` already takes `base: string`. At the four call sites (lines 133, 188, 207, 245), each currently reads:

```tsx
href={detailHref(row, detailBase)}
```

Make `detailBase` resolution happen once at the top of the table component instead, from the auth context, so no call site changes shape:

```tsx
import { useAuth } from "@/context/AuthContext";
```

and inside `OversightTable`, before the return:

```tsx
  const { userLevel } = useAuth();
  // `undefined` base renders the identifier as text rather than a dead link.
  const base = canOpenReportDetail(userLevel) ? detailBase : undefined;
```

then replace each `detailHref(row, detailBase)` with a guard:

```tsx
{base ? <Link href={detailHref(row, base)} …>…</Link> : <span …>…</span>}
```

Read lines 125-260 of the file first and preserve each call site's existing markup and classes — only the `Link`-versus-`span` decision changes. Keep the label identical in both branches so the table does not reflow.

- [ ] **Step 4: Simplify `OrgReportsView`'s call site**

`detailBase` stays required (Task 6 made it so, and the panel always knows its own base). `OrgReportsView` passes it straight through; no change needed beyond confirming the prop is still forwarded.

- [ ] **Step 5: Verify**

```bash
rg -n 'Promise.all' src/components/org/OrgIncidentDetailView.tsx || echo "no fail-fast pair left"
rg -n 'canOpenReportDetail' src/components/org/OversightTable.tsx
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
pnpm lint
```

Expected: no `Promise.all` in the detail view; the predicate defined and used; 0 type errors.

- [ ] **Step 6: Commit**

```bash
git add front/src/components/org/OrgIncidentDetailView.tsx front/src/components/org/OversightTable.tsx
git commit -m ":bug: fix(reports): Stop 403-ing org leaders on report detail

The oversight list is scoped through resolveOversightScope, which handles org
leaders, but the detail page fetched review history through getReportScope,
which throws for OrgHead/UnitHead — and Promise.all turned that rejection into
an error box on a legitimately-reached page. History is now a separate,
non-fatal fetch, and the table offers the detail link only to Manager/Ghost
until back/prompt/02 lands the server-side fix.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Write the backend handoff prompt

One backend change is required and is **not** performed here. It goes in `back/prompt/`, following the format of the existing `01-restore-lost-resolve-filing-org-id-and-finish-act-registration.md`: symptom, root cause with `file:line`, the exact change, ambiguities to resolve deliberately, verification commands, constraints.

**Files:**
- Create: `back/prompt/02-fix-review-history-scope-for-org-leaders.md`

**Interfaces:**
- Consumes: nothing.
- Produces: one prompt document. No code change.

- [ ] **Step 1: Confirm the exact backend lines to cite**

```bash
rg -n 'getReportScope' back/src/accident/reviewHistory/reviewHistory.fn.ts back/src/incident_report/reviewHistory/reviewHistory.fn.ts back/src/incident_report/oversight/filters.ts
rg -n 'throw new Error' back/src/accident/reportScope.ts
```

Expected: `getReportScope` imported and called at `reviewHistory.fn.ts:13` and `:20`; `getOrgReportBase` already used by `oversight/filters.ts`; the throw at `reportScope.ts:97`. Use whatever line numbers the command actually reports.

- [ ] **Step 2: Write the prompt**

Create `back/prompt/02-fix-review-history-scope-for-org-leaders.md` with this content:

```markdown
# Backend task: let org leaders open the report detail page

## Symptom

An `OrgHead` or `UnitHead` opens `/orghead/reports`, sees a populated oversight
console, clicks a row, and lands on a red error box. The same happens on
`/unit-head/reports`. A `Manager` and a `Ghost` see the same pages work.

## Root cause

The **list** and the **detail** resolve their scope through two different helpers,
and only one of them knows about org leaders.

The list works. `back/src/incident_report/oversight/filters.ts:15-28` says so
explicitly:

> Reuses `getOrgReportBase` rather than `getReportScope`, because `getReportScope`
> handles only Patrol and Manager/Ghost and **throws** for org leaders — which is
> exactly the audience of this console.

The detail does not. `back/src/accident/reviewHistory/reviewHistory.fn.ts:13` and
`back/src/incident_report/reviewHistory/reviewHistory.fn.ts:20` both call
`getReportScope`, which ends at `back/src/accident/reportScope.ts:97`:

```ts
throw new Error("شما اجازه مشاهده گزارش‌ها را ندارید");
```

So for an org leader the history lookup rejects. The frontend had both fetches in
one `Promise.all`, which turned that rejection into a failed page rather than a
missing audit trail — the report itself is readable, because `accident.get`
(`back/src/accident/get/mod.ts`) carries no `grantAccess` at all.

The org-head oversight console was built for org leaders. This is its primary
audience and none of them can open a single row.

## Task

In both files, replace `getReportScope(context.user)` with
`await getOrgReportBase(context.user)`:

- `back/src/accident/reviewHistory/reviewHistory.fn.ts`
- `back/src/incident_report/reviewHistory/reviewHistory.fn.ts`

`getOrgReportBase` is `async` and takes an optional `userId`; `getReportScope` is
sync. The surrounding `findOne` is already awaited, so the call site becomes:

```ts
const report = await accident.findOne({
  filters: {
    _id: new ObjectId(reportId as string),
    ...(await getOrgReportBase(context.user)),
  },
  projection: { review_history: 1 },
});
```

Update the import in each file accordingly. Then delete `getReportScope` from
`back/src/accident/reportScope.ts` **only if** nothing references it afterwards —
run `rg -n 'getReportScope' back/src` first and report what still uses it. Its
remaining callers are `incident_report/gets` and the two dashboards, which are
Patrol/Manager surfaces and may legitimately want the narrower scope. Do not
change their behaviour as part of this task; just say in your summary what still
depends on it.

## Ambiguities — resolve deliberately and say so

1. `getOrgReportBase` filters org leaders by **`road._id`**, resolved from
   `organization.road`. Legacy accidents carry no `organization` relation at all.
   Confirm the org-leader scope still matches them, or say explicitly that it does
   not. This is the same tension `oversight/filters.ts:19-23` documents, and that
   file's answer is that the scope's `$or` matches both populations — confirm the
   `accident` collection's rows satisfy it.
2. `getOrgReportBase` **throws** `"شما دسترسی به گزارش‌های این سازمان ندارید"`
   when an org leader's scope resolves to zero roads. A history request should
   arguably return an empty list instead, so the UI degrades rather than errors.
   Decide, and say which you chose and why.
3. Does a UnitHead see only their own unit's reports through this path, or every
   road their organization owns? `getOrgReportBase` takes no `unitId`, so it is the
   latter — which matches the list's behaviour, but confirm that is intended.

Do not silently pick. If you cannot determine one of these from the code, implement
the safest reading and flag it explicitly.

## Verification

```bash
cd back && deno check mod.ts    # must be clean
python3 .workbuddy-ai/tools/audit-module-acts.py
```

Then exercise the real flows, because a clean typecheck proves nothing about scope:

1. As an **OrgHead**: `/orghead/reports` lists rows; clicking one opens the detail
   page and the review trail renders. This is the case that fails today.
2. As a **UnitHead**: same, via `/unit-head/reports`.
3. As a **Patrol** officer: `accident.getReportReviewHistory` still returns only
   their own reports' history. `getReportScope` narrowed on `officer._id`;
   `getOrgReportBase` narrows on `officer._id` for Patrol too, so this must not
   regress — confirm it.
4. As a **Manager** and a **Ghost**: unchanged behaviour.

## Constraints

- **Deno strips types without checking them.** `deno task bc-dev` will boot
  successfully with a broken import inside an act body and throw at runtime on the
  first request that reaches it. A successful boot proves nothing; you must
  exercise step 1 above.
- Do not change any act's `validator`, `preAct`, `grantAccess` levels, or
  `set`/`get` shape. `front/` type-checks against the generated declarations, so
  changing a contract breaks it silently until regeneration.
- Do not touch `getOrgReportBase`, `getOrgScopedRoadIds`, `isManagerViewer` or
  `isOrgLeaderLevel` — the oversight console already depends on their current
  behaviour.
- If you regenerate declarations, use
  `TYPE_GENERATION=true deno run -A mod.ts` and copy the result to
  `front/src/types/declarations/`. Never hand-edit `selectInp.ts`.
```

Note the `## Symptom` heading above is a typo — fix it to `## Symptom` when writing the file.

- [ ] **Step 3: Verify the document is complete**

```bash
rg -n '^## ' back/prompt/02-fix-review-history-scope-for-org-leaders.md
rg -n '^## Symptom$' back/prompt/02-fix-review-history-scope-for-org-leaders.md
```

Expected: the seven `##` sections, with `## Symptom` spelled correctly.

- [ ] **Step 4: Commit**

```bash
git add back/prompt/02-fix-review-history-scope-for-org-leaders.md
git commit -m ":memo: docs(back): Hand off the review-history scope fix

The org-head oversight console is built for org leaders, and every one of its
detail links 403s: the list resolves scope through getOrgReportBase while the
detail uses getReportScope, which throws for OrgHead/UnitHead. Frontend now
degrades honestly (Task 14); this is the server-side fix.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Final Verification

Run all of it. Every command must pass before this is considered done.

```bash
cd front

# G2 — the invariant: no component constructs a panel URL
rg '/org/\$\{' src/components && echo "FAIL: hardcoded org URL" || echo "ok: no hardcoded /org/\${}"

# G1 — one org surface
find src/app/org -name page.tsx     # expect exactly 1: src/app/org/page.tsx

# The suite, including R1-R6
python3 ../.workbuddy-ai/tools/panel-routing-test.py

# Types and lint
rm -f tsconfig.tsbuildinfo && pnpm exec tsc --noEmit
pnpm lint

# Cross-repo static audits
python3 ../.workbuddy-ai/tools/audit-frontend-actions.py
python3 ../.workbuddy-ai/tools/audit-module-acts.py
```

Then the manual walk, per role. A clean typecheck does **not** prove reachability —
that is why R1 and R2 are filesystem assertions.

| Role | Walk | Expected |
| --- | --- | --- |
| OrgHead | `/orghead` → org-chart → click a unit | stays in `/orghead` |
| OrgHead | people → click a member; units/new; processes/new | all reachable, all stay in `/orghead` |
| OrgHead | reports → a row | summary inline, no dead link (Task 14) |
| UnitHead | members → org-chart → reports → warehouse | all reachable |
| Patrol | `/patrol/dashboard` → reports → detail; `/employee/{warehouse,map,announcements}` | all reachable |
| Manager | `/admin` → سازمان‌ها → pick an org | lands on `/orghead` scoped to it |
| Manager | `/patrol-manager/reports` sidebar | اطلاعیه‌ها present |
| Ghost | `/admin` → ماژول‌ها → `forms` off → `/forms` | refused with a reason |
| Ghost | `forms` on → `/forms` | builder loads |
| Enterprise | `/charts/overall`, `/temporal`, `/spatial` | the 4 new analytics in the index |
| anyone | `/charts/overall` logged out | redirected to `/login` |
| anyone | `/user` | real name and roles, no invented statistics |

## What this plan does not do

Recorded so a later reader does not mistake these for oversights:

| # | Item | Why |
| --- | --- | --- |
| F1 | Web form *runner* | `getForPatrol` has zero callers — nothing in the browser can fill a form. A feature, not a panel defect. |
| F2 | Dark-theme unification | separate 4-phase spec at `front/docs/superpowers/specs/2026-10-04-dark-theme-unification-design.md`, 93 dependent files |
| F3 | `ware` create/edit UI | `actions/ware/` is `gets.ts` only, so the warehouse cannot be filled. A feature. |
| F4 | `AdminNavGroup.requiredModule` | `adminSidebarConfig.ts:47-52` has no module field; speculative until a licensed admin feature needs one |
| F5 | `accident.get` has no `grantAccess` and no `preAct: [setUser]` | works by framework accident. Worth a backend issue. |
| F6 | `PanelShell` for `/charts` | 33 routes with no sidebar or scope picker — a larger consolidation |
| F7 | Docs claiming an `OrgAnalyticsPanel` fix | `.superpowers/sdd/…/final-package.md` says it was fixed; it still projects the removed `incident_type`. `docs/forms/08` §9 is accurate. |
