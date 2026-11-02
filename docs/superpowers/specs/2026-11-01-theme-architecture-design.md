# Theme architecture — design

Date: 2026-11-01
Status: proposed. Semantic token layer + one `data-theme` axis. Dark is the
canonical default; light is a first-class peer theme. Route-level theming is
explicitly rejected.

## Context

The frontend has **two design systems**, not one design system with two themes.
They grew independently and are now expressed as **literal Tailwind colours
inside components** rather than as a shared palette:

| Surface family | Routes / folders | Dominant idiom | Colour literals |
| --- | --- | --- | --- |
| Panels | `app/{admin,orghead,unit-head,employee,patrol,patrol-manager,forms,user}` | dark | `bg-slate-950`, `border-white/10`, `text-slate-400` |
| Analytics | `app/charts`, `app/maps`, `components/{charts,dashboards,navigation}` | light | `bg-white`, `text-gray-900`, `border-gray-200` |
| Shared chrome | `components/organisms`, `components/atoms`, `components/molecules` | mixed | both |

Measured across 355 `.tsx` files in `front/src`:

```
area                              light    dark  neutral  light share
----------------------------------------------------------------------
app/charts                          972      93      164  91%
components/dashboards               467      39       87  92%
components/charts                   424      93       57  82%
components/template                 386     169      248  70%
components/organisms                195     311      268  39%
app/maps                            112      15       21  88%
components/org                       81     570       97  12%
components/maps                      74      28       45  73%
app/admin                            50      65       67  43%
components/atoms                     24      36       28  40%
...
app/login                             0      10       19   0%
app/forms                             0       2        0   0%
----------------------------------------------------------------------
TOTAL                              2958    2023     1255
```

**110 files contain both idioms** — that is where the visible glitches live
(`app/admin`, `components/organisms/user/UserCard.tsx` at 25 light / 26 dark,
`components/template/BatchDeleteByPeriodModal.tsx` at 34 / 17).

### The mechanism that holds the two halves apart

`globals.css:743` declares a `.admin-shell` block — ~150 lines of
`!important` overrides that rewrite light utility classes into dark ones:

```css
.admin-shell .bg-white,
.admin-shell .bg-gray-50, … { background-color: rgba(15,23,42,.82) !important; }
.admin-shell .text-gray-900, … { color: #f1f5f9 !important; }
```

It is applied in exactly **two places** — `app/admin/layout.tsx` and
`components/system/PanelShell.tsx` — so it covers the panels and nothing else.
`/charts`, `/maps` and the shared chart components render outside it, keep their
light literals, and are therefore light. **That is the conflict, stated exactly:
the theme is selected by an ancestor CSS scope, not by a theme.**

### Why the existing token block did not help

`globals.css:16` already declares a `@theme` block with semantic names
(`--color-surface`, `--color-ink`, `--color-hairline`, …). It has **zero usages**
anywhere in `src`:

```bash
grep -rhoE '(bg|text|border)-(surface|hairline|ink|body|muted|faint|accent-soft)\b' src
# → no matches
```

It is documentation with a compiler cost. Two reasons it could not be adopted as
written:

1. **Plain `@theme` bakes values at build time.** A utility generated from
   `--color-surface` compiles to the literal hex, so changing the token cannot
   change the rendered colour at runtime. Theming needs `@theme inline`.
2. **It defines one theme.** There is no light value for any token, so adopting
   it would have deleted the light palette rather than unified it.

## Goals

- **One theme axis for the whole app.** A single `data-theme` attribute on
  `<html>`. No route, panel or component decides its own theme.
- **Both themes complete.** Every surface renders correctly in light and dark,
  including charts, maps, the date picker and native controls.
- **Zero flash.** No light paint before the dark theme applies, and no
  hydration mismatch.
- **Mechanical migration.** ~5,000 colour literals move to tokens by codemod with
  a reviewable mapping table — not by hand-editing 355 files.
- **A ratchet.** The literal count can only go down. CI fails when a new
  hardcoded colour is introduced.

## Non-goals

- **Per-route theming.** See *Rejected: route-level theme* below.
- **Redesigning either surface.** Dark stays visually identical to today. Light
  is new but deliberately quiet — this is an architecture change, not a refresh.
- **High-contrast / forced-colours mode.** The token layer makes it cheap later;
  it is not in scope.
- **Theming the Leaflet basemap imagery itself.** Tile *providers* are selected
  per theme (see *Non-CSS surfaces*), but tile styling is the provider's.

