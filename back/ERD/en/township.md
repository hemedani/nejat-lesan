# Township Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────┐
│                 Township                       │
├──────────────────────────────────────────────┤
│ PURE FIELDS                                  │
│  name, english_name, population              │
│  area: MultiPolygon, center_location: Point  │
│  createdAt, updatedAt                        │
│                                              │
│ RELATIONS                                    │
│  registrer ────► User (single, optional)     │
│  province ─────► Province (single, optional) │
│                                              │
│ REVERSE RELATIONS (auto from Lesan):         │
│  ◄── accident.township (accidents, mult, 20)│
└──────────────────────────────────────────────┘
```

## Pure Fields
| Field | Type | Description |
|-------|------|-------------|
| name | string | Township name |
| english_name | string | Township English name |
| population | number | Township population |
| area | GeoJSON MultiPolygon | Township geographical area |
| center_location | GeoJSON Point | Township center point |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From Township → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| province | single | Province | true | cities (multiple, 50) |

### Reverse Relations (from other models → Township)

| Source Model | Local Relation | Type | Limit |
|-------------|---------------|------|-------|
| accident | township | multiple | 20 |

## Indexes

| Field | Type |
|------|------|
| area | 2dsphere |
| center_location | 2dsphere |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439022",
  "name": "Shemiranat",
  "english_name": "Shemiranat",
  "population": 500000,
  "area": {
    "type": "MultiPolygon",
    "coordinates": [[[[51.3, 35.7], [51.6, 35.7], [51.6, 35.9], [51.3, 35.9], [51.3, 35.7]]]]
  },
  "center_location": {
    "type": "Point",
    "coordinates": [51.45, 35.80]
  },
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "province": { "_id": "prov001", "name": "Tehran" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
