#!/usr/bin/env python3
"""Assert `LeafletSurface` cannot reintroduce the collapsed-map bug.

The rule
-------
`front/src/app/globals.css` declares, twice:

    .leaflet-container { width: 100% !important; height: 100% !important; }

`MapContainer` puts `leaflet-container` on **its own** root div, so that
declaration targets the map element itself. `!important` beats any non-important
declaration regardless of source order, so a fixed height on the map — a
Tailwind class like `h-[420px]`, or an inline `style={{height:'500px'}}` — is
**silently inert**. The element then falls back to `100%` of its parent, and if
that parent has `height: auto` the map collapses to nothing: tiles load, the DOM
looks correct, and the control renders a few pixels tall.

It type-checks. It builds. It fails only when a user opens the page.

So the map itself must always be `h-full`, and the **height belongs on a wrapper
div**. That is the shape every map in this repo that actually works uses, and it
is what `LeafletSurface` exists to guarantee: its callers pass a sizing
`className` and must not be able to put that class on the map element.

Why this script checks the one component rather than every `<MapContainer>`
----------------------------------------------------------------------
"Has a fixed height" is only fatal when there is no sized ancestor, and proving
the absence of an ancestor statically is not reliable — an earlier draft of this
check flagged `SpatialSafetyMap`, which sets `style={{height:'500px'}}` on the
map but is correctly wrapped in a `height:500px; overflow-hidden` div, and
renders fine. Failing the build on that would be wrong.

`LeafletSurface` is the shared chokepoint every GeoJSON editor goes through, so
asserting its shape is exact, cannot false-positive, and covers road, org, and
the six refactored province/city/township forms at once. The repo-wide scan
below is reported but does not fail.

Run: python3 .workbuddy-ai/tools/map-surface-test.py
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
FRONT = ROOT / "front" / "src"
SURFACE = FRONT / "components" / "maps" / "LeafletSurface.tsx"
GLOBALS = FRONT / "app" / "globals.css"

failures: list[str] = []


def check_globals_rule_exists() -> None:
    """If the globals rule is removed, this script is guarding nothing."""
    text = GLOBALS.read_text(encoding="utf-8")
    if "height: 100% !important" not in text:
        failures.append(
            f"{GLOBALS.relative_to(ROOT)}: expected `.leaflet-container "
            "{ height: 100% !important }`. If that rule was removed the height "
            "trap this script guards against no longer exists — re-check every "
            "map before deleting this script."
        )


def check_surface_shape() -> None:
    text = SURFACE.read_text(encoding="utf-8")

    m = re.search(r"<MapContainer\b", text)
    if not m:
        failures.append(f"{SURFACE.relative_to(ROOT)}: no <MapContainer> found.")
        return
    end = text.find(">", m.end())
    tag = text[m.start() : end + 1]

    if "h-full" not in tag:
        failures.append(
            f"{SURFACE.relative_to(ROOT)}: MapContainer must be `h-full` — "
            "globals.css forces `height: 100% !important` on `.leaflet-container`, "
            "so anything else is inert and the map collapses to its parent."
        )
    if re.search(r"""className\s*=\s*["'][^"']*\bh-(?:\d|\[)""", tag):
        failures.append(
            f"{SURFACE.relative_to(ROOT)}: MapContainer carries a fixed height "
            "class. The caller's sizing class belongs on the wrapper div."
        )
    if re.search(r"""style\s*=\s*\{\{[^}]*\bheight\s*:""", tag, re.S):
        failures.append(
            f"{SURFACE.relative_to(ROOT)}: MapContainer carries an inline height. "
            "The height belongs on the wrapper div."
        )

    # The wrapper must exist, and must be the element that receives className.
    if not re.search(r"<div className=\{className\}>", text):
        failures.append(
            f"{SURFACE.relative_to(ROOT)}: expected a wrapper `<div className="
            "{className}>` around the MapContainer — that div is what carries "
            "the caller's height."
        )


FIXED_HEIGHT = re.compile(
    r"""(?:h-\[[\d.]+[a-z]*\]|h-\d+|style\s*=\s*\{\{[^}]*\bheight\s*:\s*["']\d)"""
)

# Advisory only — a fixed height here is fine when a sized ancestor exists.
ADVISORY: list[str] = []


def scan_repo() -> int:
    checked = 0
    for path in FRONT.rglob("*.tsx"):
        if path == SURFACE:
            continue
        text = path.read_text(encoding="utf-8")
        for m in re.finditer(r"<MapContainer\b", text):
            end = text.find(">", m.end())
            if end == -1:
                continue
            tag = text[m.start() : end + 1]
            checked += 1
            if FIXED_HEIGHT.search(tag):
                ADVISORY.append(
                    f"  ? {path.relative_to(ROOT)}:"
                    f"{text[: m.start()].count(chr(10)) + 1}: fixed height on "
                    "MapContainer (ok only if a sized ancestor wraps it)"
                )
    return checked


def main() -> None:
    check_globals_rule_exists()
    check_surface_shape()

    if failures:
        print("map-surface FAILED:")
        for f in failures:
            print(f"  x {f}")
        sys.exit(1)

    checked = scan_repo()
    if ADVISORY:
        print("map-surface: advisory — review these by hand:")
        print("\n".join(ADVISORY))
    print(
        f"map-surface ok — LeafletSurface keeps height on a wrapper; "
        f"{checked} other MapContainer(s) scanned"
    )


if __name__ == "__main__":
    main()
