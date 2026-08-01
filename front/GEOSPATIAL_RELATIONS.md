# Geo-Spatial Model Relations (for frontend AI agent)

## Models covered

- `province`
- `city`
- `city_zone`
- `road`

## Relation graph

```
user ◄── registrer         (every model)
province ◄── city.province ──► province.cities[], province.center
province ◄── road.province ──► province.axeses[]
city ◄── city_zone.city ──► city.city_zones[]
```

## How Lesan relations work here

Relations are **one-directional**: only the "child" model defines the relation to its parent; the parent's reverse relation (`relatedRelations`) is auto-created and managed by Lesan. So the same edge is accessed from both sides:

| Model | Relation (defined here) | Auto-created reverse on target |
|---|---|---|
| `city` | `city.province` (single, optional) | `province.cities` (multiple, `limit: 50`), `province.center` (single) |
| `city_zone` | `city_zone.city` (single, optional) | `city.city_zones` (multiple, `limit: 50`) |
| `road` | `road.province` (single, optional) | `province.axeses` (multiple, `limit: 50`) |
| all | `registrer` → `user` (single, optional) | none |

## Key facts for the frontend agent

- **Hierarchy**: `province → city → city_zone`. Cities belong to provinces, city zones belong to cities.
- **Roads bypass the city level**: `road` links **only to `province`** — there is **no** `road.city` or `road.city_zone` relation. To filter roads by city/zone, you'd have to intersect spatially or go through province.
- **`province.center`** is the special "capital/center city" of a province (single) — distinct from the `cities` list. Pick `center` when you need the capital.
- **Known issue (road.ts:29)**: `road.province` is a single relation but the comment notes an axis may span multiple provinces — the schema currently only supports one.
- **Excludes** matter for `get` projections: `area_excludes` hides geometry on parent-embed (province inside city, city inside city_zone), `road_excludes`/`city_zone_excludes` hide geometry on reverse arrays, and `user_excludes` trims user info. So when embedding parents you get `name`, `_id`, etc. but **not** `area`/timestamps.

## Query traversal examples (for `get` projections)

```jsonc
// List cities with their province (geometry stripped via area_excludes)
{ "get": { "_id": 1, "name": 1, "province": { "name": 1 } } }

// Province with its 50 latest cities + center city
{ "get": { "name": 1, "cities": { "name": 1 }, "center": { "name": 1 } } }

// City with its city zones
{ "get": { "name": 1, "city_zones": { "name": 1, "population": 1 } } }

// Road with its province (note: cannot reach city via road)
{ "get": { "name": 1, "province": { "name": 1 } } }
```

**Bottom line**: province is the root; city and road both point at province independently; city_zone points at city. There is no road↔city link.
