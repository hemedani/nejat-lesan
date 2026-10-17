# Backend task: every production road has no `area`, which silently disables snapping, zone checks, and the offline road map

## Why this task exists

The mobile app now draws the officer's own road on the location picker, offline, from
`organization.road.area`. It works for exactly one organization in the deployment — the
Ahvaz–Bandar Imam demo seed — because **every other road document in the database has
no geometry at all**.

This has been a known blocker since Step 9 and it is now load-bearing for a shipped
feature rather than a backlog line. `mobile/docs/TODO.md` carries it as *"~1490
production roads lack `area` — blocks snapping, zone validation **and** offline road
caching"*.

### The facts, verified against the tree

**1. The seeds cannot write geometry.** `back/src/user/seed/seed.fn.ts:369-378` inserts
through a generic `findOrCreate` that writes only a name:

```ts
const created = await model.insertOne({
	doc: {
		name: normalizedName,
		createdAt: new Date(),
		updatedAt: new Date(),
	},
	relations: { ... },
	projection: { name: 1, _id: 1 },
});
```

`road` is in that path's `modelMap` (`:85`), so every seeded road bypasses
`road.add`'s validator entirely — which is why nothing ever objected to the missing
`area`, even though `area` is **required** on the model (`back/models/road.ts:14-20`)
and on `road.add`.

**2. The data confirms it.** Parsing every seed file in the repo:

| File | accident rows with a road | rows carrying `area` |
| --- | --- | --- |
| `sample_json_files/sample.json` | 3,335 | **0** |
| `uploads/json/…-ahvaz14-11-1404.json` | 38,880 | **0** |
| `uploads/json/…-karaj.json` (×4) | 16,331 each | **0** |
| `uploads/json/…-hamedan_2-12-1404.json` | 14,310 | **0** |
| `uploads/json/…-merged.json` | 28,956 | **0** |
| **total** | **163,801** | **0** |

The union of every road key across all of them is `['id', 'name']`.

**3. Exactly one road has geometry.** `back/src/user/seedDemoOrganization/org.ts:34-38`
hardcodes a real 91-vertex OSM centreline with `DEMO_ROAD_LENGTH_METERS = 116342`, and it
is idempotency-checked and backfilled on re-run. Its own comment records what the
missing geometry costs, and is worth reading before starting — it is why the demo road
has 91 vertices and not 7:

> `چرا این‌قدر رأس دارد: نسخه‌ی قبلی یک خط ۷ رأسی و تقریباً مستقیم بود، پس
> road.snapPointToRoad نقطه را روی یک خط خیالی می‌نشاند و مسیر روی نقشه با انحراف
> چند صد متری از آزادراه کشیده می‌شد.`

### What breaks today, and will keep breaking

- **`road.snapPointToRoad`** `$geoNear`s on `area` with a 20 km max distance. With no
  geometry it matches nothing, so every report that could have been linearly referenced
  gets the Persian error «نزدیک‌ترین راه در شعاع پوشش یافت نشد». The `kilometer` /
  `meter` fields the report model is built around are unreachable.
- **`road.validatePointInZone`** depends on the same geometry, so zone validation is
  degraded for the same reason.
- **`road.getRoadsGeometry`'s `polygon` filter** is
  `area: { $geoIntersects: { $geometry: polygon } }` — it matches nothing. Unfiltered it
  returns 1,490 records with `area` simply absent.
- **The offline road map** draws nothing. The files upload and the report files
  correctly; the officer just sees the raster basemap with no highlighted road.

## What to change

### 1. Backfill `area` for every road that lacks it

Source centrelines from OSM and write them as ordered `MultiLineString` centrelines
(`[lng, lat]` per vertex, `area` in that order — `ERD/en/road.md:32`). Overpass is the
obvious source:

```
way["highway"~"^(motorway|trunk)(_link)?$"](area);
out geom;
```

Requirements, in order of how badly they bite:

- **Match by name, not by guessing.** The seed's road names are Persian
  («جاده گلف», «آزادراه …»). Overpass returns `name` in the local script for Iranian
  data, so a normalized comparison is feasible — but **log every road that matched
  nothing or matched ambiguously and leave those rows untouched.** A confidently wrong
  centreline is far worse than a missing one: it puts an officer's incident at the wrong
  kilometre on the wrong road, and the report is filed with it.
- **Preserve vertex order.** Linear referencing walks the array; reversing or
  re-sorting it inverts every kilometre on that road.
- **Set `total_length_meters` from the geometry** using the existing
  `deriveTotalLength` (`back/src/road/roadSetStruct.ts:45-48`) rather than trusting a
  source value. The demo seed does exactly this (`org.ts:296`, `:311`).
