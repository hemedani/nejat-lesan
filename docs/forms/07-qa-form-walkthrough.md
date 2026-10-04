# 07 — QA Accident Form Walkthrough

The QA team's reference prototype is `qa_docs/QA_AR/Accident_Report_App.html`
(739 lines of hand-written JavaScript). It is reproduced **in full** as a
definition:

```
shared/form-engine/src/qa-accident-form.ts        the definition itself
mobile/src/domain/qa-accident-form.ts              re-export shim to that file
mobile/src/domain/qa-accident-form.test.ts         35 acceptance tests
```

The definition lives in the shared engine rather than in one app's source tree
because it is both the engine's acceptance test *and* the accident form the
backend activates for a demo organization, while mobile renders it. The mobile
path is now only a one-line re-export, so there is one artifact and not two.

This document maps each behaviour in the prototype to the mechanism that now
implements it. That table is the acceptance criterion: **every row is
declarative, with no application code behind it.** A behaviour that needed code
would mean the engine is not general enough, and the gap belongs in the engine —
not in a special-case definition.

## Side by side

| QA prototype | Mechanism | Where |
| ------------ | --------- | ----- |
| 9-step wizard with a side rail | `pages[]` | 9 pages |
| `hasDamage === 'بله'` gate | `visibleWhen` on a page | `facilityDamage` |
| `plateType` → 4 different sub-forms | `plateVariants` selected by rule | `plate_national`, `plate_motorcycle`, `plate_free`, temporary |
| heavy vehicle → cargo select | `visibleWhen` + `requiredWhen` | `cargo` |
| `emergency` → suggested support | `visibleWhen` + advisory warning | `support` |
| nested `vehicles[].passengers[]` | nested `RepeatableNode` | `vehicles → passengers` |
| `errors()` blocks, `warnings()` advise | `requiredWhen` vs `validation.warnings` | throughout |
| plate type clears plate parts | `clearOnChange` | `plateType` |
| at least one vehicle | `minItems: 1` | `vehicles` |
| tone-coded danger choices | `OptionItem.tone` | `emergency`, `traffic`, `cargo` |
| reference lists from the server | `options: { kind: "reference" }` | `lighting` → `light_status` |
| driver attached to a vehicle | `maxItems: 1` nested repeatable | `vehicles → driver` |
| vehicle needs crane, none requested | cross-item `validation.warnings` | `mobility` |

## The nine pages

| # | Key | Title | Notes |
| - | --- | ----- | ----- |
| 1 | `location` | موقعیت واقعه | direction, lane (required), map pin (required) |
| 2 | `basics` | اطلاعات پایه | date, time, notes |
| 3 | `emergencyActions` | اقدامات فوری | traffic, emergency, **and the damage gate**, support |
| 4 | `accidentDetails` | مشخصات تصادف | severity, collision — both bound to `accident` |
| 5 | `environment` | شرایط محیطی | lighting, weather |
| 6 | `vehiclesPage` | وسایل نقلیه | the big repeatable |
| 7 | `people` | افراد | pedestrians |
| 8 | `facilityDamage` | آسیب تجهیزات راه | **conditional page** |
| 9 | `review` | بازبینی نهایی | final notes, attachments |

## Plate switching — the hardest requirement

The prototype's `plateFields` switches between four completely different shapes
based on `plateType`. Here, each shape is its own field gated by a rule:

```
plate_national      ملی              → 2 digits / letter / 3 digits / 2 digits
plate_motorcycle    موتورسیکلت        → 3 digits / 5 digits
plate_free          منطقه آزاد         → region code / 5 digits
plate_temporary_*   گذر موقت / خاص     → identity / number
```

Switching the type clears the others, because the shapes are incompatible:

```jsonc
{
  "key": "plateType",
  "clearOnChange": ["plate_national", "plate_motorcycle", "plate_free"]
}
```

## Cargo only for heavy vehicles

The prototype's `heavy(v)` helper:

