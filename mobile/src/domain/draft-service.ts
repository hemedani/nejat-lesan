import type { AccidentDraft } from './types';
import { saveDraft, saveQueueRecord } from '@/storage/local-database';

export const DRAFT_SCHEMA_VERSION = 1;

function createUuid(): string {
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) {
    return randomUuid;
  }
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
}

export async function createAccidentDraft(): Promise<AccidentDraft> {
  const now = new Date().toISOString();
  const draft: AccidentDraft = {
    client_report_uuid: createUuid(),
    schema_version: DRAFT_SCHEMA_VERSION,
    sync_status: 'draft',
    updated_at: now,
    data: {},
  };

  await saveDraft(draft);
  await saveQueueRecord({
    id: `queue-${draft.client_report_uuid}`,
    client_report_uuid: draft.client_report_uuid,
    status: 'draft',
    attempts: 0,
    updated_at: now,
  });
  return draft;
}
