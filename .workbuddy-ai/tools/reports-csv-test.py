"""Run the oversight CSV export assertions without a test framework.

`src/services/reports-csv.ts` is pure — its only import is `import type` — so it
can be verified without a browser or a server. `tsc` compiles it to standalone
JavaScript and the assertions in `reports-csv.test.mjs` run on that emit, exactly
as `panel-routing-test.py` does for the panel registry. No new dependency.

The transpile is expected to report unresolved `@/...` imports: the type-only
import of `report-sources` drags in modules that need the tsconfig `paths` alias,
which a command-line `tsc` does not read. Only the emitted
`reports-csv.js` matters and `import type` is erased, so the emit is standalone.

Usage:
  <managed-python3> .workbuddy-ai/tools/reports-csv-test.py
"""

import pathlib
import shutil
import subprocess
import sys
import tempfile

ROOT = pathlib.Path("/Users/syd/work/madani/nejat/lesan")
FRONT = ROOT / "front"
TOOLS = ROOT / ".workbuddy-ai" / "tools"

TSC = FRONT / "node_modules/.bin/tsc"
NODE = pathlib.Path(shutil.which("node") or "node")

out = pathlib.Path(tempfile.mkdtemp(prefix="reports-csv-"))
try:
    transpile = subprocess.run(
        [
            str(TSC),
            "src/services/reports-csv.ts",
            "--outDir", str(out),
            "--target", "es2020",
            "--module", "esnext",
            "--moduleResolution", "bundler",
            "--skipLibCheck",
            "--noEmitOnError", "false",
        ],
        cwd=FRONT,
        check=False,
        capture_output=True,
        text=True,
    )

    # `rootDir` is inferred, so the emit can land in a nested directory depending on
    # which files the transpile pulled in; find it rather than assuming a path.
    emits = sorted(out.rglob("reports-csv.js"))
    if not emits:
        print("transpile produced no reports-csv.js — aborting", file=sys.stderr)
        print(transpile.stdout, end="", file=sys.stderr)
        print(transpile.stderr, end="", file=sys.stderr)
        sys.exit(1)

    for stray in out.rglob("*"):
        if stray.is_file() and stray.name not in {"reports-csv.js"}:
            stray.unlink()
    emits[0].replace(out / "reports-csv.js")

    shutil.copy(TOOLS / "reports-csv.test.mjs", out / "test.mjs")

    result = subprocess.run(
        [str(NODE), "test.mjs"], cwd=out, capture_output=True, text=True
    )
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    sys.exit(result.returncode)
finally:
    shutil.rmtree(out, ignore_errors=True)