## Architecture

### Three tiers, and only the middle one is used by components

```
Tier 1  Primitives      Tailwind's built-in palette (--color-slate-950, --color-blue-500)
                        Used ONLY inside the token definitions. Never in a component.
                             ↓
Tier 2  Semantic        --canvas, --surface, --fg, --line, --brand, --danger…
                        The only colours a component may reference.
                             ↓
Tier 3  Domain          --chart-grid, --chart-1..8, --map-chrome
                        Consumed by JS (ApexCharts, Leaflet) that cannot use classes.
```

Tier 1 already exists — Tailwind v4 ships it. We add tiers 2 and 3.

### Tier 2 — the semantic set

36 tokens, chosen so that **every existing literal maps to exactly one**:

| Group | Tokens | Light | Dark |
| --- | --- | --- | --- |
| Surface | `canvas` | `#f6f7f9` | `#020617` |
| | `surface` | `#ffffff` | `#0f172a` |
| | `surface-raised` | `#ffffff` | `#0f172a` |
| | `surface-sunken` | `#f1f3f6` | `#0b1220` |
| | `surface-hover` | `rgb(15 23 42 / .04)` | `rgb(255 255 255 / .06)` |
| | `overlay` | `rgb(15 23 42 / .45)` | `rgb(2 6 23 / .72)` |
| Line | `line` | `#e3e7ee` | `rgb(255 255 255 / .10)` |
| | `line-strong` | `#cbd3df` | `rgb(255 255 255 / .18)` |
| | `line-focus` | `#2563eb` | `rgb(96 165 250 / .65)` |
| Text | `fg` | `#0f172a` | `#f8fafc` |
| | `fg-muted` | `#52627a` | `#94a3b8` |
| | `fg-faint` | `#7d8ca3` | `#64748b` |
| | `on-brand` | `#ffffff` | `#ffffff` |
| Brand | `brand` | `#2563eb` | `#2563eb` |
| | `brand-hover` | `#1d4ed8` | `#3b82f6` |
| | `brand-soft` | `#eff5ff` | `rgb(37 99 235 / .15)` |
| | `brand-border` | `#bfd6fe` | `rgb(96 165 250 / .30)` |
| | `brand-fg` | `#1d4ed8` | `#bfdbfe` |
| Status ×4 | `success` `warning` `danger` `info` | solid | solid |
| | `…-soft` | tinted background | tinted background |
| | `…-border` | tinted border | tinted border |
| | `…-fg` | readable text on `…-soft` | readable text on `…-soft` |

Utilities follow Tailwind's naming: `bg-canvas`, `bg-surface`, `text-fg`,
`text-fg-muted`, `border-line`, `bg-brand-soft`, `text-danger-fg`.

**Naming rationale.** `fg` rather than `ink` because it pairs symmetrically with
`bg`; `line` rather than `border` because `border-border` is unreadable and
`border-line` is not. `on-brand` rather than `fg-inverse` because it names the
*relationship* (text placed on a brand-filled surface) instead of a direction —
and it is `#ffffff` in both themes, since `brand` is the same blue in both.
Status names are role-based, not hue-based — `danger`, not `rose` — so a palette
retune never has to rename a class.

### Why `@theme inline` is load-bearing

```css
@theme inline {
  --color-canvas: var(--canvas);
  --color-surface: var(--surface);
  /* … */
}
```

`inline` makes Tailwind emit `background-color: var(--canvas)` into the utility
instead of the resolved value. Without it the hex is frozen into the stylesheet
and `data-theme` does nothing. This is the single detail that decides whether the
whole approach works.

### Categorical colour — the tint primitive

The five status tokens (`success`, `warning`, `danger`, `info`, `brand`) cover
*meaning*. They do not cover *identity*: a landing page gives each chart card its
own hue, `AppliedFiltersDisplay` gives each filter category its own hue, and
`UserCard` gives each user level its own hue. Eight chips in five colours is a
worse UI than eight chips in eight colours.

The naive answer — `bg-orange-50 text-orange-800 border-orange-200` — is a
**light-mode tint**: on a dark card it is a pale block, and its dark label is
unreadable. It was also invisible to the grey/white codemod, which is why 144 of
them survived the first migration and made `/charts/overall` and the filter panel
look half-themed.

So the hue is kept and the tint is *derived* from it. One hue variable, three
surfaces, no per-hue tokens and no `dark:` pairs:

