# 49 — Enhanced Prompt: Org & Unit Dashboard (هر آزادراه یک سازمان) + Patrol Surfacing (Frontend)

Copy everything below this line into your frontend AI agent.

---

## Role & Goal

You are working on the **Next.js web frontend** (`front/`) of the LESEN traffic-management system (backend = Deno + Lesan on port 1404; web talks to it through server actions → `AppApi().send`).

The backend has shipped a full **organizational structure**: each highway (`road`) is an **organization** owning a **unit tree (org chart)** where **patrol units and patrol officers are first-class nodes**. New backend models/acts exist and the generated API types are **already synced** to `front/src/types/declarations/selectInp.ts`. Your task is to build the web **Org & Unit dashboard** on top of them — org selector + summary, an org-chart viewer/tree, unit management (create/edit, assign head / parent / officers / vehicles), and patrol surfacing (per-unit officers/vehicles, report list with **incident-type** filter + badge).

The web app is **licensed per-deployment**: modules can be turned OFF by the operator (Ghost). This whole Org & Unit dashboard is part of the **`incident_patrol`** module surface, so it must be **hidden (and its routes guarded)** whenever that module is off — read the module flags and gate your UI accordingly (details in «Module-aware gating» below). The raw `organization`/`unit` **data** acts stay core; only this dashboard feature-surface is module-gated.

Do **not** modify backend code. Do not add models/acts. Build only the frontend.

## Backend already live (read-only reference — do not change)

New models & acts you will call (all typed in `ReqType["main"]`):

| Schema | Acts (all exist) |
| --- | --- |
| `organization` | `add`, `get`, `gets`, `update`, `remove`, `count` — code unique; `add` needs `roadId` |
| `unit` | `add`, `get`, `gets`, `update`, `updateRelations`, `remove`, `count`, **`getOrgChart`** — `organization`/`road` denormalized on every unit; cross-org tree guarded server-side |
| `user` | (existing mgmt) — users now carry `roles:[{roleId,name,scopeType?,scopeId?}]` + `organizations`/`units` relations |
| `accident` | `getMyReports`, `gets`, `get`, `reviewReport`, … — every report now carries `incident_type` (`accident|road_breakdown|road_obstacle|other`), `incident_payload`, `incident_severity`; `gets`/`getMyReports` accept an **`incidentType`** filter; `nearbyAccidents` payload includes `incident_type` + `incident_severity_name` |
| `accident_process` | `add`, `get`, `gets`, `update`, `activate`, `duplicate`, `remove`, `count`, **`getForPatrol`** — org-scoped wizard builder |
| `app_modules` | **`getModules`** (any authed user) + **`setModules`** (Ghost-only) — read the enabled-module set |

