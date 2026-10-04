# Dark theme unification — design spec

**Date:** 2026-10-04
**Status:** approved (architecture) / written (detail)
**Scope:** `front/` — ~250 files

## Problem

The app has one canonical dark theme but no token layer, and dark mode is
currently produced by three unrelated mechanisms:

1. **Real dark classes** — `components/system/*`, `atoms/Button.tsx`,
   `components/patrol/ui.tsx`, `organisms/Navbar.tsx`, `NewFooter.tsx`,
   `landing/*`. Consistent, but the vocabulary is implicit: every value is a
   literal Tailwind utility repeated by hand.
2. **A CSS override bridge** — `globals.css:683-826` (25 rules, scoped to
   `.admin-shell`) re-skins light Tailwind classes to dark with `!important`.
   It is applied in only 3 places: `app/admin/layout.tsx:8`,
   `components/system/PanelShell.tsx:58`, `components/org/OrgWorkspace.tsx:80`.
3. **Light classes that nothing rescues** — `/charts` (32 pages),
   `/maps`, `/map`, `/graph`, `/user`, `/test-upload`, `/forms`. These render
   as white islands inside `app/layout.tsx`'s `bg-slate-950` root.

`/forms` is the visible symptom: `app/forms/layout.tsx:22` sets
`bg-slate-100 text-gray-800` and sits outside `.admin-shell`, so its 12
components under `components/org/forms/` render fully light.

There is no `tailwind.config.*` and no `@theme`/`:root` block in
`globals.css` — Tailwind 4 CSS-first, zero declared tokens. `dark:` appears
exactly once in the codebase (`organisms/Loader.tsx:3`) and keys off
`prefers-color-scheme`, so it is not a usable strategy.

## Goal

One dark theme across the whole app, built on a real token layer, with the
`.admin-shell` override deleted and no page depending on it.

Non-goals: a light theme, a theme toggle, or runtime theme switching.

## Constraints that shaped the design

- **The override is load-bearing, not decorative.** 93 files / 341 light-token
  occurrences inside `.admin-shell` depend on it. It cannot be deleted before
  those are migrated.
- **Its rules are partly unfindable by grep.** `input`, `textarea`, `select`,
  `label`, `::placeholder`, `:focus`, `table`, `th`, `td` match on element
  type with no class requirement. A class-name audit will miss them.
- **`.admin-shell .border { … !important }` is actively destroying intent.** It
  flattens 136 coloured borders across 59 files (`border-rose-400/20`,
  `border-blue-400/25`, `border-emerald-400/25`, …) and suppresses 2 inline
  `style={{ borderColor }}` values in `org/UnitDetailView.tsx:314,352`.
  Deleting the block **fixes** these; it does not break them.
- **`MyAsyncMultiSelect` is the single biggest regression risk.** It renders on
  every page via `dashboards/GlobalFiltersBar.tsx`, which is mounted in the root
  layout — i.e. outside `.admin-shell`. It uses `classNamePrefix="react-select"`
  *and* an inline light `styles` prop. Its dropdown is dark inside the shell
  today only because rule 768-771 exists.
- **Flipping primitives to dark before page roots would strand controls.** Dark
  inputs on a `bg-gray-50` page is worse than the current state. Page roots move
  in the same phase as the primitives.

## Token layer

A single `@theme` block in `globals.css`. Its purpose is to be the one place the
palette changes and to give primitives and new code a vocabulary.

Class names already dominate the codebase (`border-white/10` appears 198 times
in 64 files) and are **kept as literals**. This is a deliberate rejection of a
rename-everything-to-semantic-names migration: it would rewrite 198
already-correct usages for no runtime gain and make the diff unreviewable.

```
Surfaces   --color-surface        #020617   bg-slate-950     page / root
           --color-surface-raised #0f172a   bg-slate-900/75  glass card, header, sidebar
           --color-surface-solid  #0f172a   bg-slate-900     modal, menu, dropdown
           --color-control        #1e293b   bg-slate-800     button-neutral, pagination cell
Hairline   --color-hairline       #ffffff1a border-white/10   THE border token
Text       --color-ink            #ffffff   text-white       headings, values
           --color-body           #e2e8f0   text-slate-200   body, labels, controls
           --color-muted          #94a3b8   text-slate-400   secondary nav
           --color-faint          #64748b   text-slate-500   captions, empty states
Accent     --color-accent-soft    #2563eb1f bg-blue-500/15   nav active
           --color-accent-chip    #60a5fa1a bg-blue-400/10   icon / pill chip
           --color-accent-line    #60a5fa4d border-blue-400/30  accent border
           --color-accent-text    #bfdbfe   text-blue-200    accent text
Status     --color-rose   #fb7185 / rose-400   → /10 bg, /20 border, /100 text
           --color-amber  #fbbf24 / amber-400
           --color-emerald #34d399 / emerald-400
           --color-orange #fb923c / orange-400
```

