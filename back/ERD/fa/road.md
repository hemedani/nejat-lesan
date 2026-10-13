# محور Model ERD

## Entity-Relationship Diagram

```
┌──────────────────────────────────────────────┐
│                 محور                        │
├──────────────────────────────────────────────┤
│ PURE FIELDS                                  │
│  name, area: MultiLineString                 │
│  origin, destination                         │
│  total_length_meters  ← مشتق از area        │
│  lanes: [{ _id, name }] → موقعیت            │
│  createdAt, updatedAt                        │
│                                              │
│ RELATIONS                                    │
│  registrer ────► User (single, optional)     │
│  province ─────► استان (single, اجباری)     │
│                                              │
│ REVERSE RELATIONS (auto from Lesan):         │
│  ◄── organization.road (single)              │
│  ◄── unit.road (units, multiple)             │
│  ◄── accident.road (accidents, multiple, 20) │
└──────────────────────────────────────────────┘
```

## Pure Fields
| فیلد | نوع | توضیح |
|------|-----|-------|
| name | رشته | نام محور |
| area | GeoJSON MultiLineString | محورِ مرتب، هر رأس به ترتیب `[lng, lat]` |
| origin | رشته، اختیاری | نام مبدأ |
| destination | رشته، اختیاری | نام مقصد |
| total_length_meters | عدد، اختیاری | **مشتق.** طولِ کشیده‌شدهٔ `area`؛ `add`/`update` دوباره حسابش می‌کنند و هیچ‌وقت از کلاینت گرفته نمی‌شود |
| lanes | آرایهٔ `{_id, name}`، اختیاری | تعریف خط/باند ارجاع‌دهنده به اسناد `موقعیت` |
| createdAt | تاریخ | زمان ایجاد رکورد |
| updatedAt | تاریخ | زمان آخرین بروزرسانی |

## Relations

### From محور → Other Models

| Relation | Type | Target | Optional | Reverse |
|----------|------|--------|----------|---------|
| registrer | single | User | true | (none) |
| province | single | استان | **false** | roads (multiple, 50) |

### Reverse Relations (from other models → محور)

| Source Model | Local Relation | Type | Limit |
|-------------|---------------|------|-------|
| organization | road | single | — |
| unit | road | multiple | 50 |
| accident | road | multiple | 20 |

## Indexes

| Field | Type |
|------|------|
| area | 2dsphere |

## نکات رفتاری

- **`total_length_meters` مشتق است.** `road.add` و `road.update` آن را از `area`
  با `multiLineLengthMeters` (از `utils/geo.ts`) دوباره حساب می‌کنند و هیچ‌کدام
  این فیلد را در validator نمی‌پذیرند. تخمین دقیقاً همان روش equirectangularِ
  `projectPointToMultiLine` است، پس مقدارِ ذخیره‌شده و خطی که `snapPointToRoad` رویش
  می‌نشاند نمی‌توانند اختلاف بگیرند. عددِ دستی بی‌سروصدا به گزارش کیلومتر/متر می‌رسد.
- **ورودی‌های `lanes` باید به اسنادِ واقعیِ `موقعیت` اشاره کنند.** هر دو اکشن
  هر `_id` را بررسی می‌کنند و در غیر این صورت «موقعیت‌های انتخاب‌شده معتبر نیستند»
  می‌دهند. `common_relation_struct` وجود `name` را تضمین می‌کند، پس `{_id}` تنها
  در validator رد می‌شود و شناسهٔ کهنه در fn.
- **`road_excludes` = `["area", "updatedAt", "createdAt"]`** — رابطه‌ی برعکسِ
  `province.roads` هندسه (گران‌ترین فیلد) را حذف می‌کند ولی `origin`، `destination`،
  `total_length_meters` و `lanes` را نگه می‌دارد.

## Complete Example

```json
{
  "_id": "507f1f77bcf86cd799439025",
  "name": "Tehran-North Freeway",
  "area": {
    "type": "MultiLineString",
    "coordinates": [[[51.3, 35.7], [51.35, 35.75], [51.4, 35.8], [51.45, 35.85]]]
  },
  "origin": "تهران",
  "destination": "شمال",
  "total_length_meters": 21430,
  "lanes": [
    { "_id": "60f1", "name": "خط اول" },
    { "_id": "60f2", "name": "خط دوم" }
  ],
  "registrer": { "_id": "user001", "first_name": "Admin", "last_name": "User" },
  "province": { "_id": "prov001", "name": "Tehran" },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```
