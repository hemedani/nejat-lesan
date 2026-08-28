import type { BackendActRequest } from './backend-types';
import type { ApiRequestOptions } from './client';
import { callTypedAct } from './client';
import type { Session } from '@/domain/types';
import { getReferenceCache, saveReferenceCache } from '@/storage/local-database';

export type ReferenceOption = {
  _id: string;
  name: string;
};

export type RefModel =
  | 'type'
  | 'collision_type'
  | 'croquis_type'
  | 'vehicle_type'
  | 'vehicle_final_status'
  | 'driver_status'
  | 'injury_status'
  | 'person_role'
  | 'damage_severity'
  | 'color'
  | 'system'
  | 'system_type'
  | 'plaque_type'
  | 'plaque_usage'
  | 'insurance_co'
  | 'body_insurance_co'
  | 'licence_type'
  | 'fault_status'
  | 'motion_direction'
  | 'human_reason'
  | 'max_damage_section'
  | 'area_usage'
  | 'light_status'
  | 'air_status'
  | 'road_situation'
  | 'road_surface_condition'
  | 'road_defect'
  | 'position'
  | 'police_station';

type GetsRequest = BackendActRequest<'main', 'type', 'gets'>;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PAGE_LIMIT = 200;

async function fetchReferencePage(
  model: RefModel,
  session: Session,
  options: ApiRequestOptions,
): Promise<ReferenceOption[]> {
  const request = {
    service: 'main',
    model,
    act: 'gets',
    details: {
      set: { page: 1, limit: PAGE_LIMIT },
      get: { _id: 1, name: 1 },
    },
  } as unknown as GetsRequest;

  return callTypedAct<'main', RefModel, 'gets', ReferenceOption[]>(request as never, {
    token: session.token,
    ...options,
  });
}

async function loadOne(
  model: RefModel,
  session: Session,
): Promise<ReferenceOption[]> {
  const cacheKey = `ref:${model}`;
  const cached = await getReferenceCache<ReferenceOption[]>(cacheKey);
  try {
    const fresh = await fetchReferencePage(model, session, {});
    if (Array.isArray(fresh)) {
      await saveReferenceCache(cacheKey, fresh, new Date().toISOString());
      return fresh;
    }
  } catch (error) {
    if (cached && Date.now() - new Date(cached.updated_at).getTime() < CACHE_TTL_MS) {
      return cached.payload;
    }
    throw error;
  }
  return cached ? cached.payload : [];
}

export type ReferenceSet = Partial<Record<RefModel, ReferenceOption[]>>;

export async function loadReferenceSet(
  session: Session,
  models: RefModel[],
): Promise<ReferenceSet> {
  const results = await Promise.all(
    models.map(model =>
      loadOne(model, session).then(options => [model, options] as const),
    ),
  );
  return Object.fromEntries(results);
}
