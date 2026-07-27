# فرآیند رویداد Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────┐
│         فرآیند رویداد                      │
├──────────────────────────────────┤
│ PURE FIELDS                      │
│  caption, start_date, end_date   │
│  createdAt, updatedAt            │
│                                  │
│ RELATIONS                        │
│  registrer ────► User (single)   │
│                                  │
│ REVERSE RELATIONS (auto):        │
│  ◄── user.registred_events       │
│       (multiple, 50)             │
└──────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| caption | رشته | عنوان فرآیند رویداد |
| start_date | تاریخ | تاریخ شروع فرآیند |
| end_date | تاریخ | تاریخ پایان فرآیند |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Relations

### From فرآیند رویداد → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | registred_events (multiple, 50) |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439032",
  "caption": "New Year Event Processing",
  "start_date": "2024-03-20T00:00:00.000Z",
  "end_date": "2024-04-01T00:00:00.000Z",
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "createdAt": "2024-03-01T00:00:00.000Z",
  "updatedAt": "2024-03-01T00:00:00.000Z"
}
```
