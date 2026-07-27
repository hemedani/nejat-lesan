# Country Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────┐
│            Country                    │
├──────────────────────────────────┤
│ PURE FIELDS                      │
│  name, description?, area[]      │
│  createdAt, updatedAt            │
│                                  │
│ RELATIONS                        │
│  registrer ────► User (single)   │
└──────────────────────────────────┘
```

## Pure Fields
| Field | Type | Description |
|-------|------|-------------|
| name | string | Country name |
| description | string (optional) | Country description |
| area | [number, number][] | Country area coordinates |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From Country → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439030",
  "name": "Iran",
  "description": "Islamic Republic of Iran",
  "area": [[51.0, 35.0], [52.0, 35.0], [52.0, 36.0], [51.0, 36.0], [51.0, 35.0]],
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
