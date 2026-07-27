# راننده Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────┐
│            راننده                    │
├──────────────────────────────────┤
│ PURE FIELDS ONLY                 │
│  sex, lastName, firstName        │
│  injuryType, licenceType         │
│  nationalCode, licenceNumber     │
│  totalReason                     │
│                                  │
│ 📌 No Lesan relations defined   │
│  (Used as embedded DTO within    │
│   accident.vehicle_dtos[])       │
└──────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| sex | رشته | جنسیت راننده |
| lastName | رشته | نام خانوادگی راننده |
| firstName | رشته | نام راننده |
| injuryType | رشته | نوع مصدومیت |
| licenceType | رشته | نوع گواهینامه |
| nationalCode | رشته | کد ملی |
| licenceNumber | رشته | شماره گواهینامه |
| totalReason | رشته | علت تامه |

## Relations

این مدل **هیچ رابطه لسان** ندارد — فقط فیلدهای خالص دارد. به عنوان یک شی توکار در آرایه `vehicle_dtos` مدل تصادف استفاده می‌شود.

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439041",
  "sex": "Male",
  "lastName": "Ahmadi",
  "firstName": "Reza",
  "injuryType": "Minor",
  "licenceType": "Grade 1",
  "nationalCode": "1234567890",
  "licenceNumber": "12345",
  "totalReason": "Speeding"
}
```
