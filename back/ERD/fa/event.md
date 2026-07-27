# رویداد Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────┐
│            رویداد                    │
├──────────────────────────────────┤
│ PURE FIELDS                      │
│  name, description               │
│  dates: [{from, to,              │
│    startEntireRange,             │
│    endEntireRange}]              │
│                                  │
│ RELATIONS                        │
│  registrer ────► User (single)   │
└──────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| name | رشته | نام رویداد |
| description | رشته | توضیحات رویداد |
| dates | object[] | آرایه‌ای از محدوده‌های تاریخ با from، to، startEntireRange، endEntireRange |

## Relations

### From رویداد → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439031",
  "name": "New Year Holidays",
  "description": "Nowruz 1403 holidays",
  "dates": [
    {
      "from": "1403-01-01",
      "to": "1403-01-13",
      "startEntireRange": "1403-01-01",
      "endEntireRange": "1403-01-13"
    }
  ],
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "createdAt": "2024-03-20T00:00:00.000Z",
  "updatedAt": "2024-03-20T00:00:00.000Z"
}
```
