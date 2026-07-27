# User Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     User                                           │
├──────────────────────────────────────────────────────────────────┤
│ PURE FIELDS                                                      │
│  first_name, last_name, father_name, mobile, gender              │
│  birth_date?, summary?, national_number (validated)              │
│  address, level (enum), is_verified                              │
│  settings { cities[], provinces[], availableCharts }             │
│  createdAt, updatedAt                                            │
│                                                                  │
│ RELATIONS                                                        │
│  avatar ────────► File (single, optional)                        │
│  national_card ──► File (single, optional)                       │
│                                                                  │
│ REVERSE RELATIONS (auto from Lesan):                             │
│  ◄── file.uploader (uploadedAssets, multiple, 50)                │
│  ◄── event_process.registrer (registred_events, multiple, 50)    │
│  ◄── police_station.commander (police_station, single)           │
│  ◄── All shared models .registrer (no named reverse)             │
└──────────────────────────────────────────────────────────────────┘
```

## Pure Fields
| Field | Type | Description |
|-------|------|-------------|
| first_name | string | First name |
| last_name | string | Last name |
| father_name | string | Father name |
| mobile | string (pattern) | Mobile phone number (Iranian pattern) |
| gender | enum(Male, Female) | Gender |
| birth_date | date (optional) | Birth date |
| summary | string (optional) | User summary |
| national_number | string/number (refined) | National ID (validated) |
| address | string | Address |
| level | enum(Ghost, Manager, Editor, Enterprise) | User authorization level |
| is_verified | boolean (default: false) | Verification status |
| settings | object (Enterprise) | Enterprise-level settings with cities, provinces, availableCharts |
| createdAt | date | Record creation timestamp |
| updatedAt | date | Last update timestamp |

## Authorization Levels
Levels: Ghost, Manager, Editor, Enterprise

Enterprise-level users have a `settings` field that restricts access to specific:
- Cities (with center_location for map bounds)
- Provinces (with center_location for map bounds)
- Available charts (per-chart filter configurations)

## Relations

### From User → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| avatar | single | File | true | (none) |
| national_card | single | File | true | (none) |

### Reverse Relations (from other models → User)

| Source Model | Relation | Type | Limit |
|-------------|----------|------|-------|
| file | uploader | multiple | 50 |
| event_process | registrer | multiple | 50 |
| police_station | commander | single | 1 |
| (all shared models) | registrer | multiple | (default) |

## Indexes

| Field | Type | Options |
|------|------|---------|
| national_number | 1 | unique |

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439050",
  "first_name": "Admin",
  "last_name": "System",
  "father_name": "Father",
  "mobile": "09121234567",
  "gender": "Male",
  "birth_date": "1990-01-01T00:00:00.000Z",
  "summary": "System administrator",
  "national_number": "1234567890",
  "address": "Tehran, Iran",
  "level": "Manager",
  "is_verified": true,
  "settings": {
    "cities": [
      { "_id": "city001", "name": "Tehran", "center_location": { "type": "Point", "coordinates": [51.3890, 35.6892] } }
    ],
    "provinces": [
      { "_id": "prov001", "name": "Tehran", "center_location": { "type": "Point", "coordinates": [51.3890, 35.6892] } }
    ],
    "availableCharts": {
      "accidentSeverityAnalytics": {},
      "temporalCountAnalytics": {}
    }
  },
  "avatar": { "_id": "file001", "name": "avatar.jpg", "type": "image/jpeg", "size": 102400 },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
