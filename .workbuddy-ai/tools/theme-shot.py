#!/usr/bin/env python3
"""
Screenshot real pages in a chosen theme.

The problem
-----------
The theme lives in a cookie and is read by a blocking inline script before first
paint, so "save the HTML and open it" gets snapped back to the server default.

The approach that actually works
--------------------------------
Fetch the server-rendered HTML, **strip every `<script>`**, rewrite the single
`data-theme` attribute, and open the result from `file://` with
`<base href="http://localhost:<app>/">` so `/_next/*` assets still resolve.

Three things had to be true for this to be stable, and each was found the hard
way:

* **No `<script>` tags.** Not `--blink-settings=scriptEnabled=false` — that flag
  makes headless Chrome skip the screenshot entirely. Without scripts there is
  no hydration to overwrite `data-theme`, and no HMR websocket to keep the page
  from ever going idle (which hangs `--virtual-time-budget` forever).
* **No local proxy.** Serving the captured HTML from a second port means the
  document origin is not the app origin: `<base>` assets load cross-origin and
  the dev server's socket never connects, so Chrome waits indefinitely.
  `file://` + `<base>` sidesteps the whole class of problem.
* **A fresh `--user-data-dir` per capture.** A shared profile leaves a
  `SingletonLock` behind and every run after the first silently writes no PNG.

Because scripts are gone, anything that only exists after hydration will be
missing from the capture. That is a feature: the SSR markup is the thing under
test, and it is the thing a user sees on first paint.

Usage
-----
    python3 .workbuddy-ai/tools/theme-shot.py /login /
    python3 .workbuddy-ai/tools/theme-shot.py --themes light /charts/overall

Captures land in `.workbuddy-ai/previews/theme/<theme>/<slug>.png`.
"""

from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
OUT_ROOT = REPO / ".workbuddy-ai" / "previews" / "theme"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def slug_for(path: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]", "-", path.strip("/").replace("/", "_") or "root")


def fetch(app_port: int, path: str) -> str:
    with urllib.request.urlopen(f"http://localhost:{app_port}{path}", timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def prepare(html: str, theme: str, app_port: int) -> str:
    html = re.sub(r"<script\b[^>]*>.*?</script>", "", html, flags=re.S)
    html = re.sub(r"<script\b[^>]*/>", "", html)
    html = html.replace(
        "<head>", f'<head><base href="http://localhost:{app_port}/">', 1
    )
    # With the pre-paint script gone, this attribute is the only thing that
    # selects the theme. Rewriting it is the whole point.
    return re.sub(
        r'data-theme="(?:light|dark|system)"', f'data-theme="{theme}"', html, count=1
    )


def shoot(html_path: Path, out: Path, width: int, height: int, wait: int) -> bool:
    if out.exists():
        out.unlink()
    profile = Path(tempfile.mkdtemp(prefix="theme-shot-"))
    try:
        cmd = [
            CHROME,
            "--headless=new",
            "--no-sandbox",
            "--disable-gpu",
            "--hide-scrollbars",
            f"--user-data-dir={profile}",
            f"--window-size={width},{height}",
            "--force-device-scale-factor=1",
            f"--virtual-time-budget={wait}",
            f"--screenshot={out}",
            html_path.resolve().as_uri(),
        ]
        subprocess.run(cmd, capture_output=True, timeout=90)
    except subprocess.TimeoutExpired:
        return False
    finally:
        shutil.rmtree(profile, ignore_errors=True)
    return out.exists()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("paths", nargs="+", help="app routes, e.g. /login /")
    parser.add_argument("--app-port", type=int, default=3044)
    parser.add_argument("--themes", nargs="+", default=["light", "dark"])
    parser.add_argument("--width", type=int, default=1440)
    parser.add_argument("--height", type=int, default=1300)
    parser.add_argument("--wait", type=int, default=4000, help="virtual time budget ms")
    args = parser.parse_args()

    if not Path(CHROME).exists():
        print(f"Chrome not found at {CHROME}", file=sys.stderr)
        return 1

    work = Path(tempfile.mkdtemp(prefix="theme-shot-src-"))
    written: list[Path] = []
    try:
        for path in args.paths:
            slug = slug_for(path)
            try:
                raw = fetch(args.app_port, path)
            except Exception as exc:  # noqa: BLE001
                print(f"skip {path}: {exc}", file=sys.stderr)
                continue

            for theme in args.themes:
                src = work / f"{slug}.{theme}.html"
                src.write_text(prepare(raw, theme, args.app_port), encoding="utf-8")
                out = OUT_ROOT / theme / f"{slug}.png"
                out.parent.mkdir(parents=True, exist_ok=True)
                if shoot(src, out, args.width, args.height, args.wait):
                    written.append(out)
                    print(f"  {theme:5s} {path} -> {out.relative_to(REPO)}")
                else:
                    print(f"  {theme:5s} {path} -> FAILED", file=sys.stderr)
    finally:
        shutil.rmtree(work, ignore_errors=True)

    print(f"\n{len(written)} screenshot(s) in {OUT_ROOT.relative_to(REPO)}")
    return 0 if written else 1


if __name__ == "__main__":
    sys.exit(main())