```css
@theme inline {
  --color-tint-soft:   color-mix(in oklab, var(--tint) var(--tint-soft-strength),   var(--surface));
  --color-tint-strong: color-mix(in oklab, var(--tint) var(--tint-strong-strength), var(--surface));
  --color-tint-border: color-mix(in oklab, var(--tint) var(--tint-border-strength), var(--surface));
  --color-tint-fg:     color-mix(in oklab, var(--tint) var(--tint-fg-strength),     var(--fg));
}
```

`tint-orange` sets `--tint: var(--hue-orange)`; the caller then writes
`tint-orange bg-tint-soft border-tint-border` and `text-tint-fg` on the label.

Why this works in both themes from one declaration: mixing 22% of a hue into
`--surface` produces a pale wash on white and a dark wash on slate. `--tint-fg`
mixes into `--fg`, so the label **darkens** in light mode and **lightens** in dark
mode — the two directions the old `-700` / `-300` pairs were hand-writing.

Three decisions inside it that are easy to get wrong:

- **Mix into `--surface`, not `--line`.** `--line` is `rgb(255 255 255 / .1)` in
  dark; mixing into it blends the hue toward white *and* inherits its alpha, so
  the border comes out a washed-out grey. An opaque base keeps the three steps
  monotonic — soft < strong < border — in both themes.
- **`--tint` defaults to brand.** An undefined `var()` inside `color-mix`
  invalidates the whole property, so a forgotten `tint-*` would silently drop the
  background. A default degrades it to a neutral wash instead.
- **The strengths are measured, not chosen.** Light `--tint-fg-strength: 56%` is
  the lowest value at which all 17 hues clear 4.5:1 against both tint surfaces;
  yellow is the binding constraint (2.9:1 at 78%, 4.65:1 at 56%). Dark lands at
  5.3–6.3:1. Re-tuning these without re-running the contrast check silently
  breaks legibility.

### Tier 3 — domain tokens for surfaces CSS cannot reach

| Token group | Consumer | Why it cannot use a class |
| --- | --- | --- |
| `--chart-grid`, `--chart-axis`, `--chart-label`, `--chart-tooltip-bg`, `--chart-tooltip-fg`, `--chart-1..8` | ApexCharts | Renders inline SVG `fill`/`stroke` attributes from a JS options object |
| `--map-popup-bg`, `--map-popup-fg`, `--map-control-bg`, `--map-control-fg` | Leaflet | Ships its own CSS; our overrides are hand-written globals |

JS reads them with `getComputedStyle(document.documentElement)
.getPropertyValue("--chart-grid")` — see `front/src/utils/chart-theme.ts`.

### Runtime model — one axis

```
cookie lesan-theme  ──┐
  "dark" | "light"    ├─→  <html data-theme="dark|light">  ─→  CSS variables  ─→  utilities
  "system"            │                                              │
OS prefers-color-scheme ┘                                             └─→  getComputedStyle ─→ ApexCharts / Leaflet
```

- The attribute lives on `<html>`, set **server-side** in `app/layout.tsx` so the
  first byte of HTML is already correct.
- `color-scheme` is set alongside it, so native scrollbars, form controls, focus
  rings and the caret follow without any extra CSS.
- Preference is stored in the `lesan-theme` cookie (not `localStorage`) so the
  server can read it on a later render and stop depending on the client script.
- Cross-tab sync uses the `storage` event; same-tab sync is React state.

### Default theme is `dark`, and it is not `system`

Product surfaces — navbar, login, landing, all seven panels, the form builder —
are dark-native and define the product's identity. Charts are the legacy surface.
Defaulting to `dark` means the shipped UI looks exactly as it does today on
every machine, including machines whose OS is light. `system` remains available
as a user choice; it is simply not the factory default.

### Rejected: route-level theme

The obvious fix — "panels dark, charts light, each keeps its own" — is what the
app already does by accident, and it is what produces the conflict. It fails
because shared components cross the boundary: `components/organisms/user/UserCard.tsx`
(25 light / 26 dark literals) is rendered from the admin panel *and* from
`/charts`. A component cannot know which theme its caller wanted, so route
scoping forces every shared component to be written twice.

One global preference also makes the navbar, footer and modal layer consistent,
which route scoping cannot: a modal portalled into `document.body` escapes any
route wrapper, so route-scoped theming leaves portals in the wrong theme — a bug
this codebase already has with the date picker.

### Rejected: `dark:` variants as the migration target

