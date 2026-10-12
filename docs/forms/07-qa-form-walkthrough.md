# 07 — QA Accident Form Walkthrough

The QA team's reference prototype is `qa_docs/QA_AR/Accident_Report_App.html`
(739 lines of hand-written JavaScript). It was reproduced **in full** as a
definition — and it still is, except where the client's arrangement has since
moved the form on:

```
shared/form-engine/src/qa-accident-form.ts        the definition itself
mobile/src/domain/qa-accident-form.ts              re-export shim to that file
mobile/src/domain/qa-accident-form.test.ts         48 acceptance tests
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
| 8-step wizard with a side rail | `pages[]` | 8 pages |
| `hasDamage === 'بله'` gate | `visibleWhen` on a repeatable | `damages` |
| `plateType` → 4 different sub-forms | `plateVariants` selected by rule | `plate_national`, `plate_motorcycle`, `plate_free`, temporary |
| heavy vehicle → cargo select | `visibleWhen` + `requiredWhen` | `cargo` |
| nested `vehicles[].passengers[]` | nested `RepeatableNode` | `vehicles → passengers` |
| `errors()` blocks, `warnings()` advise | `requiredWhen` vs `validation.warnings` | throughout |
| plate type clears plate parts | `clearOnChange` | `plateType` |
| at least one vehicle | `minItems: 1` | `vehicles` |
| tone-coded danger choices | `OptionItem.tone` | `severity`, `vehicleType`, `cargo` |
| driver attached to a vehicle | `maxItems: 1` nested repeatable | `vehicles → driver` |
| vehicle collision with one vehicle on file | `count` under `not` | `collision` |
| the accident happened just now | `defaultSource: "now"` | `date_of_accident`, `time_of_accident` |

Three prototype behaviours are **gone rather than mapped**, because what they
served is gone or was never general:

- `emergency → suggested support` — it fed a control centre that is not
  operational yet. With it went `traffic`, `emergency`, `emergencyNotes`,
  `support` and `supportNotes`, and the crane advisory that read `support`.
- the prototype's `reference` option lists — every list in this form is literal,
  so it renders with no network at all. A form the app ships as its offline
  fallback cannot wait on the server to know its own options.

## The eight pages

| # | Key | Title | Notes |
| - | --- | ----- | ----- |
| 1 | `location` | موقعیت واقعه | direction, lane (required), map pin (required) |
| 2 | `basics` | اطلاعات پایه | date and time (**default to now**), notes |
| 3 | `accidentDetails` | مشخصات تصادف | severity, collision |
| 4 | `environment` | شرایط محیطی | lighting, weather |
| 5 | `vehiclesPage` | وسایل نقلیه | the big repeatable |
| 6 | `people` | افراد | pedestrians |
| 7 | `facilityDamage` | آسیب تجهیزات راه | **always reachable** — `hasDamage` gates the list, not the page |
| 8 | `review` | بازبینی نهایی | final notes, attachments |

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

Two of the prototype's `warnings()` survive.

**Damage-only severity with a casualty on file:**

```jsonc
{ "op": "and", "rules": [
  { "op": "eq", "path": "severity", "value": "خسارتی" },
  { "op": "or", "rules": [
    { "op": "anyIn", "path": "vehicles[].passengers[].health", "value": ["مصدوم", "فوتی در صحنه"] },
    { "op": "anyIn", "path": "pedestrians[].health",           "value": ["مصدوم", "فوتی در صحنه"] },
    { "op": "anyIn", "path": "vehicles[].driver.presence",     "value": ["در صحنه فوت شده", "به بیمارستان منتقل شده"] }
  ]}
]}
```

This is the check that would have forced an expression language if `anyIn` did
not exist. It is three lines of JSON.

The driver is read from `driver_presence`, not from a health field, because the
form no longer asks for a driver's health — the two restated each other and could
disagree. `driver_presence` is the field that actually knows, and it is the only
person every vehicle always has, so leaving it out would have made the check
blind to a driver casualty. «متواری شده است» means the driver left, not that they
were hurt, and is deliberately excluded.

**A vehicle collision with only one vehicle on file** — scoped to the answer, not
to a row:

```jsonc
{ "op": "and", "rules": [
  { "op": "eq",   "path": "collision", "value": "برخورد با وسیله نقلیه" },
  { "op": "not", "rule": { "op": "count", "path": "vehicles", "gte": 2 } }
]}
```

«Fewer than two vehicles» is written as the negation of `gte: 2` because `count`
has no `lt`. This warning used to carry `count >= 2` **and** `not (count >= 2)` —
a contradiction, false for every possible answer, so it had never once been shown
however the report was filled in. See
[Design changes](#design-changes-made-while-encoding-it).

**Missing evidence** — the prototype flags vehicles and damages without photos.

## Starting values — «today» without a literal

`defaultValue` is a literal carried inside the definition. One definition is
written once and answered by every report ever filed against it, so it cannot say
"today". A field that should start at the current moment therefore names a
*source* instead:

```jsonc
{ "key": "date_of_accident", "type": "date", "defaultSource": "now" }
{ "key": "time_of_accident", "type": "time", "defaultSource": "now" }
```

`seedDefaultAnswers(definition, answers, now)` resolves it against the client
clock when the form is opened — `date` takes today's date, `time` the current
time, `datetime` both, in the same local-parts format the picker itself writes
(never `toISOString()`, which would shift the day for anyone east or west of
UTC). A non-temporal field ignores it rather than writing a timestamp into a text
box.

Seeding is additive and runs **last**: an answer restored from a draft always
wins, so an officer's own choice is never overwritten by a default. This is a
patrol officer at the roadside describing something that has just happened, so
the common case should not need a picker opened at all — but it is a default, not
a fact. See [02 Definition Schema](./02-definition-schema.md).

## Bindings — why the charts still work

One field projects onto a typed `accident` relation:

```jsonc
{ "key": "date_of_accident", "binding": { "kind": "pure", "path": "date_of_accident" } }
```

`severity`, `collision` and `lighting` are deliberately **not** bound. A
`relation` binding writes a record id, and these are literal choices whose answer
is the text «خسارتی» — binding them produced a payload the backend rejected
(`typeId: objectIdValidation`) and every submission failed. Their answers are
still stored, in `dynamic_answers`, and all 34 existing analytics and chart acts
keep reading the fields they always read.

## Design changes made while encoding it

Encoding the prototype surfaced two structural problems; a third turned up later.

**Drivers were a separate list.** The prototype keeps vehicles and drivers on
separate sheets keyed by index, which can drift out of step — a driver can end up
attached to the wrong vehicle, and the two lists have duplicate field keys, which
breaks any rule addressing them. The driver became a `maxItems: 1` nested
repeatable inside each vehicle. One row, one driver, no duplicate keys.

**The damage gate was circular.** `hasDamage` sat on the page it gates, which only
appears once `hasDamage === 'بله'` — making the question that gates it impossible
to answer. The page is now unconditional and the answer gates only the `damages`
list: «بله» reveals «افزودن آسیب» on the spot, «خیر» files the page with nothing
on it. `minItems: 1` on that list is what makes «بله» mean "record at least one";
no `requiredWhen` is needed, because an invisible node is never required and the
validator skips it outright.

**A warning that could never fire.** The vehicle-collision warning read
`count >= 2` *and* `not (count >= 2)`. Its own message states the intent
(«برای برخورد با وسیله نقلیه بیش از یک وسیله لازم است»), so the redundant half was
dropped and two tests now pin both directions.

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

48 tests covering: eight-page structure, unique keys, no unsupported field types,
nested repeatables, bindings, every conditional-visibility rule, every plate
switch, cargo gating, tone styling, every warning firing and clearing, cascade
clears, `minItems`, the starting values, and a complete report validating page by
page.

Any of these needing custom code to express would mean the engine is not general
enough — which is exactly why this file is a test and not seed data.

## Next

- **[08 Migration and Status](./08-migration-and-status.md)**
