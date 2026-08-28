# Patrol Dashboard Frontend AI Agent Guide

## Purpose

This document is the implementation guide for the frontend AI agent building the web patrol dashboard.

The dashboard has two audiences:

1. **Reporter:** the Patrol officer who created the report.
2. **Manager:** a Manager or Ghost user who reviews patrol reports.

The backend already supports the first dashboard API slice. The frontend must use these backend contracts as the source of truth and must not infer permissions, report ownership, active shifts, or status transitions locally.

## Backend Location

The backend is the Deno service in `back/`.

Important backend files:

- `back/models/accident.ts`
- `back/models/accident_review.ts`
- `back/src/accident/dashboard/`
- `back/src/accident/reviewReport/`
- `back/src/accident/resubmitReport/`
- `back/src/accident/reviewHistory/`
- `back/src/accident/reportScope.ts`
- `back/src/user/getMe/`
- `back/src/shift/getActiveShift/`
- `back/src/announcement/`

The API uses the Lesan request format:

```json
{
  "service": "main",
  "model": "accident",
  "act": "ACT_NAME",
  "details": {
    "set": {},
    "get": {}
  }
}
```

Responses use the framework envelope:

```json
{
  "success": true,
  "body": {}
}
```

For failed requests:

```json
{
  "success": false,
  "body": {
    "message": "..."
  }
}
```

The frontend must normalize this envelope in one API helper. Components should not read raw fetch responses independently.

## Authentication

The existing frontend API helper is `front/src/services/api.ts`.

The backend expects the JWT in the `token` request header without a `Bearer` prefix. The existing `AppApi()` helper already reads the browser cookie named `token` and sends it correctly.

Use the existing server action pattern for dashboard API calls:

```ts
"use server";

import { cookies } from "next/headers";
import { AppApi } from "@/services/api";

export async function getReporterDashboard(request: {
  set: ReporterDashboardSet;
  get: AccidentProjection;
}) {
  const token = (await cookies()).get("token");

  return AppApi().send(
    {
      service: "main",
      model: "accident",
      act: "getReporterDashboard",
      details: request,
    },
    { token: token?.value },
  );
}
```

Do not put passwords in browser storage. Existing web authentication uses a token cookie and session storage for user information. Do not expose password fields in report or user projections.

## Required Frontend Auth Updates

The current frontend type in `front/src/types/auth.ts` does not include `Patrol`. Update it to include:

```ts
export type UserLevel =
  | "Ghost"
  | "Manager"
  | "Editor"
  | "Enterprise"
  | "Patrol"
  | null;
```

Add types for the backend patrol payload:

```ts
export interface PatrolPermissions {
  can_submit_accident?: boolean;
  can_view_map?: boolean;
  can_receive_announcements?: boolean;
  can_register_emergency?: boolean;
  can_view_reports?: boolean;
}
```

The frontend must use `patrol_permissions` from the backend. Do not hardcode whether the user can register reports, view maps, or view announcements.

`getMe` already returns an active shift for Patrol users. The dashboard should use that result or the dashboard response instead of reading shift information from static user fields.

## Status Model

There are two independent status systems.

### Synchronization status

`sync_status` describes mobile-to-server synchronization:

```ts
type SyncStatus =
  | "draft"
  | "queued"
  | "syncing"
  | "synced"
  | "rejected";
```

Suggested Persian labels:

| Value | UI meaning | Suggested label |
|---|---|---|
| `draft` | Local or incomplete draft | پیش‌نویس |
| `queued` | Waiting to sync | در صف همگام‌سازی |
| `syncing` | Upload in progress | در حال همگام‌سازی |
| `synced` | Server received the report | همگام‌سازی‌شده |
| `rejected` | Server rejected sync/validation | ردشده در همگام‌سازی |

### Review status

`review_status` describes managerial workflow:

```ts
type ReviewStatus =
  | "submitted"
  | "under_review"
  | "returned"
  | "approved"
  | "completed";
```

Suggested Persian labels:

| Value | UI meaning | Suggested label |
|---|---|---|
| `submitted` | Ready for manager review | ارسال‌شده |
| `under_review` | Manager started review | در حال بررسی |
| `returned` | Requires reporter correction | برگشت برای اصلاح |
| `approved` | Manager approved | تأییدشده |
| `completed` | Workflow completed | تکمیل‌شده |

The frontend must show these as two separate badges or columns. For example, a report may be:

```text
Sync: همگام‌سازی‌شده
Review: برگشت برای اصلاح
```

Do not label `sync_status: "synced"` as “approved” or “completed”. A report can be successfully synchronized but still be waiting for review.

## Report Data

The accident model includes legacy fields and patrol fields.

Important top-level patrol fields:

