# کاربر Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                     کاربر                                           │
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
| فیلد | نوع | توضیح |
|------|-----|-------|
| first_name | رشته | نام |
| last_name | رشته | نام خانوادگی |
| father_name | رشته | نام پدر |
| mobile | رشته (الگو) | شماره موبایل (الگوی ایرانی) |
| gender | enum(مرد، زن) | جنسیت |
| birth_date | تاریخ (اختیاری) | تاریخ تولد |
| summary | رشته (اختیاری) | خلاصه کاربر |
| national_number | رشته/عدد (تأیید شده) | کد ملی (تأیید اعتبار شده) |
| address | رشته | آدرس |
| level | enum(Ghost, Manager, Editor, Enterprise) | سطح دسترسی |
| is_verified | boolean (پیش‌فرض: false) | وضعیت تأیید |
| settings | object (Enterprise) | تنظیمات سطح سازمانی با شهرها، استان‌ها، نمودارهای مجاز |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Authorization Levels
سطوح: Ghost، Manager، Editor، Enterprise

کاربران سطح Enterprise دارای فیلد `settings` هستند که دسترسی را محدود می‌کند به:
- شهرهای خاص (با مرکز موقعیت برای محدوده نقشه)
- استان‌های خاص (با مرکز موقعیت برای محدوده نقشه)
- نمودارهای مجاز (پیکربندی فیلتر به ازای هر نمودار)

## Relations

### From کاربر → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| avatar | single | File | true | (none) |
| national_card | single | File | true | (none) |

### Reverse Relations (from other models → کاربر)

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
