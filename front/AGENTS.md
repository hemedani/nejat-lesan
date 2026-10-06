# LESEN Frontend - Traffic Management System

## 🌟 Project Overview

LESEN Frontend is a comprehensive traffic management and accident reporting system built with Next.js 15.3.8. It serves as the user interface for the LESEN backend service, providing tools for managing traffic zones, road conditions, vehicles, and accident records through an interactive map-based interface with extensive analytics and charting capabilities.

### Architecture

- **Framework**: Next.js 15.3.8 with React 19
- **Styling**: Tailwind CSS with custom CSS for RTL and map components
- **Maps**: Leaflet with advanced mapping features (drawing, clustering, heatmaps)
- **State Management**: React Context API with custom hooks
- **Forms**: React Hook Form with Zod validation
- **Date Handling**: date-fns-jalali with zaman for Persian calendar support
- **Cookies**: js-cookie for client-side storage
- **Charts**: ApexCharts for data visualization
- **Containerization**: Docker with multi-stage builds

### Core Features

- Interactive map interface for accident visualization
- Advanced search and filtering capabilities
- Polygon-based area selection for accident analysis
- Comprehensive analytics and charting system with multiple visualization types
- RTL (right-to-left) support for Persian language
- User authentication and role-based access control
- Real-time data visualization and statistics
- Responsive design for various screen sizes

## 🛠️ Technologies & Stack

### Frontend Framework

- **Next.js**: 15.3.8 (App Router)
- **React**: 19.x
- **TypeScript**: 5.x
- **Tailwind CSS**: 4.x for styling

### Mapping & Visualization

- **Leaflet**: Interactive maps with markers and polygons
- **react-leaflet**: React components for Leaflet
- **Leaflet-draw**: Drawing tools for polygon selection
- **ApexCharts**: Data visualization
- **react-apexcharts**: React wrapper for ApexCharts

### State Management & Forms

- **React Context API**: Authentication and global state
- **React Hook Form**: Form handling and validation
- **Zod**: Schema validation
- **js-cookie**: Cookie management

### Date & Localization

- **date-fns-jalali**: Persian calendar date functions
- **react-multi-date-picker**: Persian date picker with full RTL support
- **react-date-object**: Date object manipulation for Persian calendar
- **Vazir Matn Font**: Persian typography

## 📁 Project Structure

```
front/
├── .next/                 # Next.js build output
├── public/                # Static assets
│   ├── fonts/             # Persian fonts
│   └── favicon.ico
├── src/
│   ├── app/               # Next.js app router pages
│   │   ├── actions/       # Server actions for API calls
│   │   ├── admin/         # Admin panel (Ghost / Manager / Editor)
│   │   ├── charts/        # Chart visualization pages (overall, spatial, temporal, trend)
│   │   ├── chatbot/       # Chatbot interface
│   │   ├── employee/      # Employee panel (org/unit members, Officer role)
│   │   ├── graph/         # Graph visualization
│   │   ├── login/         # Login page
│   │   ├── maps/          # Map-related pages
│   │   ├── orghead/       # Organization-head panel
│   │   ├── org/           # Legacy org workspace (Ghost/Manager browsing /org/[orgId])
│   │   ├── patrol/        # Patrol panel (incident_patrol module)
│   │   ├── patrol-manager/ # Patrol manager panel
│   │   ├── unit-head/     # Unit-head panel
│   │   ├── user/          # User management pages
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   │   ├── system/        # Panel infra: PanelGuard, PanelShell, PanelScopeProvider, ScopePicker, ScopedView, RoleNotice, panel-icons
│   │   ├── orghead/       # Org-head panel views
│   │   ├── unithead/      # Unit-head panel views
│   │   ├── employee/      # Employee panel views
│   │   └── warehouse/     # Shared warehouse workspace + forms
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API services and utilities
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions (panels.ts, panel-nav.ts = panel registry)
├── Dockerfile             # Multi-stage Docker build
├── package.json           # Dependencies and scripts
├── next.config.ts         # Next.js configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # Project documentation
```

## 🚀 Building and Running

### Prerequisites

- Node.js 20.x or higher
- pnpm package manager
- Docker (for containerized deployment)

### Development Setup

```bash
# Install dependencies
pnpm install

# Run development server with Turbopack
pnpm dev

# Or run without Turbopack
pnpm dev -- --no-turbopack
```

### Production Build

```bash
# Build the application
pnpm build

# Start production server
pnpm start
```

### Environment Variables

- `APP_PORT` - Frontend service port (default: 3000)
- `LESAN_URL` - Backend API URL (server-side)
- `NEXT_PUBLIC_LESAN_URL` - Backend API URL (client-side)

### Available Scripts

- `dev` - Start development server with Turbopack
- `build` - Build the application for production
- `start` - Start production server
- `lint` - Run ESLint

### Available Endpoints

- **Frontend UI**: http://localhost:3000
- **API calls**: Forwarded to backend service at LESAN_URL

## 🧪 Development Commands

### Development

- Run development server: `pnpm dev`
- The development server runs with Turbopack enabled by default
- The UI is in Persian (RTL) and runs on port 3000

### Production

- Build for production: `pnpm build`
- Run production server: `pnpm start`
- The production server respects the APP_PORT environment variable

## 🗄️ Key Components

### Map Interface

- Interactive Leaflet map with accident markers
- Polygon drawing tools for area-based searches
- Real-time statistics panel
- Responsive design for different screen sizes

### Authentication System

