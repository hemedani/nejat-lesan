# Dynamic incident forms — form kinds, icons, and correct Lesan relationships

**Date:** 2026-10-02
**Status:** approved, implementing
**Scope:** backend `form_definition` reshape, a new `incident_report` model, `accident`
cleanup, the web builder, and the patrol app.

---

## 1. Problem

`accident` is currently a polymorphic report: one collection holding accidents plus
three other categories via `incident_type` (`road_breakdown`, `road_obstacle`, `other`).
That is wrong for two reasons.

**Accident statistics are contaminated.** Four acts count or aggregate non-accident rows
as accidents with no filter at all:

| Act | File | Problem |
| --- | --- | --- |
| `user.dashboardStatistic` | `src/user/dashboardStatistic/dashboardStatistic.fn.ts:39` | bare `accident.countDocument({})`, shown as "total accidents" |
| `accident.count` | `src/accident/count/count.fn.ts:465` | `total` is `countDocument({ filter: {} })` |
| `accident.getCreatedAtPeriods` | `src/accident/getCreatedAtPeriods/getCreatedAtPeriods.fn.ts:11` | aggregation with **no `$match` stage** |
| `accident.mapAccidents` | `src/accident/maps/mapAccidents/mapAccidents.fn.ts:65` | unfiltered `$match`; non-accident rows appear as pins with `type: null` |

The 25 analytics/chart acts are already correct — they all filter through
`accidentOnlyFilter` (`utils/incidentTypeFilter.ts`). So the fix is a data-modelling
fix, not an analytics fix.

**The authoring model is too rigid.** `form_definition` keys on `incident_type`, so an
organization can have at most one form per category — exactly four, ever. Real
organizations want to author their own forms with their own titles, and the questions
either draw answers from an existing backend model or are entirely custom.

## 2. Decisions

These were settled with the product owner. They are the constraints the rest of this
document follows from.

| # | Decision |
| --- | --- |
| D1 | Two **form kinds**: `accident` and `incident_report`. `incident_type` is gone. |
| D2 | Exactly **one active accident form** per organization, enforced by a database index. |
| D3 | **Genuinely unbounded** non-accident forms per organization. |
| D4 | Non-accident reports go to a **new `incident_report` model**; accidents stay in `accident`. |
| D5 | The new model gets the **full patrol + review lifecycle** (15 acts). `nearbyAccidents` and `mapAccidents` stay accidents-only. |
| D6 | `incident_payload` and the `incident_severity` relation are removed from `accident`; they existed only for non-accidents. |
| D7 | `accident_process` is **restricted to accidents**. Forms take over the other three. |
| D8 | Forms, questions and answer options carry **icons**, rendered from **Phosphor** on both web and mobile, via a shared *name* registry. |
| D9 | A report is classified by **its form only** — `form_definition_id` plus title/icon snapshots. No separate category field. |
| D10 | Bound and custom questions may be **mixed** in one form. |
| D11 | When an organization has **no active form**, the mobile app renders a **bundled default accident form**. No backend seeding. |

### Deviations from the plan that preceded this document

- **`name` is not renamed to `title`.** The rename bought nothing functional and touched
  ~15 files across three services. `form_definition.name` stays authoritative and is
  snapshotted onto the report as `form_title`.
- **The default form ships in the app, not seeded in the database.** This also closes a
  documented gap: a form opened earlier could never be re-opened offline because the
  definition had to be refetched. A bundled definition is always available.

## 3. Two kinds of form

```
form_definition.form_kind = "accident"          ── exactly one active per org
form_definition.form_kind = "incident_report"   ── unbounded active per org
```

A form additionally carries `icon` and keeps its existing `status`
(`draft` → `active` → `archived`). `is_active` is deleted: it duplicated `status` and
having two sources of truth for "is this live" is how UIs disagree with the database.

### Indexes

```ts
// The singleton guarantee. A partial filter on form_kind excludes documents that
// lack the field entirely, so pre-existing rows cannot collide on a null key.
{ "organization._id": 1 }
  unique, partial { status: "active", form_kind: "accident" }

// Lookup for the mobile form list.
{ "organization._id": 1, form_kind: 1, status: 1 }   // non-unique
```

