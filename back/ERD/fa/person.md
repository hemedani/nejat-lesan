# شخص Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────┐
│               شخص                         │
├──────────────────────────────────────────┤
│ PURE FIELDS                              │
│  person_type (enum), sex (enum)          │
│  national_code, first_name, last_name    │
│  licence_number                          │
│  createdAt, updatedAt                    │
│                                          │
│ RELATIONS                                │
│  registrer ────► User (single, required) │
│  licence_type ──► LicenceType (single)   │
└──────────────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| person_type | enum(راننده، مسافر، عابر، موتورسوار) | نقش شخص در تصادف |
| sex | enum(مرد، زن) | جنسیت |
| national_code | رشته | کد ملی |
| first_name | رشته | نام |
| last_name | رشته | نام خانوادگی |
| licence_number | عدد | شماره گواهینامه |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Relations

### From شخص → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | false | (none) |
| licence_type | single | LicenceType | true | (none) |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439040",
  "person_type": "driver",
  "sex": "Male",
  "national_code": "1234567890",
  "first_name": "Reza",
  "last_name": "Ahmadi",
  "licence_number": 12345,
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "licence_type": { "_id": "lic001", "name": "Grade 1" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
