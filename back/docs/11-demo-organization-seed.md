# Demo organization seed — credentials, data and how to run it

Reference for the act `user.seedDemoOrganization`, which seeds one realistic demo organization:
**شرکت احداث، نگهداری و بهره‌برداری آزادراه اهواز – بندر امام (ره)** — the Ahvaz – Bandar Imam
(RAH) Freeway Construction, Maintenance and Operation Company.

It creates the road, the organization, 6 units, 17 people, 12 vehicles, and 4 **active** form
definitions — so a demo can log in as a patrol officer on a phone and actually file reports.

- **Act:** `user.seedDemoOrganization` (service `main`, model `user`)
- **Source:** `back/src/user/seedDemoOrganization/` — `org.ts`, `people.ts`, `forms.ts`,
  `seedDemoOrganization.fn.ts`, `seedDemoOrganization.val.ts`, `mod.ts`
- **Proof test:** `back/test/seed-demo-organization-test.ts` (16 tests)

Every value below is read from those source files, so this table cannot drift from the code.

---

## 1. How to run it

### Prerequisites

The backend must be running (default `http://localhost:1404`, POST endpoint `/lesan`).

```bash
cd back
deno task bc-dev
```

### The order matters — run these three steps in sequence

Two preconditions are checked _before_ the seed creates anything, and each has its own precondition
of its own. Skipping a step does not half-seed the organization; it refuses with a clear Persian
error naming what to do.

| # | Act                         | Run as           | Why it comes first                                                                                                                          |
| - | --------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | `app_modules.setModules`    | **Ghost**        | `form_definition.*` is gated behind the `forms` module. Only Ghost may change modules.                                                      |
| 2 | `user.seedShared`           | Manager or Ghost | Fills the 16 reference models (`road_defect`, `position`, `light_status`, …). Without records, `activate` refuses any form that names them. |
| 3 | `user.seedDemoOrganization` | Manager or Ghost | The seed itself.                                                                                                                            |

> **A brand-new database has no modules enabled at all.** If you skip step 1 you get
> «این ماژول برای این نصب فعال نیست».

### Step 1 is just `"set": {}`

`setModules` takes an **optional** `modules` list, and omitting it means "turn everything on" — the
same default a fresh install already gets. So leave the **Set** panel empty:

```json
{
	"service": "main",
	"model": "app_modules",
	"act": "setModules",
	"details": { "set": {}, "get": {} }
}
```

You only need to send the list if you want something _off_:

```json
"set": {"modules": [
  {"key":"charts","enabled":true},
  {"key":"incident_patrol","enabled":true},
  {"key":"warehouse","enabled":false},
  {"key":"forms","enabled":true}
]}
```

`modules` **replaces** the whole stored set — it is not a patch. `key` must be one of exactly four
values: `charts`, `incident_patrol`, `warehouse`, `forms`. A stored list that is empty or missing also
reads as "all on", so you cannot switch _every_ module off through this act.

### Option A — the Playground (easiest)

1. Open `http://localhost:1404` → **Playground** tab.
2. First sign in as the Ghost account (see §6 for the bootstrap password) so you can enable modules.
3. Run the three acts from the schema/act selectors, in order.

The Playground builds the `get` object for you from the act's own validator, so you can leave the
**Get** panel empty for every step.

### Option B — curl

```bash
BACKEND=http://localhost:1404/lesan
```

**Step 1 — enable every module (Ghost only).**

`set` is empty on purpose: an omitted `modules` means "everything on".

```bash
GHOST_TOKEN=$(curl -s -X POST "$BACKEND" \
  -H 'Content-Type: application/json' \
  -d '{"service":"main","model":"user","act":"login",
       "details":{"set":{"email":"ghost@nejat.ai","password":"password123"}}}' \
  | jq -r '.body.token')

curl -s -X POST "$BACKEND" -H 'Content-Type: application/json' \
  -H "token: $GHOST_TOKEN" \
  -d '{"service":"main","model":"app_modules","act":"setModules","details":{"set":{}}}'
```

**Step 2 — `seedShared`.**

