import { useCallback, useEffect, useState } from 'react';

import { translateApiError } from '@/api/errors';
import {
  describeOfflineFormCache,
  orgFormsAvailability,
  type OfflineFormCacheStatus,
  type OrgFormsAvailability,
} from '@/domain/offline-forms';
import type { Session } from '@/domain/types';
import {
  downloadOrgForms,
  offlineFormCacheStatus,
  type OrgFormsDownload,
} from '@/services/offline-forms-service';

export type OfflineFormsState = {
  /** What the device holds, as counts. Empty until the first read lands. */
  status: OfflineFormCacheStatus;
  /**
   * The Persian one-liner under the card. Resolved when the cache is read rather
   * than during render, so the age it reports is the age at read time instead of a
   * value that would differ between renders.
   */
  statusLabel: string;
  /** Whether the control is drawn, and whether it is usable. */
  availability: OrgFormsAvailability;
  busy: boolean;
  /** A Persian message from the last failed download; cleared on the next attempt. */
  error: string | null;
  /** The last completed download, so a caller can confirm what landed. */
  lastDownload: OrgFormsDownload | null;
  download: () => void;
  reload: () => void;
};

const EMPTY_STATUS: OfflineFormCacheStatus = { formCount: 0, hasProcess: false, fetchedAt: null };

/**
 * The org card's offline-form control.
 *
 * The status is read from SQLite on mount, so the card renders truthfully with no
 * network at all — which is the whole reason the officer can trust it while out of
 * coverage.
 */
export function useOfflineForms(inputs: {
  /** `null` while the session is still restoring; the control stays hidden until then. */
  session: Session | null;
  hasOrganization: boolean;
  moduleEnabled: boolean;
  offline: boolean;
}): OfflineFormsState {
  const { session, hasOrganization, moduleEnabled, offline } = inputs;
  const [status, setStatus] = useState<OfflineFormCacheStatus>(EMPTY_STATUS);
  const [statusLabel, setStatusLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDownload, setLastDownload] = useState<OrgFormsDownload | null>(null);

  const availability = orgFormsAvailability({ hasOrganization, moduleEnabled, offline });

  const reload = useCallback(() => {
    void offlineFormCacheStatus()
      .then(next => {
        setStatus(next);
        setStatusLabel(describeOfflineFormCache(next, Date.now()));
      })
      .catch(() => undefined);
  }, []);

  useEffect(reload, [reload]);

  const download = useCallback(() => {
    if (!session) {
      return;
    }
    setBusy(true);
    setError(null);
    void downloadOrgForms(session)
      .then(outcome => {
        setLastDownload(outcome);
        reload();
      })
      .catch(cause => setError(translateApiError(cause)))
      .finally(() => setBusy(false));
  }, [session, reload]);

  return { status, statusLabel, availability, busy, error, lastDownload, download, reload };
}