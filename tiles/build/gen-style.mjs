import { layers, namedFlavor } from "@protomaps/basemaps";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = process.env.TILES_PUBLIC_ORIGIN ?? "http://localhost:8790";
const cfg = JSON.parse(readFileSync(path.join(root, "config", "areas.json"), "utf8"));

const FONTSTACK = "Vazirmatn Regular";

const base = layers("protomaps", namedFlavor("light"), { lang: "fa" });

const withFont = base.map((layer) => {
  if (layer.layout && "text-font" in layer.layout) {
    return { ...layer, layout: { ...layer.layout, "text-font": [FONTSTACK] } };
  }
  return layer;
});

const style = {
  version: 8,
  name: "lesan-basemap",
  sources: {
    protomaps: {
      type: "vector",
      url: `${origin}/tiles.json`,
      attribution: cfg.attribution,
    },
  },
  glyphs: `${origin}/glyphs/{fontstack}/{range}.pbf`,
  sprite: `${origin}/sprites/v4/light`,
  layers: withFont,
};

const textLayers = withFont.filter(
  (l) => l.type === "symbol" && l.layout && "text-font" in l.layout,
);
if (textLayers.length === 0) throw new Error("no text symbol layers — labels would not render");
const allPersianFonted = textLayers.every(
  (l) => JSON.stringify(l.layout["text-font"]) === JSON.stringify([FONTSTACK]),
);
if (!allPersianFonted) throw new Error("some text layer did not get the Vazirmatn fontstack");

mkdirSync(path.join(root, "dist"), { recursive: true });
writeFileSync(path.join(root, "dist", "style.json"), JSON.stringify(style, null, 2));
console.log(`wrote dist/style.json (${withFont.length} layers, ${textLayers.length} text layers)`);