```bash
MANAGER_TOKEN=$(curl -s -X POST "$BACKEND" \
  -H 'Content-Type: application/json' \
  -d '{"service":"main","model":"user","act":"login",
       "details":{"set":{"email":"<your manager email>","password":"<your manager password>"}}}' \
  | jq -r '.body.token')

curl -s -X POST "$BACKEND" -H 'Content-Type: application/json' \
  -H "token: $MANAGER_TOKEN" \
  -d '{"service":"main","model":"user","act":"seedShared","details":{"set":{}}}'
```

**Step 3 — the seed.**

```bash
curl -s -X POST "$BACKEND" -H 'Content-Type: application/json' \
  -H "token: $MANAGER_TOKEN" \
  -d '{"service":"main","model":"user","act":"seedDemoOrganization","details":{"set":{}}}' \
  | jq
```

Both seed acts take **no input at all** — `set` is `{}`. Everything comes from the constants, and
both are idempotent: run them twice and nothing is duplicated. Each also _says_ so —
`user.seedShared` returns `alreadySeeded: true` and `user.setModules` returns `changed: false` when
there was nothing to do.

### Option C — the proof test

The fastest way to get a fully seeded database with nothing else in it, since the test clears the
collections first:

```bash
cd back && deno test -A test/seed-demo-organization-test.ts
```

It leaves the data in place (its final cleanup empties the collections), so run it, then start the
dev server against the same database if you want to click around.

### The response

`set` and `get` can both be left empty, but the full summary is what you want in practice — it hands
you every id the seed just created, plus which entities were created versus reused:

```jsonc
{
	"demoPassword": "Demo@1404",
	"organization": { "_id": "…", "code": "AHR", "name": "شرکت احداث، … (ره)" },
	"road": { "_id": "…", "name": "آزادراه اهواز – بندر امام" },
	"units": [
		{ "_id": "…", "code": "AHR-NM-01", "name": "…", "type": "Maintenance" }
	],
	"orgHead": {
		"_id": "…",
		"email": "orghead@ahvaz-freeway.ir",
		"level": "OrgHead"
	},
	"unitHeads": [
		{ "_id": "…", "email": "head.nm01@…", "unitCode": "AHR-NM-01" }
	],
	"officers": [
		{ "_id": "…", "email": "patrol.nm01.1@…", "unitCode": "AHR-NM-01" }
	],
	"vehicles": [
		{
			"_id": "…",
			"plaque_no": ["41", "ب12", "301"],
			"title": "…",
			"unitCode": "…"
		}
	],
	"forms": [
		{
			"_id": "…",
			"name": "…",
			"form_kind": "incident_report",
			"icon": "roadHorizon",
			"status": "active",
			"version": 2,
			"activated": true
		}
	],
	"totalCreated": 37,
	"totalReused": 0
}
```

`activated: false` means that form was already active and this run deliberately left it alone.
`totalCreated: 37` on a clean database (1 road + 1 org + 6 units + 17 users + 12 vehicles); the four
forms are reported separately in `forms`.

`alreadySeeded: true` means nothing was created **and** every form was already active — i.e. this
call changed nothing. It is deliberately not just `totalCreated === 0`: a half-seeded organization
(road and units present, forms missing) also reports `totalCreated === 0`, and saying
`alreadySeeded` there would be a lie.

To request it from the Playground, tick the boxes in the **Get** panel, or send:

```json
"details": {"set": {}, "get": {
  "organization": 1, "road": 1, "units": 1, "orgHead": 1,
  "unitHeads": 1, "officers": 1, "vehicles": 1, "forms": 1,
  "demoPassword": 1, "totalCreated": 1, "totalReused": 1
}}
```

---

## 2. Credentials

**One shared password for every seeded account:**

```
Demo@1404
```

It is 9 characters because `user.login` validates the password with `size(string(), 8, 100)`. It is
hashed **once** with bcrypt and reused for all 17 accounts (bcrypt is deliberately slow; 17
identical hashes would be 17× the work for no gain). The constant lives at
`back/src/user/seedDemoOrganization/people.ts` and is returned by the act as `demoPassword` — this is
a demo, not a secret.

**Sign in as any of them:**

```bash
curl -s -X POST "$BACKEND" -H 'Content-Type: application/json' \
  -d '{"service":"main","model":"user","act":"login",
       "details":{"set":{"email":"patrol.gs03.1@ahvaz-freeway.ir","password":"Demo@1404"},
                  "get":{"token":1,"permissions":1}}}'
```

