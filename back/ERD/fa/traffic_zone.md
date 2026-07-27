# حوزه ترافیکی Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────┐
│                 حوزه ترافیکی                       │
├──────────────────────────────────────────────┤
│ PURE FIELDS                                  │
│  name, area: MultiPolygon, population        │
│  createdAt, updatedAt                        │
│                                              │
│ RELATIONS                                    │
│  registrer ────► User (single, optional)     │
│                                              │
│ REVERSE RELATIONS (auto from Lesan):         │
│  ◄── accident.traffic_zone (accidents, mult) │
└──────────────────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| name | رشته | نام حوزه ترافیکی |
| area | GeoJSON MultiPolygon | محدوده جغرافیایی حوزه ترافیکی |
| population | عدد | جمعیت حوزه ترافیکی |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Relations

### From حوزه ترافیکی → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |

### Reverse Relations (from other models → حوزه ترافیکی)

| Source Model | Local Relation | Type | Limit |
|-------------|---------------|------|-------|
| accident | traffic_zone | multiple | 20 |

## Indexes

| Field | Type |
|------|------|
| area | 2dsphere |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439023",
  "name": "District 12",
  "area": {
    "type": "MultiPolygon",
    "coordinates": [[[[51.3, 35.65], [51.45, 35.65], [51.45, 35.72], [51.3, 35.72], [51.3, 35.65]]]]
  },
  "population": 250000,
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
