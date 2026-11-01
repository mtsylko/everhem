import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { colors } from "../catalog/colors.ts";
import { products } from "../catalog/products.ts";
import { defaultImages } from "../src/catalog/images.ts";
import { type Drawing, drawGarment, HEIGHT, paintGarment, WIDTH } from "./garments.ts";
import { encodePng } from "./png.ts";

// Renders drawn placeholder images for every product that uses the default local images.
// Replace the files with real photos later and run the seed again.

const IMAGES_DIR = fileURLToPath(new URL("../catalog/images", import.meta.url));

let count = 0;
for (const product of products.filter((p) => !p.images)) {
  // Drawing a view is the slow part, so each one is drawn once and painted in every color.
  const drawings = new Map<string, Drawing>();
  for (const image of defaultImages(product, IMAGES_DIR)) {
    if (image.source.kind !== "file") continue;
    const hex = colors.get(image.color)?.hex;
    if (!hex) throw new Error(`${product.handle}: unknown color "${image.color}"`);

    const drawing = drawings.get(image.view) ?? drawGarment(product, image.view);
    drawings.set(image.view, drawing);
    const png = encodePng(WIDTH, HEIGHT, paintGarment(drawing, hex));
    await mkdir(path.dirname(image.source.path), { recursive: true });
    await writeFile(image.source.path, png);
    count++;
  }
}

console.log(`Rendered ${count} images to ${path.relative(process.cwd(), IMAGES_DIR)}`);
