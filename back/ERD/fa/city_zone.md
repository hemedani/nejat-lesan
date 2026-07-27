# ناحیه شهری Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────┐
│                 ناحیه شهری                       │
├──────────────────────────────────────────────┤
│ PURE FIELDS                                  │
│  name, area: MultiPolygon, population        │
│  createdAt, updatedAt                        │
│                                              │
│ RELATIONS                                    │
│  registrer ────► User (single, optional)     │
│  city ─────────► شهر (single, optional) │
│                                              │
│ REVERSE RELATIONS (auto from Lesan):         │
│  ◄── accident.city_zone (accidents, mult,20)│
└──────────────────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| name | رشته | نام ناحیه شهری |
| area | GeoJSON MultiPolygon | محدوده جغرافیایی ناحیه شهری |
| population | عدد | جمعیت ناحیه شهری |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Relations

### From ناحیه شهری → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| city | single | شهر | true | city_zones (multiple, 50) |

### Reverse Relations (from other models → ناحیه شهری)

| Source Model | Local Relation | Type | Limit |
|-------------|---------------|------|-------|
| accident | city_zone | multiple | 20 |

## Indexes

| Field | Type |
|------|------|
| area | 2dsphere |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439024",
  "name": "District 6 Zone 1",
  "area": {
    "type": "MultiPolygon",
    "coordinates": [[[[51.35, 35.68], [51.40, 35.68], [51.40, 35.72], [51.35, 35.72], [51.35, 35.68]]]]
  },
  "population": 50000,
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "city": { "_id": "city001", "name": "Tehran" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
