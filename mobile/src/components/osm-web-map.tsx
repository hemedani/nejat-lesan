import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import type { MapCoverage } from '@/domain/map-coverage';
import type { Coordinates } from '@/domain/types';
import { ensureMapHtmlFile } from '@/services/map-web-html';

export type OsmWebMapHandle = {
  /**
   * `zoom` is optional on purpose: omitting it keeps whatever zoom the officer
   * is currently at, which is what "recentre on me" wants. Passing it jumps to
   * that zoom — what "go back to the organisation's centre" wants. The generated
   * HTML already honours `data.zoom` when it is a number, so no bridge change.
   */
  setCenter: (coords: Coordinates, zoom?: number) => void;
  zoomBy: (delta: number) => void;
};

export type OsmWebMapProps = {
  initialCenter: Coordinates;
  initialZoom?: number;
  officerMarker?: Coordinates | null;
  /**
   * Zoom range that is actually on disk.
   *
   * Only a constraint while `offline` is true. Without that distinction the
   * pack's z4..z10 gets scaled up to the z17 the picker opens at and the map
   * is a blur on a working network.
   *
   * `null` means "not downloaded yet" and is passed through unclamped, so the
   * map still renders at full detail from the network.
   */
  coverage?: MapCoverage | null;
  /** Whether the device currently has no usable network. */
  offline?: boolean;
  onRegionChangeComplete?: (coords: Coordinates) => void;
  onCoverageChange?: (covered: boolean) => void;
  style?: StyleProp<ViewStyle>;
};

export const OsmWebMap = forwardRef<OsmWebMapHandle, OsmWebMapProps>(function OsmWebMap(
  {
    initialCenter,
    initialZoom = 16,
    officerMarker,
    coverage = null,
    offline = false,
    onRegionChangeComplete,
    onCoverageChange,
    style,
  },
  ref,
) {
  const webRef = useRef<WebView | null>(null);
  const [htmlUri, setHtmlUri] = useState<string | null>(null);
  const loadEndListenersRef = useRef<Set<() => void>>(new Set());
  const onRegionChangeRef = useRef(onRegionChangeComplete);
  const onCoverageChangeRef = useRef(onCoverageChange);
  onRegionChangeRef.current = onRegionChangeComplete;
  onCoverageChangeRef.current = onCoverageChange;

  useEffect(() => {
    let cancelled = false;
    ensureMapHtmlFile()
      .then(uri => {
        if (!cancelled) {
          setHtmlUri(uri);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    setCenter(coords, zoom) {
      webRef.current?.postMessage(
        JSON.stringify({
          type: 'setCenter',
          latitude: coords.latitude,
          longitude: coords.longitude,
          // Omitted rather than sent as null: the HTML falls back to the live
          // zoom when `data.zoom` is not a number.
          ...(typeof zoom === 'number' ? { zoom } : {}),
        }),
      );
    },
    zoomBy(delta) {
      webRef.current?.postMessage(JSON.stringify({ type: 'zoomBy', delta }));
    },
  }));

  useEffect(() => {
    // Initial camera position is applied after load through the bridge because
    // the HTML document is shared and does not bake per-screen coordinates.
    const listeners = loadEndListenersRef.current;
    function send() {
      webRef.current?.postMessage(
        JSON.stringify({
          type: 'setView',
          latitude: initialCenter.latitude,
          longitude: initialCenter.longitude,
          zoom: initialZoom,
        }),
      );
    }
    if (htmlUri) {
      send();
      listeners.add(send);
    }
    return () => {
      listeners.delete(send);
    };
    // Captures the mount-time camera only; runtime moves go through setCenter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [htmlUri]);

  useEffect(() => {
    const payload = JSON.stringify({
      type: 'officer',
      latitude: officerMarker?.latitude ?? null,
      longitude: officerMarker?.longitude ?? null,
    });
    const listeners = loadEndListenersRef.current;
    function send() {
      webRef.current?.postMessage(payload);
    }
    send();
    listeners.add(send);
    return () => {
      listeners.delete(send);
    };
  }, [htmlUri, officerMarker]);

  useEffect(() => {
    // Re-sent on every load because the document is shared and starts with no
    // coverage: without this a remount would clamp to nothing (or, worse, to a
    // stale value baked by an earlier screen).
    const payload = JSON.stringify({
      type: 'coverage',
      ...(coverage ? { zoomMax: coverage.zoomMax, zoomMin: coverage.zoomMin } : {}),
    });
    const listeners = loadEndListenersRef.current;
    function send() {
      webRef.current?.postMessage(payload);
    }
    send();
    listeners.add(send);
    return () => {
      listeners.delete(send);
    };
  }, [htmlUri, coverage]);

  useEffect(() => {
    // Gating clause for the whole coverage mechanism, so it travels on its own
    // channel and takes effect the moment the radio flips rather than waiting
    // for the officer to move the map.
    const payload = JSON.stringify({ type: 'online', offline });
    const listeners = loadEndListenersRef.current;
    function send() {
      webRef.current?.postMessage(payload);
    }
    send();
    listeners.add(send);
    return () => {
      listeners.delete(send);
    };
  }, [htmlUri, offline]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as {
        type: string;
        latitude: number;
        longitude: number;
        zoom: number;
        covered?: boolean;
      };
      if (data.type !== 'moveend') {
        return;
      }
      if (typeof data.covered === 'boolean') {
        onCoverageChangeRef.current?.(data.covered);
      }
      onRegionChangeRef.current?.({ latitude: data.latitude, longitude: data.longitude });
    } catch {
      return;
    }
  }

  function handleLoadEnd() {
    loadEndListenersRef.current.forEach(send => send());
  }

  return (
    <View style={[styles.container, style]}>
      {htmlUri && (
        <WebView
          ref={webRef}
          source={{ uri: htmlUri }}
          onLoadEnd={handleLoadEnd}
          onMessage={handleMessage}
          originWhitelist={['file://', 'about:blank', 'http://*', 'https://*']}
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          javaScriptEnabled
          domStorageEnabled={false}
          allowsBackForwardNavigationGestures={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          overScrollMode="never"
          setSupportMultipleWindows={false}
          cacheEnabled={false}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
});