Writing `bg-white dark:bg-slate-900` on 5,000 sites doubles every class string,
leaves the class list unreadable, and still does not reach ApexCharts, Leaflet or
the date-picker portal. `dark:` is kept as an **escape hatch** bound to the same
axis:

```css
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

…so a genuinely theme-specific tweak is possible, but the default path is a
token. Review rule: a `dark:` pair that could have been one token is a review
comment.

## Non-CSS surfaces

These are the three places a naive "swap the classes" migration silently fails.

### ApexCharts

7 chart components hardcode `theme: "light"`; the options objects carry hundreds
of light-mode hex literals (`#1f2937` for pie values, `#6b7280` for totals,
`#374151` for legend labels). ApexCharts writes these into SVG attributes, so no
stylesheet can override them.

`front/src/utils/chart-theme.ts` provides:

```ts
const { mode, colors, options } = useChartTheme();
const chartOptions = { ...options, series };
```

- `useChartTheme()` resolves tokens to concrete colour strings and re-resolves
  when `data-theme` changes (a `MutationObserver` on `<html>`, because ApexCharts
  needs new options, not new CSS).
- `baseChartOptions(theme)` returns chart / grid / tooltip / legend / dataLabels
  defaults already themed, so a chart file stops declaring colour at all.
- `theme.mode` is set from the resolved theme, which also fixes ApexCharts' own
  internal defaults (toolbar, zoom icons, selection).

Rule: **a chart file may not contain a hex colour.** Only `colors[i]` from the
hook.

### Leaflet

`globals.css` overrides Leaflet chrome with `background: white !important` in six
places (zoom buttons, popups, popup tips, attribution). Those become tokens.
`LeafletSurface` already centralises the map element, so the class that carries
the theme lives there once.

The basemap is part of the theme, not separate from it: a dark UI on a bright OSM
raster looks broken. `BasemapContext` gains a per-theme default (dark →
a dark raster provider; light → `mapir`). The user's explicit choice still wins,
persisted as today under `lesan-basemap`.

### react-multi-date-picker

Renders into `document.body`, so it cannot inherit a scoped theme — which is
exactly why its 90 lines of `!important` dark rules are global today. They become
`[data-theme="dark"]`-scoped token rules, and the light theme gets the mirror set.
Because the calendar is portalled, this is the clearest proof that the theme must
be a document-level attribute rather than a wrapper class.

## Migration plan

Five phases. **The app renders identically at the end of every phase**, and each
phase is independently shippable and revertible.

| Phase | Status | Result |
| --- | --- | --- |
| 0 Foundation | **done** | token layer, `data-theme`, chart resolver, audit baseline |
| 1 Shared primitives | **done** | atoms / system / modals / molecules / Navbar on tokens |
| 2 Analytics surfaces | **done** | charts, dashboards, maps on tokens + `useChartTheme()` |
| 3 Enable the switch | **done** | `.admin-shell` deleted, `THEME_TOGGLE_ENABLED = true` |
| 4 Ratchet and cleanup | **partial** | baseline re-recorded; `--enforce` not yet wired into CI |

Measured outcome: **6,235 → 1,468** colour literals. `theme-codemod --check`
reports 0 files with literals. The remaining hex is deliberate data colouring
(choropleth and heat ramps, categorical series palettes) plus the brand lockup.

Two things surfaced during implementation that the plan did not anticipate, both
now folded into the architecture:

- **`react-select` is a third non-CSS surface**, like ApexCharts: its `styles`
  prop takes inline style objects, so `classNamePrefix` + CSS cannot theme it.
  It shares `use-theme-palette.ts` with the chart resolver via
  `utils/select-styles.ts` rather than growing a second one.
- **Deleting `.admin-shell` required replacing it, not just removing it.** The
  block also styled bare `input`/`select`/`textarea`/`label`/`table` elements,
  which no class rename could reach. Those rules moved to a token-driven
  `@layer base` block, global instead of admin-scoped. The layer is load-bearing:
  unlayered rules beat layered ones, which is exactly why the old block needed
  `!important` and the new one needs none.

### Phase 0 — Foundation (no component-level visual change)

- Two-theme token layer in `globals.css`; `@theme inline`; `@custom-variant dark`.
- `data-theme="dark"` set statically on `<html>`. **No toggle yet.**
- `chart-theme.ts` added but not yet consumed.
- `theme-audit.py` records the baseline (2,958 light / 2,022 dark).