Also declare in `@theme`: `--radius-card: 1rem` (`rounded-2xl`), `--radius-control: 0.75rem`
(`rounded-xl`), and the grid-overlay gradient as `--color-grid-line: #1e293b`.

### Light → dark mapping (the mechanical rule)

Applied token-for-token. No renames beyond the mapping.

Light backgrounds are not interchangeable, so `bg-white` resolves by what the
element is. Disambiguation rule, applied in this order:

| The element is | Use |
|---|---|
| a modal, menu, dropdown, or popover | `bg-slate-900` |
| a card, panel, header, sidebar, or page section | `bg-slate-900/75` |
| an input well, table header cell, or inset strip | `bg-white/[.04]` |
| a form step / wizard card | `bg-slate-900/75` + `border-white/10` |

| Light | Dark |
|---|---|
| `bg-white`, `bg-gray-50`, `bg-gray-100`, `bg-slate-50` | resolved by the table above |
| `bg-gray-200`, `bg-slate-100` | `bg-slate-800` |
| `text-gray-900`, `text-gray-800`, `text-gray-700`, `text-slate-900/800/700` | `text-white` (heading) · `text-slate-200` (body) · `text-slate-300` (label) |
| `text-gray-600`, `text-gray-500`, `text-slate-600/500` | `text-slate-400` |
| `text-gray-400`, `text-slate-400` | `text-slate-500` |
| `border`, `border-gray-100/200/300`, `border-slate-100/200/300` | `border-white/10` |
| `border-red-200` `bg-red-50` `text-red-800` | `border-rose-400/20` `bg-rose-400/10` `text-rose-100` |
| `border-green-200` `bg-green-50` `text-green-800` | `border-emerald-400/20` `bg-emerald-400/10` `text-emerald-100` |
| `border-blue-200` `bg-blue-50` `text-blue-800` | `border-blue-400/20` `bg-blue-400/10` `text-blue-100` |
| `border-amber-200` `bg-amber-50` `text-amber-800` | `border-amber-400/20` `bg-amber-400/10` `text-amber-100` |
| `bg-indigo-50` `text-indigo-700` | `bg-blue-400/10` `text-blue-200` |
| `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl` | `shadow-xl` / `shadow-2xl` |
| `rounded-lg` (container) | `rounded-2xl` |

`shadow-sm` was never covered by the override and is not in the table; it is
already inconsistent today and gets normalised to `shadow-xl` on the same pass.

## Primitive contract

Every shared primitive becomes **dark by default**. The `variant="light"` escape
hatch is removed rather than kept, because the app is single-theme — a light
variant on a single-theme app is a bug waiting to happen.

| Primitive | Today | Change |
|---|---|---|
| `atoms/Button.tsx` | dark, 5 variants, already canonical | no change |
| `atoms/MyInput.tsx` | `variant` defaults to `"light"` | default `"dark"`; delete `lightControlClasses` |
| `atoms/Select.tsx` | light label, relies on override for the control | own `styles` from the token scale; delete override dependency |
| `atoms/MyAsyncMultiSelect.tsx` | 160-line inline light `styles` | rebuild `styles` from the token scale; this is what makes it safe outside the shell |
| `atoms/MyDateInput.tsx` | light `bg-white` | dark control + dark `.rmdp-*` overrides in `globals.css` |
| `atoms/MyStandaloneDatePicker.tsx` | dead | delete |
| `atoms/LoadingSpinner.tsx` | `border-gray-300 border-t-red-500` | `border-white/10 border-t-blue-400`; accept `className` |
| `atoms/CustomCheckbox.tsx` | light, no `className` | dark fill/border; accept `className` |
| `atoms/ToggleSwitch.tsx` | off-state `bg-gray-200` | off-state `bg-white/10` |
| `atoms/Input.tsx` | dead, carries its own TODO | delete |
| `molecules/Modal.tsx` | `bg-white rounded-lg` | `bg-slate-900 border-white/10 rounded-2xl`; 1 caller |
| `molecules/Badge.tsx` | dead | delete |
| `molecules/AdvancedSearch.tsx` | light containers | migrate per table |

## Phases

Invariant: **after every phase, no surface is light.** Page roots move in the
same phase as the primitives so controls are never stranded on a light page.