```ts
interface PatrolReportFields {
  _id: string;
  serial: number;
  report_id?: string;
  client_report_uuid?: string;
  sync_status?: SyncStatus;
  rejection_reason?: string;
  review_status?: ReviewStatus;
  review_reason?: string;
  reviewed_at?: string;
  completed_at?: string;
  reported_at?: string;
  date_of_accident: string;
  location: GeoPoint;
  gps_coords?: GeoPoint;
  gps_accuracy?: number;
  travel_direction?: string;
  kilometer?: number;
  meter?: number;
  officer?: RelatedUser;
  reviewer?: RelatedUser;
  patrol_unit?: RelatedPatrolUnit;
  vehicle?: RelatedVehicle;
  lane?: RelatedReference;
  type?: RelatedReference;
  collision_type?: RelatedReference;
  road?: RelatedRoad;
  police_station?: RelatedPoliceStation;
  croquis_type?: RelatedReference;
  vehicle_dtos?: VehicleCard[];
  people_dtos?: PersonCard[];
  facility_damage_dtos?: FacilityDamageCard[];
  attachments?: FileAttachment[];
}
```

The exact generated declaration is in `back/declarations/selectInp.ts`. The frontend should regenerate or update frontend declarations after backend schema changes rather than manually duplicating the entire accident type.

Single relations are returned as embedded objects. Pure arrays such as `vehicle_dtos`, `people_dtos`, and `facility_damage_dtos` are returned as complete arrays when selected. The backend projection system does not support selecting individual fields inside pure arrays.

## Projection Rules

Every dashboard act requires a `get` projection. Use a bounded projection for list pages and a deeper projection for detail pages.

Example list projection:

```ts
const reportListProjection = {
  _id: 1,
  report_id: 1,
  serial: 1,
  date_of_accident: 1,
  reported_at: 1,
  sync_status: 1,
  rejection_reason: 1,
  review_status: 1,
  review_reason: 1,
  reviewed_at: 1,
  completed_at: 1,
  location: 1,
  kilometer: 1,
  meter: 1,
  travel_direction: 1,
  officer: {
    _id: 1,
    first_name: 1,
    last_name: 1,
    personnel_code: 1,
  },
  patrol_unit: {
    _id: 1,
    code: 1,
    name: 1,
  },
  vehicle: {
    _id: 1,
    plaque_no: 1,
  },
  type: 1,
  collision_type: 1,
};
```

For pure fields use `0` or `1`. Nested selection objects are intended for relations. Do not send nested selection syntax for fields inside pure arrays.

Avoid requesting large media arrays on list pages. Load attachments and complete vehicle/person/facility data on the detail page.

## Reporter Dashboard

### Route

Recommended frontend route:

```text
/patrol/dashboard
```

Only users with `level === "Patrol"` should enter this dashboard.

### Act: `getReporterDashboard`

Request:

```json
{
  "service": "main",
  "model": "accident",
  "act": "getReporterDashboard",
  "details": {
    "set": {
      "page": 1,
      "limit": 10
    },
    "get": {
      "_id": 1,
      "report_id": 1,
      "serial": 1,
      "reported_at": 1,
      "date_of_accident": 1,
      "sync_status": 1,
      "review_status": 1,
      "review_reason": 1,
      "location": 1,
      "type": 1,
      "collision_type": 1
    }
  }
}
```

Response body:

```ts
interface ReporterDashboardResponse {
  activeShift: ActiveShift | null;
  summary: {
    sync: Record<SyncStatus, number>;
    review: Record<ReviewStatus, number>;
  };
  recentReports: PatrolReportFields[];
}
```

`activeShift` contains:

- `_id`
- `shift_type`
- `status`
- `start_at`
- `end_at`
- `patrol_unit`
- `vehicle`

The backend returns `activeShift: null` when the Patrol officer has no active shift. The UI must show an explicit “active shift information unavailable” state and must not crash.

The backend limits reporter dashboard `limit` to a maximum of 50. The default is 10.

### Reporter report list

Use the existing `getMyReports` act for a dedicated reporter list when needed:

```json
{
  "model": "accident",
  "act": "getMyReports",
  "details": {
    "set": {
      "page": 1,
      "limit": 20,
      "status": "rejected"
    },
    "get": {}
  }
}
```

`getMyReports` uses `status` for `sync_status`, not `review_status`. The dashboard should use the dedicated dashboard endpoint for summary data and clearly label any sync-only filter.

### Reporter resubmission

Route suggestion:

```text
/patrol/reports/[id]
```

Act: `resubmitReport`

Request:

```json
{
  "service": "main",
  "model": "accident",
  "act": "resubmitReport",
  "details": {
    "set": {
      "reportId": "64f000000000000000000001"
    },
    "get": {
      "_id": 1,
      "report_id": 1,
      "review_status": 1,
      "review_reason": 1,
      "reviewed_at": 1
    }
  }
}
```

