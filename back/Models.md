# Data Models

This document describes all the data models used in the traffic accident management system.

## Core Models

### File

Manages file uploads and attachments related to accident reports, including photos, documents, and other evidence.

**Fields:** `name`, `type`, `size`, `category` (plate/insurance/croquis/facility_damage/other), `sequence`, `createdAt`, `updatedAt`

**Relations:** `uploader` → User (reverse: `user.uploadedAssets`), `accident` → Accident (reverse: `accident.attachments`)

### User

Handles user authentication and authorization, including police officers, administrators, and other system users.

**Fields:** `first_name`, `last_name`, `father_name`, `mobile`, `gender`, `birth_date`, `summary`, `email`, `password` (excluded), `national_number`, `address`, `level` (Ghost/Manager/Editor/Enterprise/Patrol), `is_verified`, `personnel_code` (numeric, unique sparse), `is_active`, `patrol_permissions` (can_submit_accident, can_view_map, can_receive_announcements, can_register_emergency, can_view_reports), `failed_login_attempts`, `locked_until`, `settings` (cities, provinces, availableCharts), `createdAt`, `updatedAt`

**Relations:** `avatar` → File, `national_card` → File, `devices` → Device (auto-created via Device.owner), `shifts` → Shift (auto-created via Shift.officer), `accidents` → Accident (auto-created via Accident.officer), `patrol_unit` → PatrolUnit (auto-created via PatrolUnit.officers)

### Accident

The main model representing traffic accident incidents, containing comprehensive accident details and linking to related data.

**Fields:** `seri`, `serial`, `location` (GeoJSON Point), `date_of_accident`, `dead_count`, `has_witness`, `news_number`, `officer` (string), `injured_count`, `completion_date`, `createdAt`, `updatedAt`

**Mobile Patrol Meta:** `client_report_uuid` (unique sparse), `report_id`, `sync_status` (draft/queued/syncing/synced/rejected), `rejection_reason`, `reported_at`, `gps_coords` (Point), `gps_accuracy`, `travel_direction`, `kilometer`, `meter`

**Police/Croquis:** `police_present`, `police_expert_name`, `police_arrival_time`, `officer_cause_description`

**Vehicle Cards (vehicle_dtos):** Expanded with `vehicle_type`, `year`, `final_status`, `plate_image` (File ObjectId), `insurance_image` (File ObjectId), driver `phone`, `driver_status`

**People Cards (people_dtos):** `role` (PersonRole), `sex`, `age`, `age_range`, `injury_status` (InjuryStatus), `first_name`, `last_name`, `national_code`, `phone`

**Facility Damage (facility_damage_dtos):** `asset_group` (EquipmentDamage), `asset_code`, `damage_type`, `damage_severity` (DamageSeverity), `quantity`, `unit`, `creates_hazard`, `needs_repair`, `temporary_action`, `images` (File ObjectIds)

**Review History (review_history, embedded — replaces the former `accident_review` model):** array of `{ action (submitted/started_review/returned/resubmitted/approved/completed/reopened), reason?, action_at, reviewer: {_id, first_name, last_name} snapshot }`. Appended atomically by `reviewReport` / `resubmitReport`; read via `getReportReviewHistory`.

**Relations:** `officer` → User (reverse: `user.accidents`), `patrol_unit` → PatrolUnit (reverse: `patrol_unit.accidents`), `vehicle` → Vehicle (reverse: `vehicle.accidents`), `lane` → Position, `police_station` → PoliceStation (reverse), `croquis_type` → CroquisType (reverse), plus geographic: `province`, `city`, `township`, `road`, `traffic_zone`, `city_zone`, `air_pollution_zone`, `type`, `area_usages`, `position`, `ruling_type`, `air_statuses`, `light_status`, `road_defects`, `human_reasons`, `collision_type`, `road_situation`, `road_repair_type`, `shoulder_status`, `vehicle_reasons`, `equipment_damages`, `road_surface_conditions`, `attachments` → File

## Geographic Models

### City

Represents cities where accidents occur, providing location context for incidents.

### Province

Manages provincial/state information for geographic organization of accident data.

### City Zone

Defines specific zones within cities for more precise accident location tracking.

### Traffic Zone

