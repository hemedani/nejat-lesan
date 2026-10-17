import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  type CameraRef,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import type { FeatureCollection, Point } from 'geojson';

import { getAppConfig } from '@/config/env';
import type { RoadLabel, RoadVertex } from '@/domain/org-road';
import { roadLabelFeature, roadLineGeoJSON } from '@/domain/road-overlay';
import type { Coordinates } from '@/domain/types';

/**
 * Native MapLibre renderer for the patrol map.
 *
 * Replaces the WebView slippy map. The camera, the officer dot, and the
 * organization's road overlay are all rendered natively; the style document
 * (and therefore every tile, glyph, and sprite) comes from the self-hosted
 * vector server named by `EXPO_PUBLIC_MAP_STYLE_URL`.
 *
 * Offline is MapLibre's own business: it reads from its offline packs and
 * ambient cache without being told a tile level, so this component no longer
 * carries the old coverage clamp.
 */

/** Overzoom headroom above the server's maxzoom 14; matches the org zoom clamp band. */
const MIN_ZOOM = 3;
const MAX_ZOOM = 19;

const OFFICER_SOURCE = 'officer';
const ROAD_SOURCE = 'org-road';
const ROAD_LABEL_SOURCE = 'org-road-label';

const EMPTY_POINTS: FeatureCollection<Point> = { type: 'FeatureCollection', features: [] };

const MAP_STYLE_URL = getAppConfig().mapStyleUrl;

export type NativeMapHandle = {
  /**
   * Recentre the camera. `zoom` is optional on purpose: omitting it keeps the
   * current zoom ("recentre on me"), passing it jumps to that zoom ("go back to
   * the organization's centre").
   */
  setCenter: (coords: Coordinates, zoom?: number) => void;
  zoomBy: (delta: number) => void;
};

export type NativeMapProps = {
  initialCenter: Coordinates;
  initialZoom?: number;
  officerMarker?: Coordinates | null;
  onRegionChangeComplete?: (coords: Coordinates) => void;
  /**
   * The organization's own centrelines, drawn over the tiles.
   *
   * `[]` (a road stored with no geometry) and `null` (never downloaded) both
   * draw nothing, so a data gap stays a data gap rather than a broken map.
   */
  roadLines?: RoadVertex[][] | null;
  /** The road's name and endpoints, written on the overlay. */
  roadLabel?: RoadLabel | null;
  style?: StyleProp<ViewStyle>;
};

export const NativeMap = forwardRef<NativeMapHandle, NativeMapProps>(function NativeMap(
  {
    initialCenter,
    initialZoom = 16,
    officerMarker = null,
    onRegionChangeComplete,
    roadLines = null,
    roadLabel = null,
    style,
  },
  ref,
) {
  const cameraRef = useRef<CameraRef | null>(null);
  const zoomRef = useRef(initialZoom);
  const onRegionChangeRef = useRef(onRegionChangeComplete);
  onRegionChangeRef.current = onRegionChangeComplete;

  const markerLat = officerMarker?.latitude ?? null;
  const markerLng = officerMarker?.longitude ?? null;

  const officerData = useMemo<FeatureCollection<Point>>(() => {
    if (markerLat == null || markerLng == null) {
      return EMPTY_POINTS;
    }
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [markerLng, markerLat] },
        },
      ],
    };
  }, [markerLat, markerLng]);

  const roadData = useMemo(() => roadLineGeoJSON(roadLines ?? []), [roadLines]);
  const roadLabelData = useMemo(
    () => roadLabelFeature(roadLines ?? [], roadLabel),
    [roadLines, roadLabel],
  );

  useImperativeHandle(
    ref,
    () => ({
      setCenter(coords, zoom) {
        const center: [number, number] = [coords.longitude, coords.latitude];
        if (typeof zoom === 'number') {
          zoomRef.current = zoom;
          cameraRef.current?.jumpTo({ center, zoom });
        } else {
          cameraRef.current?.jumpTo({ center });
        }
        // Reported directly rather than waited for from `onRegionDidChange`: the
        // camera is programmatic, so MapLibre would flag it non-interactive and
        // the picker would never re-select the point it just centred on. This
        // reproduces the old WebView, where `setCenter` ended in a `moveend`.
        onRegionChangeRef.current?.(coords);
      },
      zoomBy(delta) {
        const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomRef.current + delta));
        zoomRef.current = next;
        cameraRef.current?.zoomTo(next, { duration: 180 });
      },
    }),
    [],
  );

  function handleRegionDidChange(event: NativeSyntheticEvent<ViewStateChangeEvent>) {
    const state = event.nativeEvent;
    zoomRef.current = state.zoom;
    // Only user gestures move the selection. The initial camera placement and
    // any programmatic move arrive with `userInteraction: false`; the picker
    // owns those through `setCenter` above, so re-emitting here would select a
    // point the officer never chose.
    if (!state.userInteraction) {
      return;
    }
    const [longitude, latitude] = state.center;
    onRegionChangeRef.current?.({ latitude, longitude });
  }

  return (
    <View style={[styles.container, style]}>
      <Map
        attribution={false}
        logo={false}
        mapStyle={MAP_STYLE_URL}
        onRegionDidChange={handleRegionDidChange}
        style={styles.map}
      >
        <Camera
          initialViewState={{
            center: [initialCenter.longitude, initialCenter.latitude],
            zoom: initialZoom,
          }}
          maxZoom={MAX_ZOOM}
          minZoom={MIN_ZOOM}
          ref={cameraRef}
        />

        <GeoJSONSource data={officerData} id={OFFICER_SOURCE} />
        <Layer
          id="officer-halo"
          paint={{ 'circle-color': '#208AEF', 'circle-opacity': 0.18, 'circle-radius': 9 }}
          source={OFFICER_SOURCE}
          type="circle"
        />
        <Layer
          id="officer-dot"
          paint={{
            'circle-color': '#208AEF',
            'circle-radius': 5,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-width': 2,
          }}
          source={OFFICER_SOURCE}
          type="circle"
        />

        <GeoJSONSource data={roadData} id={ROAD_SOURCE} />
        <Layer
          id="road-casing"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#ffffff',
            'line-opacity': 0.9,
            'line-width': ['interpolate', ['linear'], ['zoom'], 8, 4, 14, 12, 19, 18],
          }}
          source={ROAD_SOURCE}
          type="line"
        />
        <Layer
          id="road-line"
          layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          paint={{
            'line-color': '#0b3b46',
            'line-width': ['interpolate', ['linear'], ['zoom'], 8, 2.4, 14, 9, 19, 14],
          }}
          source={ROAD_SOURCE}
          type="line"
        />

        <GeoJSONSource data={roadLabelData ?? EMPTY_POINTS} id={ROAD_LABEL_SOURCE} />
        <Layer
          id="road-label"
          layout={{
            'text-anchor': 'center',
            'text-field': ['get', 'title'],
            'text-font': ['Vazirmatn Regular'],
            'text-size': 12,
          }}
          minzoom={10}
          paint={{
            'text-color': '#0b3b46',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          }}
          source={ROAD_LABEL_SOURCE}
          type="symbol"
        />
      </Map>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  map: { flex: 1 },
});