Requirements:

- The logged-in user must be Patrol.
- The report must belong to that Patrol user.
- The report must have `review_status: "returned"`.
- The report must have `sync_status: "synced"`.

On success:

- `review_status` becomes `submitted`.
- `review_reason` is removed.
- A `resubmitted` review-history record is created.

After success, refresh the report detail, reporter summary, and review history.

## Manager Dashboard

### Routes

Recommended routes:

```text
/patrol-manager/dashboard
/patrol-manager/reports
/patrol-manager/reports/[id]
```

Only Manager and Ghost users may access these pages.

### Act: `getManagerDashboard`

Request:

```json
{
  "service": "main",
  "model": "accident",
  "act": "getManagerDashboard",
  "details": {
    "set": {
      "page": 1,
      "limit": 20
    },
    "get": {
      "_id": 1,
      "report_id": 1,
      "reported_at": 1,
      "sync_status": 1,
      "review_status": 1,
      "review_reason": 1,
      "officer": 1,
      "patrol_unit": 1,
      "vehicle": 1,
      "location": 1,
      "type": 1
    }
  }
}
```

Response body:

```ts
interface ManagerDashboardResponse {
  summary: {
    sync: Record<SyncStatus, number>;
    review: Record<ReviewStatus, number>;
  };
  recentReports: PatrolReportFields[];
}
```

The current backend does not yet return `activeOfficers`, a daily trend, or separate aggregate chart series. The frontend should not assume those fields exist. Use the returned `sync` and `review` count objects for the first dashboard version.

The backend limits manager dashboard `limit` to a maximum of 100. The default is 20.

### Act: `getManagerReports`

Request:

```json
{
  "service": "main",
  "model": "accident",
  "act": "getManagerReports",
  "details": {
    "set": {
      "page": 1,
      "limit": 50,
      "reviewStatus": "submitted",
      "syncStatus": "synced"
    },
    "get": {
      "_id": 1,
      "report_id": 1,
      "serial": 1,
      "reported_at": 1,
      "date_of_accident": 1,
      "sync_status": 1,
      "review_status": 1,
      "review_reason": 1,
      "officer": 1,
      "patrol_unit": 1,
      "vehicle": 1,
      "location": 1,
      "kilometer": 1,
      "meter": 1,
      "travel_direction": 1,
      "type": 1,
      "collision_type": 1
    }
  }
}
```

Supported set fields:

```ts
interface ManagerReportsSet {
  page?: number;
  limit?: number;
  reviewStatus?: ReviewStatus;
  syncStatus?: SyncStatus;
  userId?: string;
}
```

The current backend applies only these filters:

- `reviewStatus`
- `syncStatus`
- `userId`

It does not yet implement manager list filters for date, road, patrol unit, police station, severity, collision type, or text search. Do not render controls for unsupported filters until their backend contracts are added.

### Current manager scope

The current server scope is:

- Manager/Ghost can see reports whose embedded officer has `level: "Patrol"`.
- Optional `userId` narrows results to one officer.
- Patrol users cannot use manager acts.

This is a temporary organizational scope. The frontend must not present it as a police-station or patrol-unit assignment system. Do not implement client-side scope filtering as a security measure.

## Manager Review Actions

### Act: `reviewReport`

Request shape:

```ts
interface ReviewReportSet {
  reportId: string;
  action: "start_review" | "return" | "approve" | "complete";
  reason?: string;
}
```

Example start-review request:

```json
{
  "service": "main",
  "model": "accident",
  "act": "reviewReport",
  "details": {
    "set": {
      "reportId": "64f000000000000000000001",
      "action": "start_review"
    },
    "get": {
      "_id": 1,
      "report_id": 1,
      "review_status": 1,
      "review_reason": 1,
      "reviewed_at": 1,
      "reviewer": 1
    }
  }
}
```

Example return request:

```json
{
  "service": "main",
  "model": "accident",
  "act": "reviewReport",
  "details": {
    "set": {
      "reportId": "64f000000000000000000001",
      "action": "return",
      "reason": "تصویر پلاک وسیله نقلیه اول خوانا نیست. لطفاً تصویر جدید بارگذاری کنید."
    },
    "get": {
      "_id": 1,
      "report_id": 1,
      "review_status": 1,
      "review_reason": 1,
      "reviewed_at": 1,
      "reviewer": 1
    }
  }
}
```

Review transition table:

| Current status | Allowed action | Next status |
|---|---|---|
| Missing or `submitted` | `start_review` | `under_review` |
| `under_review` | `return` | `returned` |
| `under_review` | `approve` | `approved` |
| `approved` | `complete` | `completed` |

Additional rules:

