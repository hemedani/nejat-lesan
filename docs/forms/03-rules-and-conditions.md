# 03 — Rules and Conditional Logic

This is the answer to *"link fields together — make the options for a subsequent
field change, or display entirely different fields based on a prior value"*.

A rule is a **JSON tree**, not a string. There is no `eval`, no expression parser
to secure, and no injection surface. The builder renders any rule back to the
author as a Persian sentence so a mis-authored condition is visible before it is
published.

Source: `shared/form-engine/src/rules.ts`, evaluated by `evalRule`.

## Anatomy

```ts
type Rule =
  | { op: "always" }
  | { op: "and"; rules: Rule[] }
  | { op: "or";  rules: Rule[] }
  | { op: "not"; rule: Rule }
  | { op: "eq" | "ne" | "in" | "nin" | "contains"
        | "gt" | "gte" | "lt" | "lte"
        | "exists" | "empty" | "filled";
      path: string; value?: unknown }
  | { op: "anyIn" | "everyIn" | "someTrue" | "someFalse";
      path: string; value?: unknown }
  | { op: "count"; path: string; gte?: number; lte?: number };
```

## Path addressing

`path` addresses the answer tree. Segments:

| Segment | Meaning |
| ------- | ------- |
| `key` | read that property |
| `key[]` | iterate every element of the array |
| `key[2]` | read one element by index |

`[]` nests, which is how a rule reaches into repeatable groups:

```
severity
vehicles[].type
vehicles[].driver.health
vehicles[].passengers[].health
pedestrians[].health
```

Inside a repeatable, rules are evaluated **per row**: a condition on `mobility`
reads that vehicle's mobility, not every vehicle's.

## Operator reference

### Structural

| Op | Meaning | Notes |
| -- | ------- | ----- |
| `always` | always true | the idiomatic "required" |
| `and` | all children true | empty `and` is **true** (vacuous) |
| `or` | any child true | empty `or` is **false** |
| `not` | negates its child | |

### Comparison

| Op | Meaning |
| -- | ------- |
| `eq` / `ne` | equal / not equal |
| `in` / `nin` | value is one of / none of a list |
| `contains` | array contains the value, or string contains it |
| `gt` `gte` `lt` `lte` | numeric; Persian digits are coerced |
| `exists` | the path resolves to something |
| `empty` | resolves, but the answer is blank |
| `filled` | resolves to a real answer |

**"Any match wins."** Over an iterated path, `eq` asks *"does any row match?"* —
which is what you want when writing `vehicles[].type == "کامیون"`.

### Cross-item aggregates

These are what make the QA form's advisory checks expressible without an
expression language.

| Op | True when |
| -- | --------- |
| `anyIn` | any value in the resolved set is one of `value` |
| `everyIn` | every value is one of `value` |
| `someTrue` | any value is `true` |
| `someFalse` | any value is `false` |
| `count` | the row count satisfies `gte` / `lte` |

### Empty-group semantics

These are deliberate, not oversights:

| Op | Empty group | Why |
| -- | ----------- | --- |
| `anyIn` | `false` | nothing matched a casualty |
| `everyIn` | `true` | nothing violated the constraint |
| `count` (gte 1) | `false` | no rows recorded |
| `count` (no bound) | `false` | a bound-less count asserts nothing |

## The four mechanisms, with recipes

### 1. Show or hide a field — `visibleWhen`

Cargo only matters for heavy vehicles:

```jsonc
{
  "key": "cargo",
  "label": "نوع بار",
  "visibleWhen": { "op": "in", "path": "vehicleType",
                   "value": ["کامیون", "تریلی", "تانکر حمل مواد خطرناک"] },
  "requiredWhen": { "op": "in", "path": "vehicleType",
                    "value": ["کامیون", "تریلی", "تانکر حمل مواد خطرناک"] }
}
```

### 2. Show an entirely different set of fields

Put each alternative in its own `group` and gate each group. This is the
"display entirely different fields based on a specific value selected in a prior
field" requirement:

```jsonc
{ "kind": "group", "key": "nationalPlate", "visibleWhen":
    { "op": "eq", "path": "plateType", "value": "ملی" },
  "children": [ /* 2 digits, letter, 3 digits, 2 digits */ ] },

{ "kind": "group", "key": "motorcyclePlate", "visibleWhen":
    { "op": "eq", "path": "plateType", "value": "موتورسیکلت" },
  "children": [ /* 3 digits, 5 digits */ ] }
```

### 3. Change the options of a later field — `optionsFilter`

`optionsFilter` is the piece that makes a subsequent field's *choices* depend on
an earlier answer:

```jsonc
{
  "key": "support",
  "options": { "kind": "literal", "items": [
    { "value": "اورژانس ۱۱۵", "label": "اورژانس ۱۱۵" },
    { "value": "آتش‌نشانی", "label": "آتش‌نشانی" },
    { "value": "جرثقیل",  "label": "جرثقیل" }
  ]},
  "optionsFilter": {
    "mode": "dynamic",
    "rule": { "op": "eq", "path": "hazmat", "value": "بله" },
    "values": ["آتش‌نشانی", "جرثقیل"]
  }
}
```

