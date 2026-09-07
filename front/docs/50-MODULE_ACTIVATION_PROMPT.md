# 50 — Enhanced Prompt: Module Activation / Licensing UI (Web) — consume + configure per-deployment modules

Copy everything below this line into your frontend AI agent.

---

## Role & Goal

You are working on the **Next.js web frontend** (`front/`) of the LESEN traffic-management system (backend = Deno + Lesan; web calls it through server actions → `AppApi().send`).

The backend now enforces **per-deployment module licensing** for the three sellable products:

| key | محصول | Web route groups (your job to gate) |
| --- | --- | --- |
| `charts` | تحلیل و نمودار تصادفات | `/charts/**`, `/maps/**` (تحلیلی/heatmap/cluster/regional/comparison)، `/graph` |
| `incident_patrol` | ثبت رخداد موبایل + داشبورد گشت | `/patrol/**`, `/patrol-manager/**`, `/org/**` (داشبورد سازمان/واحد) |
| `warehouse` | مدیریت انبار | (هیچ صفحه‌ای فعلاً — برای آینده) |

Everything else is **core** and never gated: خانه، لاگین، پنل کاربری `/user`، پنل مدیریت داده `/admin` (شامل **CRUD گزارش/تصادف** در پنل مدیر)، و صفحه تنظیمات ماژول (خود همین صفحه).

Your task has two halves:
1. **Consume** the enabled-module set and hide/guard the UI of disabled modules across the whole web app (nav, route groups, in-page actions). Modules are licensed in **two layers**: installation-wide, and **per organization** (multi-tenant servers hosting many customer orgs). Effective for an org = installation AND org. The backend hard-blocks disabled modules — your job is graceful UX.
2. **Configure** (Ghost only): toggle modules at the **installation** level and per **organization** at runtime (installers configure once; the Ghost account is never handed to the customer).

Do **not** modify backend code. Build only the frontend.

## Backend contract (already live — read-only)

