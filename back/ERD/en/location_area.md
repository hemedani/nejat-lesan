# LocationArea Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────┐
│              LocationArea                          │
├──────────────────────────────────────────┤
│ PURE FIELDS                              │
│  caption, in_native_area                 │
│  area: GeoJSON Polygon                   │
│  createdAt, updatedAt                    │
│                                          │
│ RELATIONS                                │
│  registrer ────► User (single, optional) │
│  province ─────► Province (single, optional)   │
│  city ─────────► City (single, optional)   │
│  axes ─────────► Road (single, optional)   │
└──────────────────────────────────────────┘
```

## Pure Fields
| Field | Type | Description |
|-------|------|-------------|
| caption | string | Location area caption |
| in_native_area | boolean | Whether inside native area |
| area | GeoJSON Polygon | Location area polygon |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From LocationArea → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| province | single | Province | true | location_areas (multiple, 50) |
| city | single | City | true | location_areas (multiple, 50) |
| axes | single | Road | true | location_areas (multiple, 50) |

## Indexes

| Field | Type |
|------|------|
| area | 2dsphere |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439034",
  "caption": "Accident Hotspot Zone A",
  "in_native_area": true,
  "area": {
    "type": "Polygon",
    "coordinates": [[[51.3, 35.6], [51.5, 35.6], [51.5, 35.8], [51.3, 35.8], [51.3, 35.6]]]
  },
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "province": { "_id": "prov001", "name": "Tehran" },
  "city": { "_id": "city001", "name": "Tehran" },
  "axes": { "_id": "road001", "name": "Valiasr Street" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
