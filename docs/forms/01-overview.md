# 01 — Overview and Architecture

## The problem this solves

Before the form engine, the only definition-driven form in LESEN was
`accident_process`. It could express one thing well: a wizard of choice
questions whose answers come from one of **ten hardcoded lookup models**
(`back/src/accident_process/questionRegistry.ts`).

That ceiling produced three concrete limitations:

1. **No field types.** No text, number, date, file, map, or composite inputs.
   Only "pick some ids from `collision_type`".
2. **No conditions.** A question's only logic was `required: boolean`, and that
   flag was never enforced on the server — only in the mobile client.
3. **No grouping.** No repeatable rows, so no vehicles list, no passengers per
   vehicle.

When QA supplied a realistic reference form
(`qa_docs/QA_AR/Accident_Report_App.html`, 739 lines), the gap was stark. That
prototype needs, among other things:

- `plateType` selecting one of **four completely different** sub-forms
- `hasDamage === 'بله'` revealing an entire damage section
- `emergency` answers changing the available support services
- `vehicles[] → driver + passengers[]` — nested repeatables
- `errors()` that block and `warnings()` that do not

None of that fits the old shape. So the engine was built.

## What the engine is

A **single, dependency-free TypeScript package** that owns the meaning of a form
definition:

```
shared/form-engine/
├── src/
│   ├── types.ts       # the definition schema (types only, no runtime)
│   ├── paths.ts       # address answers: "vehicles[].passengers[].health"
│   ├── rules.ts       # evalRule — the evaluator
│   ├── traverse.ts    # walkNodes — tree walking with row scope
│   ├── conditions.ts  # visibility, requiredness, option narrowing
│   ├── validate.ts    # two-tier validation: errors and warnings
│   ├── cascade.ts     # clearOnChange — dependent-answer cleanup
│   ├── bindings.ts    # project answers onto typed accident fields
│   ├── snapshot.ts    # flatten answers into dynamic_answers rows
│   └── icons.ts       # the shared 80-name Phosphor vocabulary (data, not components)
└── test/              # 140 tests
```

Nothing in that package imports React, Deno, or Expo. It is pure functions over
plain objects.

## Why one shared package

The mobile app must decide what is visible, what is required, and what is valid
**while the device has no network**. The backend re-decides the same questions
when the report arrives. If those two implementations ever disagreed, an officer
could fill in a form that the server then rejects — or worse, file one it should
have blocked.

So the evaluator is written once and consumed three times:

| Consumer | How it uses the engine |
| -------- | ----------------------- |
| `back/` | `validateForm` at submit time — authoritative |
| `mobile/` | `validateForm` offline — guides the officer, same answers |
| `front/` | `validateForm` in the builder's live preview — WYSIWYG |

This is a correctness requirement, not a DRY convenience. It is stated in
`mobile/AGENTS.md`: *"Validation and transitions belong in testable domain
logic."*

Import it as `@forms`:

```ts
import { validateForm, visiblePages, evalRule } from "@forms";
```

## Data flow

```
        form_definition (MongoDB)
                 │
                 │ getForPatrol  ── resolves `reference` option lists
                 │                ── strips allowedIds whitelists
                 ▼
        ┌──────────────────┐
        │  mobile renderer │  ← offline-capable
        │  walkNodes       │
        │  isNodeVisible   │
        │  validateForm    │
        └────────┬─────────┘
                 │ answers (nested tree, as submitted)
                 ▼
        ┌──────────────────┐
        │  backend         │  ← authoritative
        │  validateForm    │  same function, same definition version
        │  buildBindings   │  → typed fields on the target model
        └────────┬─────────┘
                 ▼
        accident (typed relations + DTOs) → existing charts/analytics
      or incident_report (its own relations) → the report review lifecycle
```

Which model receives the projection is decided by the form's `form_kind`, not by
what the payload happens to contain. The two models declare different relations,
so an accident payload sent to the report act is rejected outright.

## Answers and bindings

Answers are stored as a nested tree matching the definition:

```jsonc
{
  "severity": "جرحی",
  "vehicles": [
    { "vehicleType": "سواری", "passengers": [{ "health": "مصدوم" }] }
  ]
}
```

