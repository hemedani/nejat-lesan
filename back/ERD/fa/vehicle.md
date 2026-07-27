# وسیله نقلیه Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────┐
│            وسیله نقلیه                            │
├──────────────────────────────────────────┤
│ PURE FIELDS                              │
│  plaque_no: (string, string, string)     │
│  createdAt, updatedAt                    │
│                                          │
│ RELATIONS                                │
│  registrer ────► User (single, optional) │
│  color ────────► رنگ (single, optional)   │
│  plaque_type ──► نوع پلاک (single, optional)   │
│  system_type ──► نوع سیستم (single, optional)   │
└──────────────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| plaque_no | tuple(رشته، رشته، رشته) | شماره پلاک (سه بخشی) |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Relations

### From وسیله نقلیه → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| color | single | رنگ | true | (none) |
| plaque_type | single | نوع پلاک | true | (none) |
| system_type | single | نوع سیستم | true | (none) |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439042",
  "plaque_no": ["12", "B", "345"],
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "color": { "_id": "color001", "name": "White" },
  "plaque_type": { "_id": "pt001", "name": "Private" },
  "system_type": { "_id": "st001", "name": "Hydraulic" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
