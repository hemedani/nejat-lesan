# Mobile task: the correction path sends `submitted_from`, which only `add` accepts

## Why this task exists

An officer files a report in the field, it syncs, they reopen it, fix a detail and
finish again. The submission fails:

```
At path: set.submitted_from -- Expected a value of type `never` but recieved: `[object object]`
```

`never` is superstruct's answer for an **unknown key** in a strict object — not a
wrong value. The app is sending a field the act's `set` schema does not declare.

The backend is right and the app is wrong. `submitted_from` is declared on the
`add` validators only, and each declaration says so in a comment:

```ts
// back/src/accident/add/add.val.ts:24-28
// Which app build filed this accident (snapshot, see
// `accident_submitted_from_struct`). `add` only: a correction of a
// returned report must not restamp the build that originally filed it.
submitted_from: optional(accident_submitted_from_struct),
```

```ts
// back/src/incident_report/add/add.val.ts:11-14
// ... `add` only: a correction of [a returned report] ...
submitted_from: object({ … }),
```

Neither `back/src/accident/update/update.val.ts` nor
`back/src/incident_report/update/update.val.ts` declares the key. So `add` works and
`update` cannot. This is the same act pair that the coerced-date bug
(`back/prompt/06-…`) lived in, which is why the officer hit the date error first and
only reached this one after that was fixed.

### Read the error before chasing it

The message in the field report was `set.submitted_form`. That key **does not exist
anywhere** in this repository or in its git history:

```bash
rg -n "submitted_form" . --glob '!node_modules'   # no hits
git log --oneline -S"submitted_form" --all        # no hits
```

The only key of that shape is `submitted_from`. Treat the pasted token as
`submitted_from` and confirm the exact key from the raw response before editing
anything. If a future report really does carry `submitted_form`, this is a different
bug and this prompt does not cover it.

## The mechanism

`src/services/sync-worker.ts` builds the payload **once**, then decides which act to
send it to. Provenance is decided before the act is chosen:

```ts
// src/services/sync-worker.ts:450
const provenance = submissionProvenance();
// :452  mapped = isReport ? buildIncidentReportAddSet(workingDraft, provenance)
//                        : buildAccidentAddSet(workingDraft)      // accident does not stamp it

// :475-481
const set: Record<string, unknown> = { ...mapped.set, ...roadFields(roadSnap) };
// The report mapper already stamps provenance; the accident mapper does not, so
// this fills it in once for both rather than teaching each mapper the same rule.
if (provenance && set['submitted_from'] === undefined) {
  set['submitted_from'] = { app_version: provenance.app_version, platform: provenance.platform };
}

// :487 — only now does anyone know whether this is a first send or a correction
const submission = pickSubmissionAction(submissionDraft);
```

and that single `set` goes to whichever of the four functions the action selects
(`src/services/sync-worker.ts:488-500`):

| draft state | accident | incident_report |
| --- | --- | --- |
| no `server_id` | `submitAccidentReport` → `accident.add` ✅ accepts the key | `submitIncidentReport` → `incident_report.add` ✅ |
| has `server_id` | `updateAccidentReportByUuid` → `accident.update` ❌ | `updateIncidentReportByUuid` → `incident_report.update` ❌ |

`pickSubmissionAction` (`src/domain/sync-rules.ts:72-77`) returns `update` whenever
the draft has a `server_id`, and `reconcileEditedSynced`
(`src/domain/sync-rules.ts:46-61`) is what puts an already-synced draft back into the
queue once the officer edits it. That pair is the entire trigger: **first send is
fine, correction is refused.**

Both report models are affected, and the worker's `=== undefined` guard means the
incident-report mapper's own stamp (`src/domain/incident-report-mapper.ts`,
asserted at `src/domain/incident-report-mapper.test.ts:159`) survives into the update
payload too. Stripping has to happen after the set is assembled, not inside either
mapper, or the report path keeps leaking it.

### Why no test and no type-checker caught this

- **Types.** `updateAccidentReportByUuid` takes `set: AccidentAddSet` — the *add*
  set type — and casts the payload with
  `as unknown as AccidentAddRequest['details']['set']` (`src/api/accident.ts:44-52`).
  The generated declarations for `accident.update` do **not** include
  `submitted_from`, so nothing about the current signature can object.
- **Tests.** `src/services/sync-worker.test.ts:255-270` already drives the whole
  correction flow and asserts `updateAccidentReportByUuid` was called once — but it
  asserts nothing about *what it was called with*. Line 362-369 checks
  `submitted_from` on the `add` path only. The suite is one assertion away from this
  bug and currently steps past it.

### Do not fix this on the backend

Two traps, both of which look reasonable:

- **Adding `submitted_from` to the update validators** would silence the error and
  break the documented rule: a correction must not restamp the build that originally
  filed the report. It would also change both validators' shape, which changes
  `selectInp.ts` and therefore the generated `front/` and `mobile/` declarations.