Add a `device` payload to get a device-scoped patrol session (this is what the mobile app sends; it
requires `level: "Patrol"` or `"Ghost"`):

```json
"device": {"device_id":"demo-device-001","fingerprint":"demo-fingerprint-001",
           "platform":"ios","app_version":"1.0.0"}
```

### All 17 accounts

Email = `<key>@ahvaz-freeway.ir`. Mobile = `0912` + 7 digits. Personnel code is numeric-only and
unique. `no` is the sequence number the other fields derive from.

| #  | Email                            | Name           | Father's name | Level       | Mobile        | Personnel code |
| -- | -------------------------------- | -------------- | ------------- | ----------- | ------------- | -------------- |
| 1  | `orghead@ahvaz-freeway.ir`       | کریم نیک‌روش    | علی           | **OrgHead** | `09121000001` | `1404001`      |
| 2  | `head.nm01@ahvaz-freeway.ir`     | حسن فراهانی    | اکبر          | UnitHead    | `09121000002` | `1404002`      |
| 3  | `head.op02@ahvaz-freeway.ir`     | مریم شریفی     | حسین          | UnitHead    | `09121000003` | `1404003`      |
| 4  | `head.gs03@ahvaz-freeway.ir`     | سعید بهرامی    | محمد          | UnitHead    | `09121000004` | `1404004`      |
| 5  | `head.gs04@ahvaz-freeway.ir`     | زهرا کاظمی     | مهدی          | UnitHead    | `09121000005` | `1404005`      |
| 6  | `head.lj05@ahvaz-freeway.ir`     | رضا موسوی      | جواد          | UnitHead    | `09121000006` | `1404006`      |
| 7  | `head.ad06@ahvaz-freeway.ir`     | نگار احمدی     | رضا           | UnitHead    | `09121000007` | `1404007`      |
| 8  | `patrol.nm01.1@ahvaz-freeway.ir` | علی رحیمی      | صفر           | **Patrol**  | `09121000008` | `1404008`      |
| 9  | `patrol.nm01.2@ahvaz-freeway.ir` | ابوالفضل اکبری | ناصر          | Patrol      | `09121000009` | `1404009`      |
| 10 | `patrol.op02.1@ahvaz-freeway.ir` | محمدجواد نصیری | هادی          | Patrol      | `09121000010` | `1404010`      |
| 11 | `patrol.op02.2@ahvaz-freeway.ir` | امیر حسینی     | مسعود         | Patrol      | `09121000011` | `1404011`      |
| 12 | `patrol.gs03.1@ahvaz-freeway.ir` | سمیرا پارسا    | فرهاد         | Patrol      | `09121000012` | `1404012`      |
| 13 | `patrol.gs03.2@ahvaz-freeway.ir` | فاطمه صادقی    | باقر          | Patrol      | `09121000013` | `1404013`      |
| 14 | `patrol.gs04.1@ahvaz-freeway.ir` | مهدی گودرزی    | اسد           | Patrol      | `09121000014` | `1404014`      |
| 15 | `patrol.gs04.2@ahvaz-freeway.ir` | سینا فتحی      | داریوش        | Patrol      | `09121000015` | `1404015`      |
| 16 | `patrol.lj05.1@ahvaz-freeway.ir` | رویا امینی     | سهراب         | Patrol      | `09121000016` | `1404016`      |
| 17 | `patrol.ad06.1@ahvaz-freeway.ir` | کامران یزدانی  | بهروز         | Patrol      | `09121000017` | `1404017`      |

**Which account to use for what**

| To do this                           | Sign in as                                                     |
| ------------------------------------ | -------------------------------------------------------------- |
| File a report from the mobile app    | any `Patrol` — e.g. `patrol.gs03.1@ahvaz-freeway.ir`           |
| See reports in the oversight console | `orghead@ahvaz-freeway.ir` (the OrgHead)                       |
| Re-seed or manage modules            | a Manager, or the Ghost                                        |
| Bootstrap the very first account     | `ghost@nejat.ai` / `password123` — see `user.setGhostPassword` |

> **The OrgHead is not optional.** `resolveOversightScope` routes OrgHead/UnitHead to
> `getOrgReportBase` and rejects every other level, so without account #1 **nobody** can see the
> demo reports in the console.

