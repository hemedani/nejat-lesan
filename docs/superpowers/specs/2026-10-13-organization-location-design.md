# Organization Location Point — Design

Give every `organization` a map location (point + default zoom), resolve the
caller's organization server-side, surface it on `user.login` / `user.getMe`,
seed it for the QA demo organization, and use it in the mobile app on the Home
tab and the incident-location screen.

## Problem

An organization is a highway operator (`organization.road` is one highway). It has
no coordinates of its own — its only geometry is the road's `area` MultiLineString,
which the map cannot frame as a point. A patrol officer opening
«انتخاب محل حادثه» therefore gets one of two bad defaults:

- officer GPS, when the fix resolves — correct, but unrelated to the org's territory
- a hardcoded Tehran point (`35.6892, 51.389`), when GPS is slow or unavailable —
  hundreds of kilometres from an Ahvaz or Bandar Abbas operator

Mobile also has **no organization data at all**. The session stores only
`modules`/`orgModules` *keys*, never names, so the app cannot say who the officer
works for.

## Non-goals

- No org-selection UI. An officer in several orgs still gets one resolved org.
- No reverse-geocoding or address strings. The point is raw GeoJSON.
- No change to `organization.road` or to the road-snapping pipeline.

## Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| D1 | `location` (GeoJSON Point) **and** `location_zoom` are separate fields | A short urban highway frames at 16; a 100 km corridor needs 12. One number cannot serve both. |
| D2 | Backend resolves the org via `resolvePrimaryOrgId`, returning `null` when ambiguous | Reuses the exact rule `orgModules` already uses. Mobile never guesses an org. |
| D3 | The resolved org is a **fixed response field**, not a client projection | Matches `orgModules`; returns even when the caller requests no `get`. |
| D4 | Mobile caches the org on the `Session`; `fetchMe` stays unused | No new network call on session restore, so offline unlock stays honest. |
| D5 | **No server-side zoom range validation** | `@deps` exports `refine` but not `range`, and `organization_pure` feeds both the write validator and `selectStruct`'s projection validator. A `refine` there risks breaking reads for a cosmetic field. Both consumers clamp instead. |
| D6 | Seed point is derived from `DEMO_ROAD_AREA`, not a literal | If the road geometry is ever regenerated the org point cannot drift away from it. |
| D7 | `ensureDemoOrganization` **backfills** a missing location, never overwrites | Orgs seeded before this change must gain the point without `cleanupDemoSeed`. |
| D8 | Edit mode keeps zoom 17 | Re-opening an incident you filed should not snap the camera to the org's whole territory. |
| D9 | Org is the map *fallback*; officer GPS still wins | GPS is the officer's real position. The org point covers the no-GPS case and stays one tap away. |

## Backend

### 1. `organization` model — `models/organization.ts`

Two optional pure fields, added to `organization_pure`:

```ts
location: optional(geoJSONStruct("Point")),  // مرکز عملیاتی سازمان
location_zoom: optional(number()),          // بزرگ‌نمایی پیش‌فرض نقشه
```

`geoJSONStruct("Point")` is the repo's existing struct
(`models/utils/geoJSONStruct.ts:5`); a Point is a **2-tuple in `[longitude, latitude]`
order**, not `array(number())`.

Add a `2dsphere` index on `location` to the existing `createIndex` block, alongside
the unique `code` index. This matches every other geo-bearing model in the repo
(`accident.ts:774`, `incident_report.ts:424`, `road.ts:63`, `city.ts:41`).

`add.val.ts` picks both fields up free via its `...organization_pure` spread.
`update.val.ts` re-lists pure fields explicitly and needs both added;
`update.fn.ts` needs **no change** — it already copies every defined pure key into
`$set`.

### 2. Resolving the caller's org — `src/user/primaryOrganization.ts`

```ts
export const getPrimaryOrganization = async (
  user: { _id: unknown; level?: string; roles?: Array<{ scopeType?: string; scopeId?: string }> },
): Promise<PrimaryOrganization | null>
```

Reuses `resolvePrimaryOrgId` (`src/app_modules/moduleConfig.ts:258`) — the same
scope rule `getPrimaryOrgModules` uses — then reads the org with projection
`{ _id, code, name, enName, location, location_zoom }`.

Scope rule (`src/app_modules/orgScope.ts`): Ghost/Manager → `[]` → `null`;
role `scopeType:"organization"` → its `scopeId`; `scopeType:"unit"` → that unit's
`organization`; patrol officer with no role → the org of the `unit.officers` unit;
warehouse head → their warehouse unit's org.