- Only Manager/Ghost can use `reviewReport`.
- The report must be inside the server-enforced manager scope.
- The report must have `sync_status: "synced"` before review.
- `return` requires a non-empty `reason`.
- Invalid transitions are rejected by the backend.
- The backend records an audit history row for every successful action.
- For actions other than `return`, the previous `review_reason` is removed.
- `complete` sets `completed_at`.

The frontend should disable actions that are impossible from the known current status, but the backend remains authoritative. Always handle a rejected transition because another manager may have changed the report after the page loaded.

Recommended action UI:

- `submitted`: show “شروع بررسی”.
- `under_review`: show “برگشت برای اصلاح” and “تأیید”.
- `approved`: show “تکمیل گزارش”.
- `returned`: show no manager action in this first slice; wait for reporter resubmission.
- `completed`: show read-only state.

## Review History

### Act: `getReportReviewHistory`

This act uses model `accident_review`, not model `accident`.

Request:

```json
{
  "service": "main",
  "model": "accident_review",
  "act": "getReportReviewHistory",
  "details": {
    "set": {
      "reportId": "64f000000000000000000001",
      "page": 1,
      "limit": 50
    },
    "get": {
      "_id": 1,
      "action": 1,
      "reason": 1,
      "action_at": 1,
      "reviewer": 1
    }
  }
}
```

Response body:

```ts
interface ReviewHistoryItem {
  _id: string;
  action:
    | "submitted"
    | "started_review"
    | "returned"
    | "resubmitted"
    | "approved"
    | "completed"
    | "reopened";
  reason?: string;
  action_at: string;
  reviewer?: RelatedUser;
}
```

History is sorted newest first. The backend caps `limit` at 100.

Display history as a timeline. Show the actor, action, timestamp, and reason. Do not treat the current accident fields as a replacement for history.

## Legacy Report Handling

Some reports created before this feature may not have `review_status`.

The backend treats a missing `review_status` as `submitted` for dashboard summary counts and the first review transition. The frontend should normalize missing values defensively:

```ts
const reviewStatus = report.review_status ?? "submitted";
```

Do not display an empty status badge for these records.

## Error Handling

Never display raw database or framework errors directly to the user.

Map common backend messages to friendly UI behavior:

| Backend condition | UI behavior |
|---|---|
| Not authenticated | Clear local session and redirect to login |
| Patrol opens manager dashboard | Show unauthorized state and hide manager navigation |
| Manager opens reporter dashboard | Show unauthorized state and hide reporter-only navigation |
| Report not found or out of scope | Show “گزارش یافت نشد یا دسترسی ندارید” |
| Invalid transition | Refresh report and show a non-blocking status update message |
| Return without reason | Keep dialog open and show required-field validation |
| Unsynced report review | Explain that the report must finish synchronization first |
| Resubmit non-returned report | Refresh detail and show that resubmission is unavailable |
| Network failure | Preserve currently displayed data and offer retry |

The frontend should use an API response normalizer, for example:

```ts
export function unwrapApiResponse<T>(response: unknown): T {
  const value = response as {
    success?: boolean;
    body?: T & { message?: string };
  };

  if (!value.success) {
    throw new Error(value.body?.message || "خطا در دریافت اطلاعات");
  }

  return value.body as T;
}
```

Use localized UI messages instead of exposing internal error text where possible.

## Loading and Refresh Behavior

Dashboard pages should support:

- Initial loading skeletons.
- Empty states for zero reports.
- Error states with retry.
- Manual refresh.
- Refresh after review action.
- Refresh after resubmission.
- Preserving selected filters during refresh.

Recommended refresh sequence after a manager action:

1. Update or invalidate the current report detail.
2. Refresh review history.
3. Refresh manager dashboard summary.
4. Refresh manager report list.

Recommended refresh sequence after reporter resubmission:

1. Refresh report detail.
2. Refresh review history.
3. Refresh reporter summary.
4. Refresh reporter report list.

Do not optimistically mark a report as approved or completed without handling a possible backend transition failure.

## Page Recommendations

### Reporter home

Show:

- Officer name and personnel code.
- Current shift.
- Patrol unit.
- Assigned vehicle.
- Counts for sync statuses.
- Counts for review statuses.
- Recent reports.
- Returned reports requiring action.
- Last synchronization information if available.

The current `getReporterDashboard` response does not include announcements or last-sync timestamp. Fetch announcements through the existing announcement acts until a combined endpoint is added.

### Reporter report list

Columns/cards:

- Report ID.
- Accident date/time.
- Reported-at time.
- Location or road summary.
- Sync badge.
- Review badge.
- Correction reason when returned.
- Open detail action.

The primary action on a returned report is “مشاهده اصلاحات” or “ارسال مجدد”, depending on whether the form editing flow is ready.

### Manager home

