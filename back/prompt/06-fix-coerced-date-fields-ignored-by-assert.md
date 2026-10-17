# Backend task: coerced date fields are silently ignored by `assert()`, so every `update` act rejects them

## Why this task exists

A patrol officer captures a report while offline, drives back into coverage, and the
submission fails:

```
At path: set.date_of_accident  -- Expected a valid `Date` object, but received: 2026-10-17
```

Nothing is wrong with the value. `2026-10-17` is what the app deliberately produces
(`mobile/src/domain/form-datetime.ts`), and the app's own comment states the intent:

```
 *   datetime  2026-10-01T12:30    `isValidDatetime` in `accident-form.ts`, and
 *                                 what `accident.date_of_accident: date()`
 *                                 accepts at submit time
```

The value is rejected because **the backend never coerces it on this act**. This is
not a mobile bug and no mobile change can work around it — see "Why the client cannot
fix this" below.

### The mechanism

`accidentSetSchema` declares its date fields as
`optional(coerce(date(), string(), (value) => new Date(value)))`
(`back/src/accident/accidentSetSchema.ts:26` and five siblings).

Lesan v0.1.26 applies coercers **only on the `create` path**
(`src/utils/serveLesan.ts`, in `runAct`):

```ts
if (act.validationRunType === "create") {
  const createdDetails = await create(body.details, act.validator);
  body = { ...body, details: createdDetails };
} else {
  assert(body.details, act.validator);
}
```

`create()` runs struct coercers. **`assert()` does not** — superstruct documents this
on `coerce` itself: *"You must use `create(value, Struct)` on the value to have the
coercion take effect! Using simply `assert()` or `is()` will not use coercion."*

So on any act without `validationRunType: "create"`, the raw **string** is handed
straight to `date()`, which tests `value instanceof Date`, and the request fails.

`accident.add` sets `validationRunType: "create"` (`back/src/accident/add/mod.ts:19`)
and works. `accident.update` does not set it at all
(`back/src/accident/update/mod.ts`) and fails. That is why a **new** report submits
correctly and a **correction or resubmission of an existing one** cannot.

### Reproduced in isolation

```js
const s = require("superstruct");
const schema = s.object({
  date_of_accident: s.optional(s.coerce(s.date(), s.string(), v => new Date(v))),
});

s.validate({ date_of_accident: "2026-10-17" }, schema);
// [ StructError: At path: date_of_accident -- Expected a valid `Date` object, but received: "2026-10-17" ]

s.create({ date_of_accident: "2026-10-17" }, schema);
// { date_of_accident: 2026-10-17T00:00:00.000Z }
```

Every string shape fails identically — `2026-10-17`, `2026-10-17T10:30`,
`2026-10-17T10:30:00.000Z`, `2026/10/17` — as does a numeric epoch. **The failure has
nothing to do with the client's date format**, so reformatting on the client cannot
help.

### Why the client cannot fix this

`date()` accepts only a real `Date` instance. JSON has no `Date` type, so no value
that can travel over the wire can satisfy it under `assert()`. The only client-side
"fix" would be to omit the field, which would silently drop an officer's correction.
This must be fixed on the server.

### Blast radius

Every act whose validator contains `coerce(date(), …)` but whose `mod.ts` does **not**
declare `validationRunType: "create"`:

| Act | Field | Declaration |
| --- | --- | --- |
| `accident.update` | `date_of_accident` | `accidentSetSchema.ts:26` |
| `accident.update` | `completion_date` | `accidentSetSchema.ts:34` |
| `accident.update` | `reported_at` | `accidentSetSchema.ts:44` |
| `accident.update` | `police_arrival_time` | `accidentSetSchema.ts:55` |
| `accident.update` | `insurance_date` (vehicle DTO) | `accidentSetSchema.ts:98` |
| `accident.update` | `body_insurance_date` (vehicle DTO) | `accidentSetSchema.ts:104` |
| `incident_report.update` | `reported_at` | `incident_report/setSchema.ts:32` |
| `incident_report.update` | `occurred_at` | `incident_report/setSchema.ts:33` |
| `incident_report.update` | `reviewed_at` | `incident_report/setSchema.ts:52` |
| `incident_report.update` | `completed_at` | `incident_report/setSchema.ts:54` |
| `user.registerUser` | `birth_date` | `user/register/registerUser.val.ts:19` |

`incident_report.update` and `user.registerUser` are latent: no current client sends
those fields with a string. They will fail the first time one does.

## What to change

### Recommended: put the affected acts on the `create` path

Add `validationRunType: "create"` to `back/src/accident/update/mod.ts` and
`back/src/incident_report/update/mod.ts`, matching what `add` already does. This is
the smallest change that makes the existing coercion do both jobs it was written for:
accept the wire string, and store a real `Date`.

It changes **no validator and no `set`/`get` shape**, so the generated declarations
are unaffected.

