import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flavors = ["light", "dark"];

function pngSize(buf) {
  // PNG: 8-byte signature, then IHDR chunk (length 4, type "IHDR" @12, width @16, height @20).
  if (buf.length < 24 || buf.readUInt32BE(12) !== 0x49484452) {
    throw new Error("not a PNG (missing IHDR)");
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function fail(msg) {
  console.error(`gen-sprites: ${msg}`);
  process.exit(1);
}

for (const flavor of flavors) {
  const base = path.join(root, "sprites", "v4", flavor);
  const index1x = JSON.parse(readFileSync(`${base}.json`, "utf8"));
  const png1x = pngSize(readFileSync(`${base}.png`));
  const png2x = pngSize(readFileSync(`${base}@2x.png`));

  if (png2x.width !== 2 * png1x.width || png2x.height !== 2 * png1x.height) {
    fail(
      `${flavor}@2x.png is ${png2x.width}x${png2x.height}, ` +
        `expected ${2 * png1x.width}x${2 * png1x.height} (2x of ${png1x.width}x${png1x.height})`,
    );
  }

  const index2x = {};
  for (const [name, s] of Object.entries(index1x)) {
    index2x[name] = {
      x: 2 * s.x,
      y: 2 * s.y,
      width: 2 * s.width,
      height: 2 * s.height,
      pixelRatio: 2,
    };
  }

  const names = (o) => Object.keys(o).sort().join(",");
  if (names(index1x) !== names(index2x)) {
    fail(`${flavor}: 1x and @2x index name sets differ`);
  }
  for (const [name, s] of Object.entries(index1x)) {
    const d = index2x[name];
    if (
      d.x !== 2 * s.x ||
      d.y !== 2 * s.y ||
      d.width !== 2 * s.width ||
      d.height !== 2 * s.height ||
      d.pixelRatio !== 2
    ) {
      fail(`${flavor}: @2x entry ${name} is not a doubled copy of its 1x counterpart`);
    }
  }

  writeFileSync(`${base}@2x.json`, JSON.stringify(index2x, null, 2) + "\n");
  console.log(`sprites: ${flavor} (${Object.keys(index2x).length} icons, @2x ${png2x.width}x${png2x.height})`);
}
