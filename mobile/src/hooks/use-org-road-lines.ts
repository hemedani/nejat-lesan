import { useEffect, useState } from 'react';

import { roadLabelOf, roadLinesForBridge, type RoadLabel, type RoadVertex } from '@/domain/org-road';
import { loadCachedOrgRoad } from '@/services/org-road-service';

/**
 * The organization's own road, for the map to draw.
 *
 * Read from SQLite and nothing else: the map has to work with no signal, which is the
 * whole reason the road is stored rather than fetched on arrival.
 *
 * Returns `null` while it is still reading, or for an officer whose organization has no
 * road, so the overlay appears when there is something to show instead of flashing on.
 * The stored id travels with the result so a slow read cannot paint the previous
 * organization's road over the current one's map.
 */
export function useOrgRoadLines(
  organizationId: string | undefined,
): { lines: RoadVertex[][]; label: RoadLabel | null } | null {
  const [loaded, setLoaded] = useState<{
    id: string;
    lines: RoadVertex[][];
    label: RoadLabel | null;
  } | null>(null);

  useEffect(() => {
    if (!organizationId) {
      return;
    }
    let cancelled = false;
    void loadCachedOrgRoad(organizationId)
      .then(road => {
        if (!cancelled) {
          setLoaded({
            id: organizationId,
            lines: roadLinesForBridge(road),
            label: roadLabelOf(road),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ id: organizationId, lines: [], label: null });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  if (!organizationId || loaded?.id !== organizationId) {
    return null;
  }
  return { lines: loaded.lines, label: loaded.label };
}