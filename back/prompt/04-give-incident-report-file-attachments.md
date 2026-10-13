# Backend task: give `incident_report` the file attachments that `accident` already has

## Symptom

An officer files a **non-accident** incident from the mobile app — `road_breakdown`,
`road_obstacle` or `other` — attaches photos to the form's `file` fields, and
submits.

The bytes upload fine. `file.uploadFile` creates a valid `file` document with the
required `uploader` relation. Then the report is filed and the evidence is
**invisible**: it is not in any relation, not in any gallery, and not reachable
from the report at all. The officer sees their photos on the device and nothing
anywhere else.

Accidents do not have this problem. The same photos on an `incident_type:
accident` report appear correctly in the console's `AttachmentGallery`.

## Root cause

`accident` declares an `attachments` relation to `file`. `incident_report`
declares **no relation to `file` whatsoever**.

`back/models/accident.ts:755-762`:

```ts
	attachments: {
		schemaName: "file",
		type: "multiple" as RelationDataType,
		optional: true,
		excludes: ["createdAt", "updatedAt"],
		relatedRelations: {},
	},
```

`back/models/incident_report.ts:227-371` — `incident_report_relations` declares
`organization`, `officer`, `patrol_unit`, `vehicle`, `police_station`, `province`,
`city`, `road`, `traffic_zone`, `city_zone`, `position`, `incident_severity`,
`road_defect`, `equipment_damage`, `light_status`, `air_status`,
`road_surface_condition`, `road_situation`, `shoulder_status`, `reviewer`. No
`attachments`.

The write side matches. `accident` accepts and links the ids:

- `back/src/accident/accidentRelationSchema.ts` — `attachmentsIds: optional(array(objectIdValidation))`
- `back/src/accident/add/add.fn.ts:360-376` — writes `relations.attachments`
- `back/src/accident/update/update.fn.ts:219-286` — appends through `addRelation`

`incident_report` accepts no such key anywhere. Its relation table is
`back/src/incident_report/relations.ts`, and `attachmentsIds` is not in
`MULTI_RELATION_KEYS`; `back/src/incident_report/setSchema.ts` has no
`attachmentsIds` either.

So a file uploaded for a non-accident report stays a `file` document with only a
`uploader` — an orphan. `file.removeOrphans` will eventually delete the row, and
it only ever cleans bytes from `./uploads/accidents`, so a `file.uploadFile`
orphan also leaks its bytes on disk.

### Why this is not fixable from the mobile app alone

The mobile client is currently *prevented* from sending the key.
`mobile/src/domain/incident-type.ts:51-60` lists `attachmentsIds` in
`ACCIDENT_ONLY_DATA_KEYS`, with this reasoning in the file's own comment:

> `attachmentsIds` belongs here for the same reason: it is a relation on
> `accident` alone, `incident_report` declares none, and the report's `set`
> validator is strict — an extra key is a validation error, not an ignored field.

That comment is correct today and becomes wrong the moment this task lands.
Removing the key from that list is a **mobile** follow-up and must happen in the
same release — otherwise the guard is inverted and non-accident submissions start
failing validation.

### The routing the fix must respect

One mobile form submission becomes **either** an `accident` **or** an
`incident_report`. `mobile/src/services/sync-worker.ts:271` decides:

```ts
const isReport = incidentTypeOf(draft) !== 'accident';
```

and line 332-334 picks the mapper. `incident_type: 'accident'` (including an
absent value, which normalizes to accident) → `accident.add`; anything else →
`incident_report.add`. Both write acts must accept `attachmentsIds`, or a single
form definition will produce evidence on one path and orphan it on the other.

## What to change

### 1. `back/models/incident_report.ts`

Add to `incident_report_relations`, mirroring `accident` exactly:

```ts
	attachments: {
		schemaName: "file",
		type: "multiple" as RelationDataType,
		optional: true,
		excludes: ["createdAt", "updatedAt"],
		relatedRelations: {},
	},
```

**Then add `"attachments"` to `backend_owned_relations` (line 211).** This is
easy to miss and it matters:

```ts
const backend_owned_relations = new Set(["reviewer"]);
```

`incident_report_bindable_paths` (line 374-376) is `Object.keys(incident_report_relations)`
minus `backend_owned_relations`. Without this, `attachments` silently becomes
**bindable** — an organization could bind a form question to it, and the officer
would be asked to answer it. The app fills it from uploaded files; no form
question may write to it.

### 2. `back/src/incident_report/relations.ts`

One line in `MULTI_RELATION_KEYS`:

```ts
export const MULTI_RELATION_KEYS = {
	roadDefectsIds: "road_defects",
	equipmentDamagesIds: "equipment_damages",
	airStatusesIds: "air_statuses",
	roadSurfaceConditionsIds: "road_surface_conditions",
	attachmentsIds: "attachments",
} as const;
```

`RELATION_SET_KEYS` (derived) and `splitRelationIds` (which loops over
`MULTI_RELATION_KEYS`) then pick it up automatically. Both write acts already
route through the helper — `add.fn.ts:88` and `update.fn.ts:62` both destructure
`const { doc: body_, relations } = splitRelationIds(...)` — so neither needs its
own relation-building code. Confirm an absent `attachmentsIds` omits the
relation rather than writing an empty array; the helper already documents this
guarantee.

