# محدوده مکانی Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────┐
│              محدوده مکانی                          │
├──────────────────────────────────────────┤
│ PURE FIELDS                              │
│  caption, in_native_area                 │
│  area: GeoJSON Polygon                   │
│  createdAt, updatedAt                    │
│                                          │
│ RELATIONS                                │
│  registrer ────► User (single, optional) │
│  province ─────► استان (single, optional)   │
│  city ─────────► شهر (single, optional)   │
│  axes ─────────► محور (single, optional)   │
└──────────────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| caption | رشته | عنوان محدوده مکانی |
| in_native_area | boolean | آیا در محدوده بومی است |
| area | GeoJSON Polygon | چندضلعی محدوده مکانی |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Relations

### From محدوده مکانی → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| province | single | استان | true | location_areas (multiple, 50) |
| city | single | شهر | true | location_areas (multiple, 50) |
| axes | single | محور | true | location_areas (multiple, 50) |

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