That tree is authoritative **for the form**. Separately, any field may declare a
`binding` that projects its value into a real typed field on the target model:

```jsonc
{ "key": "severity", "binding": { "kind": "relation", "path": "type" } }
```

This is why the existing analytics and chart acts keep working unchanged:
`severity` lands on `accident.type`, `collision` on `accident.collision_type`, and
the charts read what they always read. The generic tree is new; the typed
projection is not.

A binding is only checked at **activation**, and it must name something that
really exists: a relation the target model declares (derived from Lesan's live
schemas, not a hand-written list) or a real field of a real DTO. A `relation` or
`dto` binding is also only legal on a `reference` field — a literal choice cannot
satisfy an ObjectId relation. Catching this when the form is published is what
keeps an officer from discovering a broken form after filling it in at the
roadside.

Answers that bind to nothing still survive: `form_answers` keeps the whole tree
verbatim and `dynamic_answers` mirrors it flat, so a report is never reduced to
what happened to be queryable.

## Design decisions worth knowing

**Declarative rules, not expressions.** Conditions are a JSON tree
(`{op: "and", rules: [...]}`) rather than strings like `severity == 'fatal' && …`.
No `eval`, no parser to secure, no injection surface, and the builder can render
the tree back to the author as a Persian sentence. Aggregate operators
(`anyIn`, `everyIn`, `count`, `someTrue`, `someFalse`) cover the cross-item
checks that would otherwise have forced an expression language.

**Arbitrary nesting.** `RepeatableNode` contains `ContentNode[]`, and a
`RepeatableNode` may contain another `RepeatableNode`. That is what expresses
`vehicles → driver + passengers[]` without a bespoke schema per shape.

**Two severities, always.** The QA prototype distinguishes `errors()` (block
progress) from `warnings()` (advisory). So does the engine:
`validateForm` returns `{ errors, warnings, blockedPages }`. A warning never
blocks — "crane needed but crane not requested" should prompt a second look, not
stop an officer filing at the roadside.

**Hidden means irrelevant.** An invisible node is never required and never
invalid. This is the classic conditional-form trap: a hidden question that is
still marked required locks the officer out of the form forever.

**Never throws.** A malformed rule evaluates to `false`. A bad definition must
not be able to crash a patrol officer's field screen.

## What changed in the codebase

| Area | Change |
| ---- | ------ |
| **New** | `shared/form-engine/` — the engine and its 127 tests |
| **New** | `back/models/form_definition.ts` — `form_definition`, `form_response` |
| **New** | `back/src/form_definition/` — 11 acts + structural validator |
| **New** | `front/src/components/org/forms/` — builder, palette, rule editor, preview |
| **New** | `front/src/app/actions/form_definition/` — 11 server actions |
| **New** | `mobile/src/domain/form-state.ts`, `mobile/src/components/form/`, `mobile/src/app/incident/form.tsx` |
| **New** | `mobile/metro.config.js` — required so `@forms` resolves in the RN bundle |
| **Changed** | `MODULE_KEYS` gains `forms`; `form_definition.*` is gated by it |
| **Changed** | `front/src/types/auth.ts`, `front/src/utils/org.ts` — the new module key |
| **Changed** | `mobile/tsconfig.json`, `front/tsconfig.json` — `@forms` alias |
| **Regenerated** | `back/declarations/selectInp.ts` and its frontend copy |

Nothing was removed. `accident_process` still works, and the legacy mobile
screens are untouched.

## Verification

| Suite | Result |
| ----- | ------ |
| `shared/form-engine` (`deno test`) | 127 passed |
| `back` — 6 test files | 91 passed |
| `mobile` (`vitest run`) | 204 passed (was 135) |
| `front` (`tsc --noEmit`) | clean |
| `mobile` (`tsc --noEmit`) | clean |
| `.workbuddy-ai/tools/audit-frontend-actions.py` | OK — 341 actions resolve |
| `.workbuddy-ai/tools/audit-module-acts.py` | OK — 38 patterns resolve |

## Next

- **[02 Definition Schema](./02-definition-schema.md)** — every node and field type
- **[03 Rules and Conditional Logic](./03-rules-and-conditions.md)** — the rule language
- **[08 Migration and Status](./08-migration-and-status.md)** — what is *not* done yet
