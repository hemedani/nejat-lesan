import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import { gunzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const raw = readFileSync(process.argv[2]);
let data = raw;
try {
  data = gunzipSync(raw);
} catch {
  // not gzipped — use as-is
}

const tile = new VectorTile(new PbfReader(data));
const layers = Object.keys(tile.layers);
if (layers.length === 0) {
  console.error("tile decodes but has no layers");
  process.exit(1);
}
console.log(layers.join(","));
