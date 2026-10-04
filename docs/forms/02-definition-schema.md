# 02 — Definition Schema Reference

A `FormDefinition` is a tree of **pages → sections → nodes**. The engine walks
it with `walkNodes` and renders it on mobile, previews it in the builder, and
validates it on the server.

Source of truth: `shared/form-engine/src/types.ts`.

## Top level

```ts
type FormDefinition = {
  schemaVersion: number;   // bump on incompatible shape changes
  name: string;
  pages: PageNode[];
};
```

`schemaVersion` matters for compatibility. A client that cannot understand the
version refuses to render the form and falls back to the built-in flow, rather
than showing a partly-correct form and letting an officer file a report with
missing questions. The current version is `1`.

## Containers

### PageNode

A wizard step. A page can be conditional — that is how "the damage step only
appears when damage is confirmed" is expressed.

```ts
type PageNode = {
  key: string;            // unique across the whole definition
  title: string;
  description?: string;
  icon?: string;
  order: number;
  sections: SectionNode[];
  visibleWhen?: Rule;     // whole page hidden when false
  requiredWhen?: Rule;    // page cannot be left empty
};
```

### SectionNode

A titled group of fields inside a page. Not user-visible as a step; it
organises the page.

```ts
type SectionNode = {
  key: string;
  title: string;
  description?: string;
  icon?: string;
  order: number;
  nodes: ContentNode[];
  visibleWhen?: Rule;
  requiredWhen?: Rule;
};
```

### GroupNode

A purely organisational container. It has no answer of its own and renders as a
labelled region. Useful for "display entirely different fields for a different
value": put each alternative in its own group and gate each group.

```ts
type GroupNode = {
  kind: "group";
  key: string;
  label?: string;
  order: number;
  children: ContentNode[];
  visibleWhen?: Rule;
  requiredWhen?: Rule;
};
```

### RepeatableNode

A list the officer adds rows to. **Repeatables nest**, which is what expresses
`vehicles[] → driver + passengers[]`.

```ts
type RepeatableNode = {
  kind: "repeatable";
  key: string;
  label: string;           // "وسیله نقلیه"
  description?: string;
  order: number;
  minItems?: number;       // e.g. 1 = at least one vehicle
  maxItems?: number;       // caps the officer's list
  itemLabel?: string;      // row heading, e.g. "وسیله"
  itemSummary?: string;    // collapsed-row summary line
  children: ContentNode[];
  visibleWhen?: Rule;
  requiredWhen?: Rule;
};
```

`minItems` is checked **once against the whole group**, not once per row — an
over-filled list must not report the same error repeatedly.

## FieldNode

```ts
type FieldNode = {
  kind: "field";
  key: string;             // unique; rules address fields by this
  type: FieldType;
  label: string;           // Persian text shown to the officer
  description?: string;
  placeholder?: string;
  optionalHint?: string;   // custom message when empty-but-required
  icon?: string;
  order: number;
  defaultValue?: AnswerValue;

  // Conditional behaviour — see doc 03
  visibleWhen?: Rule;
  requiredWhen?: Rule;
  options?: OptionSource;
  optionsFilter?: OptionsFilter;
  clearOnChange?: string[];

  validation?: Validation;
  valueFrom?: Rule;        // for type: "computed"
  plateVariants?: PlateVariant[];
  binding?: Binding;
};
```

### Field types