Three globally-scoped surfaces *do* change, and this is intentional: Leaflet
chrome (popups, zoom buttons, attribution, map background), scrollbars, and the
`.loader` spinner were hardcoded **light** in `globals.css` with no per-component
literal to preserve. They were light-on-dark bugs, and tokenising them is the
whole point. Everything else renders identically, because `--canvas` in dark is
`#020617`, exactly the `bg-slate-950` the root layout used.

Exit criteria: `pnpm build` clean, panels and charts otherwise pixel-identical,
audit baseline committed.

### Phase 1 — Shared primitives

Migrate `components/atoms`, `components/system`, `components/organisms/Navbar`,
`components/modals`, `components/molecules` to tokens. Still dark-only in
appearance. This is the highest-leverage phase: these components are rendered by
every route, so Phase 2 and 3 get cheaper.

Exit criteria: no colour literal in `components/atoms` or `components/system`;
`.admin-shell` still present but no longer needed by the migrated files.

### Phase 2 — Analytics surfaces

Migrate `components/charts`, `components/dashboards`, `app/charts`, `app/maps`,
`components/maps`, then switch every chart to `useChartTheme()`. Charts are dark
now. **This is the phase that removes the reported conflict.**

Exit criteria: `theme: "light"` appears nowhere; charts re-render correctly when
`data-theme` is flipped by hand in devtools.

### Phase 3 — Enable the theme switch

- Delete the `.admin-shell` block. It is the conflict; it cannot outlive it.
- Turn on `ThemeToggle` (`THEME_TOGGLE_ENABLED = true`).
- Add the pre-paint script and `ThemeProvider`.

Exit criteria: toggling light↔dark repaints the whole app with no flash, no
hydration warning, and no light-on-light text anywhere. Checklist run on all 28
chart pages plus every panel.

### Phase 4 — Ratchet and cleanup

- `theme-audit.py` moves from *report* to *enforce*: the literal count may not
  increase. New hardcoded colours fail CI.
  **Done in the tool, not in CI** — `--enforce` works and the baseline is
  re-recorded at 1,468, but no pipeline invokes it yet.
- Delete the legacy token names and the `prefers-color-scheme` block that fought
  the explicit attribute. **Done** — the block is gone; `:root` *is* dark, so a
  missing attribute fails safe instead of following the OS.

Also completed here, beyond the original list:

- Both codemods are idempotent (a second `--write` is a no-op) and
  `chart-theme-codemod` masks module-level `COLORS` palettes so a categorical
  grey is not mistaken for a label colour.
- The `tone` prop on `GeoPolygonDrawer` / `GeoPointPicker` was deleted. It was a
  per-surface appearance knob from the two-theme era; once both surfaces read
  tokens the variants differed only in contrast, and all twelve call sites passed
  the same value. The surviving constants are the `light` ones, so the removal
  did not restyle the six forms that used them.

## The migration mapping

`front/scripts/theme-codemod.mjs` applies exactly this table. It is deliberately
explicit rather than clever — every row is a design decision, and a reviewer can
diff the table instead of 355 files.

| From | To | Note |
| --- | --- | --- |
| `bg-white` | `bg-surface` | cards, modals |
| `bg-white/80`, `bg-white/90` | `bg-surface/80`, `bg-surface/90` | |
| `bg-gray-50`, `bg-slate-50` | `bg-canvas` | page-level background |
| `bg-gray-100`, `bg-slate-100` | `bg-surface-sunken` | table headers, wells |
| `bg-gray-200` | `bg-surface-sunken` | |
| `text-gray-900`, `text-slate-900` | `text-fg` | headings |
| `text-gray-800`, `text-gray-700` | `text-fg` | |
| `text-gray-600`, `text-gray-500`, `text-slate-600`, `text-slate-500` | `text-fg-muted` | |
| `text-gray-400`, `text-slate-400` | `text-fg-faint` | captions |
| `border-gray-100/200/300`, `border-slate-200` | `border-line` | |
| `bg-blue-600` | `bg-brand` | primary action |
| `hover:bg-blue-700` | `hover:bg-brand-hover` | |
| `bg-blue-50` | `bg-brand-soft` | |
| `text-blue-600/700/800` | `text-brand-fg` | |
| `border-blue-200` | `border-brand-border` | |
| `bg-red-50`, `text-red-600/700` | `bg-danger-soft`, `text-danger-fg` | |
| `bg-green-50`, `text-green-600/700` | `bg-success-soft`, `text-success-fg` | |
| `bg-amber-50`, `text-amber-600/700` | `bg-warning-soft`, `text-warning-fg` | |
| `bg-slate-950`, `bg-slate-900` | `bg-canvas`, `bg-surface` | dark idiom |
| `border-white/10` | `border-line` | dark idiom |
| `text-white` | `text-fg` | **except** on `bg-brand` → `text-on-brand` |
| `text-slate-300/400/500` (dark idiom) | `text-fg-muted`, `text-fg-faint` | |

