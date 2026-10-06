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

def strip_comments(text: str) -> str:
    """Drop comments so prose about a banned string does not trip a grep.

    Both R6 and R7 look for code that a fix explicitly forbids, and both fixes
    document *why* in a comment. Without this the checks would be impossible to
    satisfy honestly.
    """
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"^\s*//.*$", "", text, flags=re.M)
    text = re.sub(r"\s//[^\n\"'`]*$", "", text, flags=re.M)
    return text


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
            "src/utils/form-access.ts",
            "src/utils/org.ts",
            "src/utils/chartNavigation.ts",
            "src/utils/report-routes.ts",
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

    # `@/utils/*` cannot be resolved by node; make those imports relative.
    for name in ("panel-nav.js", "form-access.js"):
        f = out / name
        f.write_text(
            f.read_text().replace('from "@/utils/panels"', 'from "./panels.js"')
        )

    shutil.copy(TOOLS / "panel-routing.test.mjs", out / "test.mjs")

    # R6 — the invariant the whole project rests on: no component constructs a
    # panel URL by hand. This covers three shapes, because each type-checks
    # cleanly and fails only when a user clicks: a `/org/${orgId}/…` template
    # literal (the original defect), a `detailBase="/orghead"` prop, and a
    # `backHref="/org/..."` prop.
    offenders = []
    # Three shapes of the same mistake, all of which type-check cleanly and fail
    # only when a user clicks: a template literal (the original defect), a base
    # prop, and a plain href/redirect literal. The panel roots are listed
    # explicitly rather than derived, so adding a fourth panel without adding it
    # here is visible in review.
    banned = (
        "/org/${",
        'detailBase="/',
        'backHref="/',
        'href="/orghead',
        'href="/unit-head',
        'href="/employee',
        'push("/orghead',
        'push("/unit-head',
        'push("/employee',
        'replace("/orghead',
        'replace("/unit-head',
        'replace("/employee',
    )
    for path in (FRONT / "src" / "components").rglob("*.tsx"):
        text = strip_comments(path.read_text(encoding="utf-8"))
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

    # R4 — three places must agree on the forms gate: the nav entry hides itself,
    # the route explains itself, and the guard decides who may author. They
    # disagreed for a long time: the nav hid `/forms` on the module while the
    # guard ignored it, so the URL served a builder the sidebar claimed did not
    # exist.
    nav_text = (FRONT / "src" / "utils" / "panel-nav.ts").read_text(encoding="utf-8")
    forms_layout = (FRONT / "src" / "app" / "forms" / "layout.tsx").read_text(encoding="utf-8")
    gate_text = (FRONT / "src" / "components" / "system" / "ModuleGate.tsx").read_text(encoding="utf-8")
    guard_text = (
        FRONT / "src" / "components" / "org" / "forms" / "FormAuthorGuard.tsx"
    ).read_text(encoding="utf-8")
    problems = []
    if 'requiredModule: "forms"' not in nav_text:
        problems.append("panel-nav.ts: no forms section declares requiredModule")
    if nav_text.count('href: "/forms"') != 1:
        problems.append("panel-nav.ts: /forms must appear once, in the shared formsNavSection()")
    if 'ModuleGate module="forms" scoped' not in forms_layout:
        problems.append("forms/layout.tsx: must render <ModuleGate module=\"forms\" scoped>")
    if 'forms:' not in gate_text:
        problems.append("ModuleGate.tsx: MODULE_NOTICES has no `forms` entry, so the off state is generic")
    if "canAuthorForms" not in guard_text:
        problems.append("FormAuthorGuard.tsx: must use the shared canAuthorForms predicate")
    # The licensing check must NOT be in the guard: that would make ModuleGate
    # unreachable, and the amber explanation could never appear.
    if "orgHasModule" in guard_text:
        problems.append("FormAuthorGuard.tsx: licensing leaked into the role guard")
    if problems:
        print("R4 FAILED — the forms gates disagree:")
        for x in problems:
            print(f"  x {x}")
        sys.exit(1)
    print("R4 ok — nav, route gate and role guard agree on /forms")

    # R5 — every route group that renders data must require authentication.
    # `/charts` and `/maps` had only a ModuleGate, and `AuthContext.hasModule`
    # returns true while the module feed is unknown — which is precisely the state
    # an anonymous visitor is in. So an unauthenticated request reached every
    # chart page.
    data_layouts = ("charts", "maps", "admin", "orghead", "unit-head", "employee",
                    "patrol", "patrol-manager", "org", "user", "forms")
    gates = ("AuthGate", "PanelGuard", "FormAuthorGuard")
    ungated = []
    for name in data_layouts:
        base = FRONT / "src" / "app" / name
        layout = base / "layout.tsx"
        if layout.exists():
            entry, where = layout, f"{name}/layout.tsx"
        elif (base / "page.tsx").exists():
            # A single-page group carries its own gate; `/org` is one, and wrapping
            # one redirecting page in a layout would be indirection, not structure.
            entry, where = base / "page.tsx", f"{name}/page.tsx"
        else:
            ungated.append(f"{name}: no layout.tsx or page.tsx")
            continue
        if not any(g in entry.read_text(encoding="utf-8") for g in gates):
            ungated.append(f"{where} has no auth gate")
    if ungated:
        print("R5 FAILED — route groups reachable without signing in:")
        for x in ungated:
            print(f"  x {x}")
        sys.exit(1)
    print(f"R5 ok — {len(data_layouts)} route groups require authentication")

    # R7 — the report console must offer a detail link that actually resolves, and
    # must reach the right collection.
    #
    # This used to assert that `OrgIncidentDetailView` degraded a refused review
    # history (`setHistory([])` in a recovery branch, no `Promise.all`). That
    # scenario was real once and is now unreachable, so the assertion was rewritten
    # rather than deleted — see the two halves below.
    table = strip_comments(
        (FRONT / "src" / "components" / "org" / "OversightTable.tsx").read_text(
            encoding="utf-8"
        )
    )
    detail = strip_comments(
        (
            FRONT / "src" / "components" / "org" / "OrgIncidentDetailView.tsx"
        ).read_text(encoding="utf-8")
    )
    # The predicate is the one place the offer/refuse decision lives. Every surface
    # that renders a row must go through it, or a dead link reappears.
    problems7 = []
    if "export const canOpenReportDetail" not in table:
        problems7.append("OversightTable.tsx: no exported canOpenReportDetail predicate")
    # No inline template-literal URL may come back. A component that appends
    # `${base}/reports/...` is a builder again, and no grep for a literal path
    # can see it.
    if "/reports/${" in table:
        problems7.append(
            "OversightTable.tsx: a detail URL is built inline; use "
            "reportDetailHref from utils/report-routes.ts"
        )
    if "reportDetailHref(" not in table:
        problems7.append("OversightTable.tsx: does not use reportDetailHref")
    if "canOpenReportDetail(userLevel)" not in table:
        problems7.append("OversightTable.tsx: RowLink does not consult canOpenReportDetail")

    # `?source=` decides which collection is queried, and the console merges both
    # into one table. A detail view that ignores it sends every non-accident id to
    # `accident`, where it misses — which is exactly the bug this replaced: the
    # component called `accident.get` unconditionally while the URL carried
    # `?source=incident_report`.
    if "fetchReportDetail(" not in detail:
        problems7.append(
            "OrgIncidentDetailView.tsx: does not go through fetchReportDetail, so it "
            "cannot resolve a row whose ?source= is incident_report"
        )
    if "source" not in detail:
        problems7.append(
            "OrgIncidentDetailView.tsx: does not accept a source, so it would read "
            "every id from the accident collection"
        )

    # `review_history` is an EMBEDDED array on both models whose reviewer is a
    # snapshot, so the trail arrives inside the report fetch. The separate
    # `getReportReviewHistory` call existed only because `accident.get` used to
    # carry no `preAct` and no scope at all: it always succeeded, so the history
    # was the single thing that could be refused, and the page needed a recovery
    # branch to keep that refusal off screen. `accident.get` now resolves its scope
    # through `getOrgReportBase`, so a report the viewer may not see fails the MAIN
    # fetch — the correct answer — and there is no second call left to degrade.
    #
    # Asserting its absence is what stops the two-request shape from creeping back:
    # it is one round trip saved on every report page, and it removes a failure mode
    # rather than papering over it.
    for banned, why in (
        ("getReportReviewHistory", "the review trail is embedded in the report document"),
        ("Promise.all", "there is no second request whose rejection could fail the page"),
        ("reviewHistory", "the review trail is embedded in the report document"),
    ):
        if banned in detail:
            problems7.append(
                f"OrgIncidentDetailView.tsx: mentions {banned} — {why}"
            )

    if problems7:
        print("R7 FAILED — the report console offers unreachable surfaces:")
        for x in problems7:
            print(f"  x {x}")
        sys.exit(1)
    print("R7 ok — one source-aware fetch, embedded history, no unreachable link")

    result = subprocess.run([str(NODE), "test.mjs"], cwd=out, capture_output=True, text=True)
    print(result.stdout, end="")
    if result.stderr:
        print(result.stderr, end="", file=sys.stderr)
    sys.exit(result.returncode)
finally:
    shutil.rmtree(out, ignore_errors=True)
