# شهر Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────┐
│                 شهر                       │
├──────────────────────────────────────────────┤
│ PURE FIELDS                                  │
│  name, english_name, population              │
│  area: MultiPolygon, center_location: Point  │
│  createdAt, updatedAt                        │
│                                              │
│ RELATIONS                                    │
│  registrer ────► User (single, optional)     │
│  province ─────► استان (single, optional) │
│                                              │
│ REVERSE RELATIONS (auto from Lesan):         │
│  ◄── accident.city (accidents, multiple, 20) │
│  ◄── city_zone.city (city_zones, mult, 50)  │
│  ◄── location_area.city (areas, multiple,50) │
└──────────────────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| name | رشته | نام شهر |
| english_name | رشته | نام انگلیسی شهر |
| population | عدد | جمعیت شهر |
| area | GeoJSON MultiPolygon | محدوده جغرافیایی شهر |
| center_location | GeoJSON Point | نقطه مرکزی شهر |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Relations

### From شهر → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| province | single | استان | true | cities (multiple, 50) |

### Reverse Relations (from other models → شهر)

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
