# File Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────┐
│            File                    │
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
| Field | Type | Description |
|-------|------|-------------|
| name | string | File name |
| type | string | File MIME type |
| size | number | File size in bytes |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From File → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| uploader | single | User | false | uploadedAssets (multiple, 50) |

### Reverse Relations (from other models → File)

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
