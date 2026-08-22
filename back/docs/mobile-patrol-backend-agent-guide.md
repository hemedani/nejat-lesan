# Mobile Patrol Backend Agent Guide

This document explains the backend changes that support the patrol officer mobile app and is intended to help a React Native AI agent understand the expected behavior, API contracts, and data model rules before implementing or debugging the app.

## 1. Mission and scope

The backend is being extended for a patrol-officer mobile experience that is:

- offline-first
- device-aware and session-controlled
- tied to a patrol officer's active shift, patrol unit, and assigned vehicle
- designed for high-reliability accident reporting and sync
- backed by a location-aware road and map system

The implementation is not just an authentication addition. It is a full backend platform extension for field operations, including device trust, officer identity, report syncing, road mapping, and operational context.

Related documents in this folder:

- `mobile-patrol-backend-todo.md` — backlog and completed work tracking
- `mobile-patrol-backend-execution-plan.md` — ordered implementation steps and verification notes
- `mobile-patrol-app-requirements.md` — product requirements for the patrol app UI/UX
- `mobile-patrol-app-requirements-fa.md` — same requirements in Persian

## 2. High-level backend architecture

The backend keeps the same Lesan patterns but adds several new domain concerns:

1. User and device identity
   - officers have a `personnel_code` instead of a username-like field
   - accounts can be active/inactive
   - patrol officers have a specific user level: `Patrol`
   - every successful mobile login registers the mobile device

2. Session security and revocation
   - tokens are device-scoped
   - devices can be revoked by admin
   - revoked devices are rejected automatically on the next request
   - failed-login lockout is enforced on the user account

3. Patrol-unit context
   - officers are associated with active shifts
   - shifts bind officer + patrol unit + vehicle
   - the dashboard must read the live shift profile, not static user data

4. Offline-first report lifecycle
   - reports use a client-generated idempotency key
   - local draft reports can be queued and synced later
   - duplicate submissions are prevented by `client_report_uuid`

5. Road and location intelligence
   - roads include geometry, direction, distance markers, and lane metadata
   - the system can snap GPS points to the nearest road and calculate kilometer/meter context
   - points are validated against the user's patrol area or valid road boundary

6. Shared reference data
   - accident form values are loaded from shared models rather than being hardcoded in the app
   - values like vehicle final status, injury status, damage severity, and road details are seeded and exposed through standard shared acts

## 3. Authentication and device management

### 3.1 User model extensions

The user model includes:

- `personnel_code` — numeric-only, unique and sparse
- `is_active` — controls whether the account is allowed to login
- `patrol_permissions` — permissions returned to the app after login
- `failed_login_attempts` — counter for repeated failed attempts
- `locked_until` — timestamp that enforces lockout
- `user_level_array` includes `"Patrol"`

This means the patrol app is not using a generic user login path; it uses a role-specific mobile login flow.

### 3.2 Device model

A new `device` model represents a device that has logged in successfully. It stores:

- `device_id`
- `fingerprint`
- `platform`
- `app_version`
- `model`
- `is_active`
- `last_seen_at`
- `registered_at`
- `revoked_at`
- `owner` → the user who owns this device

The device is a child relation on the user, and the user also gets a reverse `devices` collection automatically via Lesan relation handling.

### 3.3 Mobile login contract

The backend exposes `mobileLogin`, which accepts:

- `personnel_code`
- `password`
- device metadata (`device_id`, `fingerprint`, `platform`, `app_version`, `model`)

It validates:

- user exists
- password is valid
- account is active
- account level is `Patrol`
- user is not locked out

On success, it returns:

- `token`
- `user`
- `permissions`
- `devices`

The JWT includes identity data such as user id, personnel code, level, and device id.

### 3.4 Revocation and session enforcement

The system supports admin-level device management:

- `getUserDevices`
- `revokeDevice`
- `removeDevice`

When a device is revoked, the next authenticated request from that device is rejected with a message such as:

- `نشست این دستگاه باطل شده است`