- **Relying on the act body to drop it.** `incident_report/update/update.fn.ts:67-80`
  deletes `form_definition_id`, `serial`, `review_status`, `reviewed_at` and friends
  from the payload — but that is the *act body*, and validation runs before it
  (`serveLesan.runAct`: `preValidation` → `assert`/`create` → `preAct` → `fn`). The
  request is already refused by then. Note `accident.update` has no such strip at all,
  so the two models do not even agree here.

## What to change

Only `src/services/sync-worker.ts`.

Move the act decision **above** the payload assembly and stamp provenance only for a
first send. Concretely:

1. Call `pickSubmissionAction(submissionDraft)` before building `set`.
2. Pass the provenance into the set only when the action is `add`.
3. Keep the report mapper's own stamp working for the `add` path — the simplest
   shape is to delete the key when the action is `update`, since both mappers and the
   worker write the same key:

   ```ts
   const set: Record<string, unknown> = { ...mapped.set, ...roadFields(roadSnap) };
   if (submission.act === 'update') {
     // `submitted_from` is `add`-only on the server: a correction must not restamp
     // the build that originally filed the report. See accident/add/add.val.ts.
     delete set['submitted_from'];
   } else if (provenance && set['submitted_from'] === undefined) {
     set['submitted_from'] = {
       app_version: provenance.app_version,
       platform: provenance.platform,
     };
   }
   ```

4. Leave `submissionProvenance()` exactly as it is. Its `0.0.0` rule is deliberate
   and separately tested: an Expo Go dev session reports no version, and a report
   must not claim a build the app cannot vouch for.

While you are in `src/api/accident.ts` and `src/api/incident-report.ts`: the update
wrappers are typed against the **add** set and cast their way past the declarations.
That cast is why the compiler stayed silent. Narrowing them to the generated `update`
set type would make the next stray key a compile error. It is not required for this
fix — do it only if you can do it without regenerating declarations, and say so
explicitly if you do.

## Blast radius

- `src/services/sync-worker.ts` — the only file that must change.
- Four call sites affected downstream: `submitAccidentReport`,
  `updateAccidentReportByUuid`, `submitIncidentReport`,
  `updateIncidentReportByUuid`.
- No wire format changes. No mobile→server contract change: the server's `add` and
  `update` shapes are exactly as they were, and the declarations are untouched.

## Verification

`npm test` (vitest) and `npm run lint` must pass. There is no `typecheck` script.

1. **The add path is unchanged.** A first send still carries
   `submitted_from: { app_version, platform }` — the existing test at
   `src/services/sync-worker.test.ts:362` covers this; keep it green.

2. **The update path omits it.** New test: enqueue a draft, run the worker, edit the
   synced draft back to `draft`, run again, then assert

   ```ts
   const set = vi.mocked(updateAccidentReportByUuid).mock.calls.at(-1)?.[2];
   expect(set).not.toHaveProperty('submitted_from');
   ```

   Add the mirror assertion for `updateIncidentReportByUuid` on a report draft —
   the report mapper stamps provenance itself, so that path leaks independently.

3. **Extend the existing correction test** at `src/services/sync-worker.test.ts:255`
   to assert on the payload, not just the call count. That is the test that walked
   past this bug.

4. **Manual, with the backend fix deployed first.** The dev build points at
   `http://46.245.98.207:1400` (`mobile/.env.development:1`) — or whatever server URL
   is saved on the device under `lesen.server-url.v1`, which **overrides** the env
   value. If that server does not yet carry the coerced-date fix, you will hit
   `set.date_of_accident` first and never reach this one. Confirm the backend is
   current, then: file a report, let it sync, reopen it, edit one field, finish again.
   It must reach `success: true`.

5. **Confirm no regression on `add`.** The oversight statistics on the server count
   app-filed reports through `submitted_from.app_version`
   (`back/src/incident_report/oversight/pipeline.ts:53,223`). A report whose first
   send loses its stamp would silently drop out of those numbers, so a stamp that
   disappears is as much a bug as one that should not have been sent.

## Constraints

- Do not add `submitted_from` to any backend validator, and do not regenerate
  `selectInp.ts`. The server's `add`/`update` split is intentional.
- Do not change `date_of_accident` or any other date field format. That was the
  previous bug and it was fixed on the server, not here.
- Do not relax `submissionProvenance()`'s `0.0.0` guard. In Expo Go there is no
  version, and inventing one is exactly what that rule exists to prevent.
- Do not special-case this for corrections that carry attachments or a road snap. The
  key is wrong on every `update`, however it was assembled.
- Keep the rejection visible if it ever fails again: a payload the server refuses is
  a real defect, not something to swallow into a retry. The queue already classifies
  `validation` as definitive and marks the record `rejected`
  (`src/domain/sync-rules.ts:120-134`) — leave that alone.