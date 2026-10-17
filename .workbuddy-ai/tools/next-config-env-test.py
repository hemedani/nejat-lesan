"""Run the production-build guard assertions for `front/next.config.ts`.

`NEXT_PUBLIC_LESAN_URL` is substituted into the client bundle while `next build`
runs, so a missing value cannot be repaired afterwards by setting it on the
`next start` command — the browser keeps whatever was baked in, and
`getLesanBaseUrl` silently falls back to `window.location.origin`, which 404s
every attachment. The guard in `next.config.ts` turns that into a failed build.

The guard fires while the config module is *evaluated*, so each case needs its
own process; this runner spawns the assertion script twice rather than
cache-busting an import. The config is emitted as CommonJS because it reads
`__dirname`, which an ESM emit would not define.

Usage:
  <managed-python3> .workbuddy-ai/tools/next-config-env-test.py
"""

import json
import os
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

# `NEXT_PUBLIC_*` values that must be present for a production build. Kept in
# step with the guard in `front/next.config.ts`.
PUBLIC_VARS = ["NEXT_PUBLIC_LESAN_URL"]

checks = []


def check(name, ok, detail=""):
    checks.append((name, ok, detail))


def run_case(work, *, node_env, phase, public_url):
    env = dict(node_env)
    for key in PUBLIC_VARS:
        env.pop(key, None)
    if public_url is not None:
        env["NEXT_PUBLIC_LESAN_URL"] = public_url

    proc = subprocess.run(
        [str(NODE), "test.mjs", phase],
        cwd=work,
        env=env,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0 or not proc.stdout.strip():
        return {"outcome": f"runner failed: {proc.stderr.strip()[:200]}"}
    return json.loads(proc.stdout.strip().splitlines()[-1])


work = pathlib.Path(tempfile.mkdtemp(prefix="next-config-env-"))
try:
    transpile = subprocess.run(
        [
            str(TSC),
            "next.config.ts",
            "--outDir", str(work),
            "--target", "es2020",
            "--module", "commonjs",
            "--moduleResolution", "node",
            # `import path from "node:path"` needs interop; without this flag the
            # emit assigns the default import to `undefined` and every case fails
            # on `path.join` rather than on the guard under test.
            "--esModuleInterop",
            "--skipLibCheck",
            "--noEmitOnError", "false",
        ],
        cwd=FRONT,
        check=False,
        capture_output=True,
        text=True,
    )
    if not (work / "next.config.js").exists():
        print("transpile produced no next.config.js — aborting", file=sys.stderr)
        print(transpile.stdout, end="", file=sys.stderr)
        print(transpile.stderr, end="", file=sys.stderr)
        sys.exit(1)

    shutil.copy(TOOLS / "next-config-env.test.mjs", work / "test.mjs")
    node_env = dict(os.environ)
    # `next build` in a shell may inherit NODE_ENV from elsewhere; clear it so the
    # guard's decision provably comes from the phase and not from NODE_ENV.
    node_env.pop("NODE_ENV", None)
    node_env.pop("NEXT_PHASE", None)

    url = "http://46.245.98.207:1400"

    # 1. A real production build with the variable set must be allowed —
    #    otherwise the guard would block every legitimate deploy.
    built = run_case(
        work, node_env=node_env, phase="phase-production-build", public_url=url
    )
    check(
        "`next build` WITH the public backend URL is allowed",
        built["outcome"] == "loaded",
        built["outcome"],
    )

    # 2. A production build without it must fail, and must name the variable.
    missing = run_case(
        work, node_env=node_env, phase="phase-production-build", public_url=None
    )
    detail = missing["outcome"]
    check("`next build` WITHOUT it is rejected", detail.startswith("threw:"), detail)
    check(
        "the failure names NEXT_PUBLIC_LESAN_URL",
        "NEXT_PUBLIC_LESAN_URL" in detail,
        detail,
    )
    check(
        "the failure explains it cannot be fixed on `next start`",
        "next start" in detail,
        detail,
    )

    # 3. `next start` must NOT be blocked: the bundle is already compiled, so
    #    re-supplying the value at start would break a working deploy.
    started = run_case(
        work, node_env=node_env, phase="phase-production-server", public_url=None
    )
    check(
        "`next start` is never blocked",
        started["outcome"] == "loaded",
        started["outcome"],
    )

    # 4. Neither is `pnpm dev` — a developer needs no public backend host.
    dev = run_case(
        work, node_env=node_env, phase="phase-development-server", public_url=None
    )
    check("`next dev` is never blocked", dev["outcome"] == "loaded", dev["outcome"])

    # ------------------------------------------------------------------
    # End-to-end through Next's own loader, against a project with no `.env`.
    #
    # The cases above drive the phase by hand. This one proves `next build`
    # actually reaches the guard — and it runs without `.env` on purpose, since
    # a repo copy of `.env`/`next.local` supplies the variable and masks the
    # guard, which is why it looks like it "works" locally even when unset.
    # ------------------------------------------------------------------
    probe = work / "noproj"
    probe.mkdir(exist_ok=True)
    shutil.copy(FRONT / "next.config.ts", probe / "next.config.ts")
    shutil.copy(TOOLS / "config-loader-probe.mjs", FRONT / "config-loader-probe.tmp.mjs")

    def probe_case(phase, public_url):
        env = dict(node_env)
        env.pop("NEXT_PUBLIC_LESAN_URL", None)
        if public_url is not None:
            env["NEXT_PUBLIC_LESAN_URL"] = public_url
        proc = subprocess.run(
            [str(NODE), "config-loader-probe.tmp.mjs", str(probe), phase],
            cwd=FRONT, env=env, capture_output=True, text=True,
        )
        line = proc.stdout.strip().splitlines()[-1] if proc.stdout.strip() else ""
        try:
            return json.loads(line)
        except json.JSONDecodeError:
            return {"ok": False, "error": f"probe failed: {proc.stderr.strip()[:200]}"}

    build_missing = probe_case("phase-production-build", None)
    check(
        "via Next's loader: `next build` with no .env and no var throws",
        build_missing.get("ok") is False
        and "NEXT_PUBLIC_LESAN_URL" in (build_missing.get("error") or ""),
        build_missing.get("error") or json.dumps(build_missing),
    )

    build_ok = probe_case("phase-production-build", url)
    check(
        "via Next's loader: `next build` with the var exported is allowed",
        build_ok.get("ok") is True,
        json.dumps(build_ok),
    )

    start_ok = probe_case("phase-production-server", None)
    check(
        "via Next's loader: `next start` is not blocked",
        start_ok.get("ok") is True,
        json.dumps(start_ok),
    )

    (FRONT / "config-loader-probe.tmp.mjs").unlink(missing_ok=True)

    failed = 0
    for name, ok, why in checks:
        if ok:
            print(f"  ok   {name}")
        else:
            print(f"  FAIL {name}\n       {why}")
            failed += 1
    print("\nFAILED" if failed else "\nall checks passed")
    sys.exit(1 if failed else 0)
finally:
    shutil.rmtree(work, ignore_errors=True)
    # The probe is copied into the Next project so `next` resolves from its own
    # node_modules; leaving it behind would show up as an untracked file.
    (FRONT / "config-loader-probe.tmp.mjs").unlink(missing_ok=True)