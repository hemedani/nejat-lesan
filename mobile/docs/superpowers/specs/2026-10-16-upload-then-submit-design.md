# Upload-then-submit: a visible, resumable final submission

**Date:** 2026-10-16
**Status:** approved — modal shape chosen as a full-screen overlay (ب)
**Scope:** `mobile/src` — submission orchestration, upload progress UI, attachment linking

## The three scenarios

An officer finishes a report. What happens at the moment they press submit:

| # | State | Today | After |
|---|-------|-------|-------|
| 1 | Online, every file uploaded | submits, no UI | brief confirmation, then submits |
| 2 | Online, some files pending | uploads silently, then submits; a failure aborts the whole run with no explanation | modal uploads each file one at a time with visible progress, links the files, submits |
| 3 | Offline, files local | files stay on disk, nothing visible | «ارسال همه» on the drafts board opens a modal per report and runs the same sequence |

The modal is the **final-submission confirmation** and always appears when an officer presses
submit. What changes is its content, not its presence: a report with files to move gets the
full progress sequence, and one with nothing left to move gets a short confirmation that names
any file previously skipped. That short state is what keeps scenario 1 honest — an officer is
never shown a zero-length progress bar, and never files a report without being told that
evidence is missing.

## What exists already

More of this is built than the feature request assumes:

- `syncReportMedia` (`src/services/media-upload-service.ts`) and `syncFormAssets`
  (`src/services/asset-upload-service.ts`) already upload sequentially, skip records that
  carry a `server_file_id`, and persist that id — so a re-run resumes rather than
  re-uploading.
- The write-back is done: `applyServerFileIds` (`src/domain/media-writeback.ts`),
  `resolveAssetIdsInData` + `splitAssetAnswerRows` (`src/domain/asset-writeback.ts`). Local
  asset ids become server file ids everywhere they appear; file-field rows split into
  `answer_ids` (joinable) and `answer_names` (readable).
- `sync-worker.ts` already orders upload → write-back → map → submit, and already stamps
  `synced` with the server `_id` / `report_id`.

The gap is not the pipeline. It is that the pipeline is **invisible and all-or-nothing**,
plus one genuine linking bug.

## The orphan bug

`file.uploadAccidentImages` sets the `accident` relation only when an `accidentId` is
supplied (`back/src/file/uploadAccidentImages/uploadAccidentImages.fn.ts:145`). A new report
has no `server_id` yet, so `syncReportMedia` sends `accidentId: undefined` and the file lands
with only a `uploader` relation.

`applyServerFileIds` cannot rescue it either: `parseOwner` (`:9-16`) only understands
`vehicle:N` and `facility:N`, so a `croquis` or `incident` record matches no owner branch and
is dropped from the write-back.

Net effect: **on every new report, croquis sketches and incident photos are uploaded and then
invisible** — absent from `accident.attachments`, absent from the console's gallery, and later
reaped by `file.removeOrphans`, which also leaks their bytes because it only cleans
`./uploads/accidents` rows it can see.

`attachmentsIds` is already in the accident mapper's `ARRAY_RELATION_KEYS`
(`src/domain/accident-mapper.ts:101`) and `accident` accepts it
(`back/src/accident/accidentRelationSchema.ts`). The key simply never receives these ids.

**Fix:** fold *every* successfully uploaded file id into `attachmentsIds`, whatever its
category, for **both** models. The gallery is built from that relation, so anything not in it
is invisible.

`incident_report` is included: it declares `attachments` as of
`back/models/incident_report.ts:391` and accepts `attachmentsIds` in both write acts
(`back/src/incident_report/relations.ts:52`, `setSchema.ts:105`), which is what made the
dynamic form's evidence visible for non-accident reports in the first place. A road-damage
photo is orphaned exactly like a croquis sketch, and the same fold fixes it.

## Architecture: one path, observed

The tempting shape is a separate `submit-flow` service the modal calls. It is rejected: the
upload → write-back → submit ordering already lives in the worker, and a second copy of it
would drift — and the drift would be invisible, because the symptom is a report that silently
loses evidence.

Instead the worker **publishes what it is already doing**:

```
UploadModal ──observe──▶ syncWorker.run({ onlyDraft, observe, skipUploads })
                                   │
              syncReportMedia / syncFormAssets  ← emit one event per file
                                   │
             applyServerFileIds + resolveAssetIdsInData   (linking)
                                   │
                    mapper → accident.add / update
```

`run()` keeps its single-flight lock. A caller that loses the race gets `started: false` and
the modal says so in Persian rather than spinning forever.

### Events