While `hazmat` is `بله` only those two are offered. A filter that matches
nothing yields an **empty list, not the full list** — a visible "no options" is
safer than a dropdown offering now-invalid choices.

| `mode` | Behaviour |
| ------ | --------- |
| `all` | no narrowing (default) |
| `static` | always restricted to `values` |
| `dynamic` | restricted to `values` only while `rule` holds |

### 4. Clear a dependent answer — `clearOnChange`

Switching plate type leaves a four-part national plate in a field that now
expects two digits. Declare the dependency and the engine drops it:

```jsonc
{
  "key": "plateType",
  "label": "نوع پلاک",
  "clearOnChange": ["plate_national", "plate_motorcycle", "plate_free"]
}
```

Cascades are **transitive** (a → b → c clears both) and **cycle-safe** (a
definition declaring a → b → a terminates instead of looping). Re-selecting the
value already chosen is a no-op, so tapping a chosen option does not wipe the
parts entered.

Paths are written **relative to the changed field's own row**, so a `clearOnChange`
inside a vehicle affects that vehicle, not every vehicle.

## Two tiers: errors and warnings

The QA prototype distinguishes `errors()` (block) from `warnings()` (advisory).
So does the engine.

**Errors** come from `requiredWhen` plus scalar limits:

```jsonc
{ "key": "severity", "requiredWhen": { "op": "always" } }
```

**Warnings** are declared per field and never block:

```jsonc
{
  "key": "severity",
  "validation": { "warnings": [{
    "rule": { "op": "and", "rules": [
      { "op": "eq", "path": "severity", "value": "خسارتی" },
      { "op": "or", "rules": [
        { "op": "anyIn", "path": "vehicles[].driver.health",      "value": ["مصدوم", "فوتی در صحنه"] },
        { "op": "anyIn", "path": "vehicles[].passengers[].health", "value": ["مصدوم", "فوتی در صحنه"] },
        { "op": "anyIn", "path": "pedestrians[].health",          "value": ["مصدوم", "فوتی در صحنه"] }
      ]}
    ]},
    "message": "شدت خسارتی با وجود مصدوم یا فوتی سازگار نیست."
  }]}
}
```

Read as Persian: *"severity is خسارتی **and** (a driver **or** a passenger **or** a
pedestrian is مصدوم/فوتی)"*. In the reference app this is a warning — the officer
files the report and is prompted to re-check. Here it is still a warning, never a
blocker.

A second warning, on `support`: a vehicle needs a crane that was not requested.

```jsonc
{ "op": "and", "rules": [
  { "op": "anyIn", "path": "vehicles[].mobility", "value": ["نیاز به جرثقیل"] },
  { "op": "not", "rule": { "op": "contains", "path": "support", "value": "جرثقیل" } }
]}
```

## Page gating

A page can be conditional, which is how a whole step disappears:

```jsonc
{ "key": "facilityDamage", "title": "آسیب تجهیزات راه", "order": 8,
  "visibleWhen": { "op": "eq", "path": "hasDamage", "value": "بله" },
  "sections": [ /* … */ ] }
```

> **Place the gating question on a page that is always visible.** Putting
> `hasDamage` on the page it gates makes answering it impossible — the page only
> appears once it is answered.

## Robustness guarantees

`evalRule` **never throws**. A malformed rule evaluates to `false`.

| Input | Result |
| ----- | ------ |
| unknown `op` | `false` |
| `and` with a missing child | `false` |
| `not` with a missing child | `true` |
| empty `path` | `false` |
| 40 levels of `not` | no stack overflow |

A bad definition degrades to a form with a condition that never fires — it
cannot crash the field app. The backend still rejects the bad rule at `activate`,
and the builder warns about paths that do not resolve, because a silently
never-firing condition is worse than an error: the author believes a field is
conditional and it is not.

## Gotchas

1. **A dangling path evaluates to `false`, not an error.** `unresolvedRulePaths`
   in `front/src/components/org/forms/rule-editor.ts` flags these for the author.
2. **`anyIn` over an empty group is `false`.** If you want "no vehicles recorded"
   as a condition, use `count` with `lte`, not `anyIn`.
3. **Rules inside a repeatable see the row.** `{ "op": "eq", "path": "type" }`
   inside a vehicle reads that vehicle's type.
4. **A hidden field is never required.** Requiredness is ignored when the node is
   invisible, so hiding a question can never lock the officer out.
5. **Reaching across siblings needs the full path.** From the root use
   `vehicles[].type`; inside a vehicle row, `type` is enough.

## Next

- **[04 Backend API](./04-backend-api.md)** — how the server validates and enforces