This ensures that a lost or stolen phone cannot keep using a valid token after admin action.

### 3.5 Lockout policy

The backend enforces a per-user lockout after repeated failed attempts. The pattern is:

- increment counter on wrong password
- after 5 failed attempts, set `locked_until = now + 5 minutes`
- deny login until the lock expires
- clear lockout on successful login

The app should surface user-friendly messages such as:

- `کد پرسنلی یا رمز عبور صحیح نیست`
- `حساب کاربری غیرفعال است`
- `این حساب اجازه استفاده از اپ مأمور گشت را ندارد`
- `بیش از حد مجاز تلاش ناموفق داشتید; لطفاً چند دقیقه صبر کنید`

## 4. Offline-first sync and idempotency

This is one of the most important mobile-application requirements.

### 4.1 Client-generated idempotency key

The accident model has `client_report_uuid` as a unique sparse field. This is generated by the app so the same report can be safely retried without duplication.

The backend implements idempotent behavior in the `add` and `update` act:

- if the same `client_report_uuid` already exists, it returns the existing record instead of creating a second one
- update can also work by `client_report_uuid` when provided

This is critical for offline writes and retry logic.

### 4.2 Report status model

The todo and execution docs call out a missing but planned sync status layer:

- `draft`
- `queued`
- `syncing`
- `synced`
- `rejected`

The app should be prepared to show a sync-status field and endpoint such as `getSyncStatus` later. The system is already designed around the same idea, even though the final sync-status implementation is still on the task list.

### 4.3 App behavior expected by the UI

The product requirements say that the app should:

- save reports locally as draft entries when offline
- queue reports when the connection is down
- send them automatically when connectivity returns
- never block the user from creating or editing reports while offline

The backend should support this with:

- idempotent report submission
- report references tied to a specific officer and patrol context
- status fields for acceptance, review, and rejection

## 5. Patrol unit, shift, and live context

### 5.1 Patrol unit model

The system includes a `patrol_unit` model with:

- code
- name
- linked `police_station`
- associated vehicles
- active officers

### 5.2 Shift model

The backend adds a `shift` model that binds:

- patrol unit
- officer
- vehicle
- shift type
- start/end timestamps
- status

The shift acts include:

- assign shift
- `getActiveShift`
- end shift
- list shifts for an officer

### 5.3 Dashboard rules

The app should display the officer's live operational profile based on the active shift, not static user data. This means:

- current patrol unit is fetched from the active shift
- current vehicle is taken from the active shift
- shift status is derived from backend-defined rules

This is essential for correctness and for preventing stale or invalid patrol context in the app.

## 6. Accident model expansion

The accident model was expanded significantly to support field reporting.

### 6.1 Core metadata

The accident now includes:

- `report_id` (auto-generated)
- `client_report_uuid`
- officer relation
- patrol unit relation
- vehicle relation
- `reported_at`
- `gps_coords`
- `incident_coords`
- `gps_accuracy`
- `travel_direction`
- `kilometer`
- `meter`
- `lane` (connected to position/reference data)

### 6.2 Classification and scene data

The model includes:

- severity and collision classification
- police presence and related police station metadata
- expert name and arrival time
- croquis type
- officer cause description

### 6.3 Vehicle and people information

For each accident, the backend supports:

- vehicle type, brand, model, color, year
- final status
- plate image and insurance images as file references
- driver info block
- person role and injury status records

### 6.4 Environment and damage information

The model also tracks:

- weather / lighting / surface condition / road geometry
- road defects
- facility damage entries
- asset type, severity, quantity, repair need, and images

This is a broad, operational, evidence-oriented accident structure suited to patrol and field reporting.

## 7. Location, map, and road intelligence

### 7.1 Road model expansion

Road records now include:

- direction metadata (origin/destination)
- ordered geometry points for linear referencing
- distance markers
- lane and band definitions

This makes road-based accident reporting much more precise.

### 7.2 `snapPointToRoad`

