# Dynamic Form Engine — Design Spec

**Date:** 2026-10-01
**Status:** Approved
**Scope:** `back/` (Deno + Lesan), `front/` (Next.js 15), `mobile/` (Expo 57), new `shared/form-engine/`

---

## 1. Problem

The QA team's reference form (`qa_docs/QA_AR/Accident_Report_App.html`, 739 lines) is a
9-section field accident report that must be displayed on a phone, filled in offline, and
submitted to the backend. It cannot be built with the current tooling:

- **Backend.** `accident_process` is the only definition-driven form. Every question must
  source its answers from one of **10 hardcoded models** (`back/src/accident_process/questionRegistry.ts`),
  so only relation-backed choice questions exist. There is no text, number, date, file,
  composite, map, or repeatable field type. Its only logic is `required: boolean`, which is
  never enforced server-side.
- **Frontend.** `ProcessBuilder` is a step/question editor with ↑/↓ reordering, a dropdown
  of those same 10 models, and checkboxes for allowed answers
  (`front/src/components/org/ProcessBuilder.tsx`). No field types, no palette, no drag
  and drop, no conditional logic, no generic renderer.
- **Mobile.** One schema-driven screen exists (`mobile/src/app/incident/process.tsx`) whose
  renderer is ~50 lines, and it **hard-fails to the legacy wizard** if any question targets a
  DTO (`mobile/src/domain/process-form.ts:85-92`). Everything else is hand-written JSX.
- **No expression evaluator exists anywhere.** Zero occurrences of `eval`, `new Function`,
  `visibility`, or `dependsOn` in the backend.

### What the QA form actually requires

Capabilities absent from all three services today:

| Capability | QA example |
| --- | --- |
| Field-shape switching | `plateType` → national / motorcycle / free-zone / temporary / no-plate, each a **different** sub-form (`Accident_Report_App.html:706`) |
| Visibility conditions | `hasDamage === 'بله'` reveals the damage list and its add button (line 700) |
| Conditional requiredness | `documents === 'بله'` requires driver attachments |
| Option-list recomputation | `emergency` selections drive **suggested** `support` services (`suggestions()`, line 689) |
| Nested repeatable groups | `vehicles[] → driver + passengers[]`; `damages[]` referencing `vehicles[]` |
| Cross-group references | `damage.vehicleId` options come from the `vehicles` group |
| Cascade clears | changing `plateType` empties the plate array (line 729) |
| Cascade side effects | deleting a vehicle clears `damage.vehicleId` (line 731) |
| Derived values | `calcSupport()` merges suggestions with user overrides (line 690) |
| Two-tier validation | `errors()` blocks Next; `warnings()` (line 716) does not |
| Composite input | Iranian plate: 2 digits / letter / 3 digits / 2 digits, one part a letter dropdown |
| Map + GPS | pin drop, GPS fix, satellite layer, accuracy, manual lat/lng |
| Offline drafts | IndexedDB autosave in the reference app; SQLite + sync queue on mobile |

---

## 2. Decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Engine scope | **General-purpose form engine** | "Forms of any level of complexity" was the explicit requirement. Extending the 10-model registry caps expressiveness permanently. |
| Condition language | **Declarative JSON rule tree** | No `eval`, no parser to secure, unit-testable, and renderable as a Persian sentence in the builder so org admins can author it. |
| Answer storage | **Generic `form_response` store + optional typed binding** | Arbitrary structure must be storable, but the 34 existing accident chart acts read typed `accident` fields. Bindings project into typed fields; the generic doc is authoritative for the form. |
| Migration | **Replace — migrate existing `accident_process` definitions** | Single system, no duplicated rendering logic. Rollout is gated behind `schema_version` on mobile. |
| Phase 1 deliverable | **Engine + builder + QA form end-to-end** | The QA form is the acceptance test; building the engine without it risks the wrong shape. |
| Evaluator sharing | **Single package at `shared/form-engine/`** | Mobile must produce identical visibility/validation offline as the backend does online. Drift here is a correctness bug. |

---

## 3. Architecture

```
                    shared/form-engine/     (pure TS, zero deps)
                    types · rules · visibility · requiredness
                    options · values · validate · paths · normalize
                            ▲        ▲        ▲
              imports via    │        │        │
       back/ ../../shared    │   front/@forms   mobile/@forms
                            │        │        │
              form_definition │  FormBuilder  DynamicFormRenderer
              form_response   │  FormRenderer  (offline-capable)
                            │        │        │
                            └────────┴────────┴── accident (typed binding)
```

One evaluator, three consumers. The backend runs it to **validate at submit time**; mobile
runs it to **render and validate offline**; the web builder runs it to **preview live** as an
org admin authors conditions.

