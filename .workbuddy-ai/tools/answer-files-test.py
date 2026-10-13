"""Run the answer-file resolution assertions without a test framework.

`src/services/answer-files.ts` decides whether an answer leaf is a file
reference, by resolving its value against the report's `attachments`. It is pure
and its only import is `import type`, so `tsc` compiles it to standalone
JavaScript and the assertions in `answer-files.test.mjs` run on that emit, exactly
as `reports-csv-test.py` does. No new dependency.

This is the rule the report-detail file viewers rest on, and it is deliberately a
resolution rather than a filename pattern: `dynamic_answers` rows carry
`answer_ids`, and a `form_answers` `file` field is an array of server file ids,
while a `select` answer is a literal option value. Only the join tells them
apart. An id that does not resolve must fall back to text, so a file that never
reached `attachments` renders as a name instead of a dead link.

Usage:
  <managed-python3> .workbuddy-ai/tools/answer-files-test.py
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

out = pathlib.Path(tempfile.mkdtemp(prefix="answer-files-"))
try:
    transpile = subprocess.run(
        [
            str(TSC),
            "src/services/answer-files.ts",
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

    emits = sorted(out.rglob("answer-files.js"))
    if not emits:
        print("transpile produced no answer-files.js — aborting", file=sys.stderr)
        print(transpile.stdout, end="", file=sys.stderr)
        print(transpile.stderr, end="", file=sys.stderr)
        sys.exit(1)

    for stray in out.rglob("*"):
        if stray.is_file() and stray.name != "answer-files.js":
            stray.unlink()
    emits[0].replace(out / "answer-files.js")

    shutil.copy(TOOLS / "answer-files.test.mjs", out / "test.mjs")

    result = subprocess.run(
        [str(NODE), "test.mjs"], cwd=out, capture_output=True, text=True
    )
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    sys.exit(result.returncode)
finally:
    shutil.rmtree(out, ignore_errors=True)