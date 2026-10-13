# Road & Organization Admin Forms — Design

Give `road` and `organization` real add / update / view pages, and close the
backend contract gaps that currently make a correct frontend form impossible.

## Problems found

### 1. `road.add` cannot succeed from the frontend

The backend validator is `object({ ...road_pure, provinceId })`, so **`area` and
`provinceId` are both required**. `front/src/app/actions/road/add.ts:13` sends
`set: { name }`. Every create is rejected by superstruct — and
`CreateUpdateModal.tsx:65-87` never inspects `response.success`, so it fires a
success toast regardless. The road admin page has never been able to create a road.

### 2. `road.update` is stale — it cannot write four of the six fields

`back/src/road/update/update.val.ts:6-11` accepts only `_id`, `name`, `area`.
`origin`, `destination`, `total_length_meters` and `lanes` exist in `road_pure`
and in the `add` contract, but update has no path to them. A perfect frontend
form would silently discard input on save.

It also uses `name && (updateObj.name = name)`, which **drops an empty-string
rename** instead of clearing the field.

### 3. `total_length_meters` can drift from the geometry it describes

It is documented as a *cached* length. Today `add` accepts it as a client-supplied
number and `update` cannot change it at all — so the stored value and `area`
disagree silently, and `road.snapPointToRoad`'s km/m reports inherit the error.

### 4. `lanes` can drift from the `position` catalogue

`common_relation_struct` requires `{_id, name}`. `MyAsyncMultiSelect` produces
`string[]` ids, and the one existing precedent (`FormCreateAccident.tsx:1127`)
maps ids to `{_id}` only — which the struct rejects.

### 5. Organizations have no update form and no detail page

`OrgIndexView` renders seven create fields. There is no update form (only an
`is_active` toggle) and no detail page. `location`, `location_zoom` and `logo`
are declared in the schema and read/written nowhere in `front/`.

## Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| D1 | Derive `total_length_meters` server-side; drop it from both validators | A hand-typed length can contradict the line it describes, and km/m linear referencing inherits that error. Verified: the `geo.ts` planar method reproduces the seed's `116342` exactly. |
| D2 | Dedicated routes + forms, not the shared dashboard | `clientCommonModelDashboard` is hard-wired to `add(name)` / `update(_id, name)`. Generalizing it means migrating ~10 models (position, color, type, road_defect…) in one change. Dedicated routes are the existing escape hatch (`users/edit/*`, `air_pollution_zone/create`). |
| D3 | One `GeoPointPicker` + one `GeoLineDrawer` under `components/maps/` | The GeoJSON picker block is duplicated across six city/province/township forms. Build it once, use it everywhere. |
| D4 | `lanes` is a multi-select over `position.gets` emitting `{_id, name}` | Keeps lanes consistent with what `road.snapPointToRoad` returns, and makes the `name`-required struct impossible to get wrong. |
| D5 | Validate `road.lanes` against the `position` collection in the fn | A lane pointing at a deleted `position` would silently desync the road from what snapping returns. |
| D6 | Org and road get a real detail page; the panel-jump becomes an explicit action | The list card's click currently changes panel scope and navigates away. That is a deliberate behaviour — keep it, but stop overloading it. |
| D7 | Refactor the six legacy forms **last** | They work today. The refactor buys deduplication but puts six working screens in the diff for no functional gain on road or org. |

## Backend

### `utils/geo.ts`

`polylineLengthMeters` is private today. Export a `multiLineLengthMeters(lines:
[number, number][][]): number` that sums it across lines. This is the single
source of truth for road length.

Verified against the demo corridor: `planar = 116342` (matches
`DEMO_ROAD_LENGTH_METERS` exactly), `haversine = 116890`. The planar
equirectangular method is what `snapPointToRoad` already uses, so the cached
length and the snapping projection cannot disagree.

### `road.add`

`add.val.ts` stops accepting `total_length_meters` (it is derived) and keeps
`...road_pure` plus `provinceId`. `add.fn.ts` computes the length from `area` and
stamps it into the doc before `insertOne`.

