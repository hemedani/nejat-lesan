# 06 — Mobile and Offline Behaviour

The patrol app is offline-first, and the form engine is built around that. This
document covers what the officer experiences and the invariants the code
maintains.

## The invariants that shape everything

From `mobile/AGENTS.md`:

1. "**Offline mode must never disable incident creation, draft editing, GPS,
   media capture, or local queueing.**"
2. "Avoid embedding operational rules only in visual components. **Validation and
   transitions belong in testable domain logic.**"
3. "**Do not silently discard fields that are not currently rendered.** Preserve
   unknown or future-compatible draft data where practical."
4. "Do not duplicate backend schemas casually… derive client types from them or
   document the deliberate mobile projection."

Consequence: **every visibility, requiredness and validation decision is made on
the device**, by the same functions the server uses.

## Files

```
mobile/src/api/form-definition.ts              fetchPatrolForm(s), validateFormAnswers
mobile/src/api/incident-report.ts              submit/update/resubmit a report
mobile/src/domain/form-state.ts                transitions, persistence, page gating
mobile/src/domain/form-state.test.ts           30 tests
mobile/src/domain/form-picker.ts               3 inline + overflow, accidents first
mobile/src/domain/form-routing.ts              which screen files the report
mobile/src/domain/default-accident-form.ts      the app's own accident form
shared/form-engine/src/qa-accident-form.ts   the QA form as a definition (its home)
mobile/src/domain/qa-accident-form.ts           re-export shim to that one artifact
mobile/src/domain/qa-accident-form.test.ts      35 acceptance tests
mobile/src/domain/accident-mapper.ts            buildAccidentAddSet / buildIncidentReportAddSet
mobile/src/services/sync-worker.ts             picks model + mapper per report kind
mobile/src/app/incident/index.tsx              the form picker entry screen
mobile/src/app/incident/form.tsx               the screen
mobile/src/components/form/form-node.tsx       field/repeatable/group renderer
mobile/src/components/form/form-icon.tsx       Phosphor icons from the shared names
mobile/src/constants/form-icon-map.ts          the explicit 80-name native map
```

`form-state.ts` imports no React and no native modules, so it unit-tests in the
`node` Vitest environment. That is required by invariant 2.

## The entry screen is a picker

`/incident` shows the organization's active forms, not a fixed list of incident
types — an organization can author as many report forms as it needs. `buildFormPicker`
sorts accidents first, then report forms by title, and lists **all** of them: the
form list is the officer's incident-type menu, so hiding one behind a second tap
would hide the type they came for.

The screen has two modes, and `buildFormPicker` returns which one applies:

- **`forms`** — the organization has authored at least one active **report** form,
  which together with the bundled accident default covers every incident type. Its
  forms *are* the types, so the built-in «نوع واقعه» tiles and the «ادامه ثبت …»
  button are hidden. Showing both would ask the same question twice, and the tiles
  cannot reach an authored form at all: tapping «خرابی راه» runs the standard flow,
  never the organization's own «خرابی سطح راه» form. The list is **not** filtered by
  the draft's current incident type — `form_kind` decides which model stores the
  report, and filtering by the type is what once showed one of an organization's four
  forms.
- **`types`** — it has authored none, **or only an accident form**. The built-in tiles
  and the standard flow behind them stay: without them a خرابی/مانع/سایر report would
  have no form to be filed with at all. This is also the offline state, where the form
  list cannot load and incident creation must never be blocked.

Until the backend answers, neither mode is known, so the chooser renders a skeleton
rather than the tiles — otherwise the tiles would flash and be replaced.

Each card draws the `icon` the organization's form declared, resolved from the
shared name through `form-icon.tsx`; a form that declared none falls back to a
generic glyph. The names are the same on web and mobile, so a form looks like itself
in the builder, in the console and in the field.

If the org has no active accident form, the app prepends its own
`DEFAULT_ACCIDENT_FORM`. Two consequences follow from that form having no backend
counterpart: its draft carries **no** `form_definition_id`, and it is fully
literal, so it renders and validates with no network at all. An officer is never
blocked because an administrator has not finished setup.

## The screen

`/incident/form?uuid=<draftUuid>` renders `visiblePages` as a stepper.

Five load states, each with a distinct UI:

| State | Meaning |
| ----- | ------- |
| `loading` | spinner |
| `empty` | org has published no form → **falls back to the built-in flow** |
| `unsupported` | `schema_version` newer than this build → falls back |
| `error` | translated backend error with a retry |
| `ready` | the form |

`empty` and `unsupported` are not failures. `empty` in particular is the normal
state for an org that has not authored an accident form yet. They deliberately
mirror how the legacy process wizard treated an unrenderable `dto` question: a
partly-correct form is worse than a known-good fallback, because the officer would
file a report with questions silently missing.

### Page gating

The officer can only leave a page whose **own** errors are clear:

```ts
canLeavePage(definition, answers, pageKey)
```

A missing answer three steps ahead is not this step's problem, and blocking on it
would strand the officer in a page they already filled correctly. On the final
page, `validateAll` decides whether the report can be submitted; if not, the stepper
jumps to the first blocked page.

## Answer-tree transitions

All in `form-state.ts`, all pure, all returning a new tree.

| Function | Purpose |
| -------- | ------- |
| `setAnswer` | set or clear a top-level answer |
| `toggleMultiAnswer` | add/remove one value from a multi-select |
| `setFieldAnswer` | set **and apply cascades** |
| `addRow` / `removeRow` | top-level repeatable rows, respecting `maxItems` |
| `addNestedRow` / `removeNestedRow` / `setNestedRowAnswer` | nested rows, by explicit index path |
| `mergeAnswers` | merge into a stored draft without dropping unknowns |