Manages traffic control zones and areas with specific traffic regulations.

## Road and Infrastructure Models

### Road

Contains information about roads, streets, and highways where accidents occur.

**Fields:** `origin`, `destination`, `total_length_meters`, `lanes` (array of common_relation_struct), `area` (MultiLineString), `createdAt`, `updatedAt`

### Road Defect

Tracks road defects and infrastructure issues that may contribute to accidents.

### Road Repair Type

Categorizes different types of road repairs and maintenance activities.

### Road Situation

Describes the general condition and situation of roads at accident locations.

### Road Surface Condition

Details the surface conditions of roads (wet, dry, icy, etc.) at the time of accidents.

### Position

Manages precise positioning data for accident locations (e.g., Line 1, Line 2, Right Shoulder, Left Shoulder).

## Vehicle-Related Models

### Color

Standardizes vehicle color classifications for accident reports.

### Plaque Type

Categorizes different types of license plates (regular, commercial, diplomatic, etc.).

### Plaque Usage

Defines how license plates are used (private, commercial, government, etc.).

### Licence Type

Manages different types of driving licenses and certifications.

### Type

General vehicle type classifications (car, truck, motorcycle, etc.).

### Vehicle Type

Vehicle categories: سواری، وانت، کامیون، کشنده، اتوبوس، مینی‌بوس، موتورسیکلت، ماشین‌آلات راه‌سازی، امدادی، سایر.

### Vehicle Final Status

Final vehicle state after accident: متوقف در مسیر، متوقف در شانه، واژگون، خارج شده از راه، سقوط کرده، دچار حریق، منتقل شده با جرثقیل.

### Driver Status

Driver condition: حاضر، مصدوم، منتقل شده، فوت شده، متواری، نامشخص.

## Environmental and Condition Models

### Air Status

Tracks air quality and atmospheric conditions at accident locations.

### Light Status

Records lighting conditions during accidents (daylight, night, dawn, dusk, etc.).

### Shoulder Status

Describes the condition of road shoulders at accident sites.

### Area Usage

Categorizes how the area around the accident is typically used (residential, commercial, industrial, etc.).

## Collision and Damage Models

### Collision Type

Classifies different types of vehicle collisions (head-on, rear-end, side-impact, etc.).

### Equipment Damage

Asset groups for facility damage: گاردریل، نیوجرسی، تابلو، پایه تابلو، پایه روشنایی، چراغ روشنایی، فنس، دوربین، تجهیزات عوارضی، روکشی، پل/آبرو، سایر.

### Max Damage Section

Identifies the section of vehicles with the most significant damage.

### Motion Direction

Records the direction of vehicle movement at the time of collision.

## Insurance and Legal Models

### Insurance Co

Manages insurance company information for processing claims.

### Body Insurance Co

Handles specialized body/physical injury insurance providers.

### Fault Status

Determines and tracks fault assignment in accident cases.

### Ruling Type

Categorizes legal rulings and decisions related to accidents.

## Reason and Cause Models

### Human Reason

Documents human factors contributing to accidents (driver error, fatigue, intoxication, etc.).

### Vehicle Reason

Tracks vehicle-related causes of accidents (mechanical failure, tire problems, etc.).

## System Models

### System

Core system configuration and settings.

### System Type

Categorizes different system types and configurations.

## Mobile Patrol Models

### Device

Tracks registered mobile devices for patrol officers.

**Fields:** `device_id` (unique), `fingerprint`, `platform`, `app_version`, `model`, `is_active`, `last_seen_at`, `registered_at`, `revoked_at`, `push_token` (FCM/APNs, set at device-scoped login), `createdAt`, `updatedAt`

**Relations:** `owner` → User (reverse: `user.devices`)

### Patrol Unit

Represents a patrol unit with its associated police station, vehicles, and officers.

**Fields:** `code`, `name`, `is_active`, `createdAt`, `updatedAt`

**Relations:** `registrer` → User, `police_station` → PoliceStation (reverse: `police_station.patrol_units`), `vehicles` → Vehicle (reverse: `vehicle.patrol_unit`), `officers` → User (reverse: `user.patrol_unit`), `accidents` → Accident (reverse), `shifts` → Shift (reverse)