`src/domain/upload-events.ts` — types plus a pure reducer, no React and no native imports, so
the whole progress state machine is unit-testable in the existing `node` vitest environment.

| Event | Meaning |
|-------|---------|
| `phase` | `planning` → `uploading` → `linking` → `submitting` → `done` \| `attention` \| `failed` |
| `file-start` | `{ mediaId, name, index, total }` |
| `file-done` | `{ mediaId, ok: true }` |
| `file-failed` | `{ mediaId, name, reason }` — the sequence continues |
| `report-done` | `{ status: 'synced' \| 'rejected' \| 'retry', reason? }` |

The reducer owns the "which files are done, which failed, what is the current file" bookkeeping
so the component holds no derived logic.

## Failure handling

Per the product decision: **retry / skip this file / cancel** — never an automatic abort and
never a silent drop.

Both upload services stop throwing on the first bad file. They take
`{ skip: Set<mediaId>, onProgress }` and return `failed[]` alongside their result. The modal
renders `attention` with the failed filenames and three buttons:

- **تلاش دوباره** — re-invoke with the same `skip` set; failed records have no
  `server_file_id`, so they are the only ones retried.
- **ادامه بدون این فایل** — re-invoke with the failed ids added to `skip`.
- **انصراف** — abandon; the draft stays `queued` and nothing is submitted.

Skipped files are not forgotten: their ids are recorded on the draft payload so the console can
tell a report filed with missing evidence from one that was never given it.

## Scenarios 1 and 3

**1** — nothing left to move. The modal opens in its short confirmation state, names any file
the officer skipped on an earlier attempt, and submits. No progress bar, no fake wait.

**3** — the drafts board gets «ارسال همه» alongside the existing «همگام‌سازی همه». It walks the
queued drafts with pending media one at a time, opening the full-screen modal for each.
«ادامه در پس‌زمینه» dismisses the modal and lets the queue continue; the per-row `StatusPill`
keeps reporting the real state from `sync_status`, so nothing is hidden by the dismissal.

## Components

**New**

| File | Responsibility |
|------|----------------|
| `src/domain/upload-events.ts` | Event types, progress reducer, `describeProgress` for Persian labels. Pure. |
| `src/components/upload-modal.tsx` | The full-screen overlay. Renders the reducer's state; owns no sequencing. |
| `src/hooks/use-report-upload.ts` | Drives the worker for one draft or a queue, owns modal visibility, mediates retry/skip/cancel. |

**Changed**

| File | Change |
|------|--------|
| `src/services/media-upload-service.ts` | `{ skip, onProgress }`, return `failed[]`, no throw-on-first |
| `src/services/asset-upload-service.ts` | same |
| `src/services/sync-worker.ts` | `run({ manual, onlyDraft, observe, skipUploads })`; emit phases; thread `skipUploads` through |
| `src/domain/accident-mapper.ts` | all uploaded ids into `attachmentsIds` (the orphan fix) |
| `src/domain/media-writeback.ts` | stop dropping `croquis` / `incident` records from the result set |
| `src/app/drafts.tsx` | per-row «ارسال», bulk «ارسال همه» |
| `src/app/incident/form.tsx` | submit opens the modal; surface errors instead of swallowing them at `:466` |
| `src/app/incident/details.tsx`, `simple.tsx`, `process.tsx` | same — today only `form.tsx` runs the worker inline |

## Constraints honoured

- One `client_report_uuid` per draft, reused across every retry — unchanged; `skip`/`retry`
  re-invocations reuse it.
- `sync_status` is still never sent upstream (`accident-mapper.ts:115-126`).
- Uploads stay idempotent via `server_file_id`; a resumed run cannot create a second report.
- The modal is driven by the officer, never by the background reconnect run, so no surprise
  dialog steals focus mid-task.
- Persian labels, RTL, Estedad, ≥48dp targets, established `ui/` primitives.
- `BACKEND_CATEGORY_LIMITS` (`src/api/media.ts:34`) is enforced client-side before a push, so
  an over-cap file fails in the modal with a readable reason instead of mid-sequence.

## Tests

- `upload-events.test.ts` — reducer across every phase and failure transition.
- `media-upload-service` / `asset-upload-service` — per-file progress emission, failure
  isolation, `skip` honoured, resume skips already-uploaded records.
- `sync-worker.test.ts` — `attachmentsIds` carries `croquis` and `incident` ids, both passes
  land in one list, nothing is sent when nothing uploaded, and a non-accident report gets it
  too.
- `sync-worker.test.ts` — `onlyDraft` scoping, `observe` event order, skipped files recorded.

## Not in scope

- Real-device airplane-mode and force-close testing, called out as a gap in
  `mobile/docs/TODO.md:113`.