### Phase 1 — Foundation
- `@theme` block in `globals.css`
- Primitives dark by default (table above)
- `.rmdp-*` (react-multi-date-picker) overrides recoloured to dark
- `color-scheme: dark` promoted from `.admin-shell` to `:root`, so native
  `input` / `select` / `textarea` / scrollbars follow the theme **outside** the
  shell too. `.admin-shell` currently sets it (globals.css:686); today
  `/charts`, `/maps` and `/forms` get no such declaration, which is why their
  native controls render light. The duplicate `.admin-shell` declaration is
  removed in Phase 3.
- Flip ~44 page roots: 32 `/charts` pages, 6 `/maps`, `/map`, 2 `/graph`,
  `/user`, `/test-upload`, `/forms` layout
- Delete 17 dead files

Ends with: every page dark at its edges; no light islands; no primitive that
renders light.

### Phase 2 — `/forms`
`app/forms/layout.tsx` → dark shell matching `PanelShell` tokens.
`FormList`, `FormBuilder`, `NodeTree`, `FieldEditor`, `LivePreview`,
`RuleEditor`, `BindingEditor`, `IconPicker`, `FormIcon`, `form-icon-map`,
`FormAuthorHeader`. Swap ad-hoc `<button>` for `atoms/Button`; swap raw
`<input>`/`<select>` for `MyInput` / `Select`.

This is the originally-reported symptom and lands in Phase 2 only because
Phase 1 makes it near-mechanical.

### Phase 3 — Delete the override
- Delete `globals.css:683-826`
- Migrate the 93 dependent files per the mapping table
- Convert the 36 already-broken `bg-*-50` + `border-*-200` alert boxes in 14 form
  templates to the `/10` + `/20` + `/100` pattern

Highest-risk items, called out because a class-name audit cannot find them:
`input` / `textarea` / `select` / `label` / `::placeholder` / `:focus` and
`table` / `th` / `td`. Every raw form control in the 14 form templates and
`MultiStepForm.tsx` currently gets its colours from those element rules.

### Phase 4 — Interior detail
`/charts` (32 files, 412 light-token occurrences), `/maps` (86), `/user` (25),
`/graph` (15), `/map` (13), `/test-upload` (12).

## Dead code to delete (17 files, 0 importers)

`atoms/Input.tsx` · `atoms/InfoItem.tsx` · `atoms/MyStandaloneDatePicker.tsx` ·
`molecules/Badge.tsx` · `molecules/FilterDescription.tsx` · `molecules/HeartIcon.tsx` ·
`organisms/InfoBox.tsx` · `organisms/Loader.tsx` · `organisms/DateRangeInput.tsx` ·
`organisms/AccidentSearchFilters.tsx` · `organisms/footer.tsx` ·
`organisms/RichTextEditor.tsx` (231 lines, 100% commented out) ·
`template/ChartStep.tsx` · `template/CitySettingsStep.tsx` ·
`template/MainFormStep.tsx` · `template/WraperCard.tsx` ·
`template/FormCreateAccident.tsx.backup`

Note: `front/AGENTS.md` claims `MyStandaloneDatePicker` has 3 consumers. It has
none; that claim is stale and the doc needs correcting.

## Verification

`front/` has no test framework, so correctness here is a mix of static checks
and human eyes.

Static, must pass before each phase is called done:

```bash
pnpm exec tsc --noEmit          # no type regressions
pnpm lint                       # no new eslint errors
../.workbuddy-ai/tools/audit-frontend-actions.py   # 330 act calls still resolve
../.workbuddy-ai/tools/panel-routing-test.py        # 48 panel assertions
```

Visual, needs a human — a build cannot catch a contrast regression:

- every route in the phase's scope, at desktop and mobile widths
- for Phase 3 specifically: every `border-*` colour listed in the audit, to
  confirm the restored borders look intentional
- `react-select` dropdowns opened **inside and outside** `.admin-shell`, since
  `MyAsyncMultiSelect` is the one component that renders in both

Per project convention (`AGENTS.md`), `pnpm dev` / `pnpm build` are not run
without explicit instruction.

## Risks

| Risk | Mitigation |
|---|---|
| 93-file migration breaks a form | one phase, reviewable per-file diff; delete the block only after the migration |
| class-less override rules missed | element-type sweep (`<input`, `<select`, `<textarea`, `<table`) as an explicit migration checklist, not a grep |
| `MyAsyncMultiSelect` regresses outside the shell | fixed in Phase 1, before the override is touched; verify both contexts |
| restoring 136 coloured borders looks wrong | expected — they were being overridden. Review them as a set in Phase 3 |