> **Module feed for the web app:** `user.login` / `user.getMe` return **`modules`** (installation-level keys) and — when the caller resolves to one org — **`orgModules`** (that org's effective keys). Per org you can also call `organization.getModules` (`set { organizationId }` → `{ deployment, modules, effective }`). Effective = installation AND org. Backend hard-blocks calls to a disabled module (installation or org) for everyone except Ghost — installation message «این ماژول برای این نصب فعال نیست», org message «این ماژول برای این سازمان فعال نیست». Surface those messages, don’t fabricate other reasons.

Warehousing (`ware`/`inventory`/`consumption`/`goods_receipt`/`stock_movement`/`goods_request`) is **out of scope for this task** (a later prompt) — ignore it. (`warehouse` module off ⇒ no warehouse UI; unrelated to this dashboard.)

### Exact act shapes to code against

- `organization.gets`: `set { page?, limit?, skip?, search?, is_active? }` → returns a **flat array**. `organization.add`: `set { code, name, enName?, description?, is_active?, roadId }` → doc. `organization.update`: `set { _id, …pure, headId?, logoId? }`.
- `unit.gets`: `set { page?, limit?, organizationId?, roadId?, type?, parentUnitId?, headId?, search?, is_active? }` → **`{ data, totalCount }`**. Type enum values: `Patrol|Station|Ops|Maintenance|Logistics|Administration|Warehouse|General`.
- `unit.add`: `set { code, name, type?, … , organizationId, roadId, parentUnitId?, headId? }` (server rejects a `roadId` that isn't the org's road and a `parentUnit` in another org — surface those Persian errors).
- `unit.updateRelations`: `set { _id, organizationId?, roadId?, parentUnitId?, headId?, officerIds?: string[], removeOfficerIds?: string[], vehicleIds?: string[], removeVehicleIds?: string[] }`.
- **`unit.getOrgChart`**: `set { orgId?, activeRoleId? }`, flag `get { units?:0|1, organization?:0|1, stats?:0|1 }`. Response: `{ units?: Unit[], totalCount?, organization?, stats?: [{_id:<type>, count}] }`. Each unit is returned **flat** with `parentUnit: {_id,name}` + `head:{_id,first_name,last_name}` + `type` — the client rebuilds the tree by `parentUnit._id`. Manager/Ghost must pass `orgId`.
- `accident.gets`: `set { page, limit, incidentType?, …extensive filters }` → flat array. `accident.getMyReports` supports `incidentType` too.
- `accident_process.gets`: `set { page?, limit?, organizationId?, status?, incident_type?, search? }` → `{data,totalCount}`. `getForPatrol` is Patrol-only; on web use `accident_process.gets` (Manager).

### Module-aware gating (do this up front, tiny and central)

- Module keys: `charts`, `incident_patrol`, `warehouse`. This dashboard = **`incident_patrol`**. Ghost is always exempt server-side and in your UI you still render for Ghost.
- Read the enabled set once at login: `user.login` / `user.getMe` return `modules: string[]` (installation) and, for a single-org caller, `orgModules: string[]` (that org's effective set). Persist both beside the session (the same place `AuthContext` stores the user). When the user opens a specific org, prefer `organization.getModules({ organizationId })` → `effective` for that org.
- Expose `enabledModules`/`hasModule(key)` from `AuthContext` (or a tiny module context) so any page/layout can gate; keep it org-aware where the UI is scoped to one org.
- Rule for this dashboard: **if `incident_patrol` is NOT effective for the org in view (and the caller is not Ghost) → the `/org` route group and its navbar entries are hidden** (a `RoleNotice`-style module notice explains the module is not enabled for this organization/installation). Don’t gate the underlying `organization`/`unit` API calls themselves from the UI (they’re core); only hide the dashboard surface.

## What already exists on the front (reuse — do not reinvent)

- **Pattern:** pages are client components under `src/app/…`; each backend call is a **server action** under `src/app/actions/<model>/<act>.ts` that does `AppApi().send({service:"main",model,act,details:{set,get}},{token})`. See `src/app/actions/accident/getManagerDashboard.ts`, `src/app/actions/patrol_unit/*`.
- **Types:** `src/types/declarations/selectInp.ts` already contains `ReqType` for `organization`/`unit`/`accident_process`/`getOrgChart`/`app_modules` etc. Use `ReqType["main"][…]` generics in actions.
- **Helpers:** `unwrapApiResponse<T>` + `getPatrolErrorMessage` in `@/utils/api-response`. Add org/unit-specific Persian branches there as needed (including the module message «ماژول» → «این بخش برای این نصب فعال نیست.»).
- **Patrol UI kit** `src/components/patrol/`: `PatrolWorkspace` (workspace shell + menu), `DashboardHeader`, `SummaryMetrics`, `ReportList`, `StatusBadge`, `ui.tsx` (`PanelCard`, `PageSkeleton`, `RetryErrorBox`), `operations/*`. **Reuse these** for visual consistency (slate dark theme, RTL, Persian).
- **Auth:** `useAuth()` from `@/context/AuthContext` exposes `userLevel` (`Ghost|Manager|Editor|Enterprise|Patrol`). Route-shell pattern = `src/app/patrol-manager/layout.tsx` wrapping `<PatrolWorkspace manager>`.
- **Layout/nav:** top `Navbar` + `AdminAwareFooter` in `src/app/layout.tsx`; per-area shells are `layout.tsx` under route folders.
- **Projections:** `src/services/patrol-projections.ts` holds `reportListProjection`, `reportDetailProjection`, etc. (backend TODO §7 still open: include `incident_type` for badges).

## Prior art to model screens on

The author's Satek frontend has the exact org-head workspace (read the patterns, adapt to this repo's conventions):
`/Users/syd/work/sitak/lesanSatek/front/src/app/orghead/` → `org-chart/` (chart client + `buildTree` by `parentUnit._id`), `units/`, `users/`, `settings/`, plus `backDocs/32-unit-getOrgChart-api.md` (flat-array → client tree contract). Adapt, don't copy verbatim.

## Task — work in phases, STOP after each for review

### Phase A — Foundations (action wrappers + types + projections)
1. Create server actions under `src/app/actions/` following the `patrol_unit`/`accident` pattern:
   - `organization/{getOrganizations,getOrganization,addOrganization,updateOrganization,removeOrganization,countOrganizations}` (or one file per act with the repo naming — match `accident/getManagerDashboard.ts` style).
   - `unit/{getUnit,getUnits,addUnit,updateUnit,updateUnitRelations,removeUnit,getOrgChart}`.
   - `accident_process/{getAccidentProcesses,getAccidentProcess}` (read-side only this phase).
   - `app_modules/getModules` (used to refresh the enabled module set).
   - Keep `details.get` minimal-but-sufficient typed projections you define in one place (like `patrol-projections.ts`); prefer `ReqType` set/get generics.
2. Extend `src/types/auth.ts` so `UserData`/stored-user includes `roles` and `modules` (backend returns both; harmless if absent) — but keep `UserLevel` unchanged (no new `level`).
3. Surface `modules`/`hasModule("incident_patrol")` from `AuthContext` (seeded from the stored user / login response).
4. Extend `src/services/patrol-projections.ts`: add `incident_type: 1`, `incident_payload` (as needed), `incident_severity:{_id,name}` to `reportListProjection`/`reportDetailProjection`.
5. Verify: `npx next lint` clean, `npx tsc --noEmit` clean (or `next build`).

### Phase B — Org list + selector + summary (Manager/Ghost)
- New route group, e.g. `src/app/org/` with its own `layout.tsx` shell (mirror `PatrolWorkspace`, but org-focused; label it e.g. «سازمان‌ها / مدیریت آزادراه»).
- **Gate the group:** visible to Manager/Ghost when `hasModule("incident_patrol")`; otherwise show a module-notice panel («ماژول ثبت و مدیریت رخداد برای این نصب فعال نیست») instead of the children. Wire the navbar entry with the same condition.
- `org/` index: list orgs (`organization.gets`) as cards/table → search + active toggle; selecting an org routes to `org/[orgId]/`.
- `org/[orgId]/` dashboard shell: org header (name/code/road), KPI row from `unit.getOrgChart({orgId},{units:0,organization:1,stats:1})` → total units + per-`type` counts (گشت/پاسگاه/…). Buttons to «نمودار سازمانی» and «واحدها».
- Access: Manager/Ghost only (mirror existing `RoleNotice` gate). All org calls must pass `orgId` (backend requires it for Manager).

### Phase C — Org chart page (`unit.getOrgChart`)
- `org/[orgId]/org-chart/`: one `getOrgChart({orgId},{units:1,organization:1})` call → render the flat list as a tree.
  - Build the tree client-side from `parentUnit._id` (roots = units whose parent is missing/not in the set); implement `buildTree` and render nested groups.
  - Node card shows `name`, `type` (colored chip; patrol = گشت, station = پاسگاه…), `head` (first/last name), and a link to the unit edit page.
  - Toggle for `stats` banner (count per type).
- If an org has no units, show an empty state with a CTA to create the first (HQ) unit (Phase D).

### Phase D — Unit management
- `org/[orgId]/units/`: `unit.gets({organizationId, …filters: search, type, parentUnitId, is_active})` → table with type chips + head + parent; inline filters (type select, search).
- `org/[orgId]/units/new` + `org/[orgId]/units/[unitId]`: `unit.add`/`unit.update`/`unit.updateRelations` forms:
  - Pure fields (code, name, description, type, address, phone, head_title, is_active).
  - Relation pickers: **organization + road** (fixed from the org context), **parentUnit** (tree select of units in this org only), **head** (officer picker), and tab for **officers / vehicles** add-remove lists (load users/vehicles via existing `user.getPatrolOfficers`/`vehicle.gets`, or `unit.officers`).
  - **Surface backend Persian guard errors verbatim** (road mismatch, cross-org parent, member-not-in-unit on remove).
- `unit.update` must be disabled for nothing special server-side, but keep the save-draft mental model: always full-form submit, and on error show the returned Persian message (via `getPatrolErrorMessage` additions).
- Deleting a unit: call `unit.remove`; if it has children the server rejects (children-first) — show that message with a hint.

### Phase E — Patrol surfacing + incident-type
1. **Per-unit patrol panel** (on `org/[orgId]/units/[unitId]`): list `officers` (from `unit.get` projection) with a chip `level:"Patrol"`/role, `vehicles`, and `head`. Actions: add/remove via `unit.updateRelations` (officer picker restricted to `user.getPatrolOfficers`).
2. **Reports with type filter + badge** (Manager review list): extend the existing manager reports browsing (or a new `org/[orgId]/reports/`) driven by `accident.gets` with an `incidentType` filter control (all/accident/road_breakdown/road_obstacle/other) and an `incident_type` badge on each row (extend `StatusBadge`/`ReportList` props). Non-accident rows read `incident_payload.description` when present.
   - Charts/analytics already exclude non-accident server-side — leave chart screens alone.
3. **Process preview (read-only):** on the org dashboard show the active `accident_process` (via `accident_process.gets({organizationId,status:"active"})`): name, version, `incident_type` scope, step/question count, link «مشاهده فرآیند» that renders steps/questions read-only from `accident_process.get`. **Do not build the builder editor yet** (separate follow-up).

## Frontend conventions — follow strictly
- RTL + Persian; existing dark slate theme + Tailwind classes as used in `components/patrol`.
- Server action file pattern and `unwrapApiResponse` for all reads; Persian toasts for success/errors (repo uses `react-hot-toast`, already mounted).
- Reuse `PageSkeleton`, `RetryErrorBox`, `PanelCard`, `RoleNotice`; add new small components under `src/components/org/` (do not scatter UI in pages).
- Module gating is centralized (via `AuthContext.hasModule`), not copy-pasted per page; a disabled-module UI shows the Persian notice rather than firing dead API calls.
- Type everything via the generated `ReqType`/declaration types where possible; avoid `any` in new code.
- Do **not** invent backend capabilities: there is **no** `shift`-count-per-`unit` API yet (shifts still point at legacy `patrol_unit`); do not fabricate active-shift chips for a `unit`. Report filtering uses `accident.gets`/`getMyReports` `incidentType` only.
- Keep `{ success, body }` semantics through actions exactly as existing actions do.

## Verification (must pass before each STOP)
1. `npx next lint` — clean.
2. Type-check: `npx tsc --noEmit` (or `npm run build`) — clean.
3. Manual smoke against a running backend (`cd ../back && deno task bc-dev`; login as a seeded Manager/Ghost): create two orgs on two roads → build HQ → Station → Patrol tree → assign an officer + vehicle → see the tree + counts; open the patrol unit and reports with `incident_type` filter; verify a non-accident (`road_breakdown`) report shows the badge. Confirm the backend rejects cross-org parent and the UI shows that Persian message.
4. Module smoke (Ghost only): via the playground call `app_modules.setModules` with `incident_patrol.enabled = false`, then as a Manager confirm the `/org` dashboard is hidden behind the module notice; restore `enabled = true` and confirm it reappears. (If `setModules` is not handy, at least verify the UI reacts to a `modules` array without `"incident_patrol"`.)

## Working rules
- Stop after each phase (A→B→C→D→E) and summarize for review; don’t batch phases.
- Don’t touch backend, don’t reformat unrelated files, don’t refactor charts.
- Never log tokens/passwords.

## Toolchain
- Node via fnm (`node -v` ≈ 22); pnpm 10. Dev: `npm run dev` (port 3000). Backend: `cd ../back && deno task bc-dev` (port 1404). If generated types are ever stale, they live in `front/src/types/declarations/selectInp.ts` (already current — do not hand-edit).

## Out of scope / follow-ups (do NOT build)
- Warehouse UI (Part III) and JIT (its own module + a later prompt).
- The module **config page** (Ghost-only toggle UI) — a separate prompt (`50-MODULE_ACTIVATION_PROMPT.md`); here you only consume `modules`.
- `accident_process` **builder editor** (add/activate/duplicate UI) — later prompt.
- OrgHead/UnitHead role-based scoping UI + org picker auto-scope (backend gate is Manager for builders; role-driven scoping is a backend follow-up). Keep Manager/Ghost flow.
- Deleting legacy `patrol_unit`/`police_station` screens.
- Active-shift-per-`unit` widgets (backend follow-up).