> **Every officer belongs to exactly one unit, deliberately.** `resolveFilingOrgId` returns an
> organization only when the officer's unit set resolves to a single org, so a two-unit officer would
> file reports the console cannot attribute. The seed refuses (in Persian) rather than create that.

---

## 3. Organization and road

|                         |                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| **Organization `code`** | `AHR` — required and uniquely indexed; this is the idempotency key                         |
| **Name**                | شرکت احداث، نگهداری و بهره‌برداری آزادراه اهواز – بندر امام (ره)                            |
| **English name**        | Ahvaz – Bandar Imam (RAH) Freeway Construction, Maintenance, and Operation Company         |
| **Road**                | آزادراه اهواز – بندر امام — origin اهواز, destination بندر امام, 60,000 m                  |
| **Geometry**            | 7-vertex GeoJSON `MultiLineString`, `[longitude, latitude]`, Ahvaz (NW) → Bandar Imam (SE) |

`organization.road` also creates the reverse `road.organization`. An org is road-bound in this
schema, and the oversight console reaches legacy records through `road._id`, so a roadless demo org
would be much less useful.

---

## 4. The 6 units

Each unit carries the organization's **own road** — that equality is a real invariant
(`unit.add` refuses a unit whose road differs from its org's, and the seed inserts directly, so
nothing else would check it). Two vehicles per unit.

| Code        | Name                            | Type           | Head (email)                | Officers (emails)                    | Phone          |
| ----------- | ------------------------------- | -------------- | --------------------------- | ------------------------------------ | -------------- |
| `AHR-NM-01` | اداره نگهداری و تعمیرات         | Maintenance    | `head.nm01@…` — حسن فراهانی | `patrol.nm01.1@…`, `patrol.nm01.2@…` | `0611-3344010` |
| `AHR-OP-02` | اداره عملیات و کنترل تردد       | Ops            | `head.op02@…` — مریم شریفی  | `patrol.op02.1@…`, `patrol.op02.2@…` | `0611-3344020` |
| `AHR-GS-03` | اداره گشت محور شمال             | Patrol         | `head.gs03@…` — سعید بهرامی | `patrol.gs03.1@…`, `patrol.gs03.2@…` | `0611-3344030` |
| `AHR-GS-04` | اداره گشت محور جنوب             | Patrol         | `head.gs04@…` — زهرا کاظمی  | `patrol.gs04.1@…`, `patrol.gs04.2@…` | `0611-3344040` |
| `AHR-LJ-05` | اداره پشتیبانی و لجستیک         | Logistics      | `head.lj05@…` — رضا موسوی   | `patrol.lj05.1@…`                    | `0611-3344050` |
| `AHR-AD-06` | اداره امور اداری و منابع انسانی | Administration | `head.ad06@…` — نگار احمدی  | `patrol.ad06.1@…`                    | `0611-3344060` |

All addresses: `اهواز، کیلومتر ۱۵ آزادراه اهواز – بندر امام` plus the unit's own building.

Unit types come from `unit_type_array` in `back/models/unit.ts`.

---

## 5. Vehicles

`plaque_no` is a 3-string tuple: two digits, the letter `ب` with two digits, three digits.

| Plaque       | Title                                | Unit        |
| ------------ | ------------------------------------ | ----------- |
| `41 ب12 301` | پاترول ۴۱ — نگهداری و تعمیرات        | `AHR-NM-01` |
| `42 ب12 302` | تعمیرگاه سیار ۴۲ — نگهداری و تعمیرات | `AHR-NM-01` |
| `51 ب23 401` | پاترول ۵۱ — عملیات و کنترل تردد      | `AHR-OP-02` |
| `52 ب23 402` | خودروی پایش ۵۲ — عملیات و کنترل تردد | `AHR-OP-02` |
| `63 ب34 501` | پاترول ۶۳ — گشت محور شمال            | `AHR-GS-03` |
| `64 ب34 502` | پاترول ۶۴ — گشت محور شمال            | `AHR-GS-03` |
| `75 ب45 601` | پاترول ۷۵ — گشت محور جنوب            | `AHR-GS-04` |
| `76 ب45 602` | پاترول ۷۶ — گشت محور جنوب            | `AHR-GS-04` |
| `87 ب56 701` | وانت پشتیبانی ۸۷ — لجستیک            | `AHR-LJ-05` |
| `88 ب56 702` | خودروی لجستیک ۸۸ — لجستیک            | `AHR-LJ-05` |
| `99 ب67 801` | خودروی اداری ۹۹ — امور اداری         | `AHR-AD-06` |
| `90 ب67 802` | خودروی اداری ۹۰ — امور اداری         | `AHR-AD-06` |

