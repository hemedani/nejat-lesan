# Vehicle Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────┐
│            Vehicle                            │
├──────────────────────────────────────────┤
│ PURE FIELDS                              │
│  plaque_no: (string, string, string)     │
│  createdAt, updatedAt                    │
│                                          │
│ RELATIONS                                │
│  registrer ────► User (single, optional) │
│  color ────────► Color (single, optional)   │
│  plaque_type ──► PlaqueType (single, optional)   │
│  system_type ──► SystemType (single, optional)   │
└──────────────────────────────────────────┘
```

## Pure Fields
| Field | Type | Description |
|-------|------|-------------|
| plaque_no | tuple(string, string, string) | License plate number (3-part) |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From Vehicle → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| color | single | Color | true | (none) |
| plaque_type | single | PlaqueType | true | (none) |
| system_type | single | SystemType | true | (none) |

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
