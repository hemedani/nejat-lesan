import { Directory, File, Paths } from 'expo-file-system';

import { getAppConfig } from '@/config/env';

/**
 * The map page is hosted as a real `file://` document instead of an inline
 * HTML string: browsers block `file://` subresources from a blank origin,
 * but from a file origin (with the WebView's allow-file-access flags) the
 * slippy-map can load cached tiles directly from disk and fall back to the
 * network per tile when a file is missing.
 */

const HTML_FILE_VERSION = 3;

export function mapHtmlDirectory(): Directory {
  return new Directory(Paths.document, 'map');
}

function buildMapHtml(localRoot: string, remoteTileUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body { margin: 0; padding: 0; overflow: hidden; height: 100%; background: #e8edf0; }
  #map { position: absolute; top: 0; left: 0; right: 0; bottom: 0; touch-action: none; overflow: hidden; }
  #layer img { position: absolute; top: 0; left: 0; width: 256px; height: 256px; display: block;
    transform-origin: 0 0; will-change: transform; -webkit-user-drag: none; user-select: none; pointer-events: none; }
  .officer { position: absolute; top: 0; left: 0; width: 18px; height: 18px; margin: -9px 0 0 -9px;
    border-radius: 9px; background: #2563eb; border: 3px solid #ffffff;
    box-shadow: 0 1px 4px rgba(0,0,0,.45); pointer-events: none; will-change: transform; }
</style>
</head>
<body>
<div id="map"><div id="layer"></div></div>
<script>
(function () {
  var TILE = 256;
  var BUFFER = 2;
  var MIN_ZOOM = 3;
  var MAX_ZOOM = 19;
  var LOCAL_ROOT = ${JSON.stringify(localRoot)};
  var REMOTE_TILE_URL = ${JSON.stringify(remoteTileUrl)};

  var state = {
    zoom: 14,
    lat: 35.6892,
    lng: 51.389,
    officerLat: null,
    officerLng: null,
    W: window.innerWidth,
    H: window.innerHeight
  };

  var layer = document.getElementById('layer');
  var tiles = new Map();
  var markerEl = null;
  var framePending = false;
  var lastReconcile = 0;
  var activePan = null;
  var pinch = null;
  var lastTap = { t: 0, x: 0, y: 0 };
  var animation = null;

  function worldSize(z) { return TILE * Math.pow(2, z); }
  function lonToX(lng, z) { return ((lng + 180) / 360) * worldSize(z); }
  function latToY(lat, z) {
    var rad = (lat * Math.PI) / 180;
    return ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * worldSize(z);
  }
  function xToLon(x, z) { return (x / worldSize(z)) * 360 - 180; }
  function yToLat(y, z) {
    var n = Math.PI - (2 * Math.PI * y) / worldSize(z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  function clampLat() {
    if (state.lat > 85.05) state.lat = 85.05;
    if (state.lat < -85.05) state.lat = -85.05;
  }

  function baseZoom() {
    var bz = Math.floor(state.zoom);
    if (bz > MAX_ZOOM) bz = MAX_ZOOM;
    if (bz < 0) bz = 0;
    return bz;
  }

  function applyFrame() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(function () {
      framePending = false;
      var zf = state.zoom;
      var bz = baseZoom();
      var scale = Math.pow(2, zf - bz);
      var cxb = lonToX(state.lng, bz);
      var cyb = latToY(state.lat, bz);
      tiles.forEach(function (entry) {
        var sx = (entry.tx * TILE - cxb) * scale + state.W / 2;
        var sy = (entry.ty * TILE - cyb) * scale + state.H / 2;
        entry.el.style.transform =
          'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0) scale(' + scale.toFixed(4) + ')';
      });
      if (markerEl && state.officerLat != null) {
        var mx = lonToX(state.officerLng, zf) - lonToX(state.lng, zf) + state.W / 2;
        var my = latToY(state.officerLat, zf) - latToY(state.lat, zf) + state.W / 2;
        markerEl.style.transform = 'translate3d(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px,0)';
      }
    });
  }

  function createTile(bz, wx, ty) {
    var img = document.createElement('img');
    // Cached tile first; fall back to the network only when the file is absent.
    img.onerror = function () {
      if (!img.dataset.fallback) {
        img.dataset.fallback = '1';
        img.src = REMOTE_TILE_URL + '/' + bz + '/' + wx + '/' + ty + '.png';
      }
    };
    img.src = LOCAL_ROOT + '/' + bz + '/' + wx + '/' + ty + '.png';
    layer.appendChild(img);
    tiles.set(bz + '/' + wx + '/' + ty, { el: img, tx: wx, ty: ty });
  }

  function reconcile(force) {
    var now = Date.now();
    if (!force && now - lastReconcile < 140) return;
    lastReconcile = now;

    var bz = baseZoom();
    var n = Math.pow(2, bz);
    var scale = Math.pow(2, state.zoom - bz);
    var cxb = lonToX(state.lng, bz);
    var cyb = latToY(state.lat, bz);
    var halfW = state.W / (2 * scale);
    var halfH = state.H / (2 * scale);
    var tx0 = Math.floor((cxb - halfW) / TILE) - BUFFER;
    var ty0 = Math.floor((cyb - halfH) / TILE) - BUFFER;
    var tx1 = tx0 + Math.ceil((halfW * 2) / TILE) + BUFFER * 2;
    var ty1 = ty0 + Math.ceil((halfH * 2) / TILE) + BUFFER * 2;

    var needed = new Set();
    for (var ty = ty0; ty <= ty1; ty++) {
      if (ty < 0 || ty >= n) continue;
      for (var tx = tx0; tx <= tx1; tx++) {
        var wx = ((tx % n) + n) % n;
        var key = bz + '/' + wx + '/' + ty;
        needed.add(key);
        if (!tiles.has(key)) {
          createTile(bz, wx, ty);
        }
      }
    }

    tiles.forEach(function (entry, key) {
      if (!needed.has(key)) {
        entry.el.remove();
        tiles.delete(key);
      }
    });

    applyFrame();
  }

  function ensureMarker() {
    if (state.officerLat == null) {
      if (markerEl) { markerEl.remove(); markerEl = null; }
      return false;
    }
    if (!markerEl) {
      markerEl = document.createElement('div');
      markerEl.className = 'officer';
      layer.appendChild(markerEl);
    }
    return true;
  }

  function emitMoveEnd() {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'moveend',
      latitude: state.lat,
      longitude: state.lng,
      zoom: state.zoom
    }));
  }

  function panBy(dx, dy) {
    var cx = lonToX(state.lng, state.zoom) - dx;
    var cy = latToY(state.lat, state.zoom) - dy;
    state.lng = xToLon(cx, state.zoom);
    state.lat = yToLat(cy, state.zoom);
    clampLat();
    applyFrame();
    reconcile(false);
  }

  function anchorLatLngAt(px, py) {
    var wx = lonToX(state.lng, state.zoom) + (px - state.W / 2);
    var wy = latToY(state.lat, state.zoom) + (py - state.H / 2);
    return { lat: yToLat(wy, state.zoom), lng: xToLon(wx, state.zoom) };
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  function touchDistance(a, b) {
    var dx = a.clientX - b.clientX;
    var dy = a.clientY - b.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function cancelAnimation() {
    animation = null;
  }

  function finishAnimation() {
    animation = null;
    reconcile(true);
    emitMoveEnd();
  }

  function tick(now) {
    if (!animation) return;
    var t = Math.min(1, (now - animation.start) / animation.duration);
    var e = easeOutCubic(t);

    if (animation.type === 'zoom') {
      state.zoom = animation.fromZoom + (animation.toZoom - animation.fromZoom) * e;
      var cxT = lonToX(animation.anchorLng, state.zoom) - (animation.ax - state.W / 2);
      var cyT = latToY(animation.anchorLat, state.zoom) - (animation.ay - state.W / 2);
      state.lng = xToLon(cxT, state.zoom);
      state.lat = yToLat(cyT, state.zoom);
      clampLat();
    } else {
      state.zoom = animation.fromZoom + (animation.toZoom - animation.fromZoom) * e;
      state.lat = animation.fromLat + (animation.toLat - animation.fromLat) * e;
      state.lng = animation.fromLng + (animation.toLng - animation.fromLng) * e;
      clampLat();
    }

    applyFrame();
    reconcile(false);

    if (t >= 1) {
      finishAnimation();
      return;
    }
    animation.raf = requestAnimationFrame(tick);
  }

  function animateZoom(toZoom, ax, ay) {
    toZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, toZoom));
    if (Math.abs(toZoom - state.zoom) < 0.001) return;
    if (ax == null) { ax = state.W / 2; }
    if (ay == null) { ay = state.H / 2; }
    var anchor = anchorLatLngAt(ax, ay);
    cancelAnimation();
    animation = {
      type: 'zoom',
      start: performance.now(),
      duration: 240,
      fromZoom: state.zoom,
      toZoom: toZoom,
      anchorLat: anchor.lat,
      anchorLng: anchor.lng,
      ax: ax,
      ay: ay,
      raf: 0
    };
    animation.raf = requestAnimationFrame(tick);
  }

  function animatePanTo(lat, lng, zoom, duration) {
    cancelAnimation();
    animation = {
      type: 'view',
      start: performance.now(),
      duration: duration || 320,
      fromLat: state.lat,
      fromLng: state.lng,
      fromZoom: state.zoom,
      toLat: Math.max(-85.05, Math.min(85.05, lat)),
      toLng: lng,
      toZoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom)),
      raf: 0
    };
    animation.raf = requestAnimationFrame(tick);
  }

  var mapEl = document.getElementById('map');

  mapEl.addEventListener('touchstart', function (event) {
    event.preventDefault();
    cancelAnimation();
    if (event.touches.length >= 2) {
      pinch = {
        startDist: touchDistance(event.touches[0], event.touches[1]),
        startZoom: state.zoom,
        anchor: anchorLatLngAt(
          (event.touches[0].clientX + event.touches[1].clientX) / 2,
          (event.touches[0].clientY + event.touches[1].clientY) / 2
        )
      };
      activePan = null;
      return;
    }
    var t = event.touches[0];
    activePan = { x: t.clientX, y: t.clientY };
  }, { passive: false });

  mapEl.addEventListener('touchmove', function (event) {
    event.preventDefault();
    if (event.touches.length >= 2 && pinch) {
      var dist = touchDistance(event.touches[0], event.touches[1]);
      if (dist > 0 && pinch.startDist > 0) {
        var midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
        var midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
        state.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM,
          pinch.startZoom + Math.log2(dist / pinch.startDist)));
        var targetX = lonToX(pinch.anchor.lng, state.zoom);
        var targetY = latToY(pinch.anchor.lat, state.zoom);
        state.lng = xToLon(targetX - (midX - state.W / 2), state.zoom);
        state.lat = yToLat(targetY - (midY - state.H / 2), state.zoom);
        clampLat();
        applyFrame();
        reconcile(false);
      }
      return;
    }
    if (activePan && event.touches.length === 1) {
      var t = event.touches[0];
      panBy(t.clientX - activePan.x, t.clientY - activePan.y);
      activePan = { x: t.clientX, y: t.clientY };
    }
  }, { passive: false });

  mapEl.addEventListener('touchend', function (event) {
    if (pinch && event.touches.length < 2) {
      pinch = null;
      reconcile(true);
      emitMoveEnd();
      if (event.touches.length === 1) {
        var t = event.touches[0];
        activePan = { x: t.clientX, y: t.clientY };
      } else {
        activePan = null;
      }
      return;
    }

    if (activePan) {
      activePan = null;
      reconcile(true);
      emitMoveEnd();

      var changed = event.changedTouches[0];
      if (changed) {
        var now = Date.now();
        var nearLast = Math.abs(changed.clientX - lastTap.x) < 24 &&
          Math.abs(changed.clientY - lastTap.y) < 24;
        if (now - lastTap.t < 300 && nearLast) {
          animateZoom(state.zoom + 1, changed.clientX, changed.clientY);
          lastTap = { t: 0, x: 0, y: 0 };
        } else {
          lastTap = { t: now, x: changed.clientX, y: changed.clientY };
        }
      }
    }
  });

  mapEl.addEventListener('touchcancel', function () {
    activePan = null;
    pinch = null;
  });

  function onBridge(payload) {
    try {
      var data = JSON.parse(payload.data);
      if (data.type === 'setView') {
        // Initial jump (screen mount / restored pin): no animation, no moveend.
        cancelAnimation();
        state.lat = data.latitude;
        state.lng = data.longitude;
        state.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, data.zoom));
        clampLat();
        applyFrame();
        reconcile(true);
      } else if (data.type === 'setCenter') {
        animatePanTo(data.latitude, data.longitude, typeof data.zoom === 'number' ? data.zoom : state.zoom, 320);
      } else if (data.type === 'zoomBy') {
        animateZoom(state.zoom + data.delta);
      } else if (data.type === 'officer') {
        state.officerLat = data.latitude;
        state.officerLng = data.longitude;
        ensureMarker();
        applyFrame();
      }
    } catch (error) {}
  }
  document.addEventListener('message', onBridge);
  window.addEventListener('message', onBridge);

  window.addEventListener('resize', function () {
    state.W = window.innerWidth;
    state.H = window.innerHeight;
    reconcile(true);
  });

  ensureMarker();
  reconcile(true);
})();
</script>
</body>
</html>`;
}

/**
 * Writes the map HTML once (per content version) and returns its `file://` URI.
 * Stale versions are cleaned up so the documents folder stays tidy.
 */
export async function ensureMapHtmlFile(): Promise<string> {
  const dir = mapHtmlDirectory();
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  const fileName = `index-v${HTML_FILE_VERSION}.html`;
  const file = new File(dir, fileName);
  if (!file.exists) {
    const config = getAppConfig();
    const localRoot = new Directory(Paths.document, 'mapcache').uri.replace(/\/+$/, '');
    await file.write(buildMapHtml(localRoot, config.mapTileUrl));
    for (const entry of dir.list()) {
      if (entry instanceof File && entry.name !== fileName && entry.name.startsWith('index-')) {
        try {
          entry.delete();
        } catch {
          // ignore stale cleanup failures
        }
      }
    }
  }
  return file.uri;
}
