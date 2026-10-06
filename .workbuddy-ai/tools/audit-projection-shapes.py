#!/usr/bin/env python3
"""Audit hand-written `get:` projections against the generated validators.

A Lesan act validates the projection a client sends. The rule is:

    a RELATION  -> its projection must be an OBJECT   (`{ road: { name: 1 } }`)
    a SCALAR or an EMBEDDED struct -> takes 0/1        (`{ dead_count: 1 }`)

The generated declarations encode exactly this distinction: a relation is typed as
an object (`attachments?: { _id?: 0|1; name?: 0|1; … }`) while a scalar is typed
`(0|1)`. So a projection can be written against the generated type and TypeScript
will catch the mistake at compile time — **which is the preferred fix**, and is
what `app/actions/incident_report/getReportDetail.ts` now does with `satisfies`.

This script exists for the projections that are NOT type-checked: the ones built
as `Record<string, unknown>` for a dynamic column picker, where a per-column
fragment cannot be typed against a single act's validator. Those were the ones that
broke in production:

    front/src/utils/accidentProjection.ts
        { key: "officer",     projection: { officer: 1 } }
        { key: "attachments", projection: { attachments: 1 } }

Both 500'd the act as soon as a user ticked that column, and neither was in the
default selection, so nothing exercised them. `officer` additionally reached a
renderer that cast it to `string`.

Run:  python3 .workbuddy-ai/tools/audit-projection-shapes.py
"""

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
FRONT = ROOT / "front"
DECLARATIONS = FRONT / "src" / "types" / "declarations" / "selectInp.ts"

# Files whose projections are dynamic (a column picker merges fragments at runtime),
# so `satisfies` cannot cover them.
DYNAMIC_PROJECTION_FILES = (
    FRONT / "src" / "utils" / "accidentProjection.ts",
)

# Fragments look like `projection: { <key>: <value> }` on one line, or nested
# across lines for the multi-key ones. Capture just the outermost key/value pairs.
FRAGMENT_RE = re.compile(r"projection:\s*\{(.*?)\}", re.S)
PAIR_RE = re.compile(r"([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(\{|0\b|1\b)")


def declared_kinds(model: str) -> dict[str, str]:
    """Top-level `get:` keys of one model: name -> "relation" | "scalar"."""
    src = DECLARATIONS.read_text(encoding="utf-8")
    start = src.find(f"{model}: {{")
    if start == -1:
        sys.exit(f"{model}: no block in {DECLARATIONS}")

    seg = src[start:]
    anchor = seg.find("            get: {\nset: {")
    if anchor == -1:
        sys.exit(f"{model}: no get block found")

    body = seg[anchor:]
    depth = 0
    end = len(body)
    for i, ch in enumerate(body):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                end = i
                break

    outer = body[:end]
    inner_at = outer.find("get: {", outer.find("set: {"))
    inner = outer[inner_at + len("get: {") :]

    kinds: dict[str, str] = {}
    depth = 0
    for line in inner.split("\n"):
        m = re.match(r"^([a-zA-Z_][a-zA-Z0-9_]*)\??:\s*(.*)$", line)
        if m and depth == 0:
            rhs = m.group(2).strip()
            kinds[m.group(1)] = "relation" if rhs.startswith("{") else "scalar"
        depth += line.count("{") - line.count("}")
    return kinds


def fragments(text: str, path: pathlib.Path):
    """(line_no, key, value_kind) for the OUTERMOST pair of each fragment.

    Depth matters. `{ attachments: { name: 1, type: 1 } }` projects two relations —
    `accident.attachments` (to `file`) and, inside it, `file.type`. `type` is also
    a relation on `accident`, so a flat scan reports a false positive here. Only
    depth-0 pairs describe the model's own fields; the nested ones belong to
    whatever the relation points at.
    """
    for m in FRAGMENT_RE.finditer(text):
        body = m.group(1)
        line = text.count("\n", 0, m.start()) + 1
        depth = 0
        for pair in PAIR_RE.finditer(body):
            key, value = pair.group(1), pair.group(2)
            if depth == 0:
                yield line, key, ("relation" if value == "{" else "scalar")
            # A `{` in this pair opens a level the next pair sits inside; a `}`
            # closes one. Counting the pair's own braces keeps a multi-key object
            # such as `{ name: 1, type: 1 }` at the correct depth for its siblings.
            depth += (1 if value == "{" else 0) - (1 if value == "}" else 0)


def main() -> int:
    if not DECLARATIONS.exists():
        sys.exit(f"missing generated declarations: {DECLARATIONS}")

    accident = declared_kinds("accident")
    incident = declared_kinds("incident_report")

    known = {**accident, **incident}
    problems: list[tuple[pathlib.Path, int, str]] = []

    for path in DYNAMIC_PROJECTION_FILES:
        text = path.read_text(encoding="utf-8")
        for line, key, sent in fragments(text, path):
            declared = known.get(key)
            if declared is None:
                continue  # not a model field; leave it to tsc
            if declared == "relation" and sent == "scalar":
                problems.append(
                    (
                        path,
                        line,
                        f"{key}: sent `1` but it is a RELATION — a relation's "
                        f"projection must be an object (`{key}: {{ name: 1 }}`); "
                        f"the act rejects `1` with "
                        f"`get.{key} -- Expected an object, but received: 1`",
                    )
                )

    for path, line, message in problems:
        print(f"  x {path.relative_to(ROOT)}:{line}: {message}")

    if problems:
        print(
            f"\nFAILED — {len(problems)} projection(s) send `1` for a relation.\n"
            "This compiles cleanly and fails only when a user picks that column."
        )
        return 1

    print(
        f"OK — {len(known)} declared fields checked across "
        f"{len(DYNAMIC_PROJECTION_FILES)} dynamic projection file(s); no relation "
        f"sent as `1`"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())