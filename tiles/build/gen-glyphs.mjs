import fontnik from "fontnik";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const fonts = [
  { file: "Vazirmatn-Regular.ttf", stack: "Vazirmatn Regular" },
  { file: "Vazirmatn-Bold.ttf", stack: "Vazirmatn Bold" },
];

function glyphRange(font, start, end) {
  return new Promise((resolve, reject) => {
    fontnik.range({ font, start, end }, (err, data) =>
      err ? reject(err) : resolve(data),
    );
  });
}

for (const { file, stack } of fonts) {
  const font = readFileSync(path.join(root, "fonts", file));
  const outDir = path.join(root, "dist", "glyphs", stack);
  mkdirSync(outDir, { recursive: true });
  for (let start = 0; start < 65536; start += 256) {
    const end = start + 255;
    const buf = await glyphRange(font, start, end);
    writeFileSync(path.join(outDir, `${start}-${end}.pbf`), buf);
  }
  console.log(`glyphs: ${stack} (256 ranges)`);
}
