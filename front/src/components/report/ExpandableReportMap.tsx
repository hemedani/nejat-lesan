"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { GeoPoint } from "@/types/patrol";
import { ReportLocationMap } from "@/components/patrol/ReportLocationMap";
import { BasemapSelector } from "@/components/maps/BasemapSelector";
import { PanelIcon } from "@/components/system/panel-icons";
import { useScrollLock } from "@/hooks/useScrollLock";
import { formatPoint, formatSeparation } from "@/utils/geo";

/**
 * The rail's map, plus a way out of it.
 *
 * The rail is ~250px wide, which is enough to show *that* a report has a location and
 * roughly where — and not enough to pan, read a coordinate, or judge how far the
 * officer's GPS fix sits from the recorded point. So the small map stays small (and
 * keeps `scrollWheelZoom` off, so scrolling the page does not zoom a thumbnail) and
 * this component owns a modal that can do all three properly.
 *
 * ## The basemap selector lives in the modal only
 *
 * Three buttons do not fit in the rail, and putting a control there that opens the
 * modal to reach the control would be a worse way to change a basemap than opening the
 * modal. The small map simply reflects whatever is chosen — it reads the same
 * `BasemapContext` every other map in the app does, persisted to `localStorage`.
 *
 * That matters inside Iran: `osm` is served from `tile.openstreetmap.org` and is
 * unreliable without international internet, while `mapir` is reachable. Neshan is not
 * offered because it is an SDK rather than a tile source — see `resolveTileBasemap`.
 */
