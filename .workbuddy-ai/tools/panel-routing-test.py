"""Run the panel routing assertions without a test framework.

`src/utils/panels.ts` and `src/utils/panel-nav.ts` are pure, so they can be
verified without a browser. They only have `import type` dependencies, which
means `tsc` emits standalone JS once the `@/` alias import in panel-nav is
rewritten to a relative path.

Usage:
  <managed-python3> .workbuddy-ai/tools/panel-routing-test.py
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

# Prefer whichever `node` is on PATH. The previous absolute path pointed at a
# managed-runtime directory that does not exist on every machine, so this tool
# failed before running a single assertion.
NODE = pathlib.Path(shutil.which("node") or "node")

out = pathlib.Path(tempfile.mkdtemp(prefix="panel-routing-"))
try:
    subprocess.run(
        [
            str(TSC),
            "src/utils/panels.ts",
            "src/utils/panel-nav.ts",
            "src/utils/org-routes.ts",
            "src/utils/unit-head-routes.ts",
            "src/utils/employee-routes.ts",
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

    panels_js = out / "panels.js"
    nav_js = out / "panel-nav.js"
    if not panels_js.exists() or not nav_js.exists():
        print("transpile produced no output — aborting")
        sys.exit(1)

    # `@/utils/panels` cannot be resolved by node; make it relative.
    nav_js.write_text(
        nav_js.read_text().replace('from "@/utils/panels"', 'from "./panels.js"')
    )

    shutil.copy(TOOLS / "panel-routing.test.mjs", out / "test.mjs")

    # R6 — the invariant the whole project rests on: no component constructs a
    # panel URL by hand. This covers three shapes, because each type-checks
    # cleanly and fails only when a user clicks: a `/org/${orgId}/…` template
    # literal (the original defect), a `detailBase="/orghead"` prop, and a
    # `backHref="/org/..."` prop.
    offenders = []
    banned = ("/org/${", 'detailBase="/', 'backHref="/')
    for path in (FRONT / "src" / "components").rglob("*.tsx"):
        text = path.read_text(encoding="utf-8")
        for lineno, line in enumerate(text.splitlines(), start=1):
            if any(b in line for b in banned):
                offenders.append(f"{path.relative_to(FRONT)}:{lineno}: {line.strip()}")
    if offenders:
        print("R6 FAILED — a panel URL is constructed by hand:")
        for o in offenders:
            print(f"  x {o}")
        sys.exit(1)
    print("R6 ok — no hand-built panel URLs in src/components")

    result = subprocess.run([str(NODE), "test.mjs"], cwd=out, capture_output=True, text=True)
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    sys.exit(result.returncode)
finally:
    shutil.rmtree(out, ignore_errors=True)
