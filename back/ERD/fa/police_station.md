# کلانتری Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────┐
│              کلانتری                          │
├──────────────────────────────────────────┤
│ PURE FIELDS                              │
│  name, location: Polygon                 │
│  area: MultiPolygon, code, is_active     │
│  military_rank                           │
│  createdAt, updatedAt                    │
│                                          │
│ RELATIONS                                │
│  registrer ────► User (single, optional) │
│  commander ────► User (single, optional) │
└──────────────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| name | رشته | نام کلانتری |
| location | GeoJSON Polygon | موقعیت مکانی کلانتری |
| area | GeoJSON MultiPolygon | محدوده استحفاظی |
| code | عدد | کد کلانتری |
| is_active | boolean | فعال بودن کلانتری |
| military_rank | عدد | درجه نظامی فرمانده |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Relations

### From کلانتری → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| commander | single | User | true | police_station (single) |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439035",
  "name": "Police Station 12",
  "location": {
    "type": "Polygon",
    "coordinates": [[[51.38, 35.68], [51.39, 35.68], [51.39, 35.69], [51.38, 35.69], [51.38, 35.68]]]
  },
  "area": {
    "type": "MultiPolygon",
    "coordinates": [[[[51.3, 35.6], [51.5, 35.6], [51.5, 35.8], [51.3, 35.8], [51.3, 35.6]]]]
  },
  "code": 12,
  "is_active": true,
  "military_rank": 5,
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "commander": { "_id": "user002", "first_name": "Colonel", "last_name": "Mohammadi" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
