# فایل Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────┐
│            فایل                    │
├──────────────────────────────────┤
│ PURE FIELDS                      │
│  name, type, size                │
│  createdAt, updatedAt            │
│                                  │
│ RELATIONS                        │
│  uploader ────► User (single)    │
│                                  │
│ REVERSE RELATIONS (auto):        │
│  ◄── user.uploadedAssets (mult)  │
│  ◄── accident.attachments (mult) │
└──────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| name | رشته | نام فایل |
| type | رشته | نوع MIME فایل |
| size | عدد | اندازه فایل (بایت) |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Relations

### From فایل → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| uploader | single | User | false | uploadedAssets (multiple, 50) |

### Reverse Relations (from other models → فایل)

| Source Model | Relation | Type | Limit |
|-------------|----------|------|-------|
| accident | attachments | multiple | (unlimited) |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439033",
  "name": "accident_photo_001.jpg",
  "type": "image/jpeg",
  "size": 2048576,
  "uploader": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "createdAt": "2024-06-16T10:00:00.000Z",
  "updatedAt": "2024-06-16T10:00:00.000Z"
}
```
