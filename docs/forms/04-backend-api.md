# 04 — Backend API Reference

Schema name: **`form_definition`**. All acts follow the Lesan convention
(`{ service, model, act, details: { set, get } }`), authenticate with the `token`
header (no `Bearer` prefix), and return the standard `{ success, body }` envelope.

## Acts

| Act | Access | Purpose |
| --- | ------ | ------- |
| `add` | Manager, OrgHead, UnitHead | create a draft definition |
| `update` | Manager, OrgHead, UnitHead | replace the definition wholesale |
| `get` | any authenticated, **scoped to the caller's orgs** | read one definition |
| `gets` | any authenticated, **scoped to the caller's orgs** | list, paged and filterable |
| `count` | any authenticated, **scoped to the caller's orgs** | count for pagination |
| `remove` | Manager, OrgHead, UnitHead | delete (never an active one) |
| `activate` | Manager, OrgHead, UnitHead | validate, archive the previous, publish |
| `duplicate` | Manager, OrgHead, UnitHead | clone as a new draft |
| `getForPatrol` | any authenticated | active definition + resolved options |
| `getReferenceOptions` | any authenticated | option rows for a reference model |
| `validate` | any authenticated, **scoped to the caller's orgs** | server-side rule evaluation |

`getForPatrol` and `validate` deliberately have **no `grantAccess`**: a patrol
officer and an org head must both be able to render and check a form.
Authorization there is by org resolution, not by level.

The four read acts are still **scoped**. Each resolves its effective
organization through `orgFilterFor` → `getAllowedManagerOrgIds`, the same helper
`accident_process.gets` uses:

- Ghost and Manager pass no filter and may read across organizations.
- Everyone else is pinned to the organizations they belong to. Passing an
  `organizationId` outside that set throws «شما به این سازمان دسترسی ندارید».
- Omitting `organizationId` with several organizations in scope throws
  «شناسه سازمان را مشخص کنید» rather than silently listing all of them.

`validate` reports «فرم یافت نشد» for a definition outside the caller's scope, so
a caller cannot probe another organization's questions through its error list.
Covered by `back/test/form-definition-access-test.ts`.

## Models

### form_definition

An org-scoped form definition.

```ts
{
  name: string;
  description?: string;
  icon: string;                              // one of the 80 shared @forms icon names
  form_kind: "accident" | "incident_report"; // default "accident"
  status: "draft" | "active" | "archived";   // default "draft"
  version: number;                            // default 1, bumped on activate
  schema_version: number;                     // default 1
  definition: { schemaVersion?, name?, pages? };
  createdAt, updatedAt;
}
```

Relations: `organization` (single, **required**, reverse `form_definitions`)
and `registrer` (single, optional).

There is no `is_active` — `status` already carries that fact, and two sources of
truth for one fact is how a form ends up archived and active at once. There is no
`incident_type`: `form_kind` replaced it, and the number of forms per kind is now
asymmetric on purpose.

Two indexes enforce the asymmetry:

- A **partial unique index** on `{ "organization._id" }` filtered to
  `status: "active"` guarantees **at most one active accident form** per
  organization. Accident registration is one workflow; a second active accident
  form would make "the" accident form ambiguous for every client.
- `{ "organization._id", "form_kind", "status" }` serves the listings behind
  `getForPatrol` and the builder. `incident_report` forms are **unbounded** — an
  organization authors as many as its workflows need.

`activate` enforces the singleton in software too, so the user gets a Persian
message rather than a duplicate-key error.

### form_response

One officer's answers to one definition version.

```ts
{
  form_definition_id: string;   // raw ObjectId — see below
  definition_version: number;
  client_report_uuid?: string;  // correlates with accident.client_report_uuid
  answers?: Record<string, unknown>;              // the nested tree, as submitted
  flat_answers?: Array<{ field_key, path?, value?, values? }>;
  errors?: Issue[];   // { path, node_key, message, severity }
  warnings?: Issue[];
  createdAt, updatedAt;
}
```

Relations: `organization` (single, required), `definition` (single, optional),
`officer` (single, optional), `accident` (single, optional).

> **`form_definition_id` is a raw ObjectId, not a relation.** A filed report must
> stay readable after its definition is deleted — orphan resilience, per
> `back/AGENTS.md`. The `organization` relation carries the live tenancy join.

`flat_answers` is a flattened projection of the same data, so a report can be
found and aggregated without a bespoke pipeline per form.

## `activate` — the gate between draft and field use

This is the only place a definition's *semantics* are checked. The builder is a
convenience, not the authority.

```
1. reject if already active
2. assertOrgInActorScope
3. validateDefinitionStructure      → unique keys, known rule ops, path ops have a path
4. checkReferenceModels            → every reference model exists and has records
5. checkBindings                   → every relation/dto binding names a real target,
                                      and a relation/dto binding sits on a reference field
6. checkIcons                      → every icon is in the shared 80-name vocabulary
7. archive the previous active definition for this (org, form_kind) — accidents only
8. set status=active, version+1
```

Step 5 is why the wizard is validated at publish time rather than at submission
time: a relation binding is only legal when the *target model actually declares*
that relation (derived from Lesan `getSchemas()[target].mainRelations`, never a
hand-written list) and only on a `reference` field. An officer should not
discover a broken form after filling it in at the roadside.

Failures throw Persian messages:

