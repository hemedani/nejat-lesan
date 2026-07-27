# City Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────┐
│                 City                       │
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
│  ◄── accident.city (accidents, multiple, 20) │
│  ◄── city_zone.city (city_zones, mult, 50)  │
│  ◄── location_area.city (areas, multiple,50) │
└──────────────────────────────────────────────┘
```

## Pure Fields
| Field | Type | Description |
|-------|------|-------------|
| name | string | City name |
| english_name | string | City English name |
| population | number | City population |
| area | GeoJSON MultiPolygon | City geographical area |
| center_location | GeoJSON Point | City center point |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From City → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| province | single | Province | true | cities (multiple, 50) |

### Reverse Relations (from other models → City)

| Source Model | Local Relation | Type | Limit |
|-------------|---------------|------|-------|
| accident | city | multiple | 20 |
| city_zone | city | multiple | 50 |
| location_area | city | multiple | 50 |

## Indexes

| Field | Type |
|------|------|
| area | 2dsphere |
| center_location | 2dsphere |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439021",
  "name": "Tehran",
  "english_name": "Tehran",
  "population": 9000000,
  "area": {
    "type": "MultiPolygon",
    "coordinates": [[[[51.2, 35.6], [51.5, 35.6], [51.5, 35.8], [51.2, 35.8], [51.2, 35.6]]]]
  },
  "center_location": {
    "type": "Point",
    "coordinates": [51.3890, 35.6892]
  },
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "province": { "_id": "prov001", "name": "Tehran" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
