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
      ? "border-line bg-surface/85 text-fg-muted backdrop-blur"
      : "border-line bg-surface/95 text-fg-faint shadow-lg backdrop-blur-sm";

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
                      ? "bg-brand text-on-brand"
                      : "text-fg-muted hover:bg-surface-hover hover:text-fg"
                  }`
                : `rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                    selected
                      ? "bg-brand text-on-brand shadow-sm"
                      : "text-fg-faint hover:bg-surface-hover hover:text-fg"
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