export function ExpandableReportMap({
  location,
  gps,
  gpsAccuracy,
}: {
  location?: GeoPoint;
  gps?: GeoPoint;
  gpsAccuracy?: number;
}) {
  const [open, setOpen] = useState(false);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!location && !gps) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-slate-500">
        مختصات مکانی ثبت نشده است.
      </div>
    );
  }

  return (
    <>
      <div className="relative">
        <ReportLocationMap location={location} gps={gps} />

        {/* Over the map rather than beside it: the rail card has no room for a
            second row, and an absolute control keeps the map's height unchanged.

            `z-[1100]` is load-bearing. Leaflet paints its panes at z-index 200
            (tiles) through 700 (popups), and its own control container at 800–1000 —
            all *positioned with a positive z-index*. A positioned element with
            `z-index: auto` (i.e. 0), which is what this button got by default, is
            painted **under** every one of them. The button rendered but was invisible
            beneath the tiles. 1100 sits above `.leaflet-top`, the highest thing Leaflet
            paints, so the number is not a guess — if it ever looks wrong, compare
            against `node_modules/leaflet/dist/leaflet.css` rather than lowering it. */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="نمایش نقشه بزرگ"
          title="نمایش نقشه بزرگ"
          className="absolute left-2 top-2 z-[1100] rounded-lg border border-white/15 bg-slate-900/85 p-1.5 text-slate-200 backdrop-blur transition hover:border-blue-400/50 hover:text-white"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
            />
          </svg>
        </button>
      </div>

      <Legend hasGps={Boolean(gps)} />

      {open && (
        <MapModal
          location={location}
          gps={gps}
          gpsAccuracy={gpsAccuracy}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function MapModal({
  location,
  gps,
  gpsAccuracy,
  onClose,
}: {
  location?: GeoPoint;
  gps?: GeoPoint;
  gpsAccuracy?: number;
  onClose: () => void;
}) {
  // Bumped by the fit-bounds button; passed through to re-fit the viewport.
  const [fitKey, setFitKey] = useState(1);
  const separation = formatSeparation(location, gps);

  // Portal + `z-[100000]`, both load-bearing.
  //
  // **The z-index.** Site chrome sits far higher than a Tailwind `z-50` assumption:
  // the Navbar is `fixed z-[9999]` (`components/organisms/Navbar.tsx:81`) and
  // `GlobalFiltersBar` reaches `z-[10000]`–`z-[10002]`. At the `z-[2100]` this dialog
  // started with, the navbar painted straight over it. `z-[100000]` matches the
  // convention `components/modals/AccidentDetailsModal.tsx:183` already established
  // for a full-screen modal, and sits above every fixed element in the app.
  //
  // **The portal.** A dialog's `position: fixed` is only viewport-relative while no
  // ancestor has a `transform`, `filter`, `backdrop-filter` or `will-change` — any of
  // which silently creates a containing block *and* a stacking context, trapping the
  // modal inside the page and capping it below the navbar no matter how large its
  // z-index is. None of those exist on today's ancestors, so this is not fixing a
  // present bug; it is removing a dependency on that staying true. `createPortal` to
  // `document.body` is what makes the z-index above mean what it says.
  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="نمای بزرگ نقشه"
      onClick={onClose}
    >
      {/* `h-full`, NOT `max-h-full`.

          A `max-height` leaves the panel's height **indefinite** — sized by its own
          content. The map wrapper is `flex-1`, which distributes *free space*; with an
          indefinite parent there is none, so it collapses to its content height, and the
          map's `h-full` is then a percentage of an indefinite height, which resolves to
          `auto`. `MapContainer` has no intrinsic height, so the map rendered at 0px — a
          horizontal line where the map should be.

          A definite height gives the chain something to resolve against: overlay
          (`fixed inset-0`) → panel (`h-full`) → wrapper (`flex-1`) → map (`h-full`). */}
      <div
        className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900"
        onClick={(event) => event.stopPropagation()}
      >
        {/* `shrink-0` so the chrome keeps its height and the map absorbs the remainder,
            rather than the map being squeezed to nothing on a short window. */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">موقعیت رخداد</h2>
          <div className="flex items-center gap-2">
            <BasemapSelector variant="dark" />
            <button
              type="button"
              onClick={() => setFitKey((key) => key + 1)}
              className="rounded-lg border border-white/10 bg-white/[.04] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              نمایش هر دو نقطه
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="rounded-lg border border-white/10 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <PanelIcon name="close" className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* `flex-1` takes whatever the header and footer leave, rather than a fixed `68vh`:
            a vh height plus the chrome overflows a short window, and the panel is
            `overflow-hidden`, so the bottom of the map would be clipped with no way to
            scroll to it. `min-h-64` keeps it usable when the viewport is genuinely tiny,
            and only then — the floor is below the space a normal window leaves, so it
            does not fight the flex distribution on an ordinary screen. */}
        <div className="min-h-64 flex-1 p-3">
          <ReportLocationMap
            location={location}
            gps={gps}
            height="h-full"
            interactive
            fitBoundsKey={fitKey}
          />
        </div>

        <footer className="grid shrink-0 grid-cols-1 gap-2 border-t border-white/10 px-4 py-3 text-xs sm:grid-cols-3">
          <Coordinate label="محل حادثه" point={location} />
          <Coordinate label="GPS مأمور" point={gps} />
          <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-4">
            <span className="text-slate-500">فاصلهٔ دو نقطه</span>
            <span className="text-slate-200">
              {separation ??
                (gps ? "محل حادثه ثبت نشده" : "موقعیت GPS ثبت نشده")}
            </span>
          </div>
          {gpsAccuracy != null && (
            <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-4">
              <span className="text-slate-500">دقت GPS</span>
              <span className="text-slate-200">
                {gpsAccuracy.toLocaleString("fa-IR")} متر
              </span>
            </div>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function Coordinate({ label, point }: { label: string; point?: GeoPoint }) {
  return (
    <div className="flex items-center justify-between gap-2 sm:justify-start sm:gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200" dir={point ? "ltr" : undefined}>
        {formatPoint(point) ?? "ثبت نشده"}
      </span>
    </div>
  );
}

/**
 * Only the markers that exist, and only the separation line when there are two
 * points to draw it between. A legend listing a GPS marker on a report with no GPS
 * point describes a map the reader is not looking at.
 */
function Legend({ hasGps }: { hasGps: boolean }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
      <span>
        <span className="text-rose-400">●</span> محل حادثه
      </span>
      {hasGps && (
        <span>
          <span className="text-sky-400">●</span> GPS مأمور
        </span>
      )}
      {hasGps && (
        <span className="text-slate-600">— فاصلهٔ دو نقطه، دقت موقعیت را نشان می‌دهد</span>
      )}
    </div>
  );
}