---

## 6. The 4 forms

All are activated through the **real `form_definition.activate` act**, so every publish-time check
(structure, reference models, icons, bindings) actually ran. A form that survived activation is a
form that can genuinely record.

| Name                                  | `form_kind`       | Icon          | What it demonstrates                                                                                                                                                           |
| ------------------------------------- | ----------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| گزارش تصادف آزادراه اهواز ـ بندر امام | `accident`        | `car`         | The QA team's exact form, verbatim — 9 pages, nested passengers, dynamic option filters, tone-coded choices. The org's **single** active accident form.                        |
| خرابی سطح راه (road damage)           | `incident_report` | `roadHorizon` | `reference` option lists, a **multi-relation** binding to `road_defects`, a single-relation binding to `incident_severity`, `number` fields with min/max validation, `boolean` |
| مانع در سطح راه (road obstruction)    | `incident_report` | `barricade`   | A `computed` field driven by `valueFrom`, `datetime`, conditional requiredness (`requiredWhen`), binding to `position` and `equipment_damages`                                 |
| خرابی روشنایی (lighting failure)      | `incident_report` | `lightbulb`   | Binding to `light_status` and `road_situation`, numeric validation, conditional visibility                                                                                     |

The three report forms exercise reference-driven options and relation bindings that the QA form does
not use at all — it has **zero** `reference` options and exactly one binding. That is deliberate: the
demo shows the engine's range rather than three copies of one shape.

An officer's device fetches the active form for their organization with:

```bash
curl -s -X POST "$BACKEND" -H 'Content-Type: application/json' \
  -H "token: $OFFICER_TOKEN" \
  -d '{"service":"main","model":"form_definition","act":"getForPatrol",
       "details":{"set":{"formKind":"incident_report"},"get":{"form":1}}}'
```

An OrgHead can see the org's forms through `form_definition.gets` instead.

---

## 7. Re-running the seed

**Safe to run any number of times.** Idempotency keys:

| Entity       | Keyed on                                |
| ------------ | --------------------------------------- |
| Organization | `code === "AHR"`                        |
| Road         | name, scoped to the owning organization |
| Unit         | `code`, scoped to the organization      |
| User         | `email`                                 |
| Vehicle      | `plaque_no`                             |
| Form         | `(organization, form_kind, name)`       |

On the second run you get `totalCreated: 0`, `totalReused: 37`, and every form reports
`activated: false` with an **unchanged `version`** — the seed skips an already-active form rather
than re-activating it (which `activate` would refuse anyway with «فرم از قبل فعال است»).

Two deliberate non-destructive choices, so re-running never destroys work:

- An existing form's `definition` is **never** overwritten. If you edited a form in the builder, the
  seed leaves your edit alone.
- Multiple relations (`unit.officers`, `unit.vehicles`) are patched additively. An officer or vehicle
  a demo operator added by hand survives.

### Known consequence: forms are write-once

Because the seed never overwrites a definition and skips already-active forms, **a fix to
`forms.ts` will not reach an already-seeded organization.** To pick up a definition change you must
`form_definition.remove` the form and re-run the seed, or drop the database. This is the right
default for a demo seeder — it will not silently revert an operator's edits — but it is worth knowing
before you change a form and wonder why nothing moved.

There is deliberately **no `reset` flag**. Re-running already converges; a destructive path has no
place in a demo seeder.

---

## 8. Cleaning up — `user.cleanupDemoSeed`

Removes what the three seeding acts created. **Every call is a dry run unless you pass
`confirm: true`**, so the first call always tells you what a confirming call would remove:

```bash
curl -s -X POST "$BACKEND" -H 'Content-Type: application/json' \
  -H "token: $MANAGER_TOKEN" \
  -d '{"service":"main","model":"user","act":"cleanupDemoSeed",
       "details":{"set":{"scope":["demo"]}}}'
```

The response carries `wouldDelete`, a count per model, and `preserved` — the rows it declined to
touch. To actually delete, add `"confirm": true`.