- `user.login` / `user.getMe` responses include **`modules: string[]`** (installation keys) and — when the caller resolves to one org — **`orgModules: string[]`** (that org's effective keys) → best source at login.
- `app_modules.getModules`: `set {}`, `get { modules?:0|1 }` → `{ modules: [{ key, enabled }] }` (installation). Any authenticated user may call it.
- `app_modules.setModules`: **Ghost-only**; `set { modules: [{ key, enabled }] }` (installation; `key` ∈ `charts|incident_patrol|warehouse`).
- `organization.getModules`: `set { organizationId }`, `get { deployment?:0|1, modules?:0|1, effective?:0|1 }` → `{ deployment: string[], modules: [{key,enabled}], effective: string[] }` (org layer; any user with access to that org).
- `organization.setModules`: **Ghost-only**; `set { organizationId, modules: [{ key, enabled }] }` → org layer. `organization.module_flags` absent = inherit installation (all on).
- Disabled-module calls throw (for everyone **except Ghost**): installation → «این ماژول برای این نصب فعال نیست», org → «این ماژول برای این سازمان فعال نیست». When an explicit org/unit is targeted, even a Manager is blocked on a module-off org. Types are already in `front/src/types/declarations/selectInp.ts`.

## What already exists on the front (reuse)

- Server-action pattern (`src/app/actions/<schema>/<act>.ts` → `AppApi().send(...,{token})`), helpers `unwrapApiResponse` / `getPatrolErrorMessage` (`@/utils/api-response`).
- `AuthContext` (`@/context/AuthContext`) holds `userLevel`, `userData`, `login/logout`; session stored in cookie + `sessionStorage`. **Login page** stores the login response — thread `modules` through here.
- `Navbar` (`src/components/organisms/Navbar.tsx`) builds `publicItems` + role-based `panelItems`; route shells `src/app/patrol-manager/layout.tsx`, `src/app/patrol/layout.tsx` wrap area pages; `components/patrol/…` has `RoleNotice`, `PanelCard`, `PageSkeleton`, `RetryErrorBox` styling to mirror.
- Existing per-user gating for Enterprise charts (`availableCharts`) is **separate/orthogonal** — leave it alone.

## Task — work in phases, STOP after each for review

### Phase A — Module feed (types + context + actions)
1. `src/app/actions/app_modules/getModules.ts` / `setModules.ts` and `organization/getModules.ts` / `setModules.ts` (typed via `ReqType`).
2. Extend `src/types/auth.ts`: `UserData`/session gains `modules: string[]` and `orgModules?: string[]`.
3. `AuthContext`: store `modules` (and `orgModules`) from `login()`; expose `enabledModules`, `orgEnabledModules`, `hasModule(key)` (installation), `orgHasModule(key)` (org-effective, falls back to installation when no single org), and `refreshModules()` (calls `app_modules.getModules` / `organization.getModules` for the active org). `Ghost` is always treated as enabled (mirrors the backend exemption).
4. Verify: `npx next lint`, `npx tsc --noEmit`.

### Phase B — Gate nav + route groups
1. `Navbar`: render each module-owned item only when its module is effective; keep core items always. Charts/maps items are under `charts`; patrol-manager/patrol under `incident_patrol`; org/unit dashboard under `incident_patrol` (per-org-effective when an org is active).
2. Route guards: a small client `ModuleGate` (mirrors `RoleNotice`): wraps each module-owned `layout.tsx` (charts, maps, patrol, patrol-manager, org) — if the module is off and caller isn’t Ghost, render a Persian module-notice panel instead of children. Wrap the shell, not every page.
3. In-page: no dead calls to disabled modules (gate before fetch).
4. Verify lint + type-check; manual toggling per Phase D.

### Phase C — Ghost-only config page (two layers)
1. New route reachable only by Ghost, e.g. `src/app/admin/system/page.tsx` (entry in admin/`Navbar` for Ghost only — «تنظیمات ماژولها / سیستم»).
2. **Installation tab:** load `app_modules.getModules` → 3 module cards with status chip (فعال/غیرفعال) + toggle.
3. **Organizations tab:** list orgs (`organization.gets` with a search), per org show its `organization.getModules` chips + toggle. On toggle call `organization.setModules` (full list), refresh. Default (no `module_flags`) = «پیرو نصب» — display that, and treat the toggle as materializing an explicit list.
4. On any toggle: refresh the feed (and `AuthContext` for the acting Ghost session); Persian toasts.
5. **Ghost-only enforcement in UI:** non-Ghost never sees these routes/toggles; backend also rejects `setModules` (surface the framework error via `getPatrolErrorMessage` if it slips through).
6. Optional (nice): read-only status chips on a Manager-visible «وضعیت سامانه» showing installation + per-org effective for the orgs they manage.

### Phase D — Errors & polish
1. `getPatrolErrorMessage`: map «ماژول» → «این بخش برای این نصب/سازمان فعال نیست.» (or preserve the exact backend message). Keep other branches.
2. Empty/loading/error states consistent with `PageSkeleton`/`RetryErrorBox`; Persian everywhere.
3. Verify: full manual smoke (below).

## Frontend conventions — follow strictly
- RTL + Persian; existing dark slate theme + Tailwind (`components/patrol`, `components/atoms`, `components/molecules`).
- Centralize gating (context), don’t copy-paste per page; components under `src/components/` (add `src/components/system/` for the config page pieces).
- Type via generated `ReqType`; no `any` in new code.
- Do not touch backend; do not refactor charts/filters/analytics; do not delete or restyle unrelated pages.
- Keep `{ success, body }` semantics through actions as existing actions do.

## Verification (before each STOP and final)
1. `npx next lint` clean; `npx tsc --noEmit` (or `npm run build`) clean.
2. Manual smoke (`cd ../back && deno task bc-dev`; login):
   - As Ghost: open «تنظیمات ماژولها»; disable `incident_patrol` at the installation level and save → nav/patrol/org entries disappear; re-enable → reappear. Disable `charts` → charts/maps nav entries disappear. All-off still leaves home/admin/user usable, and **Ghost still sees everything**.
   - Per-org: disable `warehouse` for org X in the Organizations tab → org X shows «پیرو نصب»/چیپ خاموش and any org-X org-scoped user is blocked from warehouse pages; org Y unaffected.
   - As a Manager on an install with `incident_patrol` off (or org module off for the org they target): the patrol-manager/org routes show the module-notice (not a broken page); admin accident CRUD still works.
   - Confirm the login payload now carries `modules` (and `orgModules` for single-org accounts); a stale/absent array degrades to “treat as enabled” on the client (backend still enforces) — only gate when you positively know the module is off.

## Working rules
- STOP after each phase and summarize; don’t batch phases.
- Never log tokens/passwords.

## Toolchain
- Node ~22 (fnm); pnpm 10; dev `npm run dev` (port 3000); backend `cd ../back && deno task bc-dev` (port 1404). Types already synced in `front/src/types/declarations/selectInp.ts` — do not hand-edit.

## Out of scope / follow-ups (do NOT build)
- Mobile app module gating (separate mobile prompt later).
- Warehousing web UI (later prompt; module `warehouse` feed is already respected if a future page requests it).
- Per-customer expiry/license keys or remote re-activation (backend feature decision, not UI).
