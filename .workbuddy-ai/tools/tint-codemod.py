#!/usr/bin/env python3
"""
Convert the "dark-native alpha idiom" to the `tint-*` primitive.

The idiom
---------
    border-blue-400/25 bg-blue-400/10 text-blue-200

was written against the dark shell: a translucent mid-hue wash plus a *pale*
label. On dark that reads as a soft tint. On a white card the wash is invisible
and a `-200` label is white-on-white, so the text disappears — which is exactly
the defect class reported on /orghead, /admin and the login page.

The primitive
-------------
    tint-blue border-tint-border bg-tint-soft text-tint-fg

`tint-*` sets `--tint`; the four roles are `color-mix`ed from it and the mix
strengths differ per theme (see `--tint-*-strength` in globals.css). So one
declaration is legible on both surfaces, and there is one place to tune.

Safety rules
------------
1. **A pale label must be present.** The transform is keyed on
   `text-{hue}-100|200|300`, because that is the thing that actually breaks.
   A translucent wash with `text-white` on a genuinely dark panel is left alone.
2. **A wash or border must accompany it.** Bare `text-blue-300` with no tint
   context is *not* self-identifying — it might sit on a solid blue button,
   where pale-on-blue is correct. Those are reported, never rewritten.
3. **Token boundaries are `(?<![\\w-])` / `(?![\\w-])`.** The first attempt at a
   codemod in this repo used plain `str.replace` and turned `bg-orange-500` into
   `bg-tint-soft0`; prefix matching is not optional.
4. **Idempotent.** Once `text-{hue}-2xx` becomes `text-tint-fg` the key no longer
   matches, so a second run is a no-op.

Usage
-----
    python3 .workbuddy-ai/tools/tint-codemod.py            # dry run, report only
    python3 .workbuddy-ai/tools/tint-codemod.py --apply
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2] / "front" / "src"

HUES = [
    "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal",
    "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink",
    "rose", "slate",
]

BORDER_ALPHAS = r"(?:10|15|20|25|30|40|50|60)"
BG_ALPHAS = r"(?:5|10|15|20|25)"
PALE_STEPS = r"(?:100|200|300)"


def _tok(pattern: str) -> re.Pattern[str]:
    return re.compile(r"(?<![\w-])" + pattern + r"(?![\w-])")


def _rules(hue: str) -> tuple[re.Pattern[str], re.Pattern[str], re.Pattern[str]]:
    return (
        _tok(rf"border-{hue}-(?:300|400|500)/{BORDER_ALPHAS}"),
        _tok(rf"bg-{hue}-(?:300|400|500)/{BG_ALPHAS}"),
        _tok(rf"text-{hue}-{PALE_STEPS}"),
    )


RULES = {hue: _rules(hue) for hue in HUES}

# A class-bearing string literal. Templates with `${}` are matched loosely; the
# transform is token-based and idempotent, so a partial match is harmless.
LITERAL = re.compile(r"""(["'`])((?:\\.|(?!\1).)*?)\1""")


def convert(text: str) -> tuple[str, list[str], list[str]]:
    """Return (new_text, converted_hues, leftover_pale_hues)."""
    converted: list[str] = []
    leftover: list[str] = []

    def repl(match: re.Match[str]) -> str:
        quote, body = match.group(1), match.group(2)
        if not body or " " not in body and "-" not in body:
            return match.group(0)

        for hue in HUES:
            border_re, bg_re, pale_re = RULES[hue]
            if not pale_re.search(body):
                continue

            has_border = bool(border_re.search(body))
            has_bg = bool(bg_re.search(body))

            if not (has_border or has_bg):
                # Bare pale label — needs a human. It may be pale-on-solid.
                if hue not in leftover:
                    leftover.append(hue)
                continue

            if has_border:
                body = border_re.sub("border-tint-border", body)
            if has_bg:
                body = bg_re.sub("bg-tint-soft", body)
            body = pale_re.sub("text-tint-fg", body)

            if f"tint-{hue}" not in body.split():
                body = f"tint-{hue} " + body
            if hue not in converted:
                converted.append(hue)

        return f"{quote}{body}{quote}"

    return LITERAL.sub(repl, text), converted, leftover


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="write changes")
    args = parser.parse_args()

    files = sorted(
        p for p in ROOT.rglob("*") if p.suffix in {".tsx", ".ts"} and p.is_file()
    )

    changed_files = 0
    changed_literals = 0
    leftovers: dict[str, list[str]] = {}

    for path in files:
        original = path.read_text(encoding="utf-8")
        new, converted, leftover = convert(original)

        if leftover:
            leftovers[str(path.relative_to(ROOT))] = leftover

        if new == original:
            continue

        changed_files += 1

        rel = path.relative_to(ROOT)
        print(f"  {rel}  [{', '.join(converted)}]")
        if args.apply:
            path.write_text(new, encoding="utf-8")

    print()
    print(f"files changed : {changed_files}")
    print(f"mode          : {'APPLIED' if args.apply else 'dry run'}")
    if leftovers:
        print(f"leftover pale labels needing review: {len(leftovers)} files")
        for rel, hues in sorted(leftovers.items()):
            print(f"  {rel}  [{', '.join(hues)}]")
    return 0


if __name__ == "__main__":
    sys.exit(main())