Show:

- Total patrol report counts derived from returned sync/review maps.
- Submitted queue count.
- Under-review count.
- Returned count.
- Approved count.
- Completed count.
- Sync rejection count.
- Recent reports.

Do not show unsupported daily trend or active-officer cards until backend fields exist.

### Manager report list

Minimum columns:

- Report ID.
- Reporter.
- Personnel code.
- Patrol unit.
- Vehicle.
- Report date.
- Sync status.
- Review status.
- Last reviewed time.
- Open detail action.

Use only the supported filters in the first version:

- Review status.
- Sync status.
- Officer ID if the manager has a user selector.

Do not add date, road, station, vehicle, severity, or collision filters until the backend supports them in `getManagerReports`.

### Report detail

Use a shared detail component for reporter and manager views, with action controls supplied by the page role.

Sections:

- Report identity.
- Sync/review status.
- Reporter and patrol context.
- Accident location and map.
- Road linear reference.
- Classification.
- Police/croquis data.
- Vehicle cards.
- People cards.
- Environmental data.
- Facility damage.
- Attachments.
- Review history.

Manager-only controls:

- Start review.
- Return for correction.
- Approve.
- Complete.

Reporter-only controls:

- Edit returned report.
- Resubmit returned report.

## Maps and Coordinates

Accident coordinates are GeoJSON points:

```ts
interface GeoPoint {
  type: "Point";
  coordinates: [number, number];
}
```

GeoJSON coordinates are `[longitude, latitude]`, not `[latitude, longitude]`.

The report may have both:

- `gps_coords`: the officer’s actual device location while reporting.
- `location`: the selected incident location.

Display these as distinct concepts. The detail UI should not label both as simply “location”. Show GPS accuracy when available.

Use `kilometer`, `meter`, and `travel_direction` as the linear-reference summary. Missing values must be rendered as unavailable rather than as zero.

## Attachments

The report model can contain attachment references and image IDs in vehicle/facility cards. The categorized upload workflow is not yet fully documented as a stable dashboard contract.

Until the upload API is finalized:

- Render existing attachment IDs/URLs only when the backend provides them.
- Do not invent upload endpoints.
- Do not assume every image ID can be displayed as a public URL.
- Keep attachment UI isolated behind an adapter so the upload contract can be added later.
- Never display a broken image as if the evidence were missing; distinguish unavailable media from no media.

Expected future categories:

- `plate`
- `insurance`
- `croquis`
- `facility_damage`
- `other`

## Announcements

The existing announcement acts are separate from the dashboard acts:

- `announcement.gets`
- `announcement.get`
- `announcement.getUnreadCount`
- `announcement.markAnnouncementRead`

The current backend has placeholder read tracking. `getUnreadCount` currently counts matching active announcements rather than truly per-user unread announcements, and `markAnnouncementRead` does not persist a read record yet.

The frontend should still build the announcements area behind a small data adapter so true per-user read tracking can be introduced without rewriting the dashboard.

## Performance Rules

- Use server-side pagination.
- Use small projections for lists.
- Do not request `vehicle_dtos`, `people_dtos`, facility damage arrays, and attachments for every list row.
- Debounce or submit filter changes deliberately; do not issue a request on every keystroke unless the API is designed for it.
- Refresh summaries and lists independently when appropriate.
- Avoid repeated dashboard calls caused by unstable React dependencies.
- Use cached server data where the frontend architecture supports it, but invalidate after review mutations.

## Testing Requirements

The frontend AI agent should add tests for:

- Patrol user can render reporter dashboard.
- Manager/Ghost can render manager dashboard.
- Wrong-role dashboard access is handled gracefully.
- Missing `review_status` renders as `submitted`.
- Sync and review badges are separate.
- Review buttons match the current transition.
- Return dialog requires a reason.
- Successful review action refreshes detail/list/summary/history.
- Failed review action does not leave the UI in a false status.
- Reporter can see a returned reason.
- Reporter resubmission refreshes state.
- Unsupported filters are not sent to the backend.
- Empty, loading, network-error, and unauthorized states render correctly.
- GeoJSON coordinate order is handled correctly.

## Backend Limitations to Keep Visible

The frontend must account for these current limitations:

1. Manager scope is currently all patrol reports, optionally narrowed by `userId`; assignment by police station or patrol unit is not implemented.
2. `getManagerReports` currently supports only `reviewStatus`, `syncStatus`, and `userId` filters.
3. `getManagerDashboard` currently returns summary maps and recent reports, not daily trends or active-officer metrics.
4. `getReporterDashboard` currently returns active shift, summary maps, and recent reports, not announcements or last-sync timestamp.
5. Announcement read state is not truly persisted per user yet.
6. Categorized upload behavior is not yet a finalized dashboard API.
7. Review history is recorded only for successful review and resubmission actions.
8. Legacy accidents may not contain `review_status`; treat those as `submitted`.
9. Backend type generation may update `back/declarations/selectInp.ts`; frontend action types should be regenerated after schema changes.

