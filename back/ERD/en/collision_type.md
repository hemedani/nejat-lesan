# CollisionType Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────┐
│       COLLISIONTYPE         │
├──────────────────────────────────┤
│ PURE FIELDS                      │
│ ┌────────────────────────────┐   │
│ │ name: string               │   │
│ │ createdAt: date            │   │
│ │ updatedAt: date            │   │
│ └────────────────────────────┘   │
│                                  │
│ RELATIONS                        │
│ ┌────────────────────────────┐   │
│ │ registrer ────► User       │   │
│ └────────────────────────────┘   │
└──────────────────────────────────┘
```

## Pure Fields

| Field | Type | Description |
|-------|------|-------------|
| name | string | CollisionType name |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From CollisionType → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |

### Reverse Relations (from other models → CollisionType)

| Source Model | Relation | Type | Limit |
|-------------|----------|------|-------|
| accident | accidents | single | 1 |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd7994390xx",
  "name": "Example CollisionType",
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
