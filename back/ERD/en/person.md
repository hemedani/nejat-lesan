# Person Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────┐
│               Person                         │
├──────────────────────────────────────────┤
│ PURE FIELDS                              │
│  person_type (enum), sex (enum)          │
│  national_code, first_name, last_name    │
│  licence_number                          │
│  createdAt, updatedAt                    │
│                                          │
│ RELATIONS                                │
│  registrer ────► User (single, required) │
│  licence_type ──► LicenceType (single)   │
└──────────────────────────────────────────┘
```

## Pure Fields
| Field | Type | Description |
|-------|------|-------------|
| person_type | enum(driver, passenger, pedestrian, biker) | Role of the person in accident |
| sex | enum(Male, Female) | Biological sex |
| national_code | string | National ID number |
| first_name | string | First name |
| last_name | string | Last name |
| licence_number | number | Driver license number |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Relations

### From Person → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | false | (none) |
| licence_type | single | LicenceType | true | (none) |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439040",
  "person_type": "driver",
  "sex": "Male",
  "national_code": "1234567890",
  "first_name": "Reza",
  "last_name": "Ahmadi",
  "licence_number": 12345,
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "licence_type": { "_id": "lic001", "name": "Grade 1" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