The old `{ organization._id, incident_type }` partial index is dropped with the field.

### Activation

`activate` keeps its archive-then-activate order, because activating first would trip the
singleton index. For `form_kind: "accident"` the archive step also clears an active form
whose `form_kind` is absent, so upgrading an organization cannot end up with two live
accident forms.

**Known durability gap.** There is no transaction (Mongo is standalone here), so a crash
between the archive write and the activate write leaves an organization with zero active
accident forms. This is handled on the read side rather than papered over:
`getForPatrol` returns `null`, and the app falls back to the bundled default form
(D11). An organization can therefore never be left unable to file a report — only
unable to use its own form.

A new `archive` act provides an explicit deactivate. It **refuses to archive the last
active accident form**, so the singleton can only be changed through `activate`.

## 4. Relationships to backend models — derived, never hand-listed

This is the part that was actually wrong, and it is the substance of D10.

### The bug

`binding.path` is a free-form string, validated **nowhere**. `activate` never inspects it;
`validate` never inspects it. Failures surface late and badly:

1. `mobile/src/domain/accident-mapper.ts` holds hardcoded `RELATION_KEYS` /
   `ARRAY_RELATION_KEYS` allow-lists. A binding the mapper does not recognise is
   **silently discarded** — the officer's answer vanishes with no error.
   (`areaUsagesIds` is already in this state: present in the backend schema, missing from
   the mobile list.)
2. `back/src/accident/accidentRelationSchema.ts` enumerates relation ids explicitly, and
   superstruct rejects unknown keys — so a typo fails **at report submission** with a
   confusing "unknown key" error.
3. `add.fn.ts` destructures 28 known relation ids; anything else silently falls into
   `restOfDoc` and is written as a *pure field* instead of a relation.

Separately, the reference-model allow-list has drifted: the backend permits 36 models
(`REFERENCE_MODEL_NAMES`) while the builder offers 20 (`REFERENCE_MODELS`). Sixteen
models are accepted server-side and invisible in the builder, with no CI check.

### The fix

Lesan v0.1.26 exposes `TSchemas = Record<string, IModel>` where each `IModel` carries
`mainRelations` with `{ schemaName, type: "single" | "multiple", optional }`.
`getSchemas` is already exported from `back/mod.ts:168`.

Two new acts derive everything from that registry:

- **`form_definition.getBindableRelations`** — input `{ formKind }`, returns the target
  model's real relations: `{ path, schemaName, multi, type }`, minus a small exclusion
  list for server-owned relations (`user`, `file`, and the reviewer/officer plumbing the
  backend fills itself). Persian `label` and Phosphor `icon` come from a frontend
  registry keyed by `schemaName`.
- **`form_definition.getReferenceModels`** — returns the permitted reference models with
  `hasRecords`, so the builder can warn "this model has no records yet" instead of
  letting an organization author a form that renders an empty dropdown.

Consequences:

- The builder gains a **binding editor**. None exists today — `binding` appears zero
  times in `front/src` outside generated declarations.
- `activate` validates every `binding.path` against the same derived list, so a bad path
  fails at publish rather than at 3 a.m. on an officer's submission.
- The builder's reference dropdown is fed by the backend, which retires the 16-model drift.
- `air_status` — the de-facto weather model, and what the product owner meant by
  "weather" — **is not seeded**, which makes `checkReferenceModels` block `activate` on
  any weather question. It and `light_status` are seeded by this work.

## 5. Where an answer is stored

Both halves are required, and it is a hybrid rather than a choice.

1. **A question bound to a backend model** produces a **real Lesan relation** on the
   target model, written through `addRelation`. Fully aggregatable — this is what keeps
   charts working and is the reason the models were split in the first place.
   Relations are declared one-directionally per `back/AGENTS.md`, and each reverse key is
   new (`incident_reports`) because `accidents` is owned by `accident`.

