import type { BackendActRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';
import type { MediaCategory } from '@/services/media-service';
import type { Session } from '@/domain/types';

/**
 * Backend categories for `file.uploadAccidentImages`. The local `damage`
 * category maps to the backend `facility_damage` (the backend also accepts
 * the alias, but the mapping is applied explicitly on the client).
 */
export type BackendUploadCategory =
  | 'plate'
  | 'insurance'
  | 'croquis'
  | 'facility_damage';

const BACKEND_CATEGORY: Record<MediaCategory, BackendUploadCategory> = {
  croquis: 'croquis',
  damage: 'facility_damage',
  insurance: 'insurance',
  plate: 'plate',
};

export function toBackendUploadCategory(category: MediaCategory): BackendUploadCategory {
  return BACKEND_CATEGORY[category];
}

export type UploadedFileAck = {
  _id: string;
};

type UploadRequest = BackendActRequest<'main', 'file', 'uploadAccidentImages'>;

const UPLOAD_ACK_PROJECTION = { _id: 1 } as const;

/**
 * Wire format pinned by the backend handoff (B1): base64 JSON inside
 * `set.file.data { name, type, data }`. Large JPEG payloads need a longer
 * timeout than ordinary acts.
 */
export function uploadAccidentImage(
  session: Session,
  params: {
    category: MediaCategory;
    accidentId?: string;
    sequence?: number;
    fileName: string;
    mimeType: string;
    base64Data: string;
  },
  options: ApiRequestOptions = {},
): Promise<UploadedFileAck> {
  const set = {
    category: toBackendUploadCategory(params.category),
    ...(params.accidentId ? { accidentId: params.accidentId } : {}),
    ...(params.sequence != null ? { sequence: params.sequence } : {}),
    file: {
      name: params.fileName,
      type: params.mimeType,
      data: params.base64Data,
    },
  };

  const request = {
    service: 'main',
    model: 'file',
    act: 'uploadAccidentImages',
    details: {
      set,
      get: UPLOAD_ACK_PROJECTION,
    },
  } as unknown as UploadRequest;

  return callTypedAct<'main', 'file', 'uploadAccidentImages', UploadedFileAck>(
    request as never,
    { timeoutMs: 60_000, token: session.token, ...options },
  );
}