- **Verify against the demo road first.** Before touching anything else, prove the
  pipeline reproduces the Ahvaz demo centreline closely enough that
  `snapPointToRoad` on a known point of that road returns the expected kilometre. That
  single test validates the whole approach.
- **Back up the affected documents** (`mongodump` of the `road` collection, or at
  minimum the `_id` list and any `name` → `area` mapping) before the first write. This
  is a destructive, wide operation on production data.

### 2. Fix the seed so this cannot recur

The root cause is `seed.fn.ts` inserting name-only road documents outside the
validator. Either:

- route road creation through `road.add` so the required `area` is enforced at seed
  time, or
- have the seed write a placeholder geometry and the backfill replace it.

Whichever you choose, add a check that **fails loudly** when a `road` document has no
`area` — today the model says `area` is required and 1,490 documents violate it
silently, which is the actual defect. A backfill without that check leaves the next
import free to repeat it.

### 3. Add the missing `updatedAt` index (small, but it gates everything after this)

There is currently no way for a device to ask "roads changed since X": no ETag, no cache,
no `updatedAt` filter on any road act, and `road`'s only index is `area: "2dsphere"`
(`back/models/road.ts:61-65`). `updatedAt` *is* already projected by
`getRoadsGeometry` (`:28`), so a `since` parameter is a small additive change — but it
needs a non-`area` index to be cheap, or every device's refresh becomes a collection
scan.

This is what makes the mobile button cheap to press later. It is listed separately
because it is not required for the backfill and should not be blocked behind it.

## Two observations, not tasks

- **`organization.get` has no `preAct`** — no `setTokens`, no `setUser`, no
  `grantAccess` (`back/src/organization/get/mod.ts`). It returns any organization by
  `_id` to an unauthenticated caller. `road.get` and `road.gets` are the same. The
  patrol app now depends on `organization.get` to learn its own road, and it sends its
  token, but nothing checks it. Worth closing.
- **`getOrgScopedRoadIds` is not an act.** It is a private helper in
  `back/src/accident/reportScope.ts:18-35`, gated to `OrgHead`/`UnitHead`, returning
  road **ids** rather than geometry. The app does not need it — the 1:1
  `organization.road` relation returns the geometry inline, which is why this task needs
  no new act — but its name invites the assumption that such an act exists.

## Verification

Deno strips types without checking them. `deno task bc-dev` boots successfully with a
broken act and throws at runtime on the first request that reaches it. **A clean boot
proves nothing here.** Only these checks are evidence:

1. **The count.** After the backfill, the number of `road` documents with a non-empty
   `area` is reported, and the list of roads still without one is printed and explained.
   "Some roads have no geometry" is acceptable and must be a list; "most roads have no
   geometry" means the task is not done.
2. **`snapPointToRoad` works.** Take three points on one of the newly-filled roads, call
   the act, and confirm it returns a road and a plausible `kilometer`/`meter`. Before the
   backfill it returns the «نزدیک‌ترین راه در شعاع پوشش یافت نشد» error for every one.
3. **The demo road is unchanged.** `snapPointToRoad` on the Ahvaz demo road returns the
   same kilometre as before. A regression here means the backfill overwrote a known-good
   geometry.
4. **`getRoadsGeometry` with a polygon** now returns the roads that intersect it. Before,
   it returned an empty set no matter what polygon you sent.
5. **Vertex order survived.** For one filled road, confirm `kilometer` increases
   monotonically along the stored `area` array. A road that runs the other way, or whose
   vertices were reordered by a GIS tool, is a silent and serious corruption.
6. **`total_length_meters` matches the geometry.** Recompute one and compare against the
   stored value.
7. **Re-run the seed** and confirm it does not reintroduce geometry-less roads — this is
   the check that proves item 2 landed.

## Constraints

- **Never reorder or reverse the `area` vertex array.** Linear referencing depends on
  the order; a reversed road reports every kilometre mirrored.
- Keep coordinates as `[lng, lat]`. The app's `domain/organization.ts` already swaps the
  order for `organization.location`, and a road written the other way round lands in the
  Indian Ocean on the officer's map.
- Do not change the `road` model's field set or the shape of any road act's `set`/`get`.
  `front/` type-checks against the generated declarations.
- If you regenerate declarations, use `TYPE_GENERATION=true deno run -A mod.ts` and copy
  the result to `front/src/types/declarations/`. Never hand-edit `selectInp.ts`.
- Prefer an idempotent backfill: re-running it must be safe and must not re-fetch roads
  that already have geometry.
- Do not "fix" geometry-less roads by making `area` optional. It is required, and the
  enforcement gap is the bug.
- Write and run this against a **backup or a staging copy first**. This modifies roughly
  1,490 production documents with geometry that officers' reports will then be located
  against.