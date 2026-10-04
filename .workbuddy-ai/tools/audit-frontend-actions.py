"""Audit frontend server actions against the acts the backend actually registers.

A wrong `model`/`act` pair in a server action compiles fine and only fails when a
user clicks the button, so this is checked statically instead.

Three registration styles exist in this backend, and all three must be handled or
the audit reports false failures:

  1. Direct   - `setAct({ schema: "accident", actName: "gets" })`
  2. Helper   - `register("getReporterDashboard", fn)` where the helper's own
                setAct pins the schema (see accident/dashboard/mod.ts)
  3. Shared   - `setSharedActs("vehicle_type", model)` which registers the six
                standard CRUD acts against a *variable* schema name
                (see shared/setSharedActs.ts)

Run:  <managed-python3> .workbuddy-ai/tools/audit-frontend-actions.py
"""

import re
import pathlib

ROOT = pathlib.Path("/Users/syd/work/madani/nejat/lesan")
BACK = ROOT / "back"
FRONT_ACTIONS = ROOT / "front/src/app/actions"

# Registered by shared/setSharedActs.ts for every model passed to setSharedActs().
SHARED_ACTS = ["add", "get", "gets", "update", "remove", "count"]


def brace_block(text: str, open_idx: int) -> str:
    """Return the {...} substring starting at text[open_idx] == '{'."""
    depth = 0
    for i in range(open_idx, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return text[open_idx : i + 1]
    return text[open_idx:]


# ---- 1 + 2: what the backend registers -------------------------------------
registered = set()
for path in BACK.rglob("*.ts"):
    if "node_modules" in str(path):
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        continue

    schemas_in_file = set()
    for m in re.finditer(r"setAct\(\s*\{", text):
        block = brace_block(text, text.index("{", m.start()))
        s = re.search(r'schema:\s*"([^"]+)"', block)
        if s:
            schemas_in_file.add(s.group(1))
        a = re.search(r'actName:\s*"([^"]+)"', block)
        if s and a:
            registered.add(f"{s.group(1)}.{a.group(1)}")

    for m in re.finditer(r'register\(\s*"([^"]+)"', text):
        if len(schemas_in_file) == 1:
            registered.add(f"{next(iter(schemas_in_file))}.{m.group(1)}")

# ---- 3: shared CRUD acts ---------------------------------------------------
for path in BACK.rglob("*.ts"):
    if "node_modules" in str(path):
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        continue
    for m in re.finditer(r'setSharedActs\(\s*"([^"]+)"', text):
        for act in SHARED_ACTS:
            registered.add(f"{m.group(1)}.{act}")

# ---- what the frontend calls ----------------------------------------------
calls = []
for path in sorted(FRONT_ACTIONS.rglob("*.ts")):
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        continue

    for m in re.finditer(r"send\(\s*\{", text):
        block = brace_block(text, text.index("{", m.start()))
        model = re.search(r'\bmodel:\s*"([^"]+)"', block)
        act = re.search(r'\bact:\s*"([^"]+)"', block)
        if not act:
            continue
        if model:
            calls.append((path.relative_to(FRONT_ACTIONS), f"{model.group(1)}.{act.group(1)}"))
        else:
            # Variable model — recover the literal union, e.g.
            # `model: model as "province" | "city" | "city_zone"`.
            union = re.search(r'\bmodel as\s+((?:"[^"]+"\s*\|?\s*)+)', text)
            if union:
                for lit in re.findall(r'"([^"]+)"', union.group(1)):
                    calls.append((path.relative_to(FRONT_ACTIONS), f"{lit}.{act.group(1)}"))
            else:
                calls.append((path.relative_to(FRONT_ACTIONS), f"<unresolved>.{act.group(1)}"))

print(f"registered backend acts : {len(registered)}")
print(f"frontend action calls   : {len(calls)}")
print()

bad = sorted({(str(p), pair) for p, pair in calls if pair not in registered})
if bad:
    print(f"!! {len(bad)} call(s) reference an act the backend does not register:")
    for p, pair in bad:
        print(f"   {pair:45} <- {p}")
else:
    print("OK - every frontend server action resolves to a registered backend act")
