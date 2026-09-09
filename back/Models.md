# Data Models

This document describes all the data models used in the traffic accident management system.

## Core Models

### File

Manages file uploads and attachments related to accident reports, including photos, documents, and other evidence.

**Fields:** `name`, `type`, `size`, `category` (plate/insurance/croquis/facility_damage/incident/other), `sequence`, `createdAt`, `updatedAt`

**Relations:** `uploader` → User (reverse: `user.uploadedAssets`), `accident` → Accident (reverse: `accident.attachments`)

### User

Handles user authentication and authorization, including police officers, administrators, and other system users.

**Fields:** `first_name`, `last_name`, `father_name`, `mobile`, `gender`, `birth_date`, `summary`, `email`, `password` (excluded), `national_number`, `address`, `level` (Ghost/Manager/Editor/Enterprise/Patrol), `is_verified`, `personnel_code` (numeric, unique sparse), `is_active`, `patrol_permissions` (can_submit_accident, can_view_map, can_receive_announcements, can_register_emergency, can_view_reports), `failed_login_attempts`, `locked_until`, `settings` (cities, provinces, availableCharts), `createdAt`, `updatedAt`

**Relations:** `avatar` → File, `national_card` → File, `devices` → Device (auto-created via Device.owner), `shifts` → Shift (auto-created via Shift.officer), `accidents` → Accident (auto-created via Accident.officer), `patrol_unit` → PatrolUnit (auto-created via PatrolUnit.officers)

**Fields:** `first_name`, `last_name`, `father_name`, `mobile`, `gender`, `birth_date`, `summary`, `email`, `password` (excluded), `national_number`, `address`, `level` (Ghost/Manager/Editor/Enterprise/Patrol), `is_verified`, `personnel_code` (numeric, unique sparse), `is_active`, `patrol_permissions` (can_submit_accident, can_view_map, can_receive_announcements, can_register_emergency, can_view_reports), `roles` (array of `{ roleId, name, scopeType?: organization|unit, scopeId? }` — org/unit scoping, backward-compatible empty for existing users), `failed_login_attempts`, `locked_until`, `settings` (cities, provinces, availableCharts), `createdAt`, `updatedAt`

**Relations:** `avatar` → File, `national_card` → File, `devices` → Device (auto-created via Device.owner), `shifts` → Shift (auto-created via Shift.officer), `accidents` → Accident (auto-created via Accident.officer), `patrol_unit` → PatrolUnit (auto-created via PatrolUnit.officers), `organizations` → Organization (reverse: `organization.members`), `units` → Unit (reverse: `unit.members`). `level` stays the coarse auth gate; `roles` carry fine-grained org/unit scope (OrgHead, UnitHead, Officer, ...).

### Organization

