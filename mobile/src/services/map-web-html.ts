import { Directory, File, Paths } from 'expo-file-system';

import { getAppConfig } from '@/config/env';

/**
 * The map page is hosted as a real `file://` document instead of an inline
 * HTML string: browsers block `file://` subresources from a blank origin,
 * but from a file origin (with the WebView's allow-file-access flags) the
 * slippy-map can load cached tiles directly from disk and fall back to the
 * network per tile when a file is missing.
 *
 * Bumping this version is mandatory whenever the document below changes: the
 * file is written once and never rewritten, so a device that already has
 * `index-v3.html` would keep running the old tile-level logic — and the old
 * logic is what left officers staring at a blank map offline.
 */
const HTML_FILE_VERSION = 5;

export function mapHtmlDirectory(): Directory {
  return new Directory(Paths.document, 'map');
}

function buildMapHtml(localRoot: string, remoteTileUrl: string): string {
  return `<!DOCTYPE html>
<html lang="fa">
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  html, body { margin: 0; padding: 0; overflow: hidden; height: 100%; background: #e8f3f4; }
  #map { position: absolute; top: 0; left: 0; bottom: 0; right: 0; touch-action: none; overflow: hidden; }

  /* Design B — a missing tile is part of the app, not a hole in it.
     Without this the <img> simply fails to paint and the officer sees the bare
     page background: an unlabelled white void with no way to tell "no data"
     from "broken". */
  #layer .tile { position: absolute; top: 0; left: 0; width: 256px; height: 256px;
    display: block; transform-origin: 0 0; will-change: transform;
    -webkit-user-drag: none; user-select: none; pointer-events: none;
    background-color: #e8f3f4;
    background-image:
      repeating-linear-gradient(45deg, rgba(8,127,140,.10) 0 1px, transparent 1px 7px),
      repeating-linear-gradient(-45deg, rgba(8,127,140,.10) 0 1px, transparent 1px 7px);
    box-shadow: inset 0 0 0 1px rgba(8,127,140,.14); }
  #layer .tile.loading {
    background-color: #e9edf0;
    background-image: linear-gradient(100deg, transparent 20%, rgba(255,255,255,.75) 50%, transparent 80%);
    background-size: 220% 100%; background-repeat: no-repeat;
    animation: sweep 1.6s ease-in-out infinite; }
  #layer .tile.loaded { background-image: none; box-shadow: none; }
  @keyframes sweep { from { background-position: 140% 0; } to { background-position: -40% 0; } }

  /* Unifies the OSM raster with the app without recolouring the cartography:
     the officer still reads water, parks and roads as they actually are. */
  #vignette { position: absolute; top: 0; left: 0; right: 0; bottom: 0; pointer-events: none;
    background:
      linear-gradient(180deg, rgba(8,127,140,.07), rgba(8,127,140,.02)),
      radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(18,50,72,.10) 100%); }

  #officer { position: absolute; top: 0; left: 0; width: 18px; height: 18px; margin: -9px 0 0 -9px;
    border-radius: 9px; background: #2563eb; border: 3px solid #ffffff;
    box-shadow: 0 1px 4px rgba(0,0,0,.45); pointer-events: none; will-change: transform; }

  #scale { position: absolute; bottom: 10px; left: 10px; display: flex; flex-direction: column;
    align-items: flex-start; gap: 2px; pointer-events: none;
    color: #123248; font: 600 9.5px system-ui, sans-serif;
    text-shadow: 0 1px 2px rgba(255,255,255,.85); }
  #scale .bar { width: 64px; height: 5px; border: 1px solid #123248; border-top: 0;
    background: rgba(255,255,255,.55); }
</style>
</head>
<body>
<div id="map">
  <div id="layer"></div>
  <div id="vignette"></div>
  <div id="officer"></div>
  <div id="scale"><span id="scale-text"></span><span class="bar"></span></div>
</div>
<script>
(function () {
  var TILE = 256;
  var BUFFER = 2;
  var MIN_ZOOM = 3;
  var MAX_ZOOM = 19;
  var LOCAL_ROOT = ${JSON.stringify(localRoot)};
  var REMOTE_TILE_URL = ${JSON.stringify(remoteTileUrl)};

  var SCALE_STEPS_METERS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000,
                            10000, 20000, 50000, 100000, 200000];

  var state = {
    zoom: 14,
    lat: 35.6892,
    lng: 51.389,
    officerLat: null,
    officerLng: null,
    /* null = nothing downloaded yet, which must NOT clamp: before the first
       download the map is online, and clamping here is what made an officer's
       z17 map blank because the pack only reached z12. */
    coverage: null,
    /* Coverage only constrains tile levels while this is true. */
    offline: false,
    W: window.innerWidth,
    H: window.innerHeight
  };

  var layer = document.getElementById('layer');
  var officerEl = document.getElementById('officer');
  var scaleText = document.getElementById('scale-text');
  var tiles = new Map();
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

  /**
   * Mirrors tileZoomFor() in src/domain/map-coverage.ts.
   *
   * Coverage is a constraint ONLY while offline. Clamping unconditionally is a
   * worse bug than the blank map it fixed: online, the z4..z10 pack gets scaled
   * up to the z17 the officer asked for and the map is a blur, even though the
   * real tiles are one request away.
   */
  function baseZoom() {
    var target = Math.floor(state.zoom);
    if (target > MAX_ZOOM) target = MAX_ZOOM;
    if (target < 0) target = 0;
    var coverage = state.coverage;
    if (!state.offline || !coverage) return target;
    var lo = Math.min(coverage.zoomMin, coverage.zoomMax);
    var hi = Math.max(coverage.zoomMin, coverage.zoomMax);
    if (target > hi) target = hi;
    if (target < lo) target = lo;
    return target;
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
      if (state.officerLat != null) {
        var mx = lonToX(state.officerLng, zf) - lonToX(state.lng, zf) + state.W / 2;
        var my = latToY(state.officerLat, zf) - latToY(state.lat, zf) + state.H / 2;
        officerEl.style.display = 'block';
        officerEl.style.transform = 'translate3d(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px,0)';
      } else {
        officerEl.style.display = 'none';
      }
      updateScale();
    });
  }

  /** Rounds to a metric distance so the bar does not flicker while panning. */
  function updateScale() {
    var perPixel = 156543.03392 * Math.cos(state.lat * Math.PI / 180) / Math.pow(2, state.zoom);
    var wanted = perPixel * 80;
    var metres = SCALE_STEPS_METERS[SCALE_STEPS_METERS.length - 1];
    for (var i = 0; i < SCALE_STEPS_METERS.length; i += 1) {
      if (SCALE_STEPS_METERS[i] >= wanted) { metres = SCALE_STEPS_METERS[i]; break; }
    }
    scaleText.textContent = metres >= 1000
      ? (metres / 1000).toLocaleString('fa-IR') + ' کیلومتر'
      : metres.toLocaleString('fa-IR') + ' متر';
  }

  function createTile(bz, wx, ty) {
    var img = document.createElement('img');
    img.className = 'tile loading';
    /* Cached tile first; fall back to the network only when the file is absent.
       The styled placeholder underneath stays visible when both miss, which is
       what turns "blank white" into a legible "no offline coverage here". */
    img.onload = function () {
      img.className = 'tile loaded';
    };
    img.onerror = function () {
      img.className = 'tile';
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

  function emitMoveEnd() {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'moveend',
      latitude: state.lat,
      longitude: state.lng,
      zoom: state.zoom,
      /* About the REQUESTED zoom, never the clamped one. The clamp guarantees
         something is drawn, so reporting on the clamped value would claim
         "offline ready" at every zoom — the badge telling the officer a blurry
         z10 render is a usable z17 map. */
      covered: isOfflineReady(state.zoom)
    }));
  }

  /** Mirrors isOfflineReadyAt() in src/domain/map-coverage.ts. */
  function isOfflineReady(zoom) {
    var coverage = state.coverage;
    if (!coverage) return false;
    var lo = Math.min(coverage.zoomMin, coverage.zoomMax);
    var hi = Math.max(coverage.zoomMin, coverage.zoomMax);
    var target = Math.floor(zoom);
    return target >= lo && target <= hi;
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
      var cyT = latToY(animation.anchorLat, state.zoom) - (animation.ay - state.H / 2);
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
        state.officerLat = typeof data.latitude === 'number' ? data.latitude : null;
        state.officerLng = typeof data.longitude === 'number' ? data.longitude : null;
        applyFrame();
      } else if (data.type === 'coverage') {
        /* Applied without re-emitting moveend: a download finishing must not
           look like the officer moved the map. */
        state.coverage = typeof data.zoomMax === 'number'
          ? { zoomMin: typeof data.zoomMin === 'number' ? data.zoomMin : MIN_ZOOM, zoomMax: data.zoomMax }
          : null;
        reconcile(true);
      } else if (data.type === 'online') {
        /* Connectivity gates whether coverage constrains the tile level, so it
           arrives on its own channel and re-reconciles when the radio flips. */
        state.offline = data.offline === true;
        reconcile(true);
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

  officerEl.style.display = 'none';
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