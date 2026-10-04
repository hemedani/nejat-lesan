# 05 — Authoring Guide

How to build a form: either in the builder UI, or by writing a definition.

## The mental model

A definition is a tree of **pages → sections → nodes**. Three node kinds:

| Kind | Holds an answer? | Repeats? |
| ---- | ---------------- | -------- |
| `field` | yes | no |
| `group` | no | no |
| `repeatable` | no | yes, and nests |

Two questions answer most design decisions:

1. **Should this be a page?** A page is a wizard step the officer navigates to.
   Use one per distinct stage of the officer's work. If a section needs its own
   heading and its own "next", it is a page.
2. **Does the officer enter several of these?** If yes, it is a `repeatable`.
   If each instance carries its own sub-questions, the repeatable's `children`
   hold them — and one of those children may itself be a repeatable.

## Building in the UI

The builder lives at `/forms` (components in `front/src/components/org/forms/`).

```
FormBuilder.tsx     page/section/field tree, save, activate, duplicate
NodeTree.tsx        the tree + field palette + ↑/↓ reordering
FieldEditor.tsx     per-type property editor, conditions, cascades
RuleEditor.tsx      interactive rule builder with Persian readback
LivePreview.tsx     renders the definition with the real engine
form-types.ts       pure helpers: factories, immutability, inspection
rule-editor.ts      rule construction + describeRule (Persian)
```

### Workflow

1. **Add a page.** Each page starts with one section.
2. **Add fields** from the palette (15 types) or a **repeatable group** or a
   **simple group**.
3. **Reorder** with ↑/↓. Drag-and-drop is deliberately not used: `front/AGENTS.md`
   lists no drag library, `ProcessBuilder` already established arrow reordering,
   and adding `@dnd-kit` for one screen would be unjustified complexity.
4. **Select a node** to edit its properties: label, type, description, custom
   error message, options, conditions, cascades.
5. **Write conditions** in the three rule slots. Each shows a live Persian
   readback — *"معنی شرط: …"* — so you can confirm the machine understood you.
6. **Check the preview tab.** It runs the real engine, so what you see is what
   the officer gets.
7. **Save.** Then **Activate** to publish.

### The live preview is not a mock

`LivePreview` calls the same `isNodeVisible`, `resolveOptions` and `validateForm`
the mobile app calls. A separate preview implementation would drift from the
engine and quietly mislead, so there isn't one.

Answer a question in the preview and watch dependent fields appear and disappear.

### Activation is a gate

**Activate** runs the server-side structural validator and can refuse:

- a definition with no pages
- duplicate keys
- an unknown rule operator
- a path operator with no `path`
- a `reference` model that does not exist or has no records

Rejection leaves the definition a **draft**, with a Persian message explaining
what to fix.

An **active** definition is read-only. To change it, archive it or duplicate it —
this is deliberate: officers may be holding drafts built against the current
version.

> The builder is live at `/forms`, linked from the OrgHead and UnitHead sidebars
> under a «فرم‌ساز» section that shows only when the `forms` module is on for the
> organization. The organization comes from `user.roles[]`; Ghost and Manager hold
> no org role and pick one manually.

## Writing a definition by hand

Useful for tests, seeds, and version-controlled forms.

```ts
import type { FormDefinition } from '@forms';

export const myForm: FormDefinition = {
  schemaVersion: 1,
  name: 'فرم بازرسی',
  pages: [{
    key: 'intro',
    title: 'اطلاعات اولیه',
    order: 1,
    sections: [{
      key: 'introSection',
      title: 'عمومی',
      order: 1,
      nodes: [
        {
          kind: 'field',
          key: 'severity',
          type: 'choice_group',
          label: 'شدت',
          order: 1,
          requiredWhen: { op: 'always' },
          options: { kind: 'literal', items: [
            { value: 'low', label: 'کم' },
            { value: 'high', label: 'زیاد', tone: 'danger' },
          ]},
        },
        {
          kind: 'field',
          key: 'escalateTo',
          type: 'select',
          label: 'ارجاع به',
          order: 2,
          // Only offered when severity is high.
          options: { kind: 'literal', items: [
            { value: 'supervisor', label: 'سرپرست' },
            { value: 'hq', label: 'ستاد' },
          ]},
          optionsFilter: {
            mode: 'dynamic',
            rule: { op: 'eq', path: 'severity', value: 'high' },
            values: ['supervisor', 'hq'],
          },
        },
      ],
    }],
  }],
};
```

### Checklist for a definition that works

- [ ] Every `key` is unique across the whole definition — rules address by key
- [ ] `order` is sequential for readability
- [ ] A question that reveals another question lives on an **always-visible** page
- [ ] Options have stable `value`s, not labels you might reword
- [ ] Fields that project into a real model field declare a `binding`
- [ ] Every `relation`/`dto` binding sits on a **`reference`** field — a literal
      choice cannot satisfy an ObjectId relation
- [ ] Every binding target actually exists: a relation the target model declares,
      or a real field of a real DTO (the builder derives both from live schemas)
- [ ] The form has an `icon` from the shared 80-name vocabulary, so officers
      recognise it in the picker before reading the title
- [ ] `form_kind` matches the model the answers will be sent to: `accident` for
      collisions, `incident_report` for everything else. An organization may have
      one active accident form and as many report forms as it needs.
- [ ] Answers that become meaningless when a parent changes declare `clearOnChange`
- [ ] Cross-item sanity checks are `warnings`, not errors
- [ ] Reference models exist and have records (the builder warns; `activate` refuses)

`activate` refuses a draft that fails the binding, icon or reference checks, and
leaves it a draft. Everything above is therefore enforced at publish time rather
than discovered in the field.

## Common recipes

### A conditional section

```jsonc
{
  "kind": "group", "key": "damageSection", "label": "آسیب",
  "visibleWhen": { "op": "eq", "path": "hasDamage", "value": "بله" },
  "children": [ /* … */ ]
}
```

### A list with a minimum

```jsonc
{ "kind": "repeatable", "key": "vehicles", "label": "وسیله نقلیه",
  "minItems": 1, "children": [ /* … */ ] }
```

`minItems` is checked once against the whole group, not per row.

### A cross-item warning

```jsonc
{
  "key": "support",
  "validation": { "warnings": [{
    "rule": { "op": "and", "rules": [
      { "op": "anyIn", "path": "vehicles[].mobility", "value": ["نیاز به جرثقیل"] },
      { "op": "not", "rule": { "op": "contains", "path": "support", "value": "جرثقیل" } }
    ]},
    "message": "وسیله نیاز به جرثقیل دارد اما این پشتیبانی انتخاب نشده است."
  }]}
}
```

### Different sub-forms per prior answer

Two groups, each gated — see [03 Rules](./03-rules-and-conditions.md#2-show-an-entirely-different-set-of-fields).

### A cross-group reference

A damage record pointing at a vehicle in another group is a `select` whose options
are populated from the vehicle list at render time:

```jsonc
{ "key": "damage_vehicleId", "type": "select", "label": "وسیله مرتبط",
  "options": { "kind": "literal", "items": [] } }
```

> This is declared but **not yet populated at render time** — see
> [08 Status](./08-migration-and-status.md).

## Reusing a definition as a test

The QA form is written exactly this way and asserted behaviourally in
`mobile/src/domain/qa-accident-form.test.ts`. A definition that needed code to
express would mean the engine is not general enough, so it is treated as a test
rather than as seed data.

## Next

- **[06 Mobile and Offline](./06-mobile-and-offline.md)** — how it runs in the field