### 3.1 Node kinds

```
FormDefinition
  pages: PageNode[]
PageNode        { key, title, description?, icon?, order, visibleWhen?, requiredWhen? }
  sections: SectionNode[]
SectionNode     { key, title, description?, order, visibleWhen?, requiredWhen? }
  nodes: ContentNode[]
ContentNode =
  | FieldNode        { key, type, label, ..., visibleWhen?, requiredWhen?, options?, optionsWhen?, binding?, clearOnChange? }
  | RepeatableNode   { key, minItems?, maxItems?, itemLabel?, visibleWhen?, requiredWhen?, children: ContentNode[] }
  | GroupNode        { key, visibleWhen?, children: ContentNode[] }
```

`RepeatableNode` nests arbitrarily — that is how `vehicles → driver + passengers[]` works.

### 3.2 Field types

| Type | Renders | Notes |
| --- | --- | --- |
| `text`, `textarea`, `number` | input | `number` supports min/max/step |
| `date`, `time`, `datetime` | picker | Jalali display, ISO storage |
| `select`, `multi_select` | dropdown / chips | options from literal list or `reference` |
| `boolean` | بله / خیر chips | |
| `choice_group` | tap-to-select row | supports severity styling (`danger`/`warn`) |
| `reference` | backend model lookup | replaces the 10-model registry; any `{_id,name}` model |
| `plate` | composite Iranian plate | per-part length + keypad mode; a part may be an enum |
| `file` | media list | image/video/pdf, per-item, offline-preserved |
| `location` | map + GPS | pin drop, GPS fix, satellite layer, accuracy, manual lat/lng |
| `computed` | read-only text | `valueFrom: Rule` |

### 3.3 Rule tree

```ts
type Rule =
  | { op: "and" | "or"; rules: Rule[] }
  | { op: "not"; rule: Rule }
  | { op: "eq" | "ne" | "in" | "nin" | "contains" | "gt" | "gte" | "lt" | "lte"
        | "exists" | "empty" | "filled"; path: string; value?: unknown }
  | { op: "anyIn" | "everyIn" | "someTrue" | "someFalse"; path: string; value?: unknown }
  | { op: "count"; path: string; gte?: number; lte?: number }
  | { op: "always" };
```

`path` addresses the answer tree with `[]` segments for iteration:

```
severity
vehicles[].type
vehicles[].driver.health
vehicles[].passengers[].health
pedestrians[].health
```

The QA form's hardest check — *"damage-only severity, but a casualty exists"* — is
declarative, with no code and no `eval`:

```json
{ "op": "and", "rules": [
  { "op": "eq", "path": "severity", "value": "خسارتی" },
  { "op": "or", "rules": [
    { "op": "anyIn", "path": "vehicles[].driver.health",     "value": ["مصدوم", "فوتی در صحنه"] },
    { "op": "anyIn", "path": "vehicles[].passengers[].health","value": ["مصدوم", "فوتی در صحنه"] },
    { "op": "anyIn", "path": "pedestrians[].health",         "value": ["مصدوم", "فوتی در صحنه"] }
  ]}
]}
```

Field-shape switching is `visibleWhen` on a sub-`GroupNode` whose children are the plate
parts for one `plateType`:

```json
{ "op": "eq", "path": "plateType", "value": "ملی" }
```

Option recomputation is `optionsWhen`, returning a filtered option list rather than a
boolean:

```json
{ "op": "in", "path": "category", "value": ["heavy", "special"] }
```

`anyIn`/`everyIn`/`count`/`someTrue`/`someFalse` are what make the QA form's cross-item
warnings expressible — the reason an expression language would otherwise have been needed.

### 3.4 Node rule slots

| Slot | Effect | QA mapping |
| --- | --- | --- |
| `visibleWhen` | show/hide the node | `hasDamage === 'بله'` |
| `requiredWhen` | conditional requiredness | `documents === 'بله'` requires files |
| `optionsWhen` | rewrite the option list | `emergency` → suggested `support` |
| `binding` | project into typed `accident` fields | severity → `typeId` |
| `clearOnChange` | cascade clear dependents | `plateType` clears plate parts |

### 3.5 Bindings

```ts
type Binding =
  | { kind: "relation"; path: string; multi?: boolean }   // → accident.<path>
  | { kind: "dto"; dto: string; field: string; from: string }  // → accident.<dto>[].<field>
  | { kind: "pure"; path: string }                       // → accident.<path>
  | { kind: "dynamic" };                                 // → form_response only
```

Bindings preserve today's `process_target_spec` semantics. Typed fields remain the source of
truth for charts and relation queries; the generic response document is the source of truth
for the form.

