# Demo organization seed — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** A Playground-callable act that seeds one realistic demo organization — the Ahvaz–Bandar Imam freeway company — with its road, units, officers and vehicles, plus the QA team's exact accident form and three demo report forms, all active and able to record.

**Architecture:** One new Ghost/Manager-gated act, `user.seedDemoOrganization`, modelled on the existing `user.seedShared`. Idempotent on the organization's `code`. Forms are activated through the real `form_definition.activate` act rather than inserted directly, so the singleton guarantee and the publish-time binding/icon validation both apply — a form that survives real activation is a form that can genuinely record.

**Tech Stack:** Deno + Lesan 0.1.26, Superstruct validation, bcrypt (already a dep).

**Spec:** the conversation decisions below; no separate spec file.

## Decided with the user

- Fresh session; do not attempt in the session that wrote this plan.
- **Core scope only:** organization, road, 6 units, ~10 patrol officers, vehicles. Not police stations, shifts, announcements or geo records.
- **Forms:** the exact QA accident form, plus three focused demo forms — road damage (خرابی سطح راه), road obstruction (مانع در سطح راه), lighting failure (خرابی روشنایی).

## The decisive finding

**The exact QA form already exists.** `mobile/src/domain/qa-accident-form.ts` exports `qaAccidentFormDefinition: FormDefinition` — a 699-line faithful encoding of `qa_docs/QA_AR/Accident_Report_App.html`, maintained as the engine's acceptance test with 35 passing tests. Its header documents the mapping from every QA prototype behaviour (9-step wizard, `hasDamage` gate, plate variants, nested passengers, dynamic option filters, tone-coded choices) to a declarative mechanism.

**Seed that definition. Do not re-transcribe `qa_docs/QA_AR/فرم ثبت تصادف.pdf` or the HTML.** A second hand-maintained copy would drift from the one artifact the engine is tested against, and the QA team's intent is already encoded losslessly.

The backend cannot import from `mobile/` directly. Copy the definition **into the backend at seed time** — either by reading the exported object and transcribing it, or better: relocate/duplicate it into `shared/form-engine` so both sides reference one artifact. **Prefer the shared location**; if that proves awkward, a verbatim copy under `back/src/user/seedDemoOrganization/` with a header citing the source is acceptable, but say so in the report.

## Two ordering constraints — both learned the hard way

1. **`seedShared` must run first.** `activate` refuses a definition whose reference model has no records (`checkReferenceModels`). `seedShared` provides `air_status`, `light_status` and `road_surface_condition`. The seed must either require `seedShared` to have run or say so in a Persian error, and must **not** silently activate a form that will be refused.
2. **Every reference model a demo form names must have records**, or activation fails. Road damage needs `road_defect` rows; the QA form needs whatever it references. The seed must create those rows, or restrict the demo forms to models `seedShared` already populates. Verify per form rather than assuming.

## Files

| File | Responsibility |
| ---- | -------------- |
| `back/src/user/seedDemoOrganization/mod.ts` | `setAct` registration: `actName: "seedDemoOrganization"`, `preAct: [setTokens, setUser, grantAccess({levels: ["Manager", "Ghost"]})]` |
| `back/src/user/seedDemoOrganization/seedDemoOrganization.val.ts` | Validator — an optional `reset: boolean` at most; keep it near-empty like `seedShared` |
| `back/src/user/seedDemoOrganization/seedDemoOrganization.fn.ts` | All creation, idempotency, then activation |
| `back/src/user/seedDemoOrganization/org.ts` | Organization + road |
| `back/src/user/seedDemoOrganization/people.ts` | Units, officers, heads, vehicles |
| `back/src/user/seedDemoOrganization/forms.ts` | The QA accident form + three demo forms, activated via the real act |
| `back/test/seed-demo-organization-test.ts` | The proof, below |

Playground exposure is automatic once the act is registered — confirm by checking how `seedShared` appears.

## What to create

Persian name exactly as the user gave it:
**شرکت احداث، نگهداری و بهره‌برداری آزادراه اهواز – بندر امام (ره)**

English: *Ahvaz – Bandar Imam (RAH) Freeway Construction, Maintenance, and Operation Company.*