- «فرم باید حداقل یک صفحه داشته باشد»
- «کلید «x» بیش از یک بار استفاده شده است؛ کلیدها باید یکتا باشند.»
- «عملگر «exec» در شرط نمایش فیلد «x» شناخته نشده است.»
- «شرط الزام فیلد «x» به مسیر فیلد نیاز دارد.»
- «مدل «collision_type» هیچ رکوردی ندارد؛ گزینه‌ای برای نمایش وجود ندارد.»
- «آیکون‌های نامعتبر در فرم: road»
- «فرم فعال قابل ویرایش نیست؛ ابتدا آن را غیرفعال کنید»
- «فرم فعال قابل حذف نیست؛ ابتدا آن را بایگانی کنید»

A rejected definition **stays a draft**.

## `getForPatrol` — the runtime path

Request:

```jsonc
{ "set": { "formKind": "accident" | "incident_report", "orgId": "…" , "definitionId": "…" },
  "get": { "form": 1, "options": 1, "version": 1 } }
```

Resolution order:

1. **Organization.** Ghost/Manager must pass `orgId`. Others resolve via
   `roles[].scopeType === "organization"` → `unit` → `unit.organization` →
   `unit.officers`. If none, throws «سازمان مأمور یافت نشد؛ ابتدا در واحد گشت عضو شوید».
2. **Definition.** An explicit `definitionId` previews a draft (used by the
   builder). Otherwise the org's active definition for this `formKind` wins. When
   the org has no active accident form, `{ form: null }` is a legitimate answer —
   the client is expected to fall back to its own bundled definition rather than
   block the officer.
3. **Options.** Every `reference` model in the tree is resolved to
   `{ model: [{ _id, name }] }`, one query per model.
4. **Whitelist stripping.** `allowedIds` is deleted from the returned definition.

Response:

```jsonc
{
  "form": { "_id", "name", "schema_version", "definition": { … } } | null,
  "options": { "collision_type": [{ "_id", "name" }], … },
  "version": { "version": 2 }
}
```

`{ "form": null }` means the org has published no form for this incident type —
**not an error**. The caller falls back to the built-in flow.

Option resolution happens server-side on purpose. A narrowed option list cannot
be computed on a device that may be offline and cannot enumerate a reference
model at all.

## `validate` — server-side rule evaluation

Request:

```jsonc
{ "set": { "_id": "<definitionId>", "answers": { … }, "pageKey": "scene" },
  "get": {} }
```

Runs `validateForm` — **the same function mobile runs offline** — against the
stored definition. This is what makes the backend authoritative: a stale,
tampered, or older client cannot file a form its own definition forbids.

```jsonc
{
  "errors":   [{ "path": "vehicles[0].type", "node_key": "vehicleType",
                 "message": "نوع وسیله نقلیه الزامی است.", "severity": "error" }],
  "warnings": [{ "path": "vehicles[0].mobility", "node_key": "mobility",
                 "message": "این وسیله به جرثقیل نیاز دارد.", "severity": "warning" }],
  "blockedPages": ["scene"],
  "canSubmit": false,
  "definition_version": 2,
  "schema_version": 1
}
```

`pageKey` narrows the report to one page for per-section feedback.

## `getReferenceOptions`

```jsonc
{ "set": { "model": "collision_type", "ids": [...], "search": "بر", "limit": "50" },
  "get": { "model": 1, "items": 1 } }
```

The `model` must be in `REFERENCE_MODEL_NAMES`. The allow-list exists so this act
cannot be used to enumerate arbitrary collections. `limit` is capped at 500.

## Module licensing

The engine is gated behind a new module key, **`forms`**.

```
install level   : models/module_config.ts → { key: "app_modules", modules: [...] }
organization    : organization.module_flags
act map         : back/src/app_modules/moduleConfig.ts
```

| Layer | Behaviour |
| ----- | --------- |
| Install off | «این ماژول برای این نصب فعال نیست» — Ghost exempt |
| Org off | «این ماژول برای این سازمان فعال نیست» — Ghost exempt |

Gated schemas: `form_definition`, `form_response` (whole-schema wildcards).

> **`forms` must stay last in `MODULE_KEYS`.** `moduleKeyFor` returns on the
> **first** matching key in that array, so a whole-schema wildcard for
> `incident_patrol` would otherwise shadow the forms schema.

Absent org flags normalise to enabled, so pre-existing orgs are unaffected.

Core acts — `accident.get/gets/add/update/remove/count`, auth, geography,
reference models, general files, `operation_log` — are **never** gated. Licensing
the form engine cannot break filing a report.

## Declaration sync

After any model or validator change, regenerate and copy:

```bash
cd back && TYPE_GENERATION=true deno run -A mod.ts   # writes declarations/selectInp.ts
cd .. && cp -v back/declarations/selectInp.ts front/src/types/declarations/
```

Mobile reads the backend copy directly via `@backend/selectInp`. Never hand-edit
the declaration.

## Known gaps in the backend

- **`form_response` has no write act yet.** The model exists and answers are
  validated and bound, but nothing persists a response document. Submission still
  flows through `accident.add` / `accident.update` with the bound typed fields,
  which is why the charts keep working today.
- **`update` is wholesale, not partial-merge.** That is intentional — the builder
  saves the whole draft at once, so a node the author deleted actually disappears.