Each road/highway/freeway — or whole-city municipality — is an organization owning its own unit tree, head and members. Optional 1:1 `road` relation: road-bound orgs scope `accident`/`nearbyAccidents` to "this road's org" via `road.organization`; municipality orgs stay roadless (road-scoped reports/analytics don't apply).

**Fields:** `code` (unique), `name`, `enName`, `description`, `is_active`, `createdAt`, `updatedAt`

**Relations:** `road` → Road (1:1 optional, reverse: `road.organization`), `head` → User, `logo` → File, `registrer` → User

**Acts:** `add`/`update`/`remove`/`count` (Manager), `get`/`gets` (Manager; filters: `search`, `is_active`). Deleting an org is blocked while its `units` exist (children first).

### Unit

Hierarchical org node (infinite tree via `parentUnit`/`subUnits`). The professional replacement for flat `patrol_unit`/`police_station`: a patrol unit is `type:"Patrol"`, a police station `type:"Station"`. `organization` is required and `road` is denormalized on every node (query efficiency convention) — `road` is present only when the parent org is road-bound (units of roadless municipality orgs carry no road); `head` is the node commander (سرگشت / رئیس پاسگاه).

**Fields:** `code`, `name`, `description`, `is_active`, `type` (Patrol/Station/Ops/Maintenance/Logistics/Administration/Warehouse/General), `address`, `phone`, `head_title`, `features` (array of `{feature}`), `createdAt`, `updatedAt`

**Relations:** `organization` → Organization (required, reverse: `organization.units`), `road` → Road (optional, reverse: `road.units`), `parentUnit` → Unit (self, reverse: `unit.subUnits`), `head` → User (reverse: `user.headedUnits`), `vehicles` → Vehicle (reverse: `vehicle.unit`), `officers` → User (reverse: `user.unit`), `registrer` → User

**Acts:** `add`/`update`/`updateRelations`/`remove`/`count` (Manager; `add`/`updateRelations` keep road in sync with org's road — road-bound org ⇒ unit road = org road, roadless org ⇒ no unit road — and same-org parent — cross-org trees rejected), `get`/`gets` (filters: `search`, `organizationId`, `roadId`, `type`, `parentUnitId`, `headId`, `is_active`), `getOrgChart` (flag-bundled `units`/`organization`/`stats`; Manager/Ghost pass `orgId`, OrgHead/UnitHead auto-scope via `roles`).

## Warehousing Models

### Ware

Flat product catalog (D9 — no hierarchy models; taxonomy levels are plain name tags). The SKU-ish reference used by inventory.

**Fields:** `name`, `enName`, `brand`, `price`, `irc`, `gtin`, `photo_url`, `ware_type`, `ware_class`, `ware_group`, `ware_model`, `manufacturer`, `lead_time_days` (JIT Phase 5), `is_active`, `createdAt`, `updatedAt`

**Relations:** `registrer` → User

**Acts:** `add`/`update`/`remove`/`count` (Manager), `get`/`gets` (filters: `search`, `ware_type`, `ware_class`, `ware_group`, `ware_model`, `is_active`)

### Inventory

Per-unit stock at **ware level** (D10) — unique compound index `{ "unit._id": 1, "ware._id": 1 }`. `min_quantity`/`max_quantity` = JIT reorder point / safety ceiling. Written **only** via `utils/inventoryManager.ts` (no user act writes it directly).

**Fields:** `quantity`, `min_quantity`, `max_quantity`, `batch_no`, `expiration_date`, `location`, `last_counted_at`, `createdAt`, `updatedAt`

**Relations:** `unit` → Unit (required, reverse: `unit.inventories`), `warehouse_unit` → Unit (opt, reverse: `unit.warehouseInventories`), `ware` → Ware (required, reverse: `ware.inventories`)

**Acts:** `add` (upsert + adjustment movement), `get`, `gets` (role-scoped; filters `organizationId`/`unitId`/`wareId`/`search`), `adjust`, `transfer`, `count`, `getWarehouseInventory`

### Stock Movement

Read-only audit trail of every inventory change (before/after balances). **No `add`/`update`/`remove` acts** — only `inventoryManager` writes here.

**Fields:** `quantity` (+ in / − out), `balance_before`, `balance_after`, `reason` (goods_receipt/goods_issue/transfer_in/transfer_out/consumption/adjustment/return/write_off), `reference_type`, `reference_id` (polymorphic raw ref — orphan-resilient), `description`, `createdAt`, `updatedAt`

**Relations:** `unit` → Unit (reverse: `unit.stock_movements`), `created_by` → User (reverse: `user.created_stock_movements`), `ware` → Ware (opt, reverse: `ware.stock_movements`)

**Acts:** `get`, `gets`, `count` (role-scoped)

### Consumption

Records goods usage; `add` triggers `inventoryManager.removeStock` (decrement + movement). Unit is auto-derived from the caller's role scope.

**Fields:** `quantity`, `consumed_at`, `reason`, `consumed_for` (name snapshot), `notes`, `createdAt`, `updatedAt`

**Relations:** `unit` → Unit (reverse: `unit.consumptions`), `consumed_by` → User (reverse: `user.consumptions`), `inventory` → Inventory (opt), `ware` → Ware (reverse: `ware.consumptions`)

**Acts:** `add`, `get`, `gets`, `count` (role-scoped)

### Goods Receipt

Incoming-goods document; `add` triggers `addStock` per accepted line + auto `GR-{year}-{serial}`. `cross_dock`/`target_unit` fields exist for JIT (Phase 5).

**Fields:** `serial`, `receipt_number`, `received_at`, `status` (pending/completed/partially_rejected), `notes`, `items` (embedded `{ ware_id, ware_name, quantity_received, quantity_accepted, quantity_rejected, batch_no, expiration_date }`), `cross_dock`, `createdAt`, `updatedAt`

**Relations:** `received_by` → User (reverse: `user.received_goods`), `receiving_unit` → Unit (reverse: `unit.goods_receipts`), `target_unit` → Unit (opt, JIT)

**Acts:** `add`, `get`, `gets`, `count` (role-scoped)

### Goods Request

JIT replenishment request (kanban between units) — created by the reorder scan or manually.

**Fields:** `serial`, `request_number` (auto `REQ-{year}-{serial}`), `status` (draft/pending/approved/issued/received/rejected), `quantity`, `priority` (quantity ≤ min×0.5), `requested_at`, `approved_at`, `issued_at`, `received_at`, `notes`, `origin` (auto/manual), `createdAt`, `updatedAt`

**Relations:** `unit` → Unit (reverse: `unit.goods_requests`), `warehouse_unit` → Unit (opt, reverse: `unit.warehouse_requests`), `ware` → Ware (reverse: `ware.goods_requests`), `requested_by` → User (reverse: `user.requested_goods`), `approved_by` → User

**Lifecycle acts:** `add` (→ pending), `approve` (pending → approved/rejected), `issue` (approved → issued; warehouse `removeStock` goods_issue), `receive` (issued → received; consuming unit `addStock`). Plus `gets`, `count`.

### Accident

The main model representing traffic accident incidents, containing comprehensive accident details and linking to related data.
**Fields:** `seri`, `serial`, `location` (GeoJSON Point), `date_of_accident`, `dead_count`, `has_witness`, `news_number`, `officer` (string), `injured_count`, `completion_date`, `createdAt`, `updatedAt`

**Mobile Patrol Meta:** `client_report_uuid` (unique sparse), `report_id`, `sync_status` (draft/queued/syncing/synced/rejected), `rejection_reason`, `reported_at`, `gps_coords` (Point), `gps_accuracy`, `travel_direction`, `kilometer`, `meter`

**Police/Croquis:** `police_present`, `police_expert_name`, `police_arrival_time`, `officer_cause_description`

**Incident Type (polymorphic report):** `incident_type` (`accident`/`road_breakdown`/`road_obstacle`/`other` — defaults to `accident` when absent; legacy docs read as accidents) + `incident_payload` `{ description, is_hazard, needs_repair, temporary_action, follow_up_required }` for non-accident reports. Accident DTOs stay optional and are simply empty for non-accident reports; existing relations (`road_defects`, `equipment_damages`, `lane`, `road`, `kilometer`/`meter`, `attachments`, `incident_severity`) are reused for non-accident semantics.

**Per-type behavior:** `report_id` prefix is `REP-` (accidents, backward compatible), `BRK-`/`OBS-`/`OTH-` for the other three (shared `serial` counter stays unique). Recording is **all-optional** — `accident.add`/`accident.update` accept any subset of fields for every type (location, `date_of_accident`, description, etc. are never hard-required); each organization's registration process (`accident_process`) decides which fields its officers must fill. `add`/`update` still reject accident-only fields on non-accident reports (`vehicle_dtos`, `pedestrian_dtos`, `people_dtos`, `facility_damage_dtos`, `collision_type`, `type`), and `incident_type` can no longer be changed once a report is synced/rejected or in review. `getMyReports`/`gets` accept an `incidentType` filter; `nearbyAccidents` carries `incident_type` + `incident_severity_name`; analytics/charts (`src/accident/charts/*`) filter to `incident_type: "accident"` so non-accident reports never pollute accident statistics. Incident photos use the `incident` upload category (≤5MB, ≤10 per report).

**Vehicle Cards (vehicle_dtos):** Expanded with `vehicle_type`, `year`, `final_status`, `plate_image` (File ObjectId), `insurance_image` (File ObjectId), driver `phone`, `driver_status`

**People Cards (people_dtos):** `role` (PersonRole), `sex`, `age`, `age_range`, `injury_status` (InjuryStatus), `first_name`, `last_name`, `national_code`, `phone`

**Facility Damage (facility_damage_dtos):** `asset_group` (EquipmentDamage), `asset_code`, `damage_type`, `damage_severity` (DamageSeverity), `quantity`, `unit`, `creates_hazard`, `needs_repair`, `temporary_action`, `images` (File ObjectIds)

**Review History (review_history, embedded — replaces the former `accident_review` model):** array of `{ action (submitted/started_review/returned/resubmitted/approved/completed/reopened), reason?, action_at, reviewer: {_id, first_name, last_name} snapshot }`. Appended atomically by `reviewReport` / `resubmitReport`; read via `getReportReviewHistory`.

**Process answers (Part IV):** `process_version` (which active process version produced this report) + `dynamic_answers` (embedded array of `{ step_key, question_key, model_name, answer_id/answer_ids, answer_name(s) snapshots, value }` for free-text/non-relation wizard answers). Relation-mapped wizard answers persist in the typed relations above (analytics stay intact).

**Relations:** `officer` → User (reverse: `user.accidents`), `patrol_unit` → PatrolUnit (reverse: `patrol_unit.accidents`), `vehicle` → Vehicle (reverse: `vehicle.accidents`), `lane` → Position, `police_station` → PoliceStation (reverse), `croquis_type` → CroquisType (reverse), plus geographic: `province`, `city`, `township`, `road`, `traffic_zone`, `city_zone`, `air_pollution_zone`, `type`, `area_usages`, `position`, `ruling_type`, `air_statuses`, `light_status`, `road_defects`, `human_reasons`, `collision_type`, `incident_severity`, `road_situation`, `road_repair_type`, `shoulder_status`, `vehicle_reasons`, `equipment_damages`, `road_surface_conditions`, `attachments` → File

### Accident Process

Each organization (highway) designs its own patrol accident-registration wizard — steps with icons/colors/descriptions, where each question calls a database model as its answer source and shows only a whitelisted subset of that model's records (`allowed_answer_ids`; empty = all).

**Fields:** `name`, `description`, `status` (draft/active/archived), `version` (bumped on activate), `is_active`, `incident_type` (accident/road_breakdown/road_obstacle/other; empty = applies to all), embedded `steps: [{ key, title, description, icon, color, order, required, questions: [{ key, question, description, icon, color, order, required, model_name, allowed_answer_ids: ObjectId[], multi_select, target: relation(path)|dto(dto,field)|dynamic }] }]`, `createdAt`, `updatedAt`

**Relations:** `organization` → Organization (required, reverse: `organization.accident_processes`), `registrer` → User

**Index:** unique partial `{ "organization._id": 1, incident_type: 1 }` filtered `status: "active"` → one active process per org(+type).

**Acts (Manager):** `add`, `get`, `gets`, `update` (wholesale `steps` replace on draft), `remove` (draft only), `count`, `activate` (validates ≥1 step, consecutive orders, registry `model_name`, matching target, whitelist ids exist → sets active + version bump, archives the previous active), `duplicate` (clone as draft). **Patrol:** `getForPatrol` (active process for the caller's org/type with resolved whitelisted answers — the only endpoint the mobile wizard needs).

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

### Incident Severity

Severity scale for non-accident incident reports (خرابی/مانع/سایر): کم، متوسط، زیاد، بحرانی. Registered via `setSharedActs`; linked from `accident.incident_severity` (single relation, reverse: `incident_severity.accidents`).

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

## Licensing / Module Config

Modules are sold in **two layers**; a module is usable for an org only when enabled at both:

```
effective(org, key) = enabled-in-installation(key)  AND  org-flag(org, key)
org-flag absent ⇒ inherit installation (all enabled) — dedicated single-tenant installs are unchanged.
```

| key | محتوا |
| --- | --- |
| `charts` | تحلیل و نمودار تصادفات (`accident.*Analytics`, `mapAccidents`, `getCreatedAtPeriods`) |
| `incident_patrol` | ثبت رخداد موبایل + داشبورد/بررسی گشت (`getMyReports`/review/sync/`nearbyAccidents`، `emergency.*`, `shift.*`, `vehicle.*`, `police_station`/`patrol_unit`/`patrol_operations`، `accident_process.*`, `announcement.*`, `file.uploadAccidentImages`, `user.getPatrolOfficers`) |
| `warehouse` | `ware.*`, `inventory.*`, `consumption.*`, `goods_receipt.*`, `stock_movement.*`, `goods_request.*` |

**Core (هرگز گیت نمی‌شود):** auth/users/roles، جغرافیا و داده‌های پایه، `organization`/`unit`، CRUD گزارش در پنل مدیر (`accident.get/gets/add/update/remove/count`)، فایل عمومی، `operation_log`.

**Installation layer:** یک سند تکی `module_config` (`key: "app_modules"`)؛ اولین بوت از `ENABLED_MODULES` (پیش‌فرض: همه). **Organization layer:** فیلد `module_flags` روی سند `organization` (غیاب = inherit). هر دو را فقط **Ghost** تغییر می‌دهد.

**Gating:** در ابتدای fn اکشن‌های نگاشت‌شده تزریق می‌شود. نصب خاموش → «این ماژول برای این نصب فعال نیست». سازمان خاموش → «این ماژول برای این سازمان فعال نیست» — وقتی هدفِ صریح (`organizationId`/`orgId`/`unitId`/…) به سازمانِ خاموش اشاره کند حتی **Manager** هم رد می‌شود؛ **Ghost همیشه مستثناست**؛ کاربرِ بدون scope (Manager سراسری بدون هدف صریح) فقط گیت نصب را دارد.

**Acts:**
- schema `app_modules`: `getModules` (هر کاربر لاگین‌شده) و `setModules` (فقط Ghost) — سطح نصب.
- schema `organization`: `getModules` (دسترسی به سازمان) و `setModules` (فقط Ghost) — سطح سازمان؛ پاسخ شامل `deployment`/`modules`/`effective`.
- `user.login` / `user.getMe` فیلد `modules` (کلیدهای نصب) و برای کاربرِ تک‌سازمانی فیلد `orgModules` (کلیدهای مؤثر همان سازمان) را برمی‌گردانند.

## Model Names List (for copy/paste)

```
File
User
Organization
Unit
ModuleConfig
Ware
Inventory
StockMovement
Consumption
GoodsReceipt
GoodsRequest
Accident
AccidentProcess
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
IncidentSeverity
Announcement
```