- **Organization** — `code: "AHR"`. Remember `code` is required and uniquely indexed (a prior test hit this). Do not leave it null.
- **Road** — آزادراه اهواز – بندر امام, related to the organization. An org is road-bound in this schema, and `resolveOversightScope` reaches legacy reports via `road._id`, so the road must exist and be linked.
- **6 units** — under the organization, each carrying its own head officer. `unit` also takes a denormalized `road`; set it.
- **~10 patrol officers** — spread across those units, level `Patrol`, with organization-scoped roles so `resolveUserOrgId` / `getOrgReportBase` resolve them. **They must have a usable password** (bcrypt — already a dependency via `user.login`), or the demo cannot log in. Use one obvious shared password and say which.
- **Vehicles** — per unit, related to the unit.

## Idempotency

Re-running must not duplicate. Key on `organization.code === "AHR"`; if it exists, reuse it and skip creation. Forms are keyed on `(organization, form_kind, name)`.

Note the non-transactional hazard this feature already documents: `activate` archives-then-activates without a transaction. A crash between the two steps can leave the org with no active accident form. That is acceptable for a **seed** — but say so in the function's doc comment rather than leaving it as a latent surprise.

## Forms

1. **QA accident form** — `qaAccidentFormDefinition`, activated with `form_kind: "accident"`. This is the org's single active accident form; activating a second would archive this one.
2. **خرابی سطح راه** (road damage) — `form_kind: "incident_report"`, icon from the shared vocabulary.
3. **مانع در سطح راه** (road obstruction) — `form_kind: "incident_report"`.
4. **خرابی روشنایی** (lighting failure) — `form_kind: "incident_report"`, referencing `light_status`.

Give each an icon from the 80-name shared vocabulary — `activate` validates icon names and will refuse an unknown one. Accentuate variety so the mobile picker's icons are visible in a demo.

Each demo form should exercise something the QA form does not, so the demo shows the engine's range rather than three copies of one shape.

## The test that matters

Not "the seed runs" — **"a report can actually be filed against the seeded forms, on both models."**

1. Run `seedShared`, then the seed.
2. Assert the org, road, 6 units, ~10 officers and their vehicles exist and are related correctly (assert the relations, not just the counts).
3. Assert the QA accident form is **active** for the org with `form_kind: "accident"`, and that exactly one active accident form exists.
4. Assert all three report forms are active.
5. **File a real accident through `accident.add` as one of the seeded patrol officers**, carrying the QA form's `form_definition_id` and provenance, then assert:
   - it was accepted,
   - its `organization` was resolved **server-side** from the officer's unit (this is the seam the whole feature rests on — if it is null, the oversight console will not show the report),
   - its `submitted_from` snapshot was stored.
6. **File a real report through `incident_report.add`** the same way, and assert the same three things.
7. **Assert the console can see them**: call `getOversightList` as the org's OrgHead and assert both documents come back. This is the end-to-end proof that seeding produced something usable, and it is the assertion most likely to catch a silently-wrong org scope.
8. Re-run the seed and assert no duplicates were created.

## Hard constraints

- **No git command that writes.** No `add`, `commit`, `checkout`, `stash`, `restore`.
- Backend formatting: tabs, 4-space indent width, 80 line width.
- Run backend tests **one file at a time** — the suites share a database and each drops it. If a run fails oddly, check `pgrep -fl "deno test"` for an orphan first.
- No new dependency.
- User-facing strings are Persian.
- Do not weaken `activate`'s validation to make the seed pass. If activation refuses something, fix the form.

## Verification before reporting

```bash
cd back && deno test -A test/seed-demo-organization-test.ts
cd back && deno test -A test/incident-report-test.ts
cd back && deno test -A test/oversight-list-test.ts
cd back && deno fmt --check
```

All must pass. Do not claim the seed works without assertion 7 having actually run.

## Open items to surface, not silently fix

- `accident.get` is registered with **no `preAct`** — no `setTokens`, no `grantAccess`. Pre-existing; an authorization decision, out of scope here.
- Org leaders still cannot open a detail page for either model (`incident_report.get` is Manager/Patrol; both review-history acts throw for OrgHead/UnitHead). Pre-existing; the console's list and stats work, its detail links do not.