Two rows need a human: `text-white` on a coloured fill, and any `bg-gradient-*`.
The codemod reports those as `NEEDS_REVIEW` and leaves them untouched.

## Verification

| Tool | Purpose | Gate |
| --- | --- | --- |
| `.workbuddy-ai/tools/theme-audit.py` | counts hardcoded colour literals per area, compares to baseline | `--enforce` fails on increase; **not yet wired into CI** |
| `scripts/theme-codemod.mjs --check` | reports files still holding class literals | **currently 0 files** |
| `scripts/chart-theme-codemod.mjs` | finds chart hex that should come from `useChartTheme()` | **currently 0 chrome hex** |
| `npx tsc --noEmit` | catches hooks placed outside a component, missing imports | required after every batch |

Both codemods are idempotent: a second `--write` produces no diff.

Current numbers: **1,468** literals (282 light / 346 dark / 840 neutral), down
from 6,235. The 19 chart files the audit still lists hold deliberate data
colouring — choropleth and heat ramps, categorical series palettes.

Manual checklist, because colour contrast is not statically decidable:

- Every chart page in both themes: axis labels, legend, tooltip, data labels,
  empty state, export menu.
- A map with a popup, a drawn polygon and a cluster, in both themes.
- The date picker portal, both themes, in a filter sidebar and in a modal.
- A form with a validation error, both themes (`danger-fg` on `danger-soft`).
- A table with hover, a selected row and an empty state.
- Refresh mid-page: no flash of the wrong theme.

**This checklist has not been executed yet.** Everything above was verified
statically — `tsc`, a standalone PostCSS compile of `globals.css`, and the two
codemods — because this project's workflow does not run a dev server or a build.
The static checks prove the tokens reach the DOM (`@theme inline` emits
`var(--surface)`) and that the `dark:` variant compiles against `data-theme`, but
they cannot prove contrast. Run this list before calling the work shipped.

## Risks

| Risk | Mitigation |
| --- | --- |
| `@theme inline` omitted → `data-theme` silently no-ops | Phase 0 exit check: flip the attribute by hand and confirm a repaint |
| Flash of light theme on first paint | `data-theme` in server HTML + blocking pre-paint script, verified with cache disabled |
| Charts keep light hex after Phase 2 | Rule: no hex in a chart file; `theme-audit.py` scans `components/charts` for `#[0-9a-f]{6}` |
| `.admin-shell` outliving the migration and masking regressions | Deleted in Phase 3, not before — until then it is the thing keeping panels readable |
| Light theme never actually reviewed | Phase 3 exit checklist is per-page, not "looks fine" |
| Contrast regressions in status colours | `--*-fg` is defined against `--*-soft`, not against the page; both values chosen as a pair |

## Why this is the right shape, in one paragraph

The bug is not "some pages are light". It is that **the theme is a property of
where a component is mounted**, expressed through an ancestor class and a
`!important` block. Any fix that keeps that property — route defaults, `dark:`
variants, per-panel wrappers — reproduces the bug for the next shared component,
the next portal, and the next chart library. Moving the decision to one document
attribute and the colours to one token layer means a component no longer knows or
cares what theme it is in, which is the only version of this that stays fixed.

## Post-implementation: five defects found by looking at it

The migration passed every static check — `tsc`, both codemods at zero, a clean
PostCSS compile, and a ratchet at −76% — and the app was still wrong in five
places. All five are the same underlying mistake in different clothes: **a colour
that was decided by a literal instead of by the theme.** Recorded here because
each one is a shape the next migration will meet again.