### `road.update`

```ts
set: {
  _id, name?, area?, origin?, destination?, lanes?, provinceId?
}
```

`update.fn.ts`:
- Every field is an explicit `!== undefined` check, so an empty string clears a
  field instead of being dropped.
- `area` present → recompute `total_length_meters`.
- `provinceId` → `road.addRelation(..., { province: { relatedRelations: { roads: true } } })`,
  never a `$set`. Relations are never written through `findOneAndUpdate`.

### Lane validation

Both acts resolve every `lanes[]._id` against `position` and throw
«موقعیت‌های انتخاب‌شده معتبر نیستند» when any is unknown.

## Frontend

### `components/maps/GeoPointPicker.tsx` and `GeoLineDrawer.tsx`

Built on the **existing** `MapClickHandler` and `BasemapLayer`.

`GeoPointPicker` — mode toggle → map click → `{type:"Point", coordinates:[lng,lat]}`,
plus the read-only coordinate card the city forms already render.

`GeoLineDrawer` — click to add a vertex, double-click/Enter to finish, Escape to
cancel. Emits `{type:"MultiLineString", coordinates:[[ [lng,lat], … ]]}`. Multi-segment
by starting a new line. **No ring-closing push** — that is the `MultiPolygon`
convention and applying it to a road centreline would be wrong.

Both absorb the three boilerplate steps repeated in every current form:
`dynamic(..., {ssr:false})`, the Leaflet CSS `<link>` inject, and the
`L.Icon.Default._getIconUrl` sprite fix. That fix is currently **missing** from
`FormCreateTownship`, `FormUpdateTownship` and `FormCreateAccident`, so the shared
component closes that gap for free.

### Road

`/admin/road/[roadId]` detail+edit, plus an «ویرایش» action per row in
`/admin/road/page.tsx`. The generic dashboard is left alone for the tag-like
models.

Fields: `name`, `province` (required select), `origin`, `destination`, `area`
(required), `lanes` (multi-select emitting `{_id, name}`), and `total_length_meters`
**read-only**, labelled «طول محور (محاسبه‌شده)». `area` and `lanes` are optional on
update, so an empty submit must send an explicit clear rather than omitting the key.

### Organization

`/admin/org/[orgId]` detail+edit, with one form component shared by create and edit.
Fields: `code`, `name`, `enName`, `description`, `is_active`, `roadId`, `headId`,
`logoId`, `location` (point picker), `location_zoom` (number, clamped 3–19 against
the map's own range).

The list card's click opens the detail page; «ورود به پنل» stays a separate action
so the existing panel-scope behaviour is preserved.

## Verification

- Backend `deno check`; new `road-test.ts` covering the update contract, the
  derived length (pinned to `116342`), lane validation, and the empty-string rename.
- `.workbuddy-ai/tools/audit-frontend-actions.py` — a wrong `model`/`act` pair
  compiles cleanly and is invisible to `tsc`.
- `.workbuddy-ai/tools/audit-projection-shapes.py` — a relation projected as `1`
  fails at runtime, not at build time.
- `front`: `npx tsc --noEmit`, `pnpm lint`.
- `mobile`: `npx tsc --noEmit`, `pnpm lint`, `npx vitest run` — the shared
  form-engine suite must stay green.

## Risks

- **`GeoLineDrawer` has no precedent in this repo.** Nothing draws a
  MultiLineString today. The vertex-add / finish / cancel interaction is the
  least-verified part; keep it simple rather than clever.
- **Refactoring six legacy forms touches working screens** (D7). Sequenced last so
  a regression there is separable from road/org.
- **`province.roads` has `limit: 50`** — a province with more than 50 roads
  truncates on the province side. Pre-existing; not touched.
- **`road_excludes` keeps `lanes`** while excluding `area`, so the province reverse
  projection ships lane sets. Pre-existing; not touched.