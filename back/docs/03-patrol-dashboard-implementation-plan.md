# Patrol Dashboard Implementation Plan

## Goal

Create a web dashboard for patrol reporters and their managers to view submitted and completed patrol reports online, while preserving the existing offline-first mobile sync behavior.

The backend must distinguish two independent lifecycles:

- `sync_status`: whether a mobile report reached and synchronized with the server.
- `review_status`: whether the report has been submitted, reviewed, returned, approved, or completed by the organization.

`sync_status` must never be reused for managerial review because synchronization retries and review decisions have different owners, transitions, and audit requirements.

## Current Backend Foundation

Already implemented:

- Patrol users, personnel codes, dynamic patrol permissions, device registration, device revocation, and login.
- Patrol units, vehicles, and active shifts.
- Accident metadata for mobile reports, including `client_report_uuid`, officer, patrol unit, vehicle, GPS, incident coordinates, kilometer, meter, and lane.
- Idempotent accident creation and update behavior.
- `getMyReports` for officer reports and manager queries.
- `getSyncStatus` for synchronization states.
- Expanded accident form data for vehicles, people, police/croquis, environmental conditions, and facility damage.
- Road snapping, linear referencing, zone validation, and geometry cache APIs.
- Shared reference-data models and seed behavior.
- Announcement listing and unread-count endpoints.

Existing gaps relevant to the web dashboard:

- No independent manager review lifecycle exists yet.
- No review-history/audit model exists.
- Manager report access is currently broad when `userId` is omitted.
- No dashboard-specific summary/read-model endpoints exist.
- Announcement read tracking is currently a placeholder.
- Categorized upload and attachment ownership workflow is incomplete.
- Frontend auth types do not yet include the `Patrol` level.

## Phase 1: Review Lifecycle Foundation

### Accident fields

Add an independent review block to the accident model:

```text
review_status: submitted | under_review | returned | approved | completed
review_reason?: string
reviewed_at?: date
completed_at?: date
reviewer relation -> user
```

Review status should be optional for legacy records and default to `submitted` for new server-submitted patrol reports where appropriate. Existing non-patrol accident records must remain readable.

Before implementation, confirm whether the existing `completion_date` has legacy semantics. Do not silently reuse it for dashboard completion unless the meanings are identical.

### Review history

Create an `accident_review` model containing:

- Accident relation.
- Reviewer relation.
- Action.
- Optional reason.
- Timestamp.

Recommended actions:

```text
submitted
started_review
returned
resubmitted
approved
completed
reopened
```

Every review mutation must append a history record. The latest accident fields are optimized for dashboard lists; history is the audit source.

### Transition rules

Recommended transitions:

```text
submitted -> under_review
under_review -> returned
under_review -> approved
approved -> completed
returned -> submitted
```

Do not allow arbitrary status assignment through the generic accident update act.

Rules:

- Patrol users may edit their own report while it is `returned` or before review according to the final product decision.
- Patrol users may resubmit only their own returned report.
- Managers and Ghost users can review only reports inside their authorized scope.
- Return actions require a non-empty correction reason.
- Approved/completed reports cannot be modified by Patrol users.
- Completed reports cannot be reopened without an explicit privileged action.

## Phase 2: Authorization Scope

Implement a shared authorization helper that resolves the reports an actor may access.

Possible scope sources:

- Assigned police stations.
- Assigned patrol units.
- Explicit officer assignments.
- Province/city settings.
- Ghost bypass.

The final scope rule must be agreed with the business owner before manager dashboard rollout. The client-supplied `userId` must never be the authorization boundary.

Use the resolver for:

- Manager dashboard summary.
- Manager report list/detail.
- Report review mutations.
- Review history.
- Manager synchronization summaries.

## Phase 3: Dashboard API Contracts

### Reporter dashboard

Add `getReporterDashboard` returning:

```text
profile
activeShift
summary: sync/review counts
recentReports
unreadAnnouncements
lastSyncAt
```

Add or extend reporter report APIs for:

- Pagination.
- Sync status.
- Review status.
- Date range.
- Report ID/serial search.
- Severity/collision filters.
- Full report detail.
- Review history.

Add `resubmitReport` as a dedicated operation. It must validate ownership, status, and transition rules.

### Manager dashboard

Add `getManagerDashboard` returning:

