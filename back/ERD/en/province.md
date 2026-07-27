# Province Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────┐
│                 Province                       │
├──────────────────────────────────────────────┤
│ PURE FIELDS                                  │
│  name, english_name, population              │
│  area: MultiPolygon, center_location: Point  │
│  createdAt, updatedAt                        │
│                                              │
│ RELATIONS                                    │
│  registrer ────► User (single, optional)     │
│                                              │
│ REVERSE RELATIONS (auto from Lesan):         │
│  ◄── city.province (cities, multiple, 50)   │
│  ◄── township.province (cities, multiple,50) │
│  ◄── road.province (axeses, multiple, 50)    │
│  ◄── accident.province (accidents, mult,20)  │
│  ◄── location_area.province (areas, mult,50) │
└──────────────────────────────────────────────┘
```

## Pure Fields
| Field | Type | Description |
|-------|------|-------------|
| name | string | Province name |
| english_name | string | Province English name |
| population | number | Province population |
| area | GeoJSON MultiPolygon | Province geographical area |
| center_location | GeoJSON Point | Province center point |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From Province → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |

### Reverse Relations (from other models → Province)

| Source Model | Local Relation | Type | Limit |
|-------------|---------------|------|-------|
| city | province | multiple | 50 |
| township | province | multiple | 50 |
| road | province | multiple | 50 |
| accident | province | multiple | 20 |
| location_area | province | multiple | 50 |

## Indexes

| Field | Type |
|------|------|
| area | 2dsphere |
| center_location | 2dsphere |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439020",
  "name": "Tehran",
  "english_name": "Tehran",
  "population": 14000000,
  "area": {
    "type": "MultiPolygon",
    "coordinates": [[[[51.0, 35.5], [51.5, 35.5], [51.5, 35.9], [51.0, 35.9], [51.0, 35.5]]]]
  },
  "center_location": {
    "type": "Point",
    "coordinates": [51.3890, 35.6892]
  },
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
