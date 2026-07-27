# Driver Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────┐
│            Driver                    │
├──────────────────────────────────┤
│ PURE FIELDS ONLY                 │
│  sex, lastName, firstName        │
│  injuryType, licenceType         │
│  nationalCode, licenceNumber     │
│  totalReason                     │
│                                  │
│ 📌 No Lesan relations defined   │
│  (Used as embedded DTO within    │
│   accident.vehicle_dtos[])       │
└──────────────────────────────────┘
```

## Pure Fields
| Field | Type | Description |
|-------|------|-------------|
| sex | string | Driver gender |
| lastName | string | Driver last name |
| firstName | string | Driver first name |
| injuryType | string | Injury type description |
| licenceType | string | License type description |
| nationalCode | string | National ID number |
| licenceNumber | string | Driver license number |
| totalReason | string | Total reason description |

## Relations

This model has **no Lesan relations** — it has only pure fields. It is used as an embedded object within the `vehicle_dtos` array of the Accident model.

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439041",
  "sex": "Male",
  "lastName": "Ahmadi",
  "firstName": "Reza",
  "injuryType": "Minor",
  "licenceType": "Grade 1",
  "nationalCode": "1234567890",
  "licenceNumber": "12345",
  "totalReason": "Speeding"
}
```