- Role-based access control (Ghost, Manager, Editor, Enterprise, Normal)
- Enterprise users have specific settings that limit their access to certain data
- Cookie-based authentication
- Context provider for global auth state

### Search Functionality

- Advanced search with multiple filters
- Polygon-based location filtering
- Real-time results on the map

### Data Visualization

- Charts and graphs for accident analytics
- Interactive map markers with detailed information
- Statistics panels with Persian number formatting
- Multiple chart types: bar, line, pie, heatmap, tree, etc.

## 🐳 Docker Configuration

### Multi-stage Build

The Dockerfile includes three stages:

1. **Builder**: Builds the Next.js application
2. **Production**: Production-ready container with minimal footprint
3. **Development**: Development container with hot-reload capabilities

### Services

- **Frontend**: Next.js application running on port 3000
- **Uses**: Non-root user (nextjs) for security
- **Environment**: Production or development based on build stage

### Ports

- `3000` - Next.js application port

## 🧱 Customization & Extensibility

### UI Customization

- Modify components in `src/components` directory
- Update styles in `src/app/globals.css`
- Customize Tailwind configuration as needed

### Map Features

- Extend map functionality in `src/components/SimpleDrawing`
- Add new map layers or visualization tools
- Customize marker and popup behavior

### Chart & Analytics Features

- Add new analytics functions in `src/app/actions/accident` directory
- Create new chart pages in `src/app/charts` subdirectories
- Extend filter capabilities in `src/components/dashboards/ChartsFilterSidebar`

### API Integration

- Add new server actions in `src/app/actions`
- Extend API service in `src/services/api.ts`
- Update type definitions in `src/types`

### Authentication

- Modify auth context in `src/context/AuthContext.tsx`
- Extend user roles and permissions
- Customize login flow in `src/app/login`
- Enterprise users have specific settings that limit their access to certain data:
  - Cities: Array of city objects that the enterprise user can access
  - Provinces: Array of province objects that the enterprise user can access
  - Available Charts: Granular permissions for different analytics endpoints

## 🛡️ Security & Best Practices

### Security

- Non-root user in production containers
- Cookie-based authentication with secure flags
- Server-side rendering for sensitive data
- Input validation with Zod schemas

### Performance

- Dynamic imports for map components to avoid SSR issues
- Efficient state management with React Context
- Optimized bundle size with tree-shaking
- Lazy loading for heavy components

### Accessibility

- RTL support for Persian language
- Semantic HTML structure
- Proper ARIA attributes where needed
- Responsive design for various screen sizes

## 💡 Additional Notes

- The application is designed for Persian (RTL) language support
- Map components are dynamically imported to avoid SSR issues
- Server actions are used for API communication with the backend
- The application uses a custom Vazir Matn font for Persian text
- Environment variables are handled differently for server and client sides
- The application includes comprehensive error handling and loading states
- Polygon drawing functionality allows for area-based accident analysis
- Statistics are calculated and displayed in real-time based on filters
- The application follows Next.js 13+ App Router conventions
- Number formatting uses Persian digits with toLocaleString('fa-IR') for proper localization
- For consistent Persian digit formatting, use the formatNumber utility function from '@/utils/formatters'
- The project includes extensive analytics capabilities with specialized functions for spatial, temporal, and overall accident analysis

This frontend system provides a comprehensive interface for traffic management with a focus on accident visualization and analysis, featuring an interactive map interface with advanced search capabilities and rich charting functionality.

## Project Guidelines

You are a front-end persona highly proficient in Next.js, with deep expertise in UI/UX design. Always prioritize creating the most beautiful, intuitive, and visually stunning website possible, ensuring seamless user experiences, responsive layouts, and elegant aesthetics throughout your suggestions and implementations.

Use `pnpm` instead of `npm` or `yarn` when executing any Node.js-related commands.

For all backend interactions, the actual response or error data is nested within a `body` object. Example success shape (e.g., for login):

```
{
  "success": true,
  "body": {
    "token": "23423423rrsdfsagssfas2342",
    "user": {
      "_id": "sdfsdf3423422344",
      "name": "Amir",
      // ... additional user fields
    }
  }
}
```

Example error shape (e.g., for login):

```
{
  "success": false,
  "body": {
    "message": "Failed"
  }
}
```

If you want to know backend API declaration and type-safety you can read `src/types/declarations/selectInp.ts` file which include all schemas and backend API calls.

