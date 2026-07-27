# مدل تصادف - نمودار ERD

## نمودار موجودیت-رابطه (متنی)

```
┌──────────────────────────────────────────────────────────────────┐
│                          تصادف (ACCIDENT)                        │
├──────────────────────────────────────────────────────────────────┤
│ فیلدهای خالص (PURE FIELDS)                                        │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ seri: number                       (شماره سری تصادف)       │   │
│ │ serial: number                   (شماره منحصربه‌فرد تصادف)  │   │
│ │ location: GeoJSON Point           (موقعیت مکانی تصادف)     │   │
│ │ date_of_accident: date              (تاریخ وقوع تصادف)     │   │
│ │ dead_count: number                     (تعداد فوتی‌ها)     │   │
│ │ has_witness: boolean                   (وجود شاهد؟)        │   │
│ │ news_number: number                (شماره خبرگزاری)        │   │
│ │ officer: string                  (نام مأمور کاشف)          │   │
│ │ injured_count: number                 (تعداد مجروحین)      │   │
│ │ completion_date: date          (تاریخ تکمیل گزارش)         │   │
│ │ createdAt: date                (تاریخ ایجاد رکورد)         │   │
│ │ updatedAt: date                (تاریخ آخرین بروزرسانی)     │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ اشیای توکار (Embedded DTOs)                                      │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ vehicle_dtos[]  → آرایه‌ای از DTO وسیله نقلیه               │   │
│ │ pedestrian_dtos[] → آرایه‌ای از DTO عابر پیاده               │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                  │
│ روابط (RELATIONS)                                                │
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ تکی (SINGLE):                                               │   │
│ │   province ──────► استان            (معکوس: تصادفات)        │   │
│ │   city ──────────► شهر              (معکوس: تصادفات)        │   │
│ │   township ──────► شهرستان          (معکوس: تصادفات)        │   │
│ │   road ──────────► محور             (معکوس: تصادفات)        │   │
│ │   traffic_zone ──► حوزه ترافیکی     (معکوس: تصادفات)        │   │
│ │   city_zone ─────► ناحیه شهری       (معکوس: تصادفات)        │   │
│ │   type ──────────► نوع تصادف        (معکوس: تصادفات)        │   │
│ │   position ──────► موقعیت           (معکوس: تصادفات)        │   │
│ │   ruling_type ───► نوع رأی          (معکوس: تصادفات)        │   │
│ │   light_status ─► وضعیت روشنایی     (معکوس: تصادفات)        │   │
│ │   collision_type ► نوع برخورد       (معکوس: تصادفات)        │   │
│ │   road_situation ► وضعیت راه        (معکوس: تصادفات)        │   │
│ │   road_repair_type ► نوع تعمیرات   (معکوس: تصادفات)         │   │
│ │   shoulder_status ► وضعیت شانه     (معکوس: تصادفات)         │   │
│ │ چندتایی (MULTIPLE):                                          │   │
│ │   area_usages ───► کاربری اراضی[]   (معکوس: تصادفات)        │   │
│ │   air_statuses ──► وضعیت هوا[]      (معکوس: تصادفات)        │   │
│ │   road_defects ──► نقص راه[]        (معکوس: تصادفات)        │   │
│ │   human_reasons ► عوامل انسانی[]     (معکوس: تصادفات)        │   │
│ │   vehicle_reasons ► دلایل وسیله[]    (معکوس: تصادفات)        │   │
│ │   equipment_damages ► خسارت تجهیزات[] (معکوس: تصادفات)      │   │
│ │   road_surface_conditions ► شرایط سطح راه[]   (معکوس)       │   │
│ │   attachments ──► فایل‌ها[]         (بدون رابطه معکوس)      │   │
│ └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## VehicleDTO (توکار در vehicle_dtos[])

| فیلد | نوع | توضیح |
|------|-----|-------|
| color | common_relation_struct | رنگ وسیله نقلیه {شناسه، نام} |
| driver | object | اطلاعات راننده (جدول زیر) |
| system | common_relation_struct | سیستم وسیله {شناسه، نام} |
| plaque_type | common_relation_struct | نوع پلاک {شناسه، نام} |
| plaque_no | tuple(رشته، رشته، رشته) | شماره پلاک |
| system_type | common_relation_struct | نوع سیستم {شناسه، نام} |
| fault_status | common_relation_struct | وضعیت خطا {شناسه، نام} |
| insurance_co | common_relation_struct | شرکت بیمه‌گر {شناسه، نام} |
| insurance_no | رشته | شماره بیمه‌نامه |
| plaque_usage | common_relation_struct | نوع کاربری پلاک {شناسه، نام} |
| print_number | رشته | شماره چاپ |
| plaque_serial | رشته[] (اختیاری) | سریال پلاک |
| insurance_date | تاریخ | تاریخ اعتبار بیمه |
| body_insurance_co | common_relation_struct | شرکت بیمه بدنه {شناسه، نام} |
| body_insurance_no | رشته (اختیاری) | شماره بیمه بدنه |
| motion_direction | common_relation_struct | جهت حرکت {شناسه، نام} |
| body_insurance_date | تاریخ | تاریخ اعتبار بیمه بدنه |
| max_damage_sections | common_relation_struct[] | بخش‌های حداکثر خسارت |
| damage_section_other | رشته | توضیح سایر بخش‌های خسارت |
| insurance_warranty_limit | عدد | سقف تعهدات بیمه‌نامه |
| passenger_dtos | PassengerDTO[] (اختیاری) | مسافران وسیله نقلیه |

### راننده (Driver - داخل VehicleDTO)

| فیلد | نوع | توضیح |
|------|-----|-------|
| sex | enum(مرد، زن، سایر) | جنسیت راننده |
| last_name | رشته | نام خانوادگی راننده |
| first_name | رشته | نام راننده |
| injury_type | common_relation_struct | نوع مصدومیت {شناسه، نام} |
| licence_type | common_relation_struct | نوع گواهینامه {شناسه، نام} |
| national_code | رشته | کد ملی |
| licence_number | رشته (اختیاری) | شماره گواهینامه |
| total_reason | common_relation_struct (اختیاری) | علت تامه {شناسه، نام} |

### مسافر (PassengerDTO - داخل VehicleDTO)

| فیلد | نوع | توضیح |
|------|-----|-------|
| sex | enum(مرد، زن، سایر) | جنسیت مسافر |
| last_name | رشته | نام خانوادگی مسافر |
| first_name | رشته | نام مسافر |
| injury_type | common_relation_struct | نوع مصدومیت {شناسه، نام} |
| fault_status | common_relation_struct | وضعیت خطا {شناسه، نام} |
| total_reason | common_relation_struct (اختیاری) | علت تامه {شناسه، نام} |
| national_code | رشته | کد ملی |

## PedestrianDTO (توکار در pedestrian_dtos[])

| فیلد | نوع | توضیح |
|------|-----|-------|
| sex | enum(مرد، زن، سایر) | جنسیت عابر |
| last_name | رشته | نام خانوادگی عابر |
| first_name | رشته | نام عابر |
| injury_type | common_relation_struct | نوع مصدومیت {شناسه، نام} |
| fault_status | common_relation_struct | وضعیت خطا {شناسه، نام} |
| total_reason | common_relation_struct (اختیاری) | علت تامه {شناسه، نام} |
| national_code | رشته | کد ملی |

## جزئیات روابط

### روابط از تصادف به مدل‌های دیگر

| نام رابطه | نوع | مدل مقصد | اختیاری | حذف شده‌ها | رابطه معکوس |
|-----------|-----|----------|---------|------------|-------------|
| province | تکی | استان | بله | area، center_location، createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| city | تکی | شهر | بله | area، center_location، createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| township | تکی | شهرستان | بله | area، center_location، createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| road | تکی | محور | بله | area، updatedAt، createdAt | تصادفات (چندتایی، ۲۰) |
| traffic_zone | تکی | حوزه ترافیکی | بله | [traffic_zone_excludes] | تصادفات (چندتایی، ۲۰) |
| city_zone | تکی | ناحیه شهری | بله | [city_zone_excludes] | تصادفات (چندتایی، ۲۰) |
| type | تکی | نوع | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| area_usages | چندتایی | کاربری اراضی | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| position | تکی | موقعیت | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| ruling_type | تکی | نوع رأی | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| air_statuses | چندتایی | وضعیت هوا | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| light_status | تکی | وضعیت روشنایی | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| road_defects | چندتایی | نقص راه | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| human_reasons | چندتایی | عوامل انسانی | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| collision_type | تکی | نوع برخورد | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| road_situation | تکی | وضعیت راه | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| road_repair_type | تکی | نوع تعمیرات | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| shoulder_status | تکی | وضعیت شانه | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| vehicle_reasons | چندتایی | دلایل وسیله | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| equipment_damages | چندتایی | خسارت تجهیزات | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| road_surface_conditions | چندتایی | شرایط سطح راه | بله | createdAt، updatedAt | تصادفات (چندتایی، ۲۰) |
| attachments | چندتایی | فایل | بله | createdAt، updatedAt | (ندارد) |

## ایندکس‌ها

| فیلد ایندکس | نوع | توضیح |
|------------|------|-------|
| location | 2dsphere | ایندکس مکانی برای جستجوی مبتنی بر موقعیت |

## مثال کامل

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "seri": 1403,
  "serial": 12345,
  "location": {
    "type": "Point",
    "coordinates": [51.3890, 35.6892]
  },
  "date_of_accident": "2024-06-15T14:30:00.000Z",
  "dead_count": 0,
  "has_witness": true,
  "news_number": 5678,
  "officer": "افسر احمد محمدی",
  "injured_count": 2,
  "completion_date": "2024-06-16T10:00:00.000Z",
  "vehicle_dtos": [
    {
      "color": { "_id": "color001", "name": "سفید" },
      "driver": {
        "sex": "Male",
        "last_name": "احمدی",
        "first_name": "رضا",
        "injury_type": { "_id": "inj001", "name": "جزئی" },
        "licence_type": { "_id": "lic001", "name": "پایه یک" },
        "national_code": "1234567890",
        "licence_number": "12345",
        "total_reason": { "_id": "tr001", "name": "سرعت زیاد" }
      },
      "system": { "_id": "sys001", "name": "ترمز" },
      "plaque_type": { "_id": "pt001", "name": "شخصی" },
      "plaque_no": ["12", "B", "345"],
      "system_type": { "_id": "st001", "name": "هیدرولیک" },
      "fault_status": { "_id": "fs001", "name": "مقصر" },
      "insurance_co": { "_id": "ins001", "name": "بیمه ایران" },
      "insurance_no": "INS-12345-6789",
      "plaque_usage": { "_id": "pu001", "name": "شخصی" },
      "print_number": "PRN-123456",
      "plaque_serial": ["ABC", "DEF"],
      "insurance_date": "2025-01-01T00:00:00.000Z",
      "body_insurance_co": { "_id": "bi001", "name": "بیمه آسیا" },
      "body_insurance_no": "BODY-98765",
      "motion_direction": { "_id": "md001", "name": "مستقیم" },
      "body_insurance_date": "2025-01-01T00:00:00.000Z",
      "max_damage_sections": [
        { "_id": "mds001", "name": "سپر جلو" },
        { "_id": "mds002", "name": "کاپوت" }
      ],
      "damage_section_other": "",
      "insurance_warranty_limit": 500000000,
      "passenger_dtos": [
        {
          "sex": "Female",
          "last_name": "احمدی",
          "first_name": "سارا",
          "injury_type": { "_id": "inj001", "name": "جزئی" },
          "fault_status": { "_id": "fs002", "name": "غیرمقصر" },
          "total_reason": { "_id": "tr001", "name": "سرعت زیاد" },
          "national_code": "9876543210"
        }
      ]
    }
  ],
  "pedestrian_dtos": [
    {
      "sex": "Male",
      "last_name": "کریمی",
      "first_name": "علی",
      "injury_type": { "_id": "inj002", "name": "شدید" },
      "fault_status": { "_id": "fs003", "name": "خطای عابر" },
      "total_reason": { "_id": "tr003", "name": "عبور غیرمجاز" },
      "national_code": "1122334455"
    }
  ],
  "province": { "_id": "prov001", "name": "تهران" },
  "city": { "_id": "city001", "name": "تهران" },
  "township": { "_id": "twp001", "name": "منطقه ۶" },
  "road": { "_id": "road001", "name": "خیابان ولیعصر" },
  "traffic_zone": { "_id": "tz001", "name": "منطقه A" },
  "city_zone": { "_id": "cz001", "name": "منطقه ۶ ناحیه ۱" },
  "type": { "_id": "type001", "name": "برخورد خودرو با خودرو" },
  "area_usages": [
    { "_id": "au001", "name": "مسکونی" }
  ],
  "position": { "_id": "pos001", "name": "تقاطع" },
  "ruling_type": { "_id": "rt001", "name": "تخلف رانندگی" },
  "air_statuses": [
    { "_id": "as001", "name": "صاف" }
  ],
  "light_status": { "_id": "ls001", "name": "روز" },
  "road_defects": [
    { "_id": "rd001", "name": "چاله" }
  ],
  "human_reasons": [
    { "_id": "hr001", "name": "عدم توجه به جلو" }
  ],
  "collision_type": { "_id": "ct001", "name": "عقب به جلو" },
  "road_situation": { "_id": "rs001", "name": "خشک" },
  "road_repair_type": { "_id": "rrt001", "name": "در حال تعمیر" },
  "shoulder_status": { "_id": "ss001", "name": "دارای شانه" },
  "vehicle_reasons": [
    { "_id": "vr001", "name": "خرابی ترمز" }
  ],
  "equipment_damages": [
    { "_id": "ed001", "name": "شکستگی چراغ جلو" }
  ],
  "road_surface_conditions": [
    { "_id": "rsc001", "name": "آسفالت" }
  ],
  "attachments": [
    { "_id": "file001", "name": "crash_photo_1.jpg", "type": "image/jpeg", "size": 2048576 }
  ],
  "createdAt": "2024-06-16T10:00:00.000Z",
  "updatedAt": "2024-06-16T10:00:00.000Z"
}
```

## ساختمان رابطه مشترک (Common Relation Struct)

```typescript
{
  _id: ObjectId,
  name: string
}
```
