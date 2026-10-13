import assert from "node:assert/strict";

const { getLesanBaseUrl } = await import("./api.js");

const PUBLIC = "http://46.245.98.10:1404";
const INTERNAL = "http://backend:1404";

/** Run `fn` as if in the browser, with `origin` as `window.location.origin`. */
function inBrowser(origin, fn) {
  globalThis.window = { location: { origin } };
  try {
    return fn();
  } finally {
    delete globalThis.window;
  }
}

function setEnv(next) {
  for (const key of ["LESAN_URL", "NEXT_PUBLIC_LESAN_URL"]) delete process.env[key];
  Object.assign(process.env, next);
}

/** `AttachmentGallery.href` in report/AttachmentGallery.tsx, verbatim. */
function attachmentHref(file) {
  const relative = file.path ?? `accidents/${file.name}`;
  const encoded = relative
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  return `${getLesanBaseUrl()}/uploads/${encoded}`;
}

const checks = [];
function check(name, fn) {
  try {
    fn();
    checks.push(`  ok   ${name}`);
  } catch (error) {
    const detail = error.message.split("\n").slice(0, 6).join("\n       ");
    checks.push(`  FAIL ${name}\n       ${detail}`);
    process.exitCode = 1;
  }
}

// ---------------------------------------------------------------------------
// The regression: commit d4966f5 made the browser branch return
// `window.location.origin`, so every `${getLesanBaseUrl()}/uploads/...` URL was
// built against the Next.js origin and 404'd. `docker-compose.yml` sets
// LESAN_URL (Docker-internal, unresolvable in a browser) and
// NEXT_PUBLIC_LESAN_URL (public) as a deliberate two-tier contract; the browser
// must honour the public tier.
// ---------------------------------------------------------------------------

check("browser prefers NEXT_PUBLIC_LESAN_URL over its own origin", () => {
  setEnv({ LESAN_URL: INTERNAL, NEXT_PUBLIC_LESAN_URL: PUBLIC });
  assert.equal(
    inBrowser("http://localhost:3044", getLesanBaseUrl),
    PUBLIC,
    "browser resolved the asset base to the frontend origin instead of the backend",
  );
});

check("browser builds a reachable attachment URL from the recorded path", () => {
  setEnv({ LESAN_URL: INTERNAL, NEXT_PUBLIC_LESAN_URL: PUBLIC });
  const file = {
    name: "6acded34dee056ba9334d29d-eddafec9-68a5-4fa7-9264-47ff234dcb50.jpg",
    path: "images/6acded34dee056ba9334d29d-eddafec9-68a5-4fa7-9264-47ff234dcb50.jpg",
  };
  assert.equal(
    inBrowser("http://localhost:3044", () => attachmentHref(file)),
    `${PUBLIC}/uploads/images/6acded34dee056ba9334d29d-eddafec9-68a5-4fa7-9264-47ff234dcb50.jpg`,
  );
});

check("browser falls back to the accidents/ tree when no path was recorded", () => {
  setEnv({ LESAN_URL: INTERNAL, NEXT_PUBLIC_LESAN_URL: PUBLIC });
  const file = { name: "legacy shot #1.jpg" };
  assert.equal(
    inBrowser("http://localhost:3044", () => attachmentHref(file)),
    `${PUBLIC}/uploads/accidents/legacy%20shot%20%231.jpg`,
  );
});

check("browser falls back to its own origin when no public URL is configured", () => {
  setEnv({ LESAN_URL: INTERNAL });
  assert.equal(inBrowser("http://localhost:3044", getLesanBaseUrl), "http://localhost:3044");
});

// ---------------------------------------------------------------------------
// Server-side behaviour must not regress: the internal Docker host is the right
// answer there, and it is deliberately NOT the public one.
// ---------------------------------------------------------------------------

check("server uses LESAN_URL, not the public URL", () => {
  setEnv({ LESAN_URL: INTERNAL, NEXT_PUBLIC_LESAN_URL: PUBLIC });
  assert.equal(getLesanBaseUrl(), INTERNAL);
});

check("server defaults to localhost:1404 when LESAN_URL is unset", () => {
  setEnv({});
  assert.equal(getLesanBaseUrl(), "http://localhost:1404");
});

setEnv({});

console.log(checks.join("\n"));
console.log(process.exitCode ? "\nFAILED" : "\nall checks passed");
