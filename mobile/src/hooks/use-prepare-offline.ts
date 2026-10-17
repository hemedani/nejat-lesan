import { useCallback, useEffect, useState } from 'react';

import { translateApiError } from '@/api/errors';
import { isIncidentPatrolEnabled } from '@/domain/modules';
import { loadCachedOrgRoad } from '@/services/org-road-service';
import { offlineFormCacheStatus } from '@/services/offline-forms-service';
import { prepareOrgOffline, type PrepareOrgOffline } from '@/services/prepare-org-offline';
import {
  describeOfflineFormCache,
  orgFormsAvailability,
  type OfflineFormCacheStatus,
  type OrgFormsAvailability,
} from '@/domain/offline-forms';
import { summarizeOrgRoad, type OrgRoad } from '@/domain/org-road';
import type { PatrolOrganization, Session } from '@/domain/types';

export type PrepareOfflineState = {
  /** What the device holds, as counts. Empty until the first read lands. */
  status: OfflineFormCacheStatus;
  /**
   * The Persian one-liners under the org card. Resolved when the cache is read rather
   * than during render, so the ages they report are the ages at read time.
   */
  formsLabel: string;
  roadLabel: string;
  /** The officer's own road, or `null` when it was never downloaded. */
  road: OrgRoad | null;
  availability: OrgFormsAvailability;
  busy: boolean;
  /** A Persian message from the last failed preparation; cleared on the next attempt. */
  error: string | null;
  /** The last completed preparation, so a caller can confirm what landed. */
  lastPrepare: PrepareOrgOffline | null;
  prepare: () => void;
  reload: () => void;
};

const EMPTY_STATUS: OfflineFormCacheStatus = { formCount: 0, hasProcess: false, fetchedAt: null };

/**
 * The org card's offline-preparation control.
 *
 * Everything is read from SQLite on mount, so the card renders truthfully with no
 * network at all — which is the whole reason the officer can trust it while out of
 * coverage.
 */
export function usePrepareOffline(inputs: {
  /** `null` while the session is still restoring; the control stays hidden until then. */
  session: Session | null;
  organization: PatrolOrganization | null;
  /** The device cannot reach the backend, so the control is disabled with a reason. */
  offline: boolean;
}): PrepareOfflineState {
  const { session, organization, offline } = inputs;
  const [status, setStatus] = useState<OfflineFormCacheStatus>(EMPTY_STATUS);
  const [formsLabel, setFormsLabel] = useState('');
  const [road, setRoad] = useState<OrgRoad | null>(null);
  const [roadLabel, setRoadLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPrepare, setLastPrepare] = useState<PrepareOrgOffline | null>(null);

  const availability = orgFormsAvailability({
    hasOrganization: Boolean(organization),
    moduleEnabled: session ? isIncidentPatrolEnabled(session) : false,
    offline,
  });

  const reload = useCallback(() => {
    const now = Date.now();
    void offlineFormCacheStatus()
      .then(next => {
        setStatus(next);
        setFormsLabel(describeOfflineFormCache(next, now));
      })
      .catch(() => undefined);
    void loadCachedOrgRoad(organization?._id ?? '')
      .then(found => {
        setRoad(found);
        setRoadLabel(summarizeOrgRoad(found, now));
      })
      .catch(() => undefined);
  }, [organization?._id]);

  useEffect(reload, [reload]);

  const prepare = useCallback(() => {
    if (!session || !organization) {
      return;
    }
    setBusy(true);
    setError(null);
    void prepareOrgOffline(session, organization)
      .then(outcome => {
        setLastPrepare(outcome);
        reload();
      })
      .catch(cause => setError(translateApiError(cause)))
      .finally(() => setBusy(false));
  }, [session, organization, reload]);

  return {
    status,
    formsLabel,
    roadLabel,
    road,
    availability,
    busy,
    error,
    lastPrepare,
    prepare,
    reload,
  };
}
