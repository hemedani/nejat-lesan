/**
 * One button that makes a device ready to work without signal.
 *
 * Two payloads that share a reason to be on the same device at the same moment: the
 * organization's forms (so the report asks what the organization asks) and its road (so
 * the location picker can show it). An officer presses this once at base, not once per
 * thing they might need — which is why they are one action and not two buttons.
 *
 * The asymmetry is deliberate. Forms are the half the officer came for, so a failure
 * there fails the whole preparation and says so. The road is best-effort: an
 * organization legitimately has none, the lookup can fail on its own, and neither is a
 * reason to tell an officer their device is not ready when it is.
 */

import type { PatrolOrganization, Session } from '@/domain/types';

import { downloadOrgForms } from './offline-forms-service';
import { downloadOrgRoad } from './org-road-service';

export type PrepareOrgOffline = {
  /** How many authored forms were stored. */
  forms: number;
  /**
   * Three states, not two, because the last two lead to opposite actions: an
   * organization with no road is finished, and one whose road could not be read is
   * worth trying again. Collapsing them would leave the officer unable to tell.
   */
  road: 'stored' | 'none' | 'failed';
  /** Present only when the road stored, for the confirmation message. */
  roadName?: string;
};

export async function prepareOrgOffline(
  session: Session,
  organization: PatrolOrganization | null,
): Promise<PrepareOrgOffline> {
  if (!organization) {
    // `primaryOrganization` is null for a global or multi-org caller. There is no single
    // org to scope a road to, and guessing one would cache another organization's road.
    throw new Error('سازمان مأمور مشخص نیست.');
  }

  const forms = await downloadOrgForms(session);

  try {
    const result = await downloadOrgRoad(session, organization);
    return {
      forms: forms.formCount,
      road: result.status,
      ...(result.status === 'stored' ? { roadName: result.road.name } : {}),
    };
  } catch {
    return { forms: forms.formCount, road: 'failed' };
  }
}