### Shift

Represents an officer's work shift with patrol unit and vehicle assignment.

**Fields:** `shift_type`, `status` (active/ended/cancelled), `start_at`, `end_at`, `note`, `createdAt`, `updatedAt`

**Relations:** `registrer` → User, `officer` → User (reverse: `user.shifts`), `patrol_unit` → PatrolUnit (reverse: `patrol_unit.shifts`), `vehicle` → Vehicle (reverse: `vehicle.shifts`)

### Police Station

Police station with geographic area for zone validation and the mobile station picker.

**Fields:** `name`, `code`, `location` (Polygon), `area` (MultiPolygon), `military_rank`, `is_active`, `createdAt`, `updatedAt`

**Relations:** `registrer` → User, `commander` → User (reverse: `user.police_station`), `patrol_units` → PatrolUnit (reverse), `accidents` → Accident (reverse)

**Acts:** public `gets`/`get` (station picker), Manager-gated `add`/`update`/`remove`/`count` (`src/police_station/`)

### Croquis Type

Croquis types: کروکی سازشی سری ۱۲، کروکی غیرسازشی سری ۲۲.

### Injury Status

Injury severity levels: بدون آسیب، آسیب جزئی، آسیب جدی، وضعیت بحرانی، فوت در محل، فوت پس از انتقال، نامشخص.

### Person Role

Person roles in accident: راننده، سرنشین، عابر پیاده، موتورسوار، دوچرخه‌سوار، مأمور/نیروی امدادی.

### Damage Severity

Damage severity levels: جزئی، متوسط، شدید، تخریب کامل.

## Announcement Model

### Announcement

Control center announcements/notifications for patrol officers.

**Fields:** `title`, `body`, `priority` (info/warning/critical), `target_roles`, `target_user_ids`, `target_patrol_units`, `expires_at`, `is_active`, `createdAt`, `updatedAt`

**Relations:** `registrer` → User, `attachments` → File

**Acts:** `add`/`update?` (Manager), `gets`/`get` (Manager + Patrol), `markRead`, `getUnreadCount` (Patrol). Patrol visibility = active + non-expired + targeted at the officer's role / active-shift unit / user id. `gets` annotates each item with `is_read` + `read_at` and sorts unread-first.

### Announcement Read

Per-user read receipts for announcements (unique index: `announcement._id` + `reader._id`). Kept as a model (not embedded) because a single announcement can be broadcast to many officers; embedding would bloat the announcement document.

**Fields:** `read_at`, `createdAt`, `updatedAt`

**Relations:** `announcement` → Announcement (reverse: `announcement.reads`), `reader` → User (reverse: `user.announcement_reads`)

### Emergency

Emergency/SOS requests raised by patrol officers from the mobile app.

**Fields:** `status` (active/acknowledged/resolved), `connection_status` (online/degraded/offline — officer connectivity at report time), `note`, `location` (Point), `gps_accuracy`, `recorded_at`, `resolved_at`, `createdAt`, `updatedAt`

**Relations:** `officer` → User (reverse: `user.emergencies`), `patrol_unit` → PatrolUnit (reverse, auto-resolved from the active shift), `vehicle` → Vehicle (reverse, auto-resolved from the active shift)

**Acts:** `register` (Patrol; officer id comes from the token, never the client), `gets`/`get`/`updateStatus` (Manager). Every register/status change is audited into `operation_log`. The offline fallback path (SMS/call) is an ops policy, not backend code.

---

## Model Names List (for copy/paste)

```
File
User
Accident
City
Province
CityZone
TrafficZone
Road
RoadDefect
RoadRepairType
RoadSituation
RoadSurfaceCondition
Position
Color
PlaqueType
PlaqueUsage
LicenceType
Type
AirStatus
LightStatus
ShoulderStatus
AreaUsage
CollisionType
EquipmentDamage
MaxDamageSection
MotionDirection
InsuranceCo
BodyInsuranceCo
FaultStatus
RulingType
HumanReason
VehicleReason
System
SystemType
Device
PatrolUnit
Shift
PoliceStation
VehicleType
CroquisType
VehicleFinalStatus
DriverStatus
InjuryStatus
PersonRole
DamageSeverity
Announcement
```