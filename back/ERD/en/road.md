# Road Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────┐
│                 Road                       │
├──────────────────────────────────────────────┤
│ PURE FIELDS                                  │
│  name, area: MultiLineString                 │
│  createdAt, updatedAt                        │
│                                              │
│ RELATIONS                                    │
│  registrer ────► User (single, optional)     │
│  province ─────► Province (single, optional) │
│                                              │
│ REVERSE RELATIONS (auto from Lesan):         │
│  ◄── accident.road (accidents, multiple, 20) │
│  ◄── location_area.axes (areas, multiple,50) │
└──────────────────────────────────────────────┘
```

## Pure Fields
| Field | Type | Description |
|-------|------|-------------|
| name | string | Road name |
| area | GeoJSON MultiLineString | Road geographical path |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From Road → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| province | single | Province | true | axeses (multiple, 50) |

### Reverse Relations (from other models → Road)

| Source Model | Local Relation | Type | Limit |
|-------------|---------------|------|-------|
| accident | road | multiple | 20 |
| location_area | axes | multiple | 50 |

## Indexes

| Field | Type |
|------|------|
| area | 2dsphere |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439025",
  "name": "Tehran-North Freeway",
  "area": {
    "type": "MultiLineString",
    "coordinates": [[[51.3, 35.7], [51.35, 35.75], [51.4, 35.8], [51.45, 35.85]]]
  },
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "province": { "_id": "prov001", "name": "Tehran" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