**The caveat you must handle deliberately.** `create()` also *fills defaults* for any
`optional(x, default)`. None of the schemas in play carry defaults today, so behaviour
is unchanged apart from coercion — but this makes "add a default" on a shared set
schema silently overwrite the stored value on every update. Note it in a comment on
each `mod.ts` you touch, so the next person does not add a default without knowing.

`user.registerUser` is a **create** act and does not need `create` for its own sake —
but it runs `assert()`, so its `birth_date` is broken today. Give it the same flag, or
fix it by the alternative below.

### Alternative (if you want validation to stop depending on the runner)

Make the schema accept the shape that actually arrives, and normalise in the act body
instead of relying on a coercer:

1. A small shared struct that validates a **string or `Date`** and whose coercer
   produces a `Date` — exported from a shared module (e.g. `@lib`), not redefined per
   validator, so the six accident fields and the four incident-report fields cannot
   drift apart again.
2. Because `assert()` skips coercers, the act `fn` must convert those fields to `Date`
   before writing.

This is more robust — it stops the whole class of bug — but it **changes validators**,
so `selectInp.ts` must be regenerated and copied to `front/`. Only take this path if
you are prepared for that.

### Do not

- Do not loosen `date_of_accident` to accept arbitrary strings without normalising it.
  Mongo stores the value as-is under `assert()`, and `accident.gets` /
  `getMyReports` filter and sort on it as a `Date`. A string there silently breaks
  date-range queries and the reports timeline.
- Do not special-case the mobile app. The bug is server-side and affects any client.
- Do not change the wire format the mobile already sends. It is correct and is
  documented in `mobile/src/domain/form-datetime.ts`.

## Verification

**Deno strips types without checking them.** `deno task bc-dev` boots happily with a
broken validator and throws at runtime on the first request that reaches it. A clean
boot proves nothing here — only the requests below are evidence.

1. **`accident.update` with a date-only string** — this is the reported failure:

   ```bash
   curl -sS "$LESAN_URL/lesan" \
     -H 'content-type: application/json' \
     -H "token: $TOKEN" \
     -d '{
       "service": "main",
       "model": "accident",
       "act": "update",
       "details": {
         "set": {
           "client_report_uuid": "<uuid of an existing report>",
           "date_of_accident": "2026-10-17"
         },
         "get": {}
       }
     }'
   ```

   Must return `success: true`. Before the fix it returns the
   `Expected a valid 'Date' object` error.

2. **`accident.update` with a datetime string** — `"2026-10-17T10:30"`, the format the
   seven-phase wizard produces. Must also succeed.

3. **The stored value is a real `Date`.** After step 1, read the document back
   (`accident.get` with `{ _id: 1, date_of_accident: 1 }`) and confirm the field comes
   back as an ISO string, **not** the literal `"2026-10-17"` string. If it round-trips
   as a string, the coercion did not run and the queries in step 4 will break.

4. **Date queries still work.** Run `accident.gets` with a
   `dateOfAccidentFrom` / `dateOfAccidentTo` range that includes the report from
   step 1. It must appear. This is the check that catches a half-fix where validation
   passes but the value was stored unconverted.

5. **The other coerced fields.** Exercise one field from each remaining row of the
   blast-radius table — at minimum `police_arrival_time` (phase 3 of the seven-phase
   wizard) and `insurance_date` inside a `vehicle_dtos` entry — through
   `accident.update`. Nested DTO coercion is easy to get wrong.

6. **`incident_report.update`** with `occurred_at: "2026-10-17"`, and
   **`user.registerUser`** with `birth_date: "1990-04-02"`.

7. **No regression on the working paths.** `accident.add` with `date_of_accident`
   still succeeds (it already used the `create` path — confirm the flag did not
   change its behaviour), and an update that sends **no** date field at all still
   succeeds and leaves the stored date untouched.

8. **Optional but cheap:** a regression test that runs a coerced-date payload through
   each act's own validator under **both** `create` and `assert`. That test would have
   caught this, and it is the only way the next added date field is protected.

## Constraints

- Do not change any act's `set`/`get` shape. `front/` type-checks against the
  generated declarations, so a contract change breaks it silently until regeneration.
  The recommended fix changes no validator at all, so this should not arise.
- If you do take the alternative path and regenerate declarations, use
  `TYPE_GENERATION=true deno run -A mod.ts` and copy the result to
  `front/src/types/declarations/`. Never hand-edit `selectInp.ts`; it is generated.
- Do not remove `validationRunType: "create"` from any act that currently has it —
  several `add` acts depend on it for their coerced dates, and the same latent bug is
  waiting in every `update` act that has not been given it.
- Preserve the `{ success, body }` envelope and translate errors centrally. The
  officer sees a friendly Persian message from `translateApiError`, never this raw
  validator text.
- The mobile client is correct as written. Do not ask it to change `date_of_accident`
  or the `date`/`datetime` field formats.