"""Run the panel routing assertions without a test framework.

`src/utils/panels.ts` and `src/utils/panel-nav.ts` are pure, so they can be
verified without a browser. They only have `import type` dependencies, which
means `tsc` emits standalone JS once the `@/` alias import in panel-nav is
rewritten to a relative path.

Usage:
  <managed-python3> .workbuddy-ai/tools/panel-routing-test.py
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
        raw = path.read_text(encoding="utf-8")
        # Strip comments first: these strings legitimately appear in prose that
        # documents *why* the literal form is banned, and matching that would
        # make the check impossible to satisfy honestly.
        text = re.sub(r"/\*.*?\*/", "", raw, flags=re.S)
        text = re.sub(r"^\s*//.*$", "", text, flags=re.M)
        text = re.sub(r"\s//[^\n\"'`]*$", "", text, flags=re.M)
        for lineno, line in enumerate(text.splitlines(), start=1):
            if any(b in line for b in banned):
                offenders.append(f"{path.relative_to(FRONT)}:{lineno}: {line.strip()}")
    if offenders:
        print("R6 FAILED — a panel URL is constructed by hand:")
        for o in offenders:
            print(f"  x {o}")
        sys.exit(1)
    print("R6 ok — no hand-built panel URLs in src/components")

    # R1 — every href in the nav registries must resolve to a real route. A typo
    # or a stale entry type-checks cleanly and 404s only when a user clicks it,
    # which is how four chart pages and a workspace went unnoticed.
    app_dir = FRONT / "src" / "app"
    page_dirs = set()
    for page in app_dir.rglob("page.tsx"):
        rel = page.relative_to(app_dir).parent
        parts = [] if str(rel) == "." else list(rel.parts)
        # Route groups `(group)` do not appear in the URL.
        parts = [s for s in parts if not (s.startswith("(") and s.endswith(")"))]
        prefix = "/" + "/".join(parts)
        page_dirs.add(prefix.rstrip("/") or "/")

    def hrefs_in(path):
        return set(
            m.group(1)
            for m in re.finditer(r'href:\s*"([^"]+)"', path.read_text(encoding="utf-8"))
        )

    nav_sources = [
        FRONT / "src" / "utils" / "panel-nav.ts",
        FRONT / "src" / "components" / "organisms" / "adminSidebarConfig.ts",
    ]
    dead = []
    for src in nav_sources:
        for href in sorted(hrefs_in(src)):
            if not href.startswith("/"):
                continue
            if href in page_dirs:
                continue
            # A nav entry may point at the parent of a dynamic route.
            if (app_dir / href.lstrip("/")).exists():
                continue
            dead.append(f"{src.name}: {href}")
    if dead:
        print("R1 FAILED — nav hrefs with no matching route:")
        for d in dead:
            print(f"  x {d}")
        sys.exit(1)
    print(f"R1 ok — {len(nav_sources)} nav registries, every href resolves")

    result = subprocess.run([str(NODE), "test.mjs"], cwd=out, capture_output=True, text=True)
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    sys.exit(result.returncode)
finally:
    shutil.rmtree(out, ignore_errors=True)
