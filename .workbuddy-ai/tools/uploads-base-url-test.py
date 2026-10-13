"""Run the uploads base-URL assertions without a test framework.

`getLesanBaseUrl` in `front/src/services/api.ts` decides the origin every
backend asset URL (`${base}/uploads/...`) is built from. It branches on
`typeof window`, so both tiers can be exercised in node, and it reads nothing but
`process.env` and `window` — no browser, no server, no network.

Its two imports are stripped before the transpile: `lesanApi` (a value, from the
generated `@/types/declarations/selectInp`) and `Cookies` are used only by
`AppApi`, which these assertions never call, and `@/...` cannot resolve under a
command-line `tsc` that does not read the tsconfig `paths` alias. The function
under test is therefore left untouched by the strip, and the emit is standalone.

Same approach as `reports-csv-test.py` / `panel-routing-test.py`. No new dependency.

Usage:
  <managed-python3> .workbuddy-ai/tools/uploads-base-url-test.py
"""

import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path("/Users/syd/work/madani/nejat/lesan")
FRONT = ROOT / "front"
TOOLS = ROOT / ".workbuddy-ai" / "tools"

TSC = FRONT / "node_modules/.bin/tsc"
NODE = pathlib.Path(shutil.which("node") or "node")

# `import Cookies from "js-cookie";` and the multi-line-free named import above it.
VALUE_IMPORTS = re.compile(
    r"^import\s+\{?\s*(lesanApi|Cookies)\b[^\n]*\n", re.MULTILINE
)

source = (FRONT / "src/services/api.ts").read_text()
stripped = VALUE_IMPORTS.sub("", source)
if stripped == source:
    print(
        "expected to strip the lesanApi / js-cookie imports from api.ts — "
        "the harness needs updating",
        file=sys.stderr,
    )
    sys.exit(1)

work = pathlib.Path(tempfile.mkdtemp(prefix="uploads-base-url-"))
try:
    (work / "api.ts").write_text(stripped)

    transpile = subprocess.run(
        [
            str(TSC),
            "api.ts",
            "--outDir", str(work),
            "--target", "es2020",
            "--module", "esnext",
            "--moduleResolution", "bundler",
            "--skipLibCheck",
            "--noEmitOnError", "false",
        ],
        cwd=work,
        check=False,
        capture_output=True,
        text=True,
    )

    # `AppApi` still references the stripped bindings, so unresolved-name errors
    # are expected and harmless. Only the emitted `api.js` matters.
    if not (work / "api.js").exists():
        print("transpile produced no api.js — aborting", file=sys.stderr)
        print(transpile.stdout, end="", file=sys.stderr)
        print(transpile.stderr, end="", file=sys.stderr)
        sys.exit(1)

    shutil.copy(TOOLS / "uploads-base-url.test.mjs", work / "test.mjs")

    result = subprocess.run(
        [str(NODE), "test.mjs"], cwd=work, capture_output=True, text=True
    )
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    sys.exit(result.returncode)
finally:
    shutil.rmtree(work, ignore_errors=True)