### Nested addressing

```ts
setNestedRowAnswer(answers, ['vehicles', 1, 'passengers'], 0, 'health', 'مصدوم')
```

The index is **explicit**: `['vehicles', 1, …]` means *vehicle 1*. An earlier
draft addressed the last row implicitly, so deleting a passenger from the second
vehicle silently edited the first.

### Clearing is deletion

Clearing a field **removes the key** rather than storing `undefined`. "Not
answered" and "answered empty" are different to the engine's `exists` / `empty`
rules, and collapsing them would change the meaning of a condition.

### Cascades

```ts
setFieldAnswer(definition, answers, 'vehicles[0].plateType', 'موتورسیکلت')
```

The instance path matters. Seeding the value through a plain top-level write
would create a property literally named `"vehicles[0].plateType"`; the write is
delegated to the engine's cascade pass so it lands at the right address.

Cascade targets are relative to the changed field's own row, so a `clearOnChange`
inside a vehicle affects that vehicle only.

## Draft persistence

Answers live on the existing `drafts` row as JSON, reusing the app's current
shape rather than adding a parallel store.

```ts
saveDraftFormData(uuid, { form_answers: answers, form_page_index: pageIndex })
```

Autosave triggers:

| Trigger | Mechanism |
| ------- | --------- |
| field change | 500 ms debounce |
| page change | same debounce (state includes `pageIndex`) |
| leaving / unmount | flush in the effect cleanup |

`flush()` also runs before submission.

### Merge, do not replace

```ts
mergeAnswers(stored, incoming)   // shallow merge both ways
```

Unknown keys in the stored draft survive. A draft written by a newer app build
is not damaged when an older build replays it. Corrupt or non-object JSON parses
to `{}` rather than throwing — a corrupt draft must not block incident creation.

### Key stability

Field **keys** address answers in the draft. Renaming a key orphans whatever the
officer already entered under it. Prefer adding a key and deprecating the old one
over renaming one in a published form.

## Rendering

`FormNode` renders one node and recurses.

- **Hidden nodes render nothing.** `isNodeVisible` runs first, using the row
  scope when inside a repeatable.
- **Options are narrowed live.** `resolveOptions` applies `optionsFilter` with
  the current answers, so a dependent field genuinely offers different choices.
- **`reference` options** come from the map the backend sent, filtered by
  `allowedIds`, then narrowed by any filter. Offline, that map is whatever was
  cached — and an empty list renders an explanatory line rather than a blank
  dropdown.
- **Composite plates** pick their variant by evaluating `plateVariants[].when` in
  the row scope, so each vehicle's plate reads its own `plateType`.
- **Persian digits** are normalised to ASCII before numeric comparison.
- **Touch targets** and RTL come from the existing `src/components/form-fields`
  and `src/components/ui` primitives, so the form matches the rest of the app.

## Server confirmation

`validateFormAnswers` re-checks a draft on the server. It is a **confirmation,
not the primary loop**: the device already validated with the same engine. It
exists because a stale or tampered client must not be able to file a report the
current definition forbids.

If the officer is offline, the local verdict stands and the report is queued.

## Submission

```
flush draft → requeueDraft(uuid) → syncWorker.run()
```

`requeueDraft` moves `draft → queued` and resets attempts. The sync worker applies
the existing transition ladder `draft → queued → syncing → synced | rejected`, with
bounded backoff and idempotency by `client_report_uuid`.

`formAnswersToDraftData` (`mobile/src/domain/form-submission.ts`) is what the
submit button writes before requeueing. It produces three things:

- **Typed `accident` fields** from the shared engine's `buildBindings`, which is
  why the charts work on form-filed reports.
- **`dynamic_answers`**, from `buildDynamicAnswers`
  (`shared/form-engine/src/snapshot.ts`): one row per unbound leaf, shaped to the
  declared `accident.dynamic_answers` schema and keyed by instance path, so
  `vehicles[1].plate` stays distinguishable from `vehicles[0].plate`. Reference
  answers keep the id joinable (`answer_id` / `answer_ids`) alongside the label.
- **Local provenance** — `form_answers`, `form_definition_id`, `form_version` —
  which stays on the device. `accident-mapper` forwards only keys the backend
  `accident` model declares, and these are deliberately not declared.

## Testing

`mobile/src/domain/form-state.test.ts` — 30 tests: visibility, requiredness,
cascades, nested addressing, minItems/maxItems, page gating, persistence,
corrupt-JSON tolerance, unknown-key preservation.

`mobile/src/domain/form-state.ts` is import-clean of native modules, which is why
it runs in the `node` Vitest environment at all. Domain files must stay that way.

## Known gaps

| Gap | Impact |
| --- | --- |
| `file` and `location` render a hint, not a control | media and GPS are captured on their existing dedicated screens; the definition field is a placeholder until wiring is done |
| Cross-group `select` options not populated | a `damage_vehicleId`-style field declares an empty literal list |
| Form definition not cached on-device | a form already opened cannot be *reopened* offline — the fetch fails and the officer falls through to the standard flow. Creation stays possible, which invariant 2 requires, but resuming the same form offline does not yet work |
| `AppState` background autosave absent | pre-existing gap, listed in `mobile/docs/TODO.md`; flush-on-unmount covers the common case |

See **[08 Migration and Status](./08-migration-and-status.md)**.