| `scope`     | Removes                                                                                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `demo`      | org `AHR`, its road, 6 units, 17 users, 12 vehicles, its 4 form definitions, plus any accident or incident report those officers filed |
| `reference` | only rows `user.seedShared` actually inserted                                                                                          |
| `modules`   | the module-config singleton; it is recreated as all-on at the next boot                                                                |
| `all`       | all three (the default when `scope` is omitted)                                                                                        |

Level: **Ghost or Manager**. A Manager can clear a demo seed without borrowing Ghost; only Ghost
resets the `modules` scope, matching `setModules`' own Ghost-only gate.

### What `reference` will _not_ delete

`user.seedShared` skips any name that already exists, so a row that shares a seeded name is
**never stamped** and is indistinguishable from a seeded one by name. Those are real rows of yours,
so cleanup preserves them and lists them under `preserved.names` rather than passing over them in
silence.

In practice this means your pre-existing `air_status` rows — `صاف`, `ابری`, `بارانی`, `باد شدید`,
`گرد و غبار`, `مه‌آلود` — survive a `reference` cleanup, because they were in the database before
the seed ever ran. Only rows the seed inserted itself carry the marker. If you want that data gone,
delete it directly rather than through this act.

## 9. If seeding fails with `E11000 duplicate key … national_number_1`

A database created before `national_number` became optional carries a **unique, non-sparse** index
on that field, and Mongo allows only one document with a missing value under it — so the _second_
seeded user can never be inserted.

`applyUserIndexMigrations()` drops that index at boot, so this is fixed automatically on any
database the current code starts. If you are running against a database that has not been restarted
since this change, drop it by hand:

```bash
mongosh nejat --quiet --eval 'db.user.dropIndex("national_number_1")'
```

## 10. Verify it worked

```bash
# the whole proof, including a filed accident and a filed report
cd back && deno test -A test/seed-demo-organization-test.ts
```

Or check by hand, as the OrgHead:

```bash
# both documents the proof test files must be visible here
curl -s -X POST "$BACKEND" -H 'Content-Type: application/json' \
  -H "token: $ORGHEAD_TOKEN" \
  -d '{"service":"main","model":"incident_report","act":"getOversightList",
       "details":{"set":{"page":1,"limit":20},"get":{}}}'
```

A `null` or empty list means the `organization` relation was not resolved server-side on the filed
document — that is the one seam the whole feature rests on, and the test asserts it explicitly.

---

## 11. Troubleshooting

| Error (Persian)                                               | Meaning                                                | Fix                                                                               |
| ------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| ماژول «forms» برای سازمان این دمو فعال نیست…                  | The `forms` module is off                              | Run `app_modules.setModules` as **Ghost** (step 1 above)                          |
| فرم‌های دمو به مدل‌های مرجعی نیاز دارند که هیچ رکوردی ندارند: … | `seedShared` has not run                               | Run `user.seedShared` (step 2), then the seed again                               |
| ایمیل یا رمز عبور صحیح نیست                                   | Wrong password                                         | `Demo@1404`, capital D, capital `@`                                               |
| این حساب اجازه استفاده از اپ مأمور گشت را ندارد               | Logged in with a `device` payload as a non-Patrol user | Use a `Patrol` account, or drop the `device` payload                              |
| فرم از قبل فعال است                                           | Something tried to activate an active form             | Nothing to do — the seed skips these; only appears if you call `activate` by hand |

Both seed refusals are raised **before** anything is created, so a refusal never leaves a
half-built form set.

---

## 12. What the seed deliberately does not do

- **No police stations, shifts, announcements or geo records.** Core scope only, per the plan.
- **It does not grant a module licence.** `organization.module_flags` is Ghost-only via
  `organization.setModules`; the seed checks and reports instead of handing out a licence.
- **An accident cannot be filed against a form by id.** The `accident` model declares no
  `form_definition_id`, so sending one is rejected outright. This is the shipped mobile design: an
  accident filed under a form carries its answers in `dynamic_answers` and sends no form id. Only
  `incident_report.add` takes a `form_definition_id`, and it requires one.
- **No police-station-style detail pages for org leaders.** Org leaders can list and see stats, but
  opening a single record throws for both models. Pre-existing, unrelated to this seed.