| # | Symptom | Actual cause | Fix |
| --- | --- | --- | --- |
| 1 | Landing quick-access cards are pale blocks in dark mode | `bg-orange-50` / `border-purple-200` / `bg-teal-100`. The codemod knew grey and white idioms only, so 144 coloured-palette tints survived across 35 files | the `tint-*` primitive (see above) |
| 2 | Filter panel does not follow the theme | Same cause. The worst instance was a solid `bg-indigo-50 text-indigo-700` button — a whole box that stayed light — plus `bg-warning-soft` paired with `text-amber-800`, which was already broken in dark | `tint-brand`; the mismatched pair became `tint-warning` |
| 3 | Chart tooltip is white text on a white box in dark mode | ApexCharts' `.apexcharts-theme-light` sets `background: #fff` and **no `color`**, so the text inherits `foreColor` (light in dark mode). Most charts override `tooltip: { shared, y }` and drop `tooltip.theme` | tokenised once in `globals.css` with `html`-prefixed selectors |
| 4 | Date picker's month/year panel is white in dark mode | `.rmdp-month-picker` / `.rmdp-year-picker` are a **separate** container from `.rmdp-calendar` and the library hardcodes `background-color: #fff` on them. Only the day grid had been tokenised | added to the token layer, plus the popup arrow |
| 5 | `/admin` shows a navy-to-white gradient in light mode | `bg-gradient-to-b from-canvas via-surface to-blue-950` — two token stops and one literal. Light: white → white → navy | `--sidebar-gradient`, built from the indigo hue with a per-theme strength |

Two lessons worth carrying:

- **A literal in the middle of a token gradient is still a literal.** Four of the
  five are not "someone forgot a token"; they are places where a token and a
  literal were mixed, and the literal won.
- **The codemod's vocabulary is the migration's ceiling.** It matched `white` and
  the grey ramp. Everything outside that vocabulary looked migrated and was not.
  The audit counted them all along — the count was falling, which felt like
  progress, while 144 of the survivors were exactly the ones a user would notice.

Verification for these five was **visual**, not static: a harness that loads the
compiled stylesheet, then re-injects the real ApexCharts and
`react-multi-date-picker` CSS *after* it (as the libraries do at runtime, which is
the only way to prove the `html` prefix wins the cascade), rendered in both themes
through headless Chrome. The tint strengths were then solved numerically — the
light `--tint-fg-strength` moved from 78% to 56% because 78% put yellow at 2.9:1.

## Round three: the idiom had two halves, not one

The remaining surfaces — `/orghead`, `/unit-head`, `/employee`, `/patrol`,
`/report`, `/warehouse` and the `/admin` list pages — used a **dark-native alpha
idiom**: `border-blue-400/20 bg-blue-400/10 text-blue-200`. A translucent
mid-hue wash plus a *pale* label. Self-consistent on the dark shell; on a white
card the wash is invisible and a `-200` label is white-on-white.

The first attempt treated that as one pattern. It is two, and only one of them
is a triple:

| Shape | Example | Identity |
| --- | --- | --- |
| **Triple** — border + wash + label on one element | `border-cyan-400/25 bg-cyan-500/15 text-cyan-200` | self-identifying: the wash names the hue |
| **Bare label** — pale hue with no wash | `text-blue-300`, `text-rose-200` | *not* self-identifying; it may legitimately sit on a solid blue button |

So the codemod keys on the **pale label** (that is the thing that breaks) but
**requires a wash or border** before it rewrites. Bare labels are reported and
left for a human, because rewriting them blindly would "fix" pale-on-solid-blue
into unreadable dark-on-solid-blue. 45 files converted automatically; ~80 bare
labels were then mapped onto five tokens:

`text-brand-fg` · `text-danger-fg` · `text-success-fg` · `text-warning-fg` · `text-info-fg`

These are the only correct choice for accent text that is not on its own tint.
`text-blue-300` has no light-theme meaning at all — it is a *palette step*, and
the palette was chosen for a dark background.

### Hover and active states were the third variant

Reported as "for many hover and active states, the text is not visible". The
cause is the same habit inverted: `text-fg-muted hover:text-blue-100` moves the
label **lighter** on hover, so on a light card hovering makes it disappear.
`hover:bg-blue-400/10 hover:text-blue-100` is worse — wash and label vanish
together. The fix is not a colour, it is an affordance:

- `hover:text-{hue}-100|200|300` → `hover:underline` (the base is already the accent)
- `hover:bg-{hue}-400/10` → `hover:bg-tint-soft`, `hover:text-{hue}-100` → `hover:text-fg`
- `hover:border-{hue}-400/25` → `hover:border-line-focus` (65 % blue in dark, `#2563eb` in light)

### The hero gradient was the same mistake as the sidebar

