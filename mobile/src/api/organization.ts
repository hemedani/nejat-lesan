import type { RoadGeometry } from '@/domain/org-road';
import type { Session } from '@/domain/types';

import { callTypedAct } from './client';
import type { ApiRequestOptions } from './client';

/**
 * The road document as `organization.get` returns it.
 *
 * `area` is the ordered `MultiLineString` centreline the offline map draws; everything
 * else is metadata the overlay can label the road with.
 */
export type OrgRoadDocument = {
  _id: string;
  name: string;
  area?: RoadGeometry;
  origin?: string;
  destination?: string;
  total_length_meters?: number;
};

export type OrgRoadResult = {
  /** `null` when this organization is not bound to a road — a municipality org, say. */
  road: OrgRoadDocument | null;
};

/** One row of the organization document the act returns. */
type OrgRow = Record<string, unknown>;

/**
 * The road bound to an organization, taken from the act's row array.
 *
 * `organization.get` ends in `.toArray()` (back/src/organization/get/get.fn.ts), so the
 * act answers with **an array of documents** — the same shape as `road.get`. Since
 * `callTypedAct` has already unwrapped `{ success, body }`, the value arriving here *is*
 * that array. Reading `.road` off it finds nothing, which is how this once reported "no
 * road" for the one organization that has one.
 *
 * Everything is treated as untrusted: an empty array (a wrong id yields `[]`, not an
 * error), a missing key, and a `road` that is not an object all mean the same thing —
 * there is no road to draw.
 */
export function roadFromOrgRows(rows: unknown): OrgRoadDocument | null {
  if (!Array.isArray(rows)) {
    return null;
  }
  const road = (rows[0] as OrgRow | undefined)?.['road'];
  if (typeof road !== 'object' || road === null || Array.isArray(road)) {
    return null;
  }
  return road as OrgRoadDocument;
}

/**
 * `get` is a want-marker (`enums([0, 1])` on the backend), not a projection: the act
 * returns its whole payload and the framework never narrows it.
 *
 * `road` alone is deliberate and load-bearing, and it is a *nested* marker because a
 * relation is marked field by field — the generated `get` type says so. `organization.get` declares
 * `selectStruct("organization", 2)`, whose full expansion pulls in the org's units,
 * members, parent unit and head. Asking for everything would ship the entire
 * organization graph over the act wire on every press of the prepare button.
 */
const ORG_ROAD_GET = {
  road: {
    _id: 1,
    name: 1,
    area: 1,
    origin: 1,
    destination: 1,
    total_length_meters: 1,
  },
} as const;

/**
 * The road bound to one organization, geometry included.
 *
 * `organization.road` is a forward 1:1 relation with no `excludes`, so the centreline
 * rides along with the organization document — no separate geometry act is needed, and
 * nothing here depends on `road.getRoadsGeometry`'s `$geoIntersects` filter, which
 * matches nothing until the production geometry is backfilled.
 *
 * Takes the organization id the session already carries rather than the document: the
 * session's `primaryOrganization` is cached at login, so this costs no round trip to
 * work out *which* organization, and the officer's device can answer that offline.
 */
export async function fetchOrgRoad(
  session: Session,
  organizationId: string,
  options: ApiRequestOptions = {},
): Promise<OrgRoadResult> {
  const rows = await callTypedAct<'main', 'organization', 'get', OrgRow[]>(
    {
      service: 'main',
      model: 'organization',
      act: 'get',
      details: {
        set: { _id: organizationId },
        get: ORG_ROAD_GET,
      },
    },
    { token: session.token, ...options },
  );
  return { road: roadFromOrgRows(rows) };
}