```text
totalReports
awaitingReview
returned
approved
completed
rejectedSync
activeOfficers
recentReports
statusBreakdown
dailyTrend
```

Add `getManagerReports` with server-side pagination and filters for:

- Review status.
- Sync status.
- Reporter/personnel code.
- Patrol unit.
- Police station.
- Vehicle.
- Severity and collision type.
- Date ranges.
- Road/location.
- Geographic polygon where needed.

Add `getManagerReport`, `reviewReport`, and `getReportReviewHistory`.

All responses must preserve the framework `{ success, body }` envelope.

## Phase 4: Sync Status Completion

Improve `getSyncStatus` to return bounded summary data:

```text
counts
latest reports
lastSyncedAt
rejectedReports
```

Keep synchronization independent from review. Verify that retries by `client_report_uuid` never duplicate accident records or reverse relations.

Add indexes for officer/status/date queries.

## Phase 5: Attachments and Evidence

Complete categorized upload support for:

- Plate images.
- Insurance images.
- Croquis files.
- Facility damage images.
- Other evidence.

Validate MIME type, file size, category, uploader ownership, accident ownership, and allowed modification state. Centralize attachment linking instead of spreading it across generic update logic.

## Phase 6: Announcements and Notifications

Create per-user announcement read tracking. Update:

- `markAnnouncementRead`.
- `getUnreadCount`.
- `getAnnouncements`.

Correction and approval notifications should reference the report and expose a notification type. A dedicated notification model is preferable if the system will need delivery state, read state, or push integration.

## Phase 7: Frontend Dashboard

### Reporter routes

```text
/patrol/dashboard
/patrol/reports
/patrol/reports/[id]
```

The reporter UI should show active shift context, sync/review counts, recent reports, correction reasons, report detail, review history, and allowed resubmission actions.

### Manager routes

```text
/patrol-manager/dashboard
/patrol-manager/reports
/patrol-manager/reports/[id]
```

The manager UI should show review queues, scoped reports, filters, map/location data, attachments, status actions, and review history.

Use server-side pagination and typed action wrappers. Never load the full report dataset into the browser.

Update frontend auth types and navigation to support `Patrol` and dynamic patrol permissions.

## Phase 8: Performance and Data Integrity

Review and add indexes for:

```text
accident officer._id + reported_at
accident patrol_unit._id + reported_at
accident sync_status + reported_at
accident review_status + reported_at
accident report_id
accident client_report_uuid
accident location: 2dsphere
shift officer._id + status
shift patrol_unit._id + status
announcement is_active + expires_at
```

Decide whether report snapshots are required for officer name, personnel code, unit code, vehicle plate, and police station. Snapshots are recommended for operational and legal accuracy because source relations can later change.

## Delivery Order

1. Implement review fields, review history, transitions, and tests.
2. Implement authorization scope resolution.
3. Implement reporter dashboard summary/list/detail/resubmit APIs.
4. Implement manager dashboard summary/list/detail/review APIs.
5. Complete sync-status summary and indexes.
6. Complete categorized uploads and evidence display.
7. Complete announcement read tracking and report notifications.
8. Build reporter and manager frontend routes.
9. Add operational analytics after the core workflow is stable.

## Acceptance Criteria

### Reporter

- A reporter can see only their own reports.
- Sync status and review status are displayed independently.
- Returned reports show the manager correction reason.
- Only permitted reports can be edited and resubmitted.
- Review history is visible.
- Active shift, patrol unit, and vehicle come from the backend.

### Manager

- A manager sees only reports within their authorized scope.
- Lists are paginated and filterable server-side.
- A manager can inspect complete report data and evidence.
- Returning a report requires a reason.
- Review actions are transition-validated and audited.
- Ghost access is explicit and tested.

### Security and reliability

- Mobile retry idempotency remains intact.
- Revoked devices lose access on their next request.
- Passwords remain excluded from all projections.
- Raw database errors are not exposed to users.
- All acts preserve `{ success, body }`.
- No new type-check errors are introduced beyond the documented baseline.

## Open Decisions

Before completing the manager dashboard, confirm:

- The exact definition of “completed”.
- Manager organizational scope.
- Whether approved reports can be edited.
- Whether report history must be immutable for legal purposes.
- Whether future patrol events will share the accident review model.
- Whether emergency events belong in this dashboard or a separate operational system.