2. **A fully custom question** produces an entry in a new
   `form_answers: optional(object({}))` field holding the officer's answer tree verbatim,
   so repeatables remain arrays and groups remain objects, losslessly. Flat
   `dynamic_answers` rows are written alongside it for querying.

It must be both: `back/AGENTS.md` forbids Lesan relations inside embedded arrays, so a
nested repeatable's answer cannot be a relation. Today this is genuinely broken —
`scalarText` in `shared/form-engine/src/snapshot.ts` **silently drops objects**, so a
custom nested answer is discarded without error. `form_answers` is intentionally an
untyped struct: its schema *is* the definition, which is dynamic by nature, so a fixed
struct cannot validate it.

## 6. Icons

`shared/form-engine` is types-only with no imports, so the shared contract is a **name**,
never a component. `@phosphor-icons/react` (web) and `@phosphor-icons/react-native`
(native) render the same set; each app maps names to components.

- **`shared/form-engine/src/icons.ts`** — `FORM_ICON_NAMES`, `FORM_ICON_GROUPS`
  (Persian groups for the picker), `FORM_ICON_LABELS`, `type FormIconName`.
- The schema already anticipates this: `FieldNode.icon`, `PageNode.icon` and
  `SectionNode.icon` exist in the engine types and the ODM struct, and `OptionItem.symbol`
  is specified in `docs/forms` in both languages. **No builder UI sets any of them**, the
  preview ignores them, the mobile `FormNode` renderer ignores them, and both reference
  resolvers hardcode `projection: { _id: 1, name: 1 }` so reference-sourced options cannot
  carry an icon at all.
- `activate` rejects unknown icon names, so a typo fails at publish.
- Mobile's chip plumbing for option icons (`ChipItem.icon`, `IdChips.iconFor`) already
  exists and is simply not used by the form renderer.

Phosphor is SVG-based on web, which sidesteps the frontend's `* { font-family: vazir-matn }`
unlayered rule plus its 17 `!important` overrides — an icon *font* would have been painful
there.

### Deferred

Giving *reference-sourced* options icons requires adding `icon` to `shared_relation_pure`.
That touches **52 hardcoded `update` validator files** (26 models × 2), 4 projection
sites, the shared `clientCommonModelDashboard` component, and the mobile reference
mapping. It is a separate phase; form-authored icons ship first.

## 7. The report models

### `accident` — accidents only

Removed: `incident_type`, `incident_payload`, the `incident_severity` relation
(`Models.md:354` documents it as the non-accident severity scale, and `back/AGENTS.md`
states accidents use `type`), the `incidentType` filters on `gets`/`getMyReports`/`count`,
and `incident_type` from `nearbyAccidents`' projection.

Deleted as dead weight: `utils/incidentTypeFilter.ts`, `charts/accidentScope.ts`, and the
25 import/spread lines. Once the field is gone, `incident_type: { $in: ["accident", null] }`
would be misleading noise on a field that no longer exists.

`report_id` gains a consequence: `serial` becomes two independent counters, so
`REP-2026-000001` and `BRK-2026-000001` can both exist. The prefix distinguishes them and
there is no unique index on `report_id`.

### `incident_report` — new

Incident core: identity and idempotency (`client_report_uuid` unique-sparse, `serial`,
`report_id` with `BRK`/`OBS`/`OTH` prefixes), sync and review lifecycle, `location`
(2dsphere) plus road context, officer/patrol_unit/vehicle/police_station,
`description`, `incident_severity`, `road_defects`, `equipment_damages`, and the form
columns.

Form provenance replaces any category field (D9):

```
form_definition_id   raw ObjectId — a Lesan relation would embed the whole definition
                     document into every report
form_title           immutable snapshot, survives the form being deleted
form_icon            immutable snapshot
form_version         re-render guard
form_answers         verbatim answer tree
```

No `organization` relation — parity with `accident`, which scopes via `officer` and
`getOrgReportBase`.

### Acts (15)

`add` `update` `get` `gets` `count` `remove` `getMyReports` `getSyncStatus` `reviewReport`
`reviewHistory` `resubmitReport` `getReporterDashboard` `getManagerDashboard`
`getManagerReports`

