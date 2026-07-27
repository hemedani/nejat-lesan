# Air Status Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────┐
│           AIR STATUS             │
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

Reverse relations from other models:
  ◄── accident.air_statuses (multiple)
```

## Pure Fields

| Field | Type | Description |
|-------|------|-------------|
| name | string | Air status name (e.g., Clear, Rainy, Foggy) |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From Air Status → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |

### Reverse Relations (from other models → Air Status)

| Source Model | Relation | Type | Limit |
|-------------|----------|------|-------|
| accident | air_statuses | multiple | 20 |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439030",
  "name": "Clear",
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