`bg-gradient-to-l from-blue-950/90 via-surface to-surface` appeared on five
pages: `/admin`, `/orghead`, `/user`, `/unit-head`, `/employee` and
`/warehouse`. In dark it is a deep navy edge fading into the surface — the
intent. In light it is a navy-to-white slab. One hue, two opposite strengths, so
it became `--hero-gradient`: 34 % `--hue-blue` into the canvas in dark, 7 % into
the surface in light.

`/login` and the landing `Hero` had the mirror-image version,
`bg-gradient-to-br from-canvas via-blue-950 to-surface` — white → navy → white.
There the gradient was doing no work that the existing `blur-[120px]` ambient
blobs were not already doing, so it was deleted rather than tokenised, and the
decorative grid switched from a `#1e293b` literal to `var(--line)` so it reads
as a hairline in both themes.

### One more, found by sweeping rather than by report

`bg-yellow-400 text-fg` on the edit buttons in `UserCard` / `EntityCard`: a
*fixed* light plate with a token label. Legible in light (`--fg` is near-black),
invisible in dark (`--fg` is near-white on yellow). A solid accent plate is the
one place a token must **not** be used for the label — or, better, the plate
becomes a tint so both sides are theme-aware: `tint-warning bg-tint-strong
text-tint-fg`.

### State after round three

| Metric | Before | After |
| --- | --- | --- |
| Total literals | 1,160 | **706** |
| Dark-only literals | 342 | **31** |
| Light-only literals | 61 | 61 |

The light count did not move because it is now the **floor**: it is chart chrome
hex that ApexCharts writes into its own SVG (17 files), choropleth ramps and
categorical `COLORS` arrays — data colour, which must not follow the theme.

Verification was visual again, and for the first time against **real SSR
markup** rather than a hand-built harness: fetch the page, strip `<script>`,
rewrite the single `data-theme` attribute, open from `file://` with a `<base>`
pointing at the dev server. Three dead ends are worth recording because each
looked reasonable:

- `--blink-settings=scriptEnabled=false` makes headless Chrome **skip the
  screenshot entirely** — no PNG, no error.
- Serving the captured HTML from a second port **never settles**: the document
  origin is not the app origin, so `<base>` assets are cross-origin and the dev
  server's HMR socket cannot connect. `--virtual-time-budget` then waits forever.
- A shared `--user-data-dir` leaves a `SingletonLock` behind, and **every capture
  after the first silently writes no file.**

The tint strengths were re-derived numerically for the new usage: all 17 hues
clear 4.5:1 against both `bg-tint-soft` and `bg-tint-strong` in light, and
5.3–6.3:1 in dark. The five `*-fg` tokens measure 5.5–7.6:1 on white in light and
remain pale-on-dark in dark.

## Round four: the one token that must not flip

Round three removed the *literal* forms of the dark-native idiom. What survived
was the same mistake expressed with **tokens**, which is why the ratchet could
not see it.

`--on-brand` is `#ffffff` in both themes, by design: it means "text on brand
blue", and brand blue is the same in both themes. It is therefore the only token
that is *deliberately theme-independent* — correct on `bg-brand`, `bg-green-600`,
`bg-red-600`, and wrong everywhere else. Four navigation surfaces used it as a
hover colour:

```
text-fg-muted hover:bg-surface-hover hover:text-on-brand
```

In dark that is white on a faint white wash, which reads correctly. In light the
wash is `rgb(15 23 42 / .04)` and the label is `#ffffff`: white on white. Every
reported defect — header links, the dashboard-selector dropdown, the `orgHead` /
`unitHead` sidebar — was this one pair.

The general rule this yields: **an interactive row that sits on a surface wants
`text-fg` on hover, not `--on-brand`.** `--on-brand` belongs only to elements
that also set a solid brand-or-status background.

The same pairing test found three more instances the report did not mention:

| Place | Was | Why it broke |
| --- | --- | --- |
| Login form input | `bg-surface-hover … text-on-brand` | typed text was white on a light field. Masked until round three removed the navy hero behind the card — a regression introduced by the hero fix |
| Filters FAB (inactive) | `from-surface-hover to-surface-sunken text-on-brand` | neutral plate, white icon |
| 31 buttons | `text-on-brand disabled:bg-line-strong` | disabled plate is `#cbd3df` in light; label stayed white (≈1.6:1) |

A ratchet counts literals. It cannot catch a *correct token used in the wrong
place*, so this class of bug needs a **pairing grep** — `text-on-brand` on a line
with no `bg-brand` / `bg-{status}` — rather than a count. That check is now part
of the review routine, and `text-on-brand` no longer appears on any hover.

