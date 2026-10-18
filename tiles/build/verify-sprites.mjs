import { readFileSync } from "node:fs";
import path from "node:path";

const [dir, flavor] = process.argv.slice(2);
if (!dir || !flavor) {
  console.error("usage: verify-sprites.mjs <dir> <flavor>");
  process.exit(2);
}

function pngSize(buf, label) {
  if (buf.length < 24 || buf.readUInt32BE(12) !== 0x49484452) {
    throw new Error(`${label} is not a PNG (missing IHDR)`);
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const index1x = JSON.parse(readFileSync(path.join(dir, `${flavor}.json`), "utf8"));
const index2x = JSON.parse(readFileSync(path.join(dir, `${flavor}@2x.json`), "utf8"));
const png1x = pngSize(readFileSync(path.join(dir, `${flavor}.png`)), `${flavor}.png`);
const png2x = pngSize(readFileSync(path.join(dir, `${flavor}@2x.png`)), `${flavor}@2x.png`);

const names = (o) => Object.keys(o).sort().join(",");
if (names(index1x) !== names(index2x)) {
  fail(`${flavor}: @2x index names differ from 1x index`);
}
for (const [name, s] of Object.entries(index1x)) {
  const d = index2x[name];
  if (
    !d ||
    d.x !== 2 * s.x ||
    d.y !== 2 * s.y ||
    d.width !== 2 * s.width ||
    d.height !== 2 * s.height ||
    d.pixelRatio !== 2
  ) {
    fail(`${flavor}: @2x entry ${name} is not a doubled copy of its 1x counterpart`);
  }
}
if (png2x.width !== 2 * png1x.width || png2x.height !== 2 * png1x.height) {
  fail(
    `${flavor}: @2x.png is ${png2x.width}x${png2x.height}, ` +
      `expected ${2 * png1x.width}x${2 * png1x.height}`,
  );
}

console.log(
  `${flavor}: ${Object.keys(index1x).length} icons, @2x consistent (${png2x.width}x${png2x.height})`,
);