If you encounter any problems with the structure of the Lesan library used for the backend, you can use its documentation (here)[https://miaadteam.github.io/lesan/].

Please use the atomic development process to develop this project. You can find its structure in this path: `src/components`

Please strictly follow and use clean code and clean architecture and programming best practices and principles, try to avoid complex code.

Clean up any unnecessary code, such as console.log or unused variables or any other not used statements, and ensure state management is efficient and leak-free.

If you want to use any package please review `package.json` to see what kind of package are available.

### API Calls Best Practice

Please use server actions located in `src/app/actions` for all backend API calls instead of direct API calls from client components. The application has organized all API operations by model (e.g., `src/app/actions/accident`, `src/app/actions/user`, `src/app/actions/city`, `src/app/actions/road`) with standard operations like `add`, `get`, `gets`, `update`, `remove`, and specialized analytics functions.

The project has a strong focus on analytics and chart visualizations, with numerous specialized analytics functions available in the accident model, such as:

- Spatial analytics: `spatialCollisionAnalytics`, `spatialSeverityAnalytics`, `spatialLightAnalytics`, `spatialSafetyIndexAnalytics`
- Temporal analytics: `temporalCollisionAnalytics`, `temporalSeverityAnalytics`, `temporalNightAnalytics`, `hourlyDayOfWeekAnalytics`
- Overall analytics: `accidentSeverityAnalytics`, `collisionAnalytics`, `roadDefectsAnalytics`, `humanReasonAnalytics`, `vehicleReasonAnalytics`
- Specialized analytics: `companyPerformanceAnalytics`, `areaUsageAnalytics`, `monthlyHolidayAnalytics`

Using server actions provides several benefits:

- Proper authentication handling via cookies
- Server-side execution for security-sensitive operations
- Centralized API logic that can be reused across components
- Consistent error handling and response format
- Better separation of concerns between UI and data fetching logic

Example usage:

```ts
// Instead of direct API calls from components
import { gets as getAccidents } from "@/app/actions/accident/gets";

const response = await getAccidents({
  set: {
    limit: 10,
    skip: 0,
  },
  get: {
    _id: 1,
    accidentDate: 1,
    location: 1,
    // ... other fields you want to fetch
  },
});

// For analytics and charts
import { accidentSeverityAnalytics } from "@/app/actions/accident/accidentSeverityAnalytics";

const analyticsResponse = await accidentSeverityAnalytics({
  set: {
    lightStatus: [],
    collisionType: [],
    dateOfAccidentFrom: "",
    dateOfAccidentTo: "",
    // ... other filter parameters
  },
  get: {
    defectDistribution: 1,
    defectCounts: 1,
    // ... other analytics data you want to fetch
  },
});

// When using the response, note that backend returns data directly in response.body
// rather than response.body.data as in some other systems
if (response.success && response.body) {
  const accidents = response.body; // This contains the actual data
  // ... process the accidents
}

if (analyticsResponse.success && analyticsResponse.body) {
  const analyticsData = analyticsResponse.body; // This contains the analytics data
  // ... process the analytics data for charts
}
```

Note: When handling API responses, the backend typically returns the actual data directly in the `response.body` property, rather than nesting it inside `response.body.data`. Always check `response.body` directly for the data you requested.

## Important Backend Integration Notes

1. **Backend Authentication Header Format**:
   - The backend expects the JWT token in a header field called `token`
   - The token should be sent without the `Bearer` prefix
   - Example: `token: "actual-jwt-token-value"` rather than `authorization: "Bearer actual-jwt-token-value"`

2. **API Call Structure for Lesan Framework**:
   - When making API calls to the backend via the `AppApi` service, make sure to include the authentication token properly
   - For operations that don't require pagination, the response may be directly the requested data

3. **Authentication Token Handling**:
   - Tokens are stored in cookies under the key "token"
   - When using the `AppApi` service, pass the token using the second parameter: `AppApi(undefined, token)`
   - The `AppApi` service now handles proper token formatting for backend compatibility

4. **Type Safety Considerations**:
   - When making API calls, the `get` parameter in the request only specifies the fields to return, not the response structure

5. **Using Declared Types for Consistency**:
   - Always use the type definitions from the declarations file (e.g. `src/types/declarations/selectInp.ts`) rather than creating custom interfaces
   - Import and use the exact backend schema types (e.g. `accidentSchema`, `userSchema`, `citySchema`) to ensure consistency with the backend
   - This prevents synchronization issues and ensures type safety between frontend and backend
   - Example: Use `import { accidentSchema } from "@/types/declarations/selectInp";` and then `type Accident = accidentSchema;`

6. **Enterprise User Settings**:
   - Enterprise users have a `settings` field that limits their access to specific data
   - The settings structure includes:
     - `cities`: Array of city objects (with `_id`, `name`, and `center_location`) that the enterprise user can access
     - `provinces`: Array of province objects (with `_id`, `name`, and `center_location`) that the enterprise user can access
     - `availableCharts`: Object containing granular permissions for different analytics endpoints
   - These settings are stored in the authentication context and can be accessed via `useAuth().enterpriseSettings`

## Development Guidelines

Please follow these guidelines when working with this project:

### Do NOT Automatically Execute

- **DO NOT** run any development server (e.g., `pnpm run dev`, `npm start`, etc.)
- **DO NOT** execute any build commands (e.g., `pnpm run build`, etc.)
- **DO NOT** start any local servers or processes automatically

### Wait for Explicit Instructions

Only run development servers or build commands when I explicitly ask you to do so. For example:

- "Please start the development server"
- "Run the build command"
- "Start the local server"

### Default Behavior

When I ask about development or building, provide the commands that would be used, but do not execute them until I give explicit permission.

### Exception Cases

You may still:

- Analyze project structure and configuration files
- Suggest commands that could be run
- Help debug configuration issues
- Explain what different commands do

## 📝 Recent Changes

### Role-Scoped Panels (`/orghead`, `/unit-head`, `/employee`)

**Scope**: `src/utils/panels.ts`, `src/utils/panel-nav.ts`, `src/components/system/*`, `src/app/{orghead,unit-head,employee}/**`

**Why**: Previously OrgHead and UnitHead shared one `/org` + `/org/[orgId]/*` workspace with an
identical sidebar (no role filtering), no route-level guards, nav logic duplicated across
`Navbar` / `OrgWorkspace` / `PatrolWorkspace`, and **no Employee panel at all** — a unit-scoped
Officer had no landing surface and no path to warehouse features.

**Architecture** (registry → nav config → route guard → shared shell):

| Layer | File | Responsibility |
| --- | --- | --- |
| Registry | `src/utils/panels.ts` | `PANEL_DEFINITIONS`, `PanelViewer`, `canAccessPanel`, `getAccessiblePanels`, `getDefaultPanel`, `getScopedRoles`, `makePanelViewer` |
| Nav config | `src/utils/panel-nav.ts` | `PANEL_NAV` sidebar sections, `filterPanelSections`, `isNavItemActive` |
| Guard | `src/components/system/PanelGuard.tsx` | Waits for `authReady`; redirects to `/login` or `getDefaultPanel(viewer)` |
| Scope | `src/components/system/PanelScopeProvider.tsx` | Resolves `orgId`/`unitId` from `user.roles[]`; Ghost/Manager pick manually (sessionStorage `lesan_panel_scope`) |
| Shell | `src/components/system/PanelShell.tsx` | Shared sidebar + mobile drawer + scope picker + logout |
| Helper | `src/components/system/ScopedView.tsx` | Render-prop that waits for scope: `ScopedView({ require, children })` |

**Panels**: `admin` (Ghost/Manager/Editor) · `orghead` · `unit-head` · `employee` ·
`patrol` · `patrol-manager` · `profile`.

**Key rules**:

- Panels live at **flat URLs** — no `[orgId]` route param. Scope always comes from `user.roles[]`
  (`scopeType: "organization" | "unit"`), falling back to manual selection for Ghost/Manager.
- `getDefaultPanel(viewer)` order: super → `/admin`; OrgHead → `/orghead`; UnitHead → `/unit-head`;
  **any scoped role → `/employee`**; Editor → `/admin`; Patrol → `/patrol/dashboard`; Enterprise →
  `/charts/overall`; else `/user`.
- `AuthContext` now exposes **`authReady`** — guards must wait for it before redirecting, otherwise
  a refresh bounces an authenticated user to `/login`.
- `"Officer"` is a valid **RoleName** but **not** a valid **UserLevel** — keep it out of `levels`.

**Backend constraints that shape the UI** (verified against `back/`):

- `accident.getReportScope` accepts **only** Patrol (own reports) and Manager/Ghost (all) — it
  **throws** for OrgHead/UnitHead. Hence the employee "patrol" nav section is `allowedLevels: ["Patrol"]`.
- `announcement.gets` / `markRead` are gated to `["Manager","Patrol"]`.
- `accident.getReporterDashboard` requires `level === "Patrol"`.
- Warehouse acts (`inventory.*`, `consumption.*`, `goods_receipt.*`, `goods_request.*`, `ware.*`)
  have **no `grantAccess`** — scope is enforced inside the fn by `getScopedUnitIds(user)`.
  `inventoryManager.ts` is the only writer to `inventory` / `stock_movement`.
- `goods_receipt_item_struct` requires `quantity_received` + `quantity_accepted` + `quantity_rejected`
  (snake_case), **not** `{ wareId, quantity }`.

**Backend fix applied**: `back/src/app_modules/moduleConfig.ts` registered
`accident.reviewHistory`, but the registered act is `accident.getReportReviewHistory` — so
review-history module gating never matched. Corrected. All 38 act patterns in that file now
resolve to one of the 369 registered acts.

**Employee map** (`/employee/map`): built on `accident.nearbyAccidents`, which accepts Patrol
(requires `patrol_permissions.can_view_map`), Manager and Ghost only — same gate shape as the
reports section, so it lives in the Patrol-gated nav group. Uses a `dynamic(..., { ssr: false })`
leaflet component plus a `MapBridge` that publishes `flyTo` upward and reports the visible
bounding box so the toolbar can re-query the current viewport.

### Dynamic form authoring (`/forms`)

The form builder is a **flat, standalone route** — not nested under `/orghead` or
`/unit-head`, because OrgHead and UnitHead both author forms but enter from different
panels. It therefore has its own chrome rather than a duplicated route per panel:

| Layer | File | Responsibility |
| --- | --- | --- |
| Guard | `components/org/forms/FormAuthorGuard.tsx` | admits **Ghost, Manager, OrgHead, UnitHead**; everyone else is redirected to `getDefaultPanel(viewer)` |
| Scope | `components/system/PanelScopeProvider.tsx` | org comes from `user.roles[]`; Ghost/Manager hold no org role and pick one manually |
| Chrome | `components/org/forms/FormAuthorHeader.tsx` | org chip + "بازگشت به پنل" back to the viewer's own panel |

Routes: `/forms` (list), `/forms/new`, `/forms/[formId]`.

**Two separate nav registries exist — a link missing from one is invisible in the other.**

| Registry | Panels | Module gate field |
| --- | --- | --- |
| `utils/panel-nav.ts` → `ORGHEAD_NAV` / `UNIT_HEAD_NAV` | role panels drawn by `PanelShell` | `requiredModule` |
| `components/organisms/adminSidebarConfig.ts` | the `/admin` panel drawn by `AdminSidebar` | **none** — `AdminNavItem` has no module field |

Both carry a `/forms` entry (a «فرم‌ساز» section / group). Ghost and Manager land on
`/admin`, so the admin sidebar is their **only** navigation path to the builder.

**`forms` is its own module key, not part of `incident_patrol`.** Authoring is an
organizational capability: licensing it must not break filing a report, and disabling
it must not disable patrol. It is also the **last** key in `MODULE_KEYS`, which is declared
once in `utils/org.ts`. The ordering is load-bearing on the backend — `moduleKeyFor` in
`back/src/app_modules/moduleConfig.ts` returns on the first match, so an `incident_patrol`
whole-schema wildcard registered first would shadow `form_definition` and the gate would
never run. **There is no `moduleKeyFor` in `front/`**: the frontend list has no resolver of
its own and exists only to mirror the backend's order, so the two licensing screens cannot
disagree about what is licensed. The key union is `types/auth.ts` (`ModuleKey`); the labels
are `utils/org.ts` (`MODULE_LABELS`).

**The `/forms` gate is deliberately split in two, and R4 enforces the split.** The nav entry
declares `requiredModule: "forms"` so the menu hides itself; `/forms/layout.tsx` renders
`<ModuleGate module="forms" scoped>` so an author who *is* entitled to the feature gets an
explanation rather than a silent bounce; and `FormAuthorGuard` checks **role only**, via
`canAuthorForms` in `utils/form-access.ts`. Putting the licensing check in the guard makes
`ModuleGate` unreachable — R4 fails if `orgHasModule` ever appears there. Only **Ghost** is
exempt from licensing (`assertModuleOpen` in the backend returns early for Ghost alone);
Manager is not, matching `canAccessPanel`, which checks `requiredModule` *before* its
super-viewer bypass.

### Route builders — never hand-write a panel URL

Three modules own every panel URL, one per panel:

| Module | Panel |
| --- | --- |
| `utils/org-routes.ts` | `/orghead` |
| `utils/unit-head-routes.ts` | `/unit-head` |
| `utils/employee-routes.ts` | `/employee` |

No component may construct one. `OrgReportsView`'s `detailBase` and
`OrgIncidentDetailView`'s `backHref` are **required** props for the same reason: they used to
default to `/org/${orgId}`, which is how a caller that forgot them navigated out of the
panel. **R6** in `panel-routing-test.py` greps `src/components` for `/org/${`,
`detailBase="/` and `backHref="/` and fails the build on a hit. It strips comments first, so
prose documenting *why* the literal form is banned does not trip it.

If the «فرم‌ساز» nav section is missing, the `forms` module is off for that
organization — enable it at `/admin/modules` (Ghost-only). That page is itself only
reachable from the admin sidebar.

`panel-routing-test.py` asserts both nav entries, both module gates (including that
`/forms` survives when `incident_patrol` is off), and that it never leaks to the
employee / patrol / patrol-manager panels. **Its module list must include `"forms"`** —
it was originally omitted, which is why a missing nav entry passed unnoticed. Re-run it
after touching `PANEL_NAV`.

### CRITICAL: never send an empty `get` projection to an aggregation act

`get: {}` sent to an act whose fn forwards `get` into a Mongo **aggregation** fails with HTTP 501:

```
Invalid $project : : caused by : : projection specification must have at least one field
```

This is not a data problem and not an auth problem — it is a request-shape problem, so it surfaces
as a red error box where a table should be.

**Which acts are affected:** aggregation-based ones. `inventory.gets`, `goods_request.gets`,
`consumption.gets`, `stock_movement.gets`, `goods_receipt.gets`, `ware.gets` all reject `{}`.

**Which are NOT:** acts whose fn uses `find({ projection: get })` — Mongo's `find` accepts `{}` as
"all fields". `announcement.gets` is fine. Acts whose validator declares `get: object({})` (e.g.
`inventory.transfer`) are also fine. **The rule is per-act — check the fn, don't generalise.**

**Always** write the default as a named projection merged with the caller's:

```ts
const DEFAULT_PROJECTION = { _id: 1, quantity: 1, ware: { _id: 1, name: 1 } };

export async function getXRows(request: { set?: ...; get?: ... } = {}) {
  return AppApi().send({ ..., details: {
    set: request.set ?? {},
    get: { ...DEFAULT_PROJECTION, ...request.get } as never,
  }}, { token: token?.value });
}
```

An unknown field inside a `$project` is **silently ignored** by Mongo — only a *totally empty*
projection errors. So over-specifying is safe; under-specifying is not.

### Related: check the model before reading a relation

`goods_receipt` has **no `ware` relation** (ware identity is in the embedded `items[]`, as
`ware_name`) and records `received_by`, not `created_by`. Reading `row.ware?.name` /
`row.created_by` on a receipt silently yields blanks. Always confirm relation names against
`back/models/<model>.ts` before rendering.

### Empty panels may just be empty collections

The warehouse domain has **no seed**. Current counts: `ware` 0, `inventory` 0, `consumption` 0,
`goods_receipt` 0, `goods_request` 0, `stock_movement` 0, `announcement` 0 — versus `accident`
52,828. So warehouse/announcement panels legitimately render empty until ware items are created.
Per the `lesan-empty-result-diagnosis` skill: `success: true` + empty means the query matched
nothing; an error means the request shape is wrong. Distinguish before debugging.

### Verification tooling — `.workbuddy-ai/tools/`

Two static audits that catch failures TypeScript cannot see. Run them with the managed python3.

| Script | Checks | Last result |
| --- | --- | --- |
| `audit-module-acts.py` | every act pattern in `back/src/app_modules/moduleConfig.ts` resolves to a registered act | 369 acts / 38 patterns / 0 unresolved |
| `audit-frontend-actions.py` | every `model:`/`act:` pair in `front/src/app/actions/**` resolves to a registered act | 417 acts / 330 calls / 0 unresolved |
| `panel-routing-test.py` | panel access + default-landing + nav-filtering logic in `utils/panels.ts` / `utils/panel-nav.ts` | 48 assertions pass |
| `probe-empty-get.py` | live probe: does `get: {}` get rejected by an aggregation act? | reference |

`panel-routing-test.py` transpiles `panels.ts` + `panel-nav.ts` with `tsc` and runs assertions in
node — no test framework needed. It works because both modules have only `import type`
dependencies, so `tsc` emits standalone JS (the one `@/utils/panels` import in `panel-nav` is
rewritten to a relative path). **Re-run it after changing `PANEL_DEFINITIONS`, `getDefaultPanel`, or
`PANEL_NAV`** — a wrong branch there sends users to the wrong screen and is otherwise invisible.

**Why they matter:** a wrong `model`/`act` pair compiles cleanly and only fails when a user clicks
the button — the same bug class as the `accident.reviewHistory` mismatch found and fixed today.

The backend registers acts in **three** styles. An audit must handle all three or it reports false
failures:

1. **Direct** — `setAct({ schema: "accident", actName: "gets" })`
2. **Helper** — `register("getReporterDashboard", fn)` (`accident/dashboard/mod.ts`); the act name
   is a *positional argument*, so a property-based scan misses it
3. **Shared** — `setSharedActs("vehicle_type", model)` (`shared/setSharedActs.ts`); registers
   `add`/`get`/`gets`/`update`/`remove`/`count` against a **variable** schema name

Also: `app/actions/getGeoJSON.ts` passes a variable model
(`model as "province" | "city" | "city_zone"`), requiring union-literal recovery.

### Leaflet default-marker bug (known, partially fixed)

Bare `<Marker>` with leaflet's default icon renders a **broken sprite** under Next — the sprite URL
resolves relative to the bundler output and 404s. Fix is
`delete L.Icon.Default.prototype._getIconUrl` + `L.Icon.Default.mergeOptions({...})` pointing at the
cdnjs copies (see `app/map/page.tsx`). Apply it in **any** component that renders a bare `<Marker>`
or calls `L.marker`.

Still missing the fix: `components/template/FormCreateTownship.tsx`,
`components/template/FormUpdateTownship.tsx`, `components/template/FormCreateAccident.tsx`.
`components/maps/ClusteredAccidentMarkers.tsx` is unaffected — it passes an explicit
`icon={L.divIcon(...)}`.

### Date Picker Migration (react-multi-date-picker)

**Date**: Current
**Component**: `MyDateInput.tsx`
**Scope**: ChartsFilterSidebar.tsx (Step 1 of full migration)

**Changes Made**:

- Replaced `zaman` date picker with `react-multi-date-picker` throughout the entire project
- Created `MyDateInput.tsx` for React Hook Form integration (form-based date inputs)
- Created `MyStandaloneDatePicker.tsx` for standalone usage (non-form date inputs)
- Added `react-multi-date-picker` (v4.5.2) and `react-date-object` (v2.1.4) packages
- Removed `zaman` dependency from package.json
- Updated global CSS with custom blue theme styles (no CSS import needed - library doesn't include blue.css)
- Maintained Persian calendar support with full RTL (right-to-left) layout
- Preserved all existing functionality including ISO date storage format
- Enhanced styling to match existing UI design system with custom blue theme (#3b82f6)
- Implemented proper TypeScript type handling for multiple date format conversions
- Added `portal` prop for proper z-index handling (calendar renders in document.body)
- Increased z-index to 9999 to ensure calendar appears above all other UI elements

**Benefits**:

- Better TypeScript support and type safety
- More active maintenance and community support
- Better integration with React 19
- Improved RTL and Persian calendar handling
- More customizable and flexible API

**Migration Status**:

- ✅ Step 1: MyDateInput.tsx component updated (React Hook Form integration)
- ✅ Step 2: MyStandaloneDatePicker.tsx component created (standalone usage)
- ✅ Step 3: ChartsFilterSidebar.tsx using updated MyDateInput component (8 date inputs)
- ✅ Step 4: All components using MyDateInput automatically migrated (AdvancedSearch.tsx, FormCreateAccident.tsx, FormCreateUser.tsx, FormCreateUserUpdated.tsx, EventCreateUpdateModal.tsx, MainFormStep.tsx)
- ✅ Step 5: Direct Zaman usage replaced with MyStandaloneDatePicker:
  - charts/trend/collision-analytics/page.tsx (2 date pickers)
  - charts/trend/severity-analytics/page.tsx (2 date pickers)
  - organisms/user/EditUserPures.tsx (1 date picker)
- ✅ Complete: All Zaman date pickers replaced project-wide

**Installation Required**:
Run `pnpm install` to install the new dependencies before testing.

### Email/Password Auth Migration

**Date**: Current
**Component**: Login flow, user management
**Scope**: Replace OTP (national_number + SMS code) login with email + password authentication

**Changes Made**:

- `loginAction` (`src/app/actions/login.ts`) now takes `{ email, password }` (was `{ national_number, code }`)
- Deleted `src/app/actions/loginReq.ts` (backend `loginReq` act removed) and the `registration_step` cookie logic
- Deleted the two-step OTP UI: `LoginStepOne.tsx`, `LoginStepTwo.tsx`, and the now-unused `useAutoReturnTimer.ts` hook
- Added server actions (wired only, no UI yet): `setGhostPassword.ts` (public, `set: {}`, no token) and `changeUserPassword.ts` (Ghost-only reset)
- Added `email` to `UserData` in `src/types/auth.ts` and to the `getMe` / `getUser` default projections
- Created `LoginForm.tsx` single-step email + password form (landing-page design system)
- Redesigned `/login` page to match the landing page style (dark gradient, glass card, glow effects)
- `FormCreateUser.tsx`: added required `email` + `password` (8–100) fields; `national_number` is now optional (omitted when empty)
- `EditUserPures.tsx`: added optional `email` / `password` inputs; empty values are omitted on submit
- Admin user list (`/admin/users`) now fetches and displays `email`; `UserCard` is resilient to missing fields (fallback to `—` / `کاربر`)
- Deleted dead code `FormCreateUserUpdated.tsx` (not imported anywhere; broke compilation with the new `addUser` type requiring email/password)

**Security Notes**:

- `password` is never included in any `get` projection (TypeScript type is `never`)
- Login errors are mapped from Persian backend messages to friendly UI text in `LoginForm.tsx`

**Testing**:

- Login with valid email + password → `{ success: true, body: { token, user } }`
- `setGhostPassword` sets the Ghost password to `password123` (one-time, public)
- `changeUserPassword` works only for Ghost-level users

---

## Report detail page (`/orghead/reports/[reportId]`, `/unit-head/…`)

**Design**: `../docs/superpowers/specs/2026-10-06-report-detail-page-design.md`
**Backend**: `../back/prompt/03-scope-report-detail-and-list-for-org-leaders.md`

### The button that was not a button

`OversightTable.tsx` gated the **مشاهده** link with `canOpenReportDetail(level)`,
which returned `true` only for `Manager | Ghost`. An `OrgHead` therefore got an
inert `<span>` — the console's primary audience could not open a single one of its
own rows, while every other control on the page worked. Behind it were four
server gates, now fixed in `back/src/**`; `canOpenReportDetail` admits org leaders.

**Do not re-gate this without reading that diff.** `accident.get` now resolves
scope through `getOrgReportBase` — it used to carry **no `preAct` at all**, matching
on `_id` alone, so any authenticated caller could read any accident by id.

### Two collection names, one route

`?source=` (`accident` | `incident_report`) decides which collection is queried,
written by `reportDetailHref` and read by `parseReportSource`. `OrgIncidentDetailView`
used to call `accident.get` unconditionally, so every non-accident row missed.
**`fetchReportDetail` is the only place that branches.** `ReviewActions` takes a
**required** `source` and dispatches to `reviewReport` or `reviewIncidentReport` —
it used to hardcode the `accident` act, so approving a non-accident row sent an id
that was not in `accident`. Both default-to-`accident` defaults are deliberate
anti-patterns.

### One request, not two

`review_history` is an **embedded array** on both models whose `reviewer` is a
snapshot, so `get: { review_history: 1 }` returns the whole trail inside the report
fetch. The separate `getReportReviewHistory` call existed only because `accident.get`
had no scope and always succeeded; it is deleted, along with its
`incident_report` twin and `historyProjection`. `ReviewTimeline` re-sorts
newest-first client-side, which the act used to do.

**Do not re-add a second fetch for the trail.** R7 in `panel-routing-test.py`
asserts its absence, and `Promise.all` is banned in the detail view.

### Two response shapes — the trap

`accident.get`'s fn is `accident.aggregation(...).toArray()`, so `body` is a
**one-element array**; `incident_report.get`'s fn is `findOne`, so `body` is the
**object**. `fetchReportDetail` normalises this once. `accident/get.ts` never called
`asSingleItemResponse`, which is why every detail page used to render an empty shell.

Two named projections, never one shared superset: `incident_report.get`'s validator
is `selectStruct("incident_report", 1)` and **rejects** `serial` / `collision_type`
as unknown keys. Superstruct validates `get` strictly, so an over-wide projection is
an error, not an ignored field.

### Form labels cost no extra request

`incident_report.form_answers` is the answer tree verbatim and `dynamic_answers`
carries `question_key` as an **instance path** (`vehicles[1].plate`, from
`buildDynamicAnswers`). Neither carries the question's Persian text, so
`FormAnswersSection` needs the definition — and gets it through
`loadOrgFormDefinitions`, which caches **one read per organization per session**.
`OrgReportsView` already made exactly that read for its filter bar, so arriving from
the console costs nothing.

The cache returns `{definitions, failed}`, never a bare array: "no forms" and "the
read was refused" need opposite responses, and collapsing them is the same
silent-wrong-answer failure as a swallowed scope error.

`FormAnswersSection` walks the tree with the shared engine's `walkNodes` +
`resolvePath`, so repeatable rows render one labelled line each. Without a
definition it degrades to raw keys and **says so**.

### Layout

Sticky rail on the **right** (RTL) — summary, review actions, map — beside
scrolling content. Below `lg` the rail becomes the first block in flow. Vehicle
cards show plate, fault status, final status and driver name always; the twelve
other fields sit behind «جزئیات بیشتر», which renders nothing when there is nothing
to reveal.

No surrounding-accident layer: `accident.nearbyAccidents` is Patrol/Manager/Ghost
only **and** applies no organization scope, so it would leak cross-org rows.

### Known limitations (documented, not faked)

- `accident.dynamic_answers` labels are **not** resolved — those keys come from
  `accident_process`, a different model with its own lifecycle. Shown raw under
  «یادداشت‌های تکمیلی».
- `AttachmentGallery` is `accident`-only and may be empty. Files live at
  `<LESAN_URL>/uploads/accidents/<name>` — a path **not stored on the document**,
  derived from which act wrote them. That inference lives in one line.
- The org console shows **14 rows, not 52,000**: the legacy catalogue has a road but
  no officer, so `"officer.level": "Patrol"` excludes it before the `$or` runs.
  Widening it is a data decision, not a `$or` change.

### CRITICAL: a relation's `get` projection must be an object, never `1`

The sibling rule to the empty-projection one above, and the one that breaks the report
detail page:

| Field kind | Send | Example |
| --- | --- | --- |
| Relation | **an object** | `road: { name: 1 }` |
| Scalar / embedded struct | `1` | `dead_count: 1` |

`attachments` is a relation to `file`, so `attachments: 1` is rejected at runtime with

```
At path: get.attachments -- Expected an object,  but received:  1
```

Superstruct fails on the **first** bad path, so a projection with several mistakes reports
only one — fix, then re-run.

**Make the projection type-checked.** The generated declarations already encode the rule:
a relation is typed as an object, a scalar as `(0|1)`. So the fix is a type, not a cast —
`as never` silences every field check, which is exactly how `attachments: 1` reached
production with a clean `tsc`:

```ts
type AccidentGet = ReqType["main"]["accident"]["get"]["get"];
const ACCIDENT_PROJECTION = { /* … */ } as const satisfies AccidentGet;
```

`accident` has 32 relations and `incident_report` has 20 — the full list is derivable from
the declarations, which is what `audit-projection-shapes.py` does for the projections that
are dynamic (`Record<string, unknown>`, built per column) and so cannot use `satisfies`.
Run it after editing `utils/accidentProjection.ts` or `services/patrol-projections.ts`.

### Map tiles must work without international internet

`osm` is served from `tile.openstreetmap.org` and is unreliable from inside Iran;
`mapir` (Map.ir) and `neshan` are reachable. `DEFAULT_BASEMAP` stays `osm` deliberately
(changing it would alter every map in the app), so **every `MapContainer` map needs a way
to switch.** The registry, the persisted preference and the selector already exist:

| Piece | File |
| --- | --- |
| provider registry + labels + attribution | `utils/basemaps.ts` |
| preference, persisted as `lesan-basemap` | `context/BasemapContext.tsx` |
| the selector, `variant="dark"` for the panels | `components/maps/BasemapSelector.tsx` |

**Neshan cannot be a `TileLayer`.** It sets `useSdk: true` with an empty `url` because it
loads its own Leaflet SDK from `static.neshan.org` that *replaces* `window.L`. So:

- `TILE_BASEMAPS` (`osm`, `mapir`) is the set a `<MapContainer>` can actually render.
- `resolveTileBasemap(context.basemap)` maps anything else to `mapir` — **not** to `osm`,
  because falling back to the unreachable provider would recreate the problem.
- `BasemapSelector` defaults to `scope="tile"`, so Neshan is never offered where it
  cannot work. Passing the raw context value to `BasemapLayer` instead leaves markers
  and polylines on a **blank background**, which is why the report map builds its own
  `TileLayer` from `getBasemapUrl(resolveTileBasemap(...))` and reuses only the token
  handling.

**Adding a satellite source** is one entry in `BASEMAPS` plus its key in `TILE_BASEMAPS`.
Do not guess a tile template: a wrong URL renders a blank map with no error. All three
current entries are *standard* raster — there is no satellite layer configured.

### Two bugs the map's hooks had, and the rules behind them

1. **A hook after an early return changes hook order.** `useTileBasemap()` was called after
   `if (!incident && !officer) return null`, so it was skipped on a render with no points and
   called on the next — React then discards that component's memoised state. Every hook goes
   **above** every early return.
2. **A `useMap()` fit-bounds effect must not depend on converted coordinates.** `[lat, lng]`
   arrays are fresh references every render, so depending on them re-fits after every render
   and yanks the view back the moment the user pans. Read the points from a ref and depend on
   `[map, trigger]` only — the button works by *changing* `trigger`, which is the whole point of
   passing it.

### CRITICAL: site chrome lives at z-index 9999+, not z-50

A dialog at a conventional `z-50` (or even `z-[2100]`) renders **underneath** the
navbar. The existing stacking tiers:

| z-index | Element |
| --- | --- |
| `9999` | `Navbar` — `fixed inset-x-0 top-0` (`components/organisms/Navbar.tsx:81`) |
| `10000`–`10002` | `GlobalFiltersBar` FAB, overlay, drawer |
| `100000` | the full-screen modal convention (`components/modals/AccidentDetailsModal.tsx:183`) |

**A full-screen dialog uses `z-[100000]`.** Anything modal should follow that, not
invent a number.

**Portal a dialog into `document.body`.** `position: fixed` is viewport-relative only
while no ancestor has a `transform`, `filter`, `backdrop-filter`, `perspective`,
`contain` or `will-change` — each of which creates a containing block *and* a stacking
context, trapping the dialog inside the page and capping it below the navbar no matter
how large its z-index is. `main` happens to be clean today, so this is a dependency on
that staying true rather than a live bug; `createPortal` (already used in
`components/atoms/MyAsyncMultiSelect.tsx`) removes it. `createPortal` inside a dialog is
also safe with `useScrollLock`, which sets `position: fixed` on `body`.

Related: the ⤢ expand button over the rail map needs `z-[1100]`. `globals.css` forces
`.leaflet-control-container { z-index: 1000 !important }` and `.leaflet-container
{ z-index: 1 !important }`, so a plain `absolute` button (z-index auto) is painted over
by the map.
