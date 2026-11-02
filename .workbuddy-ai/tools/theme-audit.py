#!/usr/bin/env python3
"""Theme audit — the ratchet that keeps hardcoded colours out of the frontend.

    python3 .workbuddy-ai/tools/theme-audit.py            # report + compare to baseline
    python3 .workbuddy-ai/tools/theme-audit.py --enforce  # exit 1 if the count went up
    python3 .workbuddy-ai/tools/theme-audit.py --write-baseline

Design: docs/superpowers/specs/2026-11-01-theme-architecture-design.md

Why this exists
---------------
The theme architecture is only as good as its enforcement. A single
`className="bg-white text-gray-900"` reintroduces exactly the bug the migration
removes: a surface that cannot follow `data-theme`, because its colour is baked
into the component instead of resolved from a token.

TypeScript cannot see this. Neither can the linter — `bg-white` is a valid class.
So the guard is a static count: literals may fall, never rise.

Phase 0–3 of the migration run this as a report. Phase 4 turns `--enforce` on in
CI.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "front" / "src"
BASELINE = Path(__file__).resolve().parent / "theme-audit-baseline.json"

# A Tailwind colour utility: prefix-palette-shade, optionally with /opacity.
COLOR_UTILITY = re.compile(
    r"\b(?:bg|text|border|from|to|via|ring|divide|fill|stroke|shadow|placeholder"
    r"|outline|decoration|caret|accent)"
    r"-(?:white|black|gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime"
    r"|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)"
    r"(?:-\d{2,3})?(?:/\d{1,3}|/\[[^\]]+\])?\b"
)

# Hex colours inside a chart file: ApexCharts writes these into SVG attributes,
# so no stylesheet can override them. Phase 2 gate.
HEX_LITERAL = re.compile(r"#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b")

CHART_DIRS = ("components/charts", "app/charts", "components/dashboards")


def classify(utility: str) -> str:
    """`light` / `dark` / `neutral`.

    A literal is only a *problem* when it is a surface or text colour; the
    classification is what lets the report show which way a surface leans.
    """
    if re.match(r"^(border|divide|ring)-white/", utility):
        return "dark"
    if re.match(r"^bg-white/\[", utility):
        return "dark"
    if re.match(r"^bg-(slate|gray|zinc)-(8|9)\d\d", utility):
        return "dark"
    if re.match(r"^bg-(blue|cyan|emerald|rose|amber|orange|violet)-(4|5)\d\d/", utility):
        return "dark"
    if re.match(r"^text-(slate|gray)-(1|2|3|4|5)\d\d", utility):
        return "dark"
    if re.match(r"^text-(blue|cyan|emerald|rose|amber|orange|violet)-(1|2|3)\d\d", utility):
        return "dark"
    if utility == "text-white":
        return "dark"

    if utility == "bg-white" or re.match(r"^bg-white/", utility):
        return "light"
    if re.match(r"^bg-(gray|slate|zinc)-(50|100|200)$", utility):
        return "light"
    if re.match(r"^text-(gray|slate|zinc)-[3-9]\d\d$", utility):
        return "light"
    if re.match(r"^border-(gray|slate|zinc)-[1-3]\d\d$", utility):
        return "light"
    if re.match(
        r"^bg-(blue|red|green|amber|orange|indigo|purple|pink|teal|cyan|rose"
        r"|emerald|yellow|violet|lime|sky)-(50|100)$",
        utility,
    ):
        return "light"
    if re.match(
        r"^text-(blue|red|green|amber|orange|indigo|purple|pink|teal|cyan|rose"
        r"|emerald|yellow|violet|lime|sky)-[6-8]0\d$",
        utility,
    ):
        return "light"
    if re.match(
        r"^border-(blue|red|green|amber|orange|indigo|purple|pink|teal|cyan|rose"
        r"|emerald|yellow|violet|lime|sky)-[1-2]0\d$",
        utility,
    ):
        return "light"
    return "neutral"


def area_of(path: Path) -> str:
    parts = path.relative_to(SRC).parts
    if not parts:
        return "src"
    if parts[0] in ("app", "components") and len(parts) > 1:
        return f"{parts[0]}/{parts[1]}"
    return parts[0]


def scan() -> tuple[Counter, dict[str, Counter], list[tuple[str, int]]]:
    totals: Counter = Counter()
    per_area: dict[str, Counter] = defaultdict(Counter)
    hex_hits: list[tuple[str, int]] = []

    for path in sorted(SRC.rglob("*.tsx")):
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(SRC).as_posix()
        area = area_of(path)

        for match in COLOR_UTILITY.finditer(text):
            kind = classify(match.group(0))
            totals[kind] += 1
            per_area[area][kind] += 1

        if any(rel.startswith(prefix) for prefix in CHART_DIRS):
            hexes = HEX_LITERAL.findall(text)
            if hexes:
                hex_hits.append((rel, len(hexes)))

    return totals, per_area, hex_hits


def main() -> int:
    args = sys.argv[1:]
    enforce = "--enforce" in args
    write_baseline = "--write-baseline" in args

    totals, per_area, hex_hits = scan()
    literal_total = totals["light"] + totals["dark"] + totals["neutral"]

    print(f"{'area':32} {'light':>7} {'dark':>7} {'neutral':>8}  leans")
    print("-" * 72)
    for area, counts in sorted(
        per_area.items(), key=lambda item: -(item[1]["light"] + item[1]["dark"])
    ):
        light, dark = counts["light"], counts["dark"]
        share = f"{light / (light + dark) * 100:.0f}% light" if (light + dark) else "-"
        print(f"{area:32} {light:>7} {dark:>7} {counts['neutral']:>8}  {share}")
    print("-" * 72)
    print(
        f"{'TOTAL':32} {totals['light']:>7} {totals['dark']:>7} "
        f"{totals['neutral']:>8}"
    )
    print(f"\nhardcoded colour literals: {literal_total}")

    if hex_hits:
        print(f"\nHEX LITERALS IN CHART FILES: {len(hex_hits)} files")
        print("  ApexCharts writes these into SVG attributes — no CSS can reach them.")
        print("  They must come from `useChartTheme()` (utils/chart-theme.ts).")
        for rel, count in hex_hits[:20]:
            print(f"    {rel}  ({count})")
        if len(hex_hits) > 20:
            print(f"    … and {len(hex_hits) - 20} more")

    if write_baseline:
        BASELINE.write_text(
            json.dumps(
                {"literalTotal": literal_total, "light": totals["light"], "dark": totals["dark"], "neutral": totals["neutral"]},
                indent=2,
            )
            + "\n",
            encoding="utf-8",
        )
        print(f"\nbaseline written to {BASELINE.relative_to(ROOT)}")
        return 0

    if not BASELINE.exists():
        print("\nno baseline recorded — run with --write-baseline once")
        return 0

    baseline = json.loads(BASELINE.read_text(encoding="utf-8"))
    previous = baseline["literalTotal"]
    delta = literal_total - previous
    print(f"baseline: {previous}   delta: {delta:+d}")

    if delta > 0:
        print("\nFAIL — hardcoded colour literals increased.")
        print("Use the semantic tokens in `front/src/app/globals.css` instead:")
        print("  bg-surface / bg-canvas / text-fg / text-fg-muted / border-line")
        print("  bg-brand / bg-brand-soft / text-brand-fg / text-danger-fg …")
        print("")
        print("For a categorical accent colour (one hue per card or chip), do NOT")
        print("reach for `bg-orange-50` — that is a light-mode tint and it will be")
        print("a pale block in dark mode. Use the hue-parameterised tint instead:")
        print("  <a class=\"tint-orange bg-tint-soft border border-tint-border\">")
        print("      <span class=\"bg-tint-strong text-tint-fg\">…</span>")
        print("  Hues: tint-{red,orange,amber,yellow,lime,green,emerald,teal,cyan,")
        print("        sky,blue,indigo,violet,purple,fuchsia,pink,rose,slate}")
        print("        plus tint-{brand,success,warning,danger,info}")
        print("  Surfaces: bg-tint-soft, bg-tint-strong, border-tint-border, text-tint-fg")
        return 1 if enforce else 0

    print("OK — literal count did not increase.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
