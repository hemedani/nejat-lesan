import re
import pathlib

BACK = pathlib.Path("/Users/syd/work/madani/nejat/lesan/back")


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


registered = set()
for path in BACK.rglob("*.ts"):
    if "node_modules" in str(path):
        continue
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        continue

    schemas_in_file = set()

    # 1) Direct setAct({ ... }) registrations — brace-matched so nested
    #    objects (e.g. validatorFoo({ x: 1 })) don't truncate the block.
    for m in re.finditer(r"setAct\(\s*\{", text):
        block = brace_block(text, text.index("{", m.start()))
        s = re.search(r'schema:\s*"([^"]+)"', block)
        if s:
            schemas_in_file.add(s.group(1))
        a = re.search(r'actName:\s*"([^"]+)"', block)
        if s and a:
            registered.add(f"{s.group(1)}.{a.group(1)}")

    # 2) Indirect `register("actName", fn)` helper calls, where the helper's own
    #    setAct fixes the schema.
    for m in re.finditer(r'register\(\s*"([^"]+)"', text):
        if len(schemas_in_file) == 1:
            registered.add(f"{next(iter(schemas_in_file))}.{m.group(1)}")

cfg = (BACK / "src/app_modules/moduleConfig.ts").read_text(encoding="utf-8")
patterns = set(
    m.strip('"') for m in re.findall(r'"[a-z_]+\.[A-Za-z_][A-Za-z0-9_]*"', cfg)
)

# Non-act strings that live in the same file (field paths, template examples).
NOISE = {"organization._id", "schema.act"}
patterns -= NOISE

print(f"registered acts detected: {len(registered)}")
print(f"moduleConfig act patterns: {len(patterns)}")
print()

missing = sorted(p for p in patterns if p not in registered)
if missing:
    print(f"!! {len(missing)} pattern(s) match no registered act:")
    for m in missing:
        print(f"   {m}")
else:
    print("OK - every moduleConfig act pattern resolves to a registered act")