The review trio copies near-verbatim: it is 100% type-agnostic today, keyed only on
`sync_status`/`review_status`/`review_history`. `src/accident/reportScope.ts` is reused,
not duplicated. `add` requires `form_definition_id` and then verifies **server-side** that
the form is active, its `form_kind` matches, and its organization matches the officer's —
deriving `form_title`/`form_icon` itself and never trusting client values.

Module: `incident_patrol`.

## 8. Mobile

The four incident-type tiles are replaced by a **form picker**: active forms as cards with
Phosphor icons, the **first three inline and the rest behind a "بقیه فرم‌ها" button**. The
accident form is always present because it is a singleton. If an organization has zero
non-accident forms, one extra standard-flow entry routes to `/incident/simple`.

> **Superseded (2026-10-05).** The two shipped deviations from this paragraph were both
> bugs. The list is no longer split into "three inline + the rest behind a button": the
> picker is the officer's incident-type menu, so hiding a form behind a second tap hides
> the type they came for. It is also no longer filtered by the draft's `incident_type`,
> which showed one of an organization's four forms — `form_kind` decides the model, not
> the type. The tiles are now shown only when the organization's forms cannot stand in
> for them: no report form authored (so خرابی/مانع/سایر would have nothing to file
> with), or offline, where the list cannot load at all. Otherwise the forms replace them.
> See `docs/forms/06-mobile-and-offline.md` § *The entry screen is a picker*.

No new list act is needed — the org-scoped `form_definition.gets` returns the active forms
and `getForPatrol({ definitionId })` already fetches the chosen one.

Submission branches on `form_kind`. `form-submission.ts` writes bound keys, `form_answers`
and `dynamic_answers`. The draft's `incident_type` becomes `form_definition_id` +
`form_kind`. **No SQLite migration** — the drafts table is one untyped JSON blob keyed by
`client_report_uuid`.

The bundled default accident form (`mobile/src/domain/default-accident-form.ts`) renders
through the same dynamic renderer, binds to real `accident` relations so submissions still
populate typed fields, and is validated by the same engine tests as any other definition.

## 9. Sequencing

Producers before removals, so no report is ever un-submittable.

| Phase | Work |
| --- | --- |
| P1 | Shared icon registry |
| P2 | `form_definition` reshape, indexes, `archive`, `activate` guards |
| P3 | `getBindableRelations`, `getReferenceModels`, seed `air_status`/`light_status` |
| P4 | `incident_report` model + 15 acts (dark) |
| P5 | Mobile: bundled default form, form picker, submission branching, icons |
| P6 | Web builder: kind, icon picker, binding editor, reference models from backend |
| P7 | Web ops console: merge both sources, filter by form |
| P8 | `accident` cleanup, `accident_process` narrowed, declarations resync, docs |

P2 removes `incident_type` from `form_definition`, which the mobile form path currently
resolves by. Between P2 and P5 that path degrades to the standard flow; with zero
`form_definition` rows in any database this affects no data.

## 10. Data

The development database was inspected before writing this: **52,828 accidents, zero
non-accident rows, zero `form_definition` rows, one accident-typed `accident_process`.**
There is nothing to migrate. A guarded pre-flight query ships with the release anyway,
because the production database was not reachable from the development host.

## 11. Risks

| Risk | Mitigation |
| --- | --- |
| `@phosphor-icons/react-native` compatibility with RN 0.86 / Expo 57 is unverified | If it fails to install, map the same registry onto the existing `@expo/vector-icons`; only the adapter changes |
| Archive-then-activate is not atomic | Read-side fallback to the bundled default form; `archive` refuses to remove the last active accident form |
| `shared_relation_pure.icon` is a 52-file change | Deliberately deferred to its own phase |
| The bundled default form can drift from the org's own accident form | Same engine, same validation, same bindings; it is a fallback, not a parallel implementation |

## 12. Open questions

None outstanding. Three were raised and answered: no backend seeding (D11), mixing bound
and custom questions is allowed (D10), and no per-organization form limit (D3).