## Recommended Frontend Implementation Order

1. Update frontend auth types to include Patrol and patrol permissions.
2. Add typed server actions for the five implemented dashboard acts:
   - `getReporterDashboard`
   - `getManagerDashboard`
   - `getManagerReports`
   - `reviewReport`
   - `resubmitReport`
3. Add the typed `getReportReviewHistory` action under the `accident_review` model.
4. Add shared status normalization and badge components.
5. Build the shared report list and report detail components.
6. Build reporter dashboard and reporter report detail.
7. Build manager dashboard and manager report queue.
8. Add review action dialogs and refresh/invalidation behavior.
9. Add map and attachment adapters.
10. Add tests for role boundaries and status transitions.

## Definition of Done

The first frontend dashboard slice is complete when:

- Patrol users can view their dashboard and own reports.
- Managers can view the manager summary and scoped report list.
- Report detail shows both sync and review state.
- Managers can execute valid review actions from the UI.
- Return actions require a correction reason.
- Patrol users can see correction reasons and resubmit returned reports.
- Review history is visible to the authorized user.
- Unsupported filters and unsupported metrics are not presented.
- API failures, unauthorized access, empty data, and legacy reports are handled safely.
- No password or sensitive authentication data is rendered.

---

# Patrol Operations Panel (Management APIs)

This section documents the backend contracts for the **patrol operations management panel** used by Ghost/Manager users on the web. These acts manage the operational data consumed by the mobile Patrol app: patrol units, officers, vehicles, police stations, shifts, and the operations summary.

## Authorization Matrix

Enforced server-side via `grantAccess` in every act's `preAct` chain. Never rely on hiding UI controls.

| Act group | Ghost | Manager | Patrol | Editor / Enterprise |
|---|---|---|---|---|
| `patrol_unit.updateRelations` | ✅ | ✅ | ❌ | ❌ |
| `vehicle.add / get / gets / update / remove` | ✅ | ✅ | ❌ | ❌ |
| `patrol_operations.getOperationsSummary` | ✅ | ✅ | ❌ | ❌ |
| `user.getPatrolOfficers` | ✅ | ✅ | ❌ | ❌ |
| `patrol_unit.gets` (extended) | ✅ | ✅ | ❌ | ❌ |
| `shift.getShifts` | all shifts | all shifts | own shifts only | ❌ |
| `shift.getActiveShift` | any officer | any officer | own shift only | ❌ |

Denial message from the framework for out-of-level calls: `"You cant do this"`. Domain failures return clear Persian messages (see error tables below).

## 1. Act: `patrol_unit.updateRelations`

Single entry point for assigning/removing officers, vehicles, and the police station of a patrol unit.

Request:

```json
{
  "service": "main",
  "model": "patrol_unit",
  "act": "updateRelations",
  "details": {
    "set": {
      "_id": "PATROL_UNIT_ID",
      "officerIds": ["USER_ID"],
      "removeOfficerIds": ["USER_ID"],
      "vehicleIds": ["VEHICLE_ID"],
      "removeVehicleIds": ["VEHICLE_ID"],
      "policeStationId": "POLICE_STATION_ID",
      "removePoliceStation": false
    },
    "get": {
      "_id": 1,
      "code": 1,
      "name": 1,
      "is_active": 1,
      "police_station": { "_id": 1, "name": 1, "code": 1 },
      "officers": {
        "_id": 1,
        "first_name": 1,
        "last_name": 1,
        "personnel_code": 1,
        "level": 1,
        "is_active": 1
      },
      "vehicles": { "_id": 1, "plaque_no": 1, "is_active": 1 }
    }
  }
}
```

Semantics:

- All list fields are optional; send only what changes.
- `officerIds` / `vehicleIds`: **add** to the unit (duplicates are ignored).
- `removeOfficerIds` / `removeVehicleIds`: remove members that must currently belong to the unit.
- `policeStationId`: sets or replaces the single station relation.
- `removePoliceStation: true`: clears the station.
- The same id cannot appear in both add and remove lists.
- Relation mutations keep both directions in sync automatically (officer/vehicle embeds `patrol_unit`, station embeds `patrol_units`).

Server-side rules:

