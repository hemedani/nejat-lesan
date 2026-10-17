import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcPath = process.argv[2];
if (!srcPath) throw new Error("usage: node gen-tilejson.mjs <generated-tilejson.json>");

const origin = process.env.TILES_PUBLIC_ORIGIN ?? "http://localhost:8790";
const cfg = JSON.parse(readFileSync(path.join(root, "config", "areas.json"), "utf8"));
const iran = cfg.areas.find((a) => a.id === "iran");
if (!iran) throw new Error("areas.json: no 'iran' area");

const tj = JSON.parse(readFileSync(srcPath, "utf8"));

if (!Array.isArray(tj.vector_layers) || tj.vector_layers.length === 0) {
  throw new Error(
    "generated TileJSON has no vector_layers — is the archive an MVT basemap?",
  );
}

tj.tilejson = "3.0.0";
tj.scheme = "xyz";
tj.tiles = [`${origin}/tiles/{z}/{x}/{y}.mvt`];
tj.minzoom = iran.minzoom;
tj.maxzoom = iran.maxzoom;
tj.bounds = iran.bbox;
tj.tileSize = 512;
tj.attribution = cfg.attribution;

mkdirSync(path.join(root, "dist"), { recursive: true });
writeFileSync(path.join(root, "dist", "tiles.json"), JSON.stringify(tj, null, 2));
console.log(`wrote dist/tiles.json (tileSize=512, maxzoom=${tj.maxzoom}, layers=${tj.vector_layers.length})`);
