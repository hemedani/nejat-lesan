"use client";

import { useBasemap } from "@/context/BasemapContext";
import { BASEMAPS, TILE_BASEMAPS, type BasemapType } from "@/utils/basemaps";

/**
 * Which basemaps to offer.
 *
 * Defaults to the tile-based ones. A map rendered as a react-leaflet
 * `<MapContainer>` cannot show Neshan — it is an SDK that replaces `window.L`, not a
 * tile source (`resolveTileBasemap`) — so offering it there would select a provider
 * that renders a blank background. Callers whose map *is* an SDK-backed map pass
 * `all` and get everything.
 */
export function BasemapSelector({
  variant = "light",
  scope = "tile",
}: {
  /** `dark` for the role panels, which are dark; `light` for the public `/maps` pages. */
  variant?: "light" | "dark";
  scope?: "tile" | "all";
}) {
  const { basemap, setBasemap } = useBasemap();
  const options: BasemapType[] =
    scope === "all"
      ? (Object.keys(BASEMAPS) as BasemapType[])
      : [...TILE_BASEMAPS];

  // The context may hold `neshan` (chosen on a `/maps` page); the effective tile
  // basemap is what this control reflects, so the highlight does not sit on nothing.
  const active: BasemapType =
    scope === "all"
      ? basemap
      : (TILE_BASEMAPS as readonly BasemapType[]).includes(basemap)
        ? basemap
        : "mapir";

  const shell =
    variant === "dark"
      ? "border-white/10 bg-slate-900/85 text-slate-300 backdrop-blur"
      : "border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur-sm";

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border p-1 ${shell}`}
      role="group"
      aria-label="انتخاب نقشه"
    >
      {options.map((type) => {
        const selected = active === type;
        return (
          <button
            key={type}
            type="button"
            aria-pressed={selected}
            onClick={() => setBasemap(type)}
            className={
              variant === "dark"
                ? `rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    selected
                      ? "bg-blue-500 text-white"
                      : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
                  }`
                : `rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    selected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                  }`
            }
          >
            {BASEMAPS[type].name}
          </button>
        );
      })}
    </div>
  );
}

export default BasemapSelector;