| Rule | Persian error (substring) |
|---|---|
| Unit must exist | `گشت یافت نشد` |
| Officers must exist | `مأمور(های) زیر یافت نشدند` |
| Officer level must be `Patrol` | `مأمور گشت نیست` |
| Officer must be active | `غیرفعال است و قابل تخصیص به گشت نیست` |
| Vehicles must exist | `خودرو(های) زیر یافت نشدند` |
| Vehicles must be active | same inactive message as above |
| Exclusive assignment among ACTIVE units (officer) | `قبلاً به گشت فعال دیگری ... تخصیص یافته است` |
| Exclusive assignment among ACTIVE units (vehicle) | same message pattern |
| Station must exist | `کلانتری یافت نشد` |
| Station must be active | `کلانتری غیرفعال است` |
| Remove non-member officer | `عضو این گشت نیستند` |
| Remove unassigned vehicle | `به این گشت تخصیص نیافته‌اند` |
| Remove when no station set | `این گشت در حال حاضر کلانتری ندارد` |
| Add+remove overlap | `هم‌زمان اضافه و حذف` |

Every successful mutation writes an audit row into the `operation_log` collection (`action: "patrol_unit.updateRelations"`, actor, changed ids). This log is internal and has no public act yet.

Response body: the updated unit filtered by the sent `get`.

Officers of an **inactive** unit can be re-assigned to an active unit directly; only active units participate in exclusivity checks.

## 2. Vehicle CRUD

New pure fields on `vehicle`: `title: string` (display name, required) and `is_active: boolean` (default `true`). `plaque_no` remains the existing three-part tuple.

### `vehicle.add`

```json
{
  "model": "vehicle",
  "act": "add",
  "details": {
    "set": {
      "plaque_no": ["11", "ب345", "ایران63"],
      "title": "پاترول ۲۳",
      "is_active": true,
      "colorId": "COLOR_ID",
      "plaqueTypeId": "PLAQUE_TYPE_ID",
      "systemTypeId": "SYSTEM_TYPE_ID"
    },
    "get": { "_id": 1, "plaque_no": 1, "title": 1, "is_active": 1 }
  }
}
```

The three optional `*Id` fields map to the existing `color`, `plaque_type`, and `system_type` relations.

### `vehicle.get`

`set: { _id }` → single vehicle or Persian error `خودرو یافت نشد`.

### `vehicle.gets`

```json
{
  "set": {
    "page": 1,
    "limit": 20,
    "plaque": "ب345",
    "title": "پاترول",
    "is_active": true,
    "patrolUnitId": "UNIT_ID"
  },
  "get": {
    "_id": 1,
    "plaque_no": 1,
    "title": 1,
    "is_active": 1,
    "patrol_unit": { "_id": 1, "name": 1, "code": 1 }
  }
}
```

- Server-side pagination; `patrol_unit` reverse relation is embedded when assigned.
- Each row carries an extra computed field `active_shift_count` (number of active shifts using this vehicle).
- `plaque` performs a partial case-insensitive match across all three plaque parts.

### `vehicle.update`

`set: { _id, plaque_no?, title?, is_active? }`. `plaque_no` must contain exactly three parts or the request fails with `پلاک باید از سه بخش تشکیل شود`.

### `vehicle.remove`

Deletion policy (server-enforced):

1. Unknown id → `خودرو یافت نشد`.
2. Vehicle used by an **active** shift → `این خودرو در حال حاضر در یک شیفت فعال استفاده می‌شود و قابل حذف نیست`.
3. If assigned to a patrol unit, it is detached from the unit (both directions) automatically before deletion.
4. Vehicles referenced by past (ended) shifts are preserved for audit history → `این خودرو در سوابق عملیاتی (شیفت‌های پیشین) ثبت شده است و قابل حذف نیست`.

## 3. Act: `patrol_operations.getOperationsSummary`

Model `patrol_operations` holds no documents; it exists purely as the namespace for this combined summary. The response shape is stable regardless of `get` (the validator mirrors it):

```json
{
  "service": "main",
  "model": "patrol_operations",
  "act": "getOperationsSummary",
  "details": {
    "set": {},
    "get": {
      "patrolUsers": { "total": 1, "active": 1 },
      "patrolUnits": { "total": 1, "active": 1 },
      "vehicles": { "total": 1, "active": 1, "assigned": 1 },
      "shifts": { "active": 1, "endedToday": 1 }
    }
  }
}
```

Field semantics:

- `patrolUsers.total/active`: users with `level: "Patrol"` (active = `is_active: true`).
- `patrolUnits.total/active`: all units vs `is_active: true`.
- `vehicles.total/active/assigned`: all vehicles, active vehicles, and vehicles whose embedded `patrol_unit._id` exists.
- `shifts.active`: shifts with `status: "active"`.
- `shifts.endedToday`: shifts ended between local midnight and now.

## 4. Act: `user.getPatrolOfficers`

Paginated list of Patrol officers with their assigned unit and current active shift.