The backend exposes logic that maps a lat/lng coordinate to the nearest valid road and returns:

- nearest road
- road direction
- kilometer and meter offsets

This is critical when the app wants to attach an accident to a road segment instead of a raw coordinate.

### 7.3 `validatePointInZone`

The backend can verify whether a point falls within:

- the officer's valid patrol area
- the allowable road network boundary

This prevents invalid reports or out-of-zone operations.

### 7.4 Offline map data

The system is prepared to return road geometry for a patrol area so the app can cache map data locally for offline map work.

## 8. Shared reference data and seeded values

The backend introduced shared reference models so the app can fetch standard values from the API instead of hardcoding them. These include:

- `vehicle_type`
- `croquis_type`
- `vehicle_final_status`
- `driver_status`
- `injury_status`
- `person_role`
- `damage_severity`

Other existing shared models were also extended with missing values such as:

- `position`
- `road_situation`
- `road_surface_condition`
- `road_defect`
- `equipment_damage`

The `seedShared` mechanism non-destructively adds values by exact case-insensitive match and is safe to run multiple times.

## 9. API conventions and important backend invariants

The backend is built around a few conventions that the React Native app must account for:

### 9.1 Response envelope

Responses keep a standard `{ success, body }` envelope unless the framework behavior is otherwise overridden.

The project notes explicitly say that new acts must keep this format consistent.

### 9.2 Raw server errors should not leak to the app

The app should display translated, friendly error messages. It should not render raw backend exceptions or internal strings directly.

### 9.3 `insertOne` default behavior caveat

There was a discovered issue: Lesan `insertOne` does not automatically apply `defaulted` defaults. If you insert a document directly with `insertOne`, you must set those defaults explicitly in the function.

This matters for device creation and any other model where default values are required.

### 9.4 Idempotency is required for offline writes

Every report created from the app should carry a unique client-side idempotency value. If the app retries the same report, the backend should treat it as the same item.

## 10. Expected app/backend workflow

### Login flow

1. Device is not yet known to the backend.
2. User enters personnel code + password.
3. Backend validates active account, patrol permission, and lockout status.
4. Backend creates or reactivates the device entry.
5. Backend returns JWT plus profile and permission data.
6. App stores token securely and optionally uses PIN/biometric for quick subsequent unlock.

### Report creation flow

1. App creates an accident draft locally.
2. App attaches `client_report_uuid`.
3. App submits or queues the report.
4. Backend checks for existing report by `client_report_uuid`.
5. Report is created or updated without duplication.
6. Sync status moves through the pipeline as the report is uploaded and acknowledged.

### Patrol context flow

1. App requests current user profile or active shift.
2. Backend resolves the officer's currently active shift.
3. Shift yields patrol unit and vehicle.
4. Dashboard shows the correct unit and vehicle information.

## 11. File map for the React Native AI agent

The most relevant files and areas are:

- `models/user.ts` — user and patrol/auth fields
- `models/device.ts` — device registration and revocation
- `models/road.ts` — road geometry and linear referencing
- `models/accident.ts` — accident model and report data
- `models/patrol_unit.ts` — patrol unit definition
- `models/shift.ts` — operational shift context
- `src/user/mobileLogin/` — mobile login flow
- `src/user/getUserDevices/` — device listing
- `src/user/revokeDevice/` — admin device revocation
- `src/user/removeDevice/` — device deletion
- `src/shared/setSharedActs.ts` — shared model act factory
- `src/shared/seedShared/` — seed reference data

## 12. Practical guidance for the React Native app

The mobile app should assume the backend is authoritative for:

- patrol permission checks
- device trust and session revocation
- active shift and vehicle context
- report idempotency
- road/geospatial validation
- reference-data values

The app should not hardcode permissions, active shifts, or reference lists. Instead, it should fetch them from the backend and render them as dynamic data.

The backend is intentionally designed around real-world field operations. The app should respect those rules, especially around offline behavior, device registration, and the `client_report_uuid` idempotency pattern.
