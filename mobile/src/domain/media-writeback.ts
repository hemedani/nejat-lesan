import type { MediaCategory } from '@/services/media-service';

export type MediaUploadResult = {
  ownerId: string;
  category: MediaCategory;
  fileId: string;
};

function parseOwner(ownerId: string): { kind: 'vehicle' | 'facility'; index: number } | null {
  const match = /^(vehicle|facility):(\d+)$/.exec(ownerId);
  if (!match) {
    return null;
  }
  return { kind: match[1] as 'vehicle' | 'facility', index: Number.parseInt(match[2], 10) };
}

/**
 * Writes returned server file `_id`s back into the report payload so the
 * backend can auto-link them into `attachments` on `accident.add`/`update`:
 * - `plate`/`insurance` → `vehicle_dtos[index].plate_image` / `.insurance_image`
 * - `damage` → `facility_damage_dtos[index].images[]`
 * - `croquis` needs no write-back (linked via the accident relation on upload).
 * Returns a new object; unknown draft fields are preserved.
 */
export function applyServerFileIds(
  data: Record<string, unknown>,
  results: MediaUploadResult[],
): Record<string, unknown> {
  if (results.length === 0) {
    return data;
  }

  const next: Record<string, unknown> = { ...data };

  const vehicleDtosRaw = Array.isArray(next['vehicle_dtos'])
    ? [...(next['vehicle_dtos'] as Record<string, unknown>[])]
    : null;
  const facilityDtosRaw = Array.isArray(next['facility_damage_dtos'])
    ? [...(next['facility_damage_dtos'] as Record<string, unknown>[])]
    : null;

  for (const result of results) {
    const owner = parseOwner(result.ownerId);
    if (!owner) {
      continue;
    }
    if (owner.kind === 'vehicle' && vehicleDtosRaw) {
      const card = vehicleDtosRaw[owner.index];
      if (!card || typeof card !== 'object') {
        continue;
      }
      const field = result.category === 'plate' ? 'plate_image' : 'insurance_image';
      vehicleDtosRaw[owner.index] = { ...card, [field]: result.fileId };
      continue;
    }
    if (owner.kind === 'facility' && facilityDtosRaw && result.category === 'damage') {
      const card = facilityDtosRaw[owner.index];
      if (!card || typeof card !== 'object') {
        continue;
      }
      const images = Array.isArray(card['images']) ? [...card['images']] : [];
      if (!images.includes(result.fileId)) {
        images.push(result.fileId);
      }
      facilityDtosRaw[owner.index] = { ...card, images };
    }
  }

  if (vehicleDtosRaw && Array.isArray(data['vehicle_dtos'])) {
    next['vehicle_dtos'] = vehicleDtosRaw;
  }
  if (facilityDtosRaw && Array.isArray(data['facility_damage_dtos'])) {
    next['facility_damage_dtos'] = facilityDtosRaw;
  }

  return next;
}