### 3.6 Two-tier validation

```ts
type ValidationResult = {
  errors:   Issue[];   // block page advance and submit
  warnings: Issue[];   // display, never block
};
type Issue = { path: string; nodeKey: string; message: string };
```

`warnings` is a field on a `FieldNode` and a node-level list. This reproduces the QA app's
`errors()` vs `warnings()` split exactly, and it matters: the QA form's cross-checks
("crane needed but crane not requested") are advisory, and blocking on them would be wrong.

---

## 4. Persistence

### 4.1 `form_definition` (new model)

Org-scoped, mirroring `accident_process`'s versioning and licensing.

```ts
form_definition_pure = {
  name: string(),
  description: optional(string()),
  status: defaulted(enums(["draft", "active", "archived"]), "draft"),
  version: defaulted(number(), 1),
  is_active: defaulted(boolean(), false),
  incident_type: optional(process_incident_type_emums),  // absent = all types
  schema_version: defaulted(number(), 1),
  definition: form_definition_struct,                    // recursive embedded
  ...createUpdateAt,
};
```

Relations: `organization` (single, required, reverse `form_definitions` limit 20),
`registrer` (single, optional).

Unique partial index on `{ "organization._id": 1, incident_type: 1 }` filtered
`status: "active"`.

### 4.2 `form_response` (new model)

```ts
form_response_pure = {
  form_definition_id: objectIdValidation,   // raw ref: survives definition deletion
  definition_version: number(),
  client_report_uuid: optional(string()),
  answers: form_answers_struct,             // the nested tree, as submitted
  flat_answers: array(object({              // field_key → value, for querying/reporting
    field_key: string(),
    node_key: string(),
    value: optional(string()),
    values: optional(array(string())),
  })),
  errors: defaulted(array(form_issue_struct), []),
  warnings: defaulted(array(form_issue_struct), []),
  ...createUpdateAt,
};
```

Relations: `form_definition` (single, optional — orphan resilience), `organization` (single,
required), `officer` (single, optional), `accident` (single, optional).

`form_response` is embedded on `accident` as `form_response_dtos[]` so a report and its
answers stay in one document for read consistency, while the standalone model serves
reporting queries. This follows the repo's existing `accident_review` → `review_history`
precedent.

### 4.3 Migration of `accident_process`

Each `accident_process` converts to a `form_definition` by mapping `steps[].questions[]` →
`FieldNode { type: "reference", options: { model: q.model_name, allowedIds: q.allowed_answer_ids } }`
with `binding: q.target` and `requiredWhen: q.required ? {op:"always"} : undefined`.
`version` carries over so mobile's `process_version` freshness check keeps working.

### 4.4 Licensing

Add `"forms"` to `MODULE_KEYS` (`back/src/app_modules/constants.ts`) and map
`form_definition.*` + `form_response.*` to it in `MODULE_PATTERNS`.

`back/AGENTS.md` documents that `moduleKeyFor` returns on the **first** matching key in
`MODULE_KEYS` order, so `forms` must be appended **after** `incident_patrol` —
otherwise the `accident_process` wildcard would shadow it. Actually, since
`accident_process` is retired in favour of `form_definition`, `forms` should be added and
the `accident_process` entry removed from `INCIDENT_SCHEMAS` in the same commit.

---

## 5. Backend acts

New schema `form_definition`, 10 acts mirroring `accident_process`:

| Act | Levels | Purpose |
| --- | --- | --- |
| `add` | Manager, OrgHead, UnitHead | create draft |
| `update` | Manager, OrgHead, UnitHead | wholesale definition replace (same as today) |
| `get` / `gets` / `count` | any authed | list & read |
| `remove` | Manager, OrgHead, UnitHead | delete |
| `activate` | Manager, OrgHead, UnitHead | validate + archive previous + bump `version` |
| `duplicate` | Manager, OrgHead, UnitHead | clone |
| `getForPatrol` | any authed | active definition + resolved `reference` options |
| `validate` | any authed | **server-side rule evaluation** — runs the shared evaluator |
| `getReferenceOptions` | any authed | option lists for a `reference` field |

`getForPatrol` resolves `reference` options server-side and **strips** `allowedIds` from the
response, matching the existing privacy behaviour at `getForPatrol.fn.ts:135-136`. Clients
cannot see the whitelist.

`validate` is the act that makes the backend authoritative: it runs the same shared
evaluator the client ran, so a tampered or stale client cannot submit a form that violates
its own definition.

### 5.1 Definition validation on `activate`

