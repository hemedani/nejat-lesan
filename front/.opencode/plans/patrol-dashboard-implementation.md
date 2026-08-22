# Patrol Dashboard Implementation Plan

## Goal

Build the first frontend slice for the patrol reporting workflow using the backend dashboard contracts and the visual language established by the landing and login pages.

The product has two audiences:

- Patrol officers who view their shift, own reports, correction reasons, and resubmit returned reports.
- Manager/Ghost users who review patrol reports, filter the queue, and execute review transitions.

The dashboard must remain operational and information-dense. It should share the landing/login palette and typography without becoming a marketing-style page.

## Backend Contract Rules

- Use server actions for all backend calls.
- Use `AppApi` and the `token` cookie; do not call the backend directly from components.
- Treat backend permissions, ownership, scope, active shifts, and transitions as authoritative.
- Normalize missing `review_status` to `submitted`.
- Keep `sync_status` and `review_status` separate everywhere in the UI.
- Use only supported manager filters: `reviewStatus`, `syncStatus`, and `userId`.
- Do not invent daily trends, active-officer metrics, upload endpoints, or assignment scope.
- Use bounded list projections and deeper detail projections.
- Convert GeoJSON `[longitude, latitude]` to Leaflet `[latitude, longitude]` explicitly.

## Frontend Architecture

### Domain and API

Add:

```text
src/types/patrol.ts
src/utils/patrol-status.ts
src/utils/api-response.ts
src/services/patrol-projections.ts
src/services/announcements.ts
src/services/patrol-attachments.ts
```

Add typed server actions:

```text
src/app/actions/accident/getReporterDashboard.ts
src/app/actions/accident/getManagerDashboard.ts
src/app/actions/accident/getManagerReports.ts
src/app/actions/accident/reviewReport.ts
src/app/actions/accident/resubmitReport.ts
src/app/actions/accident_review/getReportReviewHistory.ts
```

Update `src/types/auth.ts` and `src/context/AuthContext.tsx` for `Patrol` and `patrol_permissions`.

### Routes

Reporter:

```text
/patrol/dashboard
/patrol/reports
/patrol/reports/[id]
```

Manager:

```text
/patrol-manager/dashboard
/patrol-manager/reports
/patrol-manager/reports/[id]
```

Use a dedicated role-aware workspace shell so the public navbar/footer does not dominate the operational dashboard.

### Shared Components

Add under `src/components/patrol/`:

- Workspace shell and navigation.
- Role guards and unauthorized states.
- Summary metrics and status badges.
- Shared report list and responsive report cards.
- Shared report detail sections.
- Review-history timeline.
- Manager review controls and return dialog.
- Reporter resubmission control.
- Leaflet location adapter.
- Attachment adapter.
- Loading, empty, error, and retry states.

The report detail component must accept a role/mode and receive role-specific controls from the route.

## Visual System

- `slate-950` page background.
- `slate-900` translucent surfaces.
- `border-white/10` and restrained backdrop blur.
- Blue/cyan accents from the landing and login pages.
- Vazirmatn and RTL-first layout.
- Compact `rounded-xl` or smaller surfaces.
- Status colors with clear semantic meaning.
- Subtle grid/glow background treatment only where it does not reduce readability.
- Dense desktop tables and stacked mobile cards.
- Icon buttons with accessible labels/tooltips.
- No purple-dominant admin styling and no oversized hero section.

## Data and Interaction Flow

### Reporter Dashboard

Show officer identity, personnel code, active shift or explicit unavailable state, patrol unit, vehicle, sync counts, review counts, returned reports, recent reports, and announcements through an isolated adapter.

### Manager Dashboard

Show counts derived from sync/review summary maps and recent reports. Do not render unsupported trend or active-officer cards.

### Manager Queue

Render report identity, reporter, personnel code, patrol unit, vehicle, report time, sync/review badges, last review time, detail action, and only the three supported filters.

### Report Detail

Show identity, separate statuses, patrol context, incident location, GPS location/accuracy, linear reference, classification, police/croquis data, vehicle/person/facility sections, attachments, and review history.

### Review Actions

- `submitted`: start review.
- `under_review`: return or approve.
- `approved`: complete.
- `returned` and `completed`: manager read-only.

The return dialog requires a non-empty reason. Never optimistically change status. Refresh detail, history, summary, and list after successful actions and refresh after rejected transitions.

### Reporter Resubmission

Allow resubmission only when the report is returned and synced. Refresh detail, history, summary, and list after success.

## Error and Loading Behavior

Support initial skeletons, empty states, retryable errors, manual refresh, preserved filters, unauthorized role states, invalid transition refreshes, missing active shift, missing values, unavailable attachments, and expired-session redirects.

Never expose raw framework or database errors to users.

## Verification

Add or establish frontend test coverage for role boundaries, status normalization, separate badges, valid review actions, required return reasons, action refresh behavior, failed transitions, resubmission, unsupported filter exclusion, loading/empty/error states, and GeoJSON coordinate conversion.

Run type checking and linting after implementation. Do not start a development server or run a production build without explicit instruction.

## Implementation Order

1. Add the plan and confirm generated contracts.
2. Add auth/domain types and normalizers.
3. Add server actions and projections.
4. Add workspace shell and role guards.
5. Add shared status, list, detail, map, history, and action components.
6. Build reporter routes.
7. Build manager routes.
8. Add refresh/error behavior and adapters.
9. Add focused tests.
10. Run type/lint verification.