Wired into `loginUser.fn.ts` (both the device/patrol and plain-web return paths)
and `getMe.fn.ts`, as a sibling of the existing `orgModules` key:

```ts
primaryOrganization: await getPrimaryOrganization(authUser),
```

### 3. QA seed — `src/user/seedDemoOrganization/org.ts`

```ts
export const DEMO_ORG_LOCATION = {
  type: "Point",
  coordinates: DEMO_ROAD_AREA.coordinates[0][0],  // [48.67056, 31.31823] — سرِ اهواز
};
export const DEMO_ORG_ZOOM = 13;
```

Zoom 13 frames the eastern two-thirds of the ~100 km Ahvaz–Bandar Imam corridor.

**Backfill.** `ensureDemoOrganization` currently returns early for an existing org
and never touches pure fields, so an org seeded before this change would keep
`location: undefined`. It gains a guarded `$set` that fires **only when
`location` is absent**, never overwriting an operator's own point.

Rebuild order (documented in `back/docs/11-demo-organization-seed.md`):

1. `user.cleanupDemoSeed` (`confirm: true`)
2. `app_modules.setModules` — `forms` must be on; step 4's
   `assertDemoFormsModuleOpen` fails otherwise
3. `user.seedShared`
4. `user.seedDemoOrganization`

`cleanupDemoSeed` needs no change; it drops the whole org document.

## Mobile

### 4. Session carries the org

`domain/types.ts`:

```ts
export type PatrolOrganization = {
  _id: string;
  code: string;
  name: string;
  enName?: string;
  location?: { type: 'Point'; coordinates: [number, number] };
  location_zoom?: number;
};

export type Session = { /* …existing… */ primaryOrganization?: PatrolOrganization | null };
```

`session-service.ts` `toSession` stores `response.primaryOrganization ?? null`
through a `normalizeOrganization` that **drops a malformed point rather than
throwing** — a bad organization must never block a login.

### 5. Pure domain module — `src/domain/organization.ts`

No RN imports, fully unit-testable:

- `organizationPoint(org): Coordinates | null` — validates `lng ∈ [-180,180]`,
  `lat ∈ [-90,90]`, returns `{latitude, longitude}` (swapping the GeoJSON order)
- `organizationZoom(org, fallback = 17): number` — clamps to `3..19`, matching the
  map HTML's own `MIN_ZOOM`/`MAX_ZOOM`

This clamp is the client half of D5.

### 6. Location screen — `app/incident/location.tsx`

```
center = initialSelected ?? organizationPoint(org) ?? FALLBACK_CENTER   // Tehran last
zoom   = initialSelected ? 17 : organizationZoom(org)                  // D8
```

The existing GPS effect is untouched, so GPS still wins and, because `setCenter`
preserves the current zoom, the org zoom survives that pan (D9).

The sheet gains an org row plus a «مرکز سازمان» control above the distance row.

`OsmWebMapHandle.setCenter` gains an **optional** `zoom` parameter. The generated
HTML handler already accepts it (`services/map-web-html.ts:390`:
`typeof data.zoom === 'number' ? data.zoom : state.zoom`), so this is a one-line
RN-side change with no HTML regeneration. Existing callers — `map-controls.tsx`
and the GPS effect — are unaffected.

### 7. Home tab — `app/(tabs)/index.tsx`

A new `OrganizationCard` renders between the greeting block and the existing
`unitStrip`, reading `session.primaryOrganization`: org name, org code, and the
org point as `fa-IR` coordinates. When `primaryOrganization` is null (global
Manager / Ghost) it renders the muted «سازمانی ثبت نشده», consistent with the
existing «واحد گشت تخصیص نیافته».

## Verification

- Backend `deno check`; seed test extended for location + zoom write, re-run
  idempotency, and legacy-org backfill.
- Mobile `src/domain/organization.test.ts` for point/zoom/clamp; session tests for
  `normalizeOrganization` (malformed point dropped, absent field → `null`).
- `pnpm lint` and the mobile TypeScript check.
- Regenerate `back/declarations/selectInp.ts`, then
  `cp -rv back/declarations/selectInp.ts front/src/types/declarations/`.

## Risks

- **The Lesan model schema also backs projection validation.** Any custom struct
  added to `organization_pure` must survive `selectStruct`. `geoJSONStruct` is
  already used by ten models, so the pattern is proven; `deno check` plus a
  `organization.get` round-trip confirm it.
- **`organization.update` does not expose `module_flags`.** Adding
  `location_zoom` to the update validator widens the write surface; it stays
  guarded by the existing `assertOrgInActorScope`.