1. `pages.length > 0`
2. Every `key` unique across the whole definition
3. Every `optionsWhen`/`visibleWhen`/`requiredWhen`/`valueFrom` rule is well-formed
4. Every rule `path` root resolves to a known field key
5. Every `reference` field's `model` exists and has records (if `allowedIds` is empty)
6. Every `binding.path` maps to a real `accident` relation or pure field
7. `plate` parts sum to a known format for each applicable `plateType`

Errors are Persian, thrown via `throwError` from `@lib`, following
`validateProcessStructure` in `activate.fn.ts:24-90`.

---

## 6. Frontend

### 6.1 Builder — `front/src/components/org/forms/`

```
FormBuilder.tsx        page/section/field tree, drag-free reorder (↑/↓, matching ProcessBuilder)
FieldPalette.tsx       the 12 field types, click to add
FieldEditor.tsx        per-type property editor
RuleEditor.tsx         rule-tree builder rendered as "اگر … و … آنگاه"
ConditionSentence.tsx  readback of a rule tree in Persian (non-technical authors)
LivePreview.tsx        renders the definition with the real engine, live
```

No drag-and-drop library: `front/AGENTS.md` lists no DnD package and `ProcessBuilder`
already uses arrow-button reordering. Adding `@dnd-kit` is deliberately deferred (YAGNI).

### 6.2 Renderer — `front/src/components/forms/`

`DynamicFormRenderer.tsx` + one component per field type under `front/src/components/forms/fields/`.
Reuses existing atoms (`MyInput`, `SelectBox`, `MyAsyncMultiSelect`, `MyDateInput`) so
styling and RTL/Persian behaviour match the rest of the app.

### 6.3 Server actions — `front/src/app/actions/form/`

One file per act, `"use server"`, token from `cookies()`, `AppApi().send(...)`, envelope
returned untransformed. Verified by `.workbuddy-ai/tools/audit-frontend-actions.py`.

---

## 7. Mobile

### 7.1 Renderer

`mobile/src/app/incident/form.tsx` replaces `process.tsx`. Screens stay **thin** per
`mobile/AGENTS.md:34` — all logic lives in domain modules:

```
mobile/src/domain/form-engine.ts   re-exported shared engine + mobile-only helpers
mobile/src/domain/form-state.ts    answer tree state, pure transitions
mobile/src/domain/form-draft.ts    draft persistence, autosave, restore
mobile/src/components/form/        RN field components (one per type)
```

### 7.2 Offline-first invariants

- Draft state persists in `expo-sqlite` as `form_answers` JSON on the existing `drafts`
  row, plus the definition snapshot so a draft survives a definition change
- Media rows persist per `client_report_uuid`; upload happens on sync, exactly as today
- Definition is cached in `references_cache` under key `form_definition:<orgId>:<type>`
- `FormRenderer` works with no network: `reference` options come from the cache, falling
  back to the literal option list
- `mobile/AGENTS.md:46` — **never discard unknown fields**: `form-state.ts` shallow-merges
  on save so future-compatible answers survive

### 7.3 Routing

`mobile/src/app/incident/index.tsx` prefers an active `form_definition`; falls back to the
existing `/incident/details` and `/incident/simple` screens when none is published. The
`schema_version` on the cached definition gates the switch, so old app builds keep working.

---

## 8. Verification

| Layer | How |
| --- | --- |
| Shared engine | Deno test — rules, visibility, requiredness, options, validate, paths |
| Backend | `back/test/form-definition-test.ts` — activate validation, getForPatrol stripping, `validate` act agreement with client |
| Frontend | `.workbuddy-ai/tools/audit-frontend-actions.py`, `audit-module-acts.py`, `panel-routing-test.py` |
| Mobile | `pnpm test` (Vitest, `.ts` only) — `form-state.test.ts`, engine conformance |
| Cross-runtime parity | Same rule fixtures asserted in all three suites; any divergence fails CI |

Declaration sync: after backend model changes, regenerate
`back/declarations/selectInp.ts` and run
`cp -rv back/declarations/selectInp.ts front/src/types/declarations/` from the repo root.
Never hand-edit the declaration (`mobile/AGENTS.md:18`).

---

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Metro cannot resolve `shared/` — **confirmed: `mobile/` has no `metro.config.js`** | Add one with `watchFolders` + `extraNodeModules` before the first mobile task |
| Rule evaluator diverges across runtimes | Parity fixtures asserted in all three suites |
| Reference options offline | Definition snapshot + `references_cache`; literal fallback |
| Superstruct rejects undeclared keys, failing the whole report | `form_response` stores answers under **one** declared struct; typed projection happens server-side only |
| Large blast radius on migration | `schema_version` gate on mobile; `accident_process` data migrated, not dropped |