import path from "node:path";
import type { CatalogImage, CatalogProduct, ImageSource, ImageView } from "./types.ts";

export const IMAGES_PER_PRODUCT = 3;

export interface PlannedImage {
  /** Stable id inside a product, e.g. black-front. */
  key: string;
  color: string;
  view: ImageView;
  alt: string;
  filename: string;
  source: ImageSource;
}

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** One front shot per color, then back shots until the product has three images. */
export function defaultImages(product: CatalogProduct, imagesDir: string): CatalogImage[] {
  const views: ImageView[] = ["front", "back"];
  return views
    .flatMap((view) => product.colors.map((color) => ({ color, view })))
    .slice(0, IMAGES_PER_PRODUCT)
    .map(({ color, view }) => ({
      color,
      view,
      source: {
        kind: "file",
        path: path.join(imagesDir, product.handle, `${slugify(color)}-${view}.png`),
      },
    }));
}

export function planImages(product: CatalogProduct, imagesDir: string): PlannedImage[] {
  const images = product.images ?? defaultImages(product, imagesDir);
  return images.map((image) => {
    const key = `${slugify(image.color)}-${image.view}`;
    return {
      ...image,
      key,
      alt: `${product.title} in ${image.color}, ${image.view} view`,
      filename: `${product.handle}-${key}${extensionOf(image.source)}`,
    };
  });
}

/** The image shown when a shopper picks this color. */
export function variantImageFor<T extends PlannedImage>(images: readonly T[], color: string) {
  return (
    images.find((image) => image.color === color && image.view === "front") ??
    images.find((image) => image.color === color)
  );
}

export function mimeTypeFor(filename: string): string {
  const type = MIME_TYPES[path.extname(filename).toLowerCase()];
  if (!type) throw new Error(`Unsupported image type: ${filename}`);
  return type;
}

function extensionOf(source: ImageSource): string {
  const file = source.kind === "file" ? source.path : new URL(source.url).pathname;
  return path.extname(file).toLowerCase() || ".jpg";
}