```ts
['وانت بار','مینی‌بوس','اتوبوس','کامیونت','کامیون','تریلی','تانکر حمل مواد خطرناک','خودروی آتش‌نشانی']
```

becomes one declarative rule:

```jsonc
{ "op": "in", "path": "vehicleType", "value": [ … ] }
```

with the same list on both `visibleWhen` and `requiredWhen`.

## Cross-item warnings

Three of the prototype's `warnings()` survive verbatim.

**Damage-only severity with a casualty on file:**

```jsonc
{ "op": "and", "rules": [
  { "op": "eq", "path": "severity", "value": "خسارتی" },
  { "op": "or", "rules": [
    { "op": "anyIn", "path": "vehicles[].driver.health",       "value": ["مصدوم", "فوتی در صحنه"] },
    { "op": "anyIn", "path": "vehicles[].passengers[].health", "value": ["مصدوم", "فوتی در صحنه"] },
    { "op": "anyIn", "path": "pedestrians[].health",           "value": ["مصدوم", "فوتی در صحنه"] }
  ]}
]}
```

This is the check that would have forced an expression language if `anyIn` did
not exist. It is three lines of JSON.

**A vehicle needs a crane that was not requested** — scoped to the vehicle row,
so vehicle 1's warning is not raised by vehicle 2's answer:

```jsonc
{ "op": "and", "rules": [
  { "op": "eq",   "path": "mobility", "value": "نیاز به جرثقیل" },
  { "op": "not", "rule": { "op": "contains", "path": "support", "value": "جرثقیل" } }
]}
```

**Missing evidence** — the prototype flags vehicles and damages without photos.

## Bindings — why the charts still work

Two fields project onto typed `accident` relations:

```jsonc
{ "key": "severity",  "binding": { "kind": "relation", "path": "type" } }
{ "key": "collision", "binding": { "kind": "relation", "path": "collision_type" } }
{ "key": "lighting",  "binding": { "kind": "relation", "path": "light_status" } }
{ "key": "date_of_accident", "binding": { "kind": "pure", "path": "date_of_accident" } }
```

All 34 existing analytics and chart acts keep reading the fields they always read.

## Design changes made while encoding it

Encoding the prototype surfaced two structural problems, both fixed:

**Drivers were a separate list.** The prototype keeps vehicles and drivers on
separate sheets keyed by index, which can drift out of step — a driver can end up
attached to the wrong vehicle, and the two lists have duplicate field keys, which
breaks any rule addressing them. The driver became a `maxItems: 1` nested
repeatable inside each vehicle. One row, one driver, no duplicate keys.

**The damage gate was circular.** `hasDamage` initially sat on the page it gates,
which only appears once `hasDamage === 'بله'` — making it impossible to answer.
It now lives on `emergencyActions`, which is always visible.

## Not yet reproduced

| Prototype behaviour | Status |
| -------------------- | ------ |
| Map pin, GPS fix, satellite layer, road snapping | `location` field is declared; capture happens on the existing dedicated screen, not yet wired to the form field |
| Photo/video/PDF attachments per row | `file` field is declared; media is captured on the existing media screen, not yet wired |
| Officer↔incident distance, GPS accuracy readouts | `computed` field type exists; these specific readouts are not yet declared |
| Kilometre/metre from the road axis | the prototype itself marks this as needing GIS data |

## Running the acceptance tests

```bash
cd mobile && npx vitest run src/domain/qa-accident-form.test.ts
```

35 tests covering: nine-page structure, unique keys, no unsupported field types,
nested repeatables, bindings, every conditional-visibility rule, every plate
switch, cargo gating, tone styling, every warning firing and clearing, cascade
clears, `minItems`, and a complete report validating page by page.

Any of these needing custom code to express would mean the engine is not general
enough — which is exactly why this file is a test and not seed data.

## Next

- **[08 Migration and Status](./08-migration-and-status.md)**
