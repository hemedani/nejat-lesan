# EventProcess Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────┐
│         EventProcess                      │
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
| Field | Type | Description |
|-------|------|-------------|
| caption | string | Event process caption |
| start_date | date | Process start date |
| end_date | date | Process end date |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From EventProcess → Other Models

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
