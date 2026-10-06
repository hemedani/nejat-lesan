export const reportListProjection = {
  _id: 1, report_id: 1, serial: 1, reported_at: 1, date_of_accident: 1,
  sync_status: 1, rejection_reason: 1, review_status: 1, review_reason: 1,
  reviewed_at: 1, completed_at: 1, location: 1, kilometer: 1, meter: 1,
  travel_direction: 1, officer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
  patrol_unit: { _id: 1, code: 1, name: 1 }, vehicle: { _id: 1, plaque_no: 1 },
  type: { _id: 1, name: 1 }, collision_type: { _id: 1, name: 1 },
  incident_type: 1, incident_payload: 1,
  incident_severity: { _id: 1, name: 1 },
} as const;

/**
 * What `accident.resubmitReport` returns.
 *
 * Wide, because a resubmission is the officer's own correction flow: the response
 * is fed straight back into the detail page, which renders the whole report. Kept
 * here rather than folded into the detail page's own projections because those are
 * per-source and this act is `accident`-only.
 */
export const reportDetailProjection = {
  ...reportListProjection, gps_coords: 1, gps_accuracy: 1,
  reviewer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
  road: { _id: 1, name: 1, origin: 1, destination: 1 },
  police_station: { _id: 1, name: 1, code: 1 },
  croquis_type: { _id: 1, name: 1 }, police_present: 1, police_expert_name: 1,
  police_arrival_time: 1, officer_cause_description: 1, vehicle_dtos: 1,
  people_dtos: 1, pedestrian_dtos: 1, facility_damage_dtos: 1,
  // `attachments` is a relation to `file`, not an embedded array — a Lesan
  // relation's projection must be an object, and sending `1` for it is rejected at
  // runtime with `get.attachments -- Expected an object, but received: 1`.
  attachments: { _id: 1, name: 1, type: 1, size: 1, category: 1, sequence: 1 },
  lane: { _id: 1, name: 1 }, area_usages: { _id: 1, name: 1 },
  light_status: { _id: 1, name: 1 }, air_statuses: { _id: 1, name: 1 },
} as const;

/**
 * What a *write* returns: the updated document after a review transition.
 *
 * Used by `resubmitReport` and by the review actions, which need the new status
 * and reviewer rather than the whole report.
 *
 * `reportDetailProjection` below is **not** the detail page's projection any more —
 * that lives in `app/actions/incident_report/getReportDetail.ts`, one per source,
 * because `accident.get` and `incident_report.get` validate `get` against different
 * schemas and cannot share one.
 */
export const reviewProjection = {
  _id: 1, report_id: 1, review_status: 1, review_reason: 1, reviewed_at: 1,
  completed_at: 1, reviewer: { _id: 1, first_name: 1, last_name: 1, personnel_code: 1 },
} as const;