### 3. Naming trap — resolve it deliberately, do not let it drift

`accident` uses **`attachmentsIds`**. The table-driven design in
`relations.ts` documents that its key naming "follows the engine's
`relationSetKey`", and the engine derives that key from the *relation name*,
which here is already plural — so the mechanical derivation is
**`attachmentIds`**, not `attachmentsIds`.

`accident` has been the odd one out and has simply been matched. Pick one, and
say so in a comment in `relations.ts`. My recommendation: use `attachmentsIds`
for both, so the two write acts take an identical payload and a client cannot
get it right for one model and wrong for the other. If you choose `attachmentIds`
instead, note that `accident` is now inconsistent with `incident_report` and the
mobile mapper has to branch.

### 4. `back/src/incident_report/setSchema.ts`

Add to `multiRelationSchema`:

```ts
	attachmentsIds: optional(array(objectIdValidation)),
```

Both `add` and `update` spread `incident_report_set_schema`, so this one line
covers both acts. Their validators are strict — an undeclared key is a
validation error, not an ignored field.

### 5. `back/models/file.ts`

`file_relations` currently has `uploader` and `accident` only. Add the reverse
for `incident_report`:

```ts
	incident_report: {
		schemaName: "incident_report",
		type: "single" as RelationDataType,
		optional: true,
		excludes: incident_report_excludes,
		relatedRelations: {
			attachments: { type: "multiple", limit: 100, excludes: file_excludes,
				sort: { field: "_id", order: "asc" } },
		},
	},
```

Note the file's own precedent: the comment at `incident_report.ts:214-217` says
Lesan **forbids declaring the same reverse from two places**, which is why
`incident_report` declares its own `incident_reports` reverse on `officer` even
though `accident` already owns `accidents`. Read that comment before choosing a
key name.

`incident_report_excludes` is **not currently exported** from
`models/incident_report.ts` — you will need to export it (or inline the list) to
build this relation.

If declaring this reverse turns out to conflict, the fallback is to declare
`attachments` on `incident_report` with `relatedRelations: {}` — exactly what
`accident` does — and accept that `file` cannot navigate back to non-accident
reports. That is strictly worse for `file.removeOrphans`; prefer the full
relation if the framework allows it.

### 6. Regenerate and sync declarations

```bash
cp -rv back/declarations/selectInp.ts front/src/types/declarations/
```

`incident_report.*` select structs and the `file` relation must both change.

### 7. Frontend, so the evidence is actually visible

`front/src/app/actions/incident_report/getReportDetail.ts:130-138` projects the
accident shape. `front/src/components/patrol/ReportDetail.tsx:105-125` renders
`<AttachmentGallery>` **only inside the `isAccident` branch**, and
`AttachmentGallery.tsx:28-29` documents why: *"It is `accident`-only —
`incident_report` has no `attachments` relation, so the gallery renders nothing
for non-accident reports."*

- Add `attachments: { _id: 1, name: 1, type: 1, size: 1, path: 1, category: 1, sequence: 1 }`
  to the `incident_report` projection.
- Hoist `<AttachmentGallery>` out of the `isAccident` branch so both report kinds
  render it. `AttachmentGallery` itself needs no change — it already reads
  `file.path` and falls back to `accidents/<name>`.
- `front/src/types/report-detail.ts:111-129` — confirm `AttachmentDto` is
  reachable from the non-accident detail type.

### 8. Mobile follow-up — required in the same release

`mobile/src/domain/incident-type.ts` — remove `'attachmentsIds'` from
`ACCIDENT_ONLY_DATA_KEYS` and rewrite the comment, which currently states the
opposite. Then `mobile/src/domain/accident-mapper.ts` can send the key on both
paths; confirm the non-accident mapper's allowlist actually forwards it
(it currently strips it because of the list above).

## Verification

- `back/test/incident-types-test.ts` already covers the JSON/base64 path for a
  **non-accident** report — "upload an incident photo linked to a non-accident
  report" (lines 601-639). Extend it to cover the **multipart** path:
  `file.uploadFile` → `incident_report.add` with `attachmentsIds`, asserting the
  file appears in `incident_report.attachments` and carries `_id`, `name`,
  `type`, `size` and `path`.
- Cover `incident_report.update` too: adding a photo to a returned report must
  link it without clearing what is already attached. `accident.update`'s
  append-not-replace behaviour is the reference.
- Assert a `Patrol` user cannot attach to another officer's report. Note that
  `file.uploadAccidentImages` enforces this (`assertAccidentAccess`) but
  `file.uploadFile` has **no ownership check and no size or MIME validation at
  all** — a direct `file.uploadFile` + `attachmentsIds` path is only as safe as
  the validator you write. Decide whether `incident_report.add`/`update` should
  verify that each submitted id was uploaded by the current user, and if so where
  that check lives (`accident` does not do it today — this is a pre-existing
  gap, not one this task introduces; say so rather than silently inheriting it).
- Confirm the strict-validator behaviour: sending `attachmentsIds` to
  `incident_report.add` before this change must fail, and must pass after.
- Confirm an **empty** `attachmentsIds: []` is omitted rather than nulling the
  relation on update.
