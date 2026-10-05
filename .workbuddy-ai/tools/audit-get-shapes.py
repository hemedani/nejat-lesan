#!/usr/bin/env python3
"""Audit `get:` declarations across backend validators.

Lesan validates `get` but never uses it as a projection (serveLesan.ts returns
`act.fn(body)` raw), so the codebase idiom for `get` is a "want" marker:
`optional(enums([0, 1]))`. A field declared as `object({})`, `string()` or
`number()` instead is a *response-type* declaration, and any client that sends
the idiomatic `1` for it fails validation at runtime:

    At path: get.form -- Expected an object, but received: 1

This script lists every such field so the outliers can be reviewed.

Run: python3 .workbuddy-ai/tools/audit-get-shapes.py
"""

import re
import sys
from pathlib import Path

BACK = Path(__file__).resolve().parents[2] / "back"

# A field line inside a `get: object({ ... })` block.
FIELD_RE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.+?),\s*$")

IDIOM = "enums([0, 1])"
IDIOM_SPACED = "enums([0,1])"


def get_block(text: str) -> str | None:
    """Return the body of the first `get: object({ ... })` block."""
    m = re.search(r"get:\s*object\(\{(.*?)\n\t*\}\),", text, re.S)
    return m.group(1) if m else None


def unwrap_optional(decl: str) -> str:
    """`optional(object({}))` -> `object({})`; leaves anything else alone."""
    m = re.match(r"optional\((.*)\)$", decl.strip())
    return m.group(1).strip() if m else decl.strip()


def classify(decl: str) -> str:
    if IDIOM in decl or IDIOM_SPACED in decl:
        return "idiom"
    inner = unwrap_optional(decl)
    if inner.startswith("object({"):
        return "object"
    if inner.startswith("string()"):
        return "string"
    if inner.startswith("number()"):
        return "number"
    return "other"


def main() -> int:
    val_files = sorted(BACK.glob("src/**/*.val.ts"))
    flagged: list[tuple[str, str, str, str]] = []
    idiom_count = 0
    block_count = 0

    for path in val_files:
        text = path.read_text(encoding="utf-8")
        block = get_block(text)
        if block is None:
            continue
        block_count += 1
        for line in block.splitlines():
            m = FIELD_RE.match(line)
            if not m:
                continue
            field, decl = m.group(1), m.group(2).strip()
            kind = classify(decl)
            if kind == "idiom":
                idiom_count += 1
            elif kind in ("object", "string", "number"):
                rel = path.relative_to(BACK)
                flagged.append((str(rel), field, kind, decl))

    # `object({})` and `string()` reject the idiomatic `1` a Lesan client sends,
    # so they break at runtime. `number()` accepts `1` and is harmless.
    breaking = [f for f in flagged if f[2] in ("object", "string")]
    harmless = [f for f in flagged if f[2] == "number"]

    print(f"validators with a `get: object({{...}})` block : {block_count}")
    print(f"fields using the `enums([0, 1])` idiom        : {idiom_count}")
    print(f"fields declaring a response type instead     : {len(flagged)}")
    print(f"    of those, BREAK on the idiomatic `1`     : {len(breaking)}")
    print(f"    of those, harmless (`number()`)          : {len(harmless)}")
    print()

    if harmless:
        print("`number()` fields (accept `1`, left as-is):")
        for rel, field, _, decl in harmless:
            print(f"  {rel}  ->  {field}: {decl}")
        print()

    if not breaking:
        print("OK - no `get` field rejects the idiomatic `1`")
        return 0

    print("BREAKING - these reject the `1` every Lesan client sends:")
    for rel, field, kind, decl in breaking:
        print(f"  {rel}")
        print(f"      {field}: {decl}   [{kind}]")
    print()
    print(
        "Fix by aligning the validator with the codebase idiom\n"
        "(`optional(enums([0, 1]))`), not by changing the client: `get` is a\n"
        "want-marker that serveLesan.ts validates but never projects with."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