| Type | Renders | Notes |
| ---- | ------- | ----- |
| `text` | single-line input | |
| `textarea` | multi-line input | |
| `number` | numeric input | Persian digits normalised before comparison |
| `date` | date picker | stores ISO |
| `time` | time picker | |
| `datetime` | combined | |
| `select` | dropdown, one choice | needs `options` |
| `multi_select` | chips, many choices | needs `options` |
| `boolean` | بله / خیر chips | built-in options if omitted |
| `choice_group` | tap-to-select row | supports `tone` colouring |
| `reference` | backend model lookup | options come from the server, never typed by hand |
| `plate` | composite Iranian plate | see [Plate variants](#plate-variants) |
| `file` | media list | captured on the dedicated media screen |
| `location` | map + GPS | separate location screen |
| `computed` | read-only text | value from `valueFrom` |

### Options

Literal options are declared inline:

```ts
options: {
  kind: "literal",
  items: [
    { value: "حریق یا دود شدید", label: "حریق یا دود شدید", tone: "danger", symbol: "♨" },
    { value: "مصدوم", label: "مصدوم", tone: "warn" },
  ],
}
```

`tone` is `normal` | `warn` | `danger` and drives the chip colouring, which is
how the QA form highlights fire, explosion and full road closure.

A `reference` source pulls options from any Lesan model exposing `{_id, name}`:

```ts
options: { kind: "reference", model: "collision_type", allowedIds: [] }
```

`allowedIds` restricts the list to a subset. **This whitelist is stripped from
the patrol response** — clients cannot see which subset is in play; the narrowed
list they receive is the only view they get.

### Validation

```ts
validation: {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  message?: string;              // shown on failure
  warnings?: Array<{ rule: Rule; message: string }>;
};
```

`warnings` are the advisory checks. They never block.

## Bindings

A binding projects an answer onto a real typed field on the **target model** —
`accident` for a form of kind `accident`, `incident_report` for a report form — so
the existing charts keep working and reports stay queryable.

```ts
type Binding =
  | { kind: "relation"; path: string; multi?: boolean }
  | { kind: "dto"; dto: string; field: string; from: string }
  | { kind: "pure"; path: string }
  | { kind: "dynamic" };
```

| Kind | Target | Example |
| ---- | ------ | ------- |
| `relation` | a relation the target model declares | `{ kind: "relation", path: "type" }` |
| `dto` | a field inside an embedded DTO array | `{ kind: "dto", dto: "vehicle_dtos", field: "vehicle_type", from: "type" }` |
| `pure` | a top-level field of the target model | `{ kind: "pure", path: "date_of_accident" }` |
| `dynamic` | no typed target — form data only | `{ kind: "dynamic" }` |

The set key is derived the way `mobile/src/domain/process-form.ts` does it, so
existing mobile payloads are produced unchanged: `road_defects` + `multi` →
`roadDefectsIds`; `collision_type` → `collisionTypeId`.

### What a legal binding looks like

Two rules are enforced at **activation**, and both exist because violating them
produced a report that silently lost data:

1. **The target must exist.** A `relation` path must be a relation the target
   model declares; a `dto` field must be a real field of a real DTO. Both sets are
   derived from the live Lesan schemas on the server, so a hand-written list can
   never drift away from the models again.
2. **`relation` and `dto` bindings only work on a `reference` field.** A literal
   choice yields a string, not an ObjectId, so binding it to a relation cannot
   resolve. A `pure` or `dynamic` binding is fine on any field type.

A binding that breaks either rule makes `activate` refuse the definition with
«آیکون‌های نامعتبر…»-style Persian errors, and the form stays a draft. The builder
offers only what passes, so the common case cannot be authored wrong at all.

## Plate variants

An Iranian licence plate has different shapes per plate type. The definition
declares each shape and the engine selects by rule:

```ts
{
  key: "plate_national",
  type: "plate",
  visibleWhen: { op: "eq", path: "plateType", value: "ملی" },
  requiredWhen: { op: "eq", path: "plateType", value: "ملی" },
  plateVariants: [{
    when: { op: "eq", path: "plateType", value: "ملی" },
    parts: [
      { key: "a", label: "دو رقم", kind: "digits", length: 2, inputMode: "numeric" },
      { key: "b", label: "حرف",    kind: "select", items: [ /* ب, ج, د, … */ ] },
      { key: "c", label: "سه رقم", kind: "digits", length: 3, inputMode: "numeric" },
      { key: "d", label: "کد",     kind: "digits", length: 2, inputMode: "numeric" },
    ],
  }],
}
```

Part kinds: `digits` (fixed `length`, numeric keypad), `letters`, `text`,
`select` (from `items`). A variant must declare **at least one part** — a variant
with none would render an empty control.

## Rules on nodes

Three slots, covering everything the QA team asked for:

| Slot | Effect |
| ---- | ------ |
| `visibleWhen` | show/hide the node |
| `requiredWhen` | conditional requiredness |
| `optionsFilter` | narrow the option list based on other answers |

Plus `clearOnChange`, which lists fields to clear whenever this one changes.

## Storage shape

`form_definition.definition` holds the tree. The node struct is deliberately a
**loose envelope**, not a recursive superstruct:

- A self-referential `object()` recurses until the stack overflows — verified,
  not theoretical.
- So the envelope is validated by the model, and the *semantics* (unique keys,
  legal rule ops, resolvable reference models) are validated in `activate`,
  which produces Persian, actionable errors.

This also means a definition can gain new optional node fields without a
migration.

> **A trap worth knowing.** Use `optional()`, not `defaulted()`, on definition
> nodes. `defaulted` only fills defaults under `create()` (the `add` act's
> `validationRunType`), while `update` runs a plain `assert` — a defaulted field
> would validate on add and then fail on update with the identical document.

## Key rules

1. **Every `key` must be unique across the entire definition.** Rules address
   fields by key, so a duplicate silently breaks every condition that names it.
   The backend rejects duplicates at `activate`, and the builder warns.
2. **`order` controls sequence.** Equal orders preserve declaration order.
3. **Keys must be stable.** Mobile drafts are keyed by field key; renaming a key
   orphans the answers already entered under it.

## Next

- **[03 Rules and Conditional Logic](./03-rules-and-conditions.md)** — the rule language in full
