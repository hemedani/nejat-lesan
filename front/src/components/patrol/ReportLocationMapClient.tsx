"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import type { GeoPoint } from "@/types/patrol";
import {
  BASEMAPS,
  getBasemapUrl,
  resolveTileBasemap,
  DEFAULT_BASEMAP,
  type BasemapType,
} from "@/utils/basemaps";
import { useOptionalBasemap } from "@/context/BasemapContext";
import { formatPoint, formatSeparation } from "@/utils/geo";

/**
 * Leaflet's default marker sprites resolve relative to the bundler output, so
 * they 404 under Next and markers render as broken images. Point them at the
 * CDN copies instead — the same fix the project's other map surfaces apply.
 */
const MARKER_ICON = {
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
};

type LatLng = [number, number];

const toLatLng = (point?: GeoPoint): LatLng | undefined =>
  point ? [point.coordinates[1], point.coordinates[0]] : undefined;

/**
 * Where the accident is, and where the officer was when they filed it.
 *
 * The line between the two is the point of the component. An officer's GPS fix and the
 * location they recorded are rarely the same point, and the gap between them is
 * evidence: a large divergence means the report was filed away from the scene, and an
 * absent GPS point means the position came from somewhere else entirely. Two markers
 * and no relationship between them would leave a reviewer to eyeball it.
 *
 * ## Why the tile layer is built here rather than reusing `BasemapLayer`
 *
 * `BasemapLayer` reads the **raw** context value and returns `null` for `neshan`,
 * because Neshan is an SDK that replaces `window.L` and is not a tile source. This map
 * is a react-leaflet `<MapContainer>`, so it needs `resolveTileBasemap(context)`, which
 * maps `neshan` to `mapir`. Handing the raw value to `BasemapLayer` would render
 * markers on a blank background for anyone who had chosen Neshan on a `/maps` page —
 * so the resolution happens before the `TileLayer` is built, and only
 * `getBasemapUrl` (the token handling) is reused.
 */
export default function ReportLocationMapClient({
  location,
  gps,
  height = "h-64",
  interactive = false,
  /** Bump this to re-fit the viewport — the modal's fit-bounds button uses it as a key. */
  fitBoundsKey = 0,
}: {
  location?: GeoPoint;
  gps?: GeoPoint;
  height?: string;
  /**
   * Whether the wheel zooms the map.
   *
   * Off for the rail's small map: scrolling a page that happens to contain it would
   * zoom a thumbnail and swallow the scroll. On in the modal, where zooming is the
   * point. Panning and the zoom buttons stay available either way.
   */
  interactive?: boolean;
  fitBoundsKey?: number;
}) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
      ._getIconUrl;
    L.Icon.Default.mergeOptions(MARKER_ICON);
  }, []);

  // Above the early return on purpose: a hook called after one is skipped on the
  // render that has no points and called on the next, which changes hook order and
  // makes React discard the memoised state for this component.
  const basemap = useTileBasemap();

  const incident = toLatLng(location);
  const officer = toLatLng(gps);
  const both = Boolean(incident && officer);

  if (!incident && !officer) return null;

  const separation = formatSeparation(location, gps);

  return (
    <div className={`${height} overflow-hidden rounded-xl border border-white/10`}>
      <MapContainer
        center={incident ?? officer!}
        zoom={14}
        bounds={both ? padBounds(incident!, officer!) : undefined}
        scrollWheelZoom={interactive}
        className="h-full w-full"
      >
        <TileLayer
          // Remounts the layer when the provider changes, so Leaflet discards the
          // cached tiles of the previous one instead of leaving them on screen.
          key={basemap}
          url={getBasemapUrl(basemap)}
          attribution={BASEMAPS[basemap].attribution}
        />
        {both && (
          <Polyline
            positions={[incident!, officer!]}
            pathOptions={{ color: "#f87171", weight: 2, dashArray: "4 4", opacity: 0.7 }}
          >
            {separation && (
              <Tooltip sticky className="text-xs">
                {separation}
              </Tooltip>
            )}
          </Polyline>
        )}
        {incident && (
          <Marker position={incident}>
            <Popup>
              محل حادثه
              <br />
              <span dir="ltr">{formatPoint(location)}</span>
            </Popup>
          </Marker>
        )}
        {officer && (
          <Marker position={officer}>
            <Popup>
              موقعیت GPS مأمور
              <br />
              <span dir="ltr">{formatPoint(gps)}</span>
            </Popup>
          </Marker>
        )}
        {fitBoundsKey > 0 && both && (
          <FitBounds location={location} gps={gps} trigger={fitBoundsKey} />
        )}
      </MapContainer>
    </div>
  );
}

/** Padding so neither marker lands on the viewport edge once fitted. */
const padBounds = (a: LatLng, b: LatLng) => L.latLngBounds([a, b]).pad(0.35);

/**
 * The basemap this map renders, guaranteed to be a tile layer.
 *
 * `useOptionalBasemap` rather than `useBasemap`: the latter throws outside a provider.
 * The root layout mounts `BasemapProvider`, so that never fires in the app — but a map
 * that renders as a blank box because a test mounted it without the shell is a worse
 * failure than defaulting to the standard basemap.
 */
function useTileBasemap(): BasemapType {
  const context = useOptionalBasemap();
  return resolveTileBasemap(context?.basemap ?? DEFAULT_BASEMAP);
}

/**
 * Re-fit the viewport on both markers.
 *
 * A child of `MapContainer` because `useMap` is only valid inside it.
 *
 * The effect's dependencies are the `map` instance and `trigger` **only**. The two
 * GeoPoints are read from a ref rather than listed as deps on purpose: converting them
 * to `[lat, lng]` arrays produces fresh references on every render, so listing them
 * would re-run the effect on every render — and re-fitting after each render would
 * yank the view back the moment the user panned away. The button has to work by
 * changing `trigger`, which is the whole point of passing it.
 *
 * `invalidateSize` comes first because a map sized inside a just-opened modal has stale
 * dimensions, and `fitBounds` would compute against them.
 */
function FitBounds({
  location,
  gps,
  trigger,
}: {
  location?: GeoPoint;
  gps?: GeoPoint;
  trigger: number;
}) {
  const map = useMap();
  const points = useRef({ location, gps });

  points.current = { location, gps };

  useEffect(() => {
    if (trigger <= 0) return;
    const a = toLatLng(points.current.location);
    const b = toLatLng(points.current.gps);
    if (!a || !b) return;
    map.invalidateSize();
    map.fitBounds(padBounds(a, b));
  }, [map, trigger]);

  return null;
}