```json
{
  "model": "user",
  "act": "getPatrolOfficers",
  "details": {
    "set": {
      "page": 1,
      "limit": 20,
      "is_active": true,
      "search": "۱۲۳۴"
    },
    "get": {
      "_id": 1,
      "first_name": 1,
      "last_name": 1,
      "personnel_code": 1,
      "level": 1,
      "is_active": 1,
      "patrol_unit": { "_id": 1, "name": 1, "code": 1 }
    }
  }
}
```

- Only relations up to `patrol_unit` can be selected; heavy reverse relations (`accidents`, `shifts`, `devices`, …) are rejected by the validator.
- `search` matches first name, last name, or personnel code (partial, case-insensitive).
- Every row additionally contains a computed `active_shift` field:

```ts
interface ActiveShiftSummary {
  _id: string;
  shift_type: string;
  status: "active";
  start_at: Date;
  end_at?: Date;
  patrol_unit: { _id: string; code: string; name: string } | null;
  vehicle: { _id: string; plaque_no: [string, string, string] } | null;
}
```

`active_shift` is `null` when the officer has no active shift. Password/settings never appear in responses (excluded at model level).

## 5. Extended: `patrol_unit.gets`

Existing act, extended with:

- New optional filter `is_active: boolean`.
- Computed `active_shift_count` per row (number of active shifts assigned to that unit).
- Existing behavior preserved: pagination plus embedded `officers`, `vehicles`, `police_station`.

## 6. Shift improvements

### `shift.assignShift` (hardened)

Additional server-side validations on top of previous behavior:

| Check | Persian error (substring) |
|---|---|
| Officer level must be `Patrol` | `شیفت فقط به مأمور با سطح «Patrol» قابل تخصیص است` |
| Officer must be active | `مأمور غیرفعال است` |
| Unit must exist | `گشت یافت نشد` |
| Unit must be active | `گشت غیرفعال است` |
| No duplicate active shift per officer | `این مأمور در حال حاضر یک شیفت فعال دارد` |
| Vehicle must exist | `خودرو یافت نشد` |
| Vehicle must be active | `خودرو غیرفعال است` |
| Vehicle not already in an active shift | `این خودرو در حال حاضر در یک شیفت فعال استفاده می‌شود` |

The success response embeds the assigned `officer`, `patrol_unit`, and `vehicle` objects when requested through `get`. `getActiveShift`, `endShift`, and their ownership rules are unchanged.

### `shift.getShifts` (extended filters)

```json
{
  "set": {
    "page": 1,
    "limit": 20,
    "userId": "OPTIONAL_OFFICER_ID",
    "patrolUnitId": "OPTIONAL_UNIT_ID",
    "status": "active"
  },
  "get": { "_id": 1, "shift_type": 1, "status": 1, "start_at": 1, "end_at": 1, "officer": 1, "patrol_unit": 1, "vehicle": 1 }
}
```

- Ghost/Manager: lists all shifts; optional `userId`, `patrolUnitId`, and `status` filters (`status` accepts only `active | ended | cancelled`; unknown unit id returns `گشت یافت نشد`).
- Patrol: always scoped to own shifts; `patrolUnitId` is rejected for Patrol.
- This doubles as the "active shifts" operational list (`status: "active"`).

## 7. Report compatibility (verified)

The manager dashboard/report APIs already expose everything the operations panel needs. Requesting these fields in `getManagerReports` / `getManagerDashboard` projections works today:

`report_id`, `serial`, `reported_at`, `date_of_accident`, `sync_status`, `review_status`, `review_reason`, `reviewed_at`, `location`, plus embedded `officer`, `patrol_unit`, `vehicle`.

Sensitive authentication fields (`password`, login-lockout counters, settings) are excluded from every user projection at the model level and cannot leak through report relations.

## 8. Generated declarations

After schema changes regenerate types by starting the backend once (`TYPE_GENERATION` defaults to `true`):

```bash
cd back && deno run -A ./mod.ts   # writes back/declarations/selectInp.ts, then Ctrl-C
cp declarations/selectInp.ts ../front/src/types/declarations/selectInp.ts
```

The frontend copy lives at `front/src/types/declarations/selectInp.ts` and exports `lesanApi` used by `front/src/services/api.ts`.

## 9. Backend tests

Integration tests live in `back/test/patrol-operations-test.ts` and run against an **isolated database** (`nejat_patrol_ops_test`) so dev data is untouched:

```bash
cd back && deno test -A test/patrol-operations-test.ts
```

Requires a local MongoDB. Coverage includes: Ghost authorization, Manager policy, Patrol denial (real token + preAct pipeline), Patrol-only officer validation, inactive officer/vehicle/unit rejection, duplicate active-shift conflict, busy-vehicle conflict, exclusive assignment conflicts between active units, relation add/remove integrity in both directions, audit-log writing, pagination without overlap, missing-resource Persian errors, and vehicle deletion guards.
