import { useEffect, useState } from 'react';

import {
  getConnectivitySnapshot,
  subscribeToConnectivity,
  type ConnectivitySnapshot,
} from '@/services/connectivity';

/**
 * Live connectivity for surfaces that must explain *why* they are degraded.
 *
 * `null` means "not resolved yet", and callers should read it as *online*.
 *
 * Defaulting the other way is a small lie with a visible cost: the map clamps
 * tile levels to the offline pack when it believes it is offline, so guessing
 * "offline" on mount paints a blurred map for a frame before the real snapshot
 * arrives. Guessing "online" costs nothing — an uncached tile simply falls
 * through to the network and succeeds.
 */
export function useConnectivity(): ConnectivitySnapshot | null {
  const [snapshot, setSnapshot] = useState<ConnectivitySnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getConnectivitySnapshot()
      .then(value => {
        if (!cancelled) {
          setSnapshot(value);
        }
      })
      .catch(() => undefined);
    const unsubscribe = subscribeToConnectivity(value => {
      if (!cancelled) {
        setSnapshot(value);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return snapshot;
}