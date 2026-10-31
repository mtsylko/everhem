import { quantityFor } from "./inventory.ts";
import { SIZES, type CatalogProduct, type Color, type Size } from "./types.ts";

export interface PlannedVariant {
  color: string;
  size: Size;
  sku: string;
  quantity: number;
}

export function skuFor(productCode: string, colorCode: string, size: Size): string {
  return `HEM-${productCode}-${colorCode}-${size}`;
}

export function variantKey(color: string, size: string): string {
  return `${color}/${size}`;
}

export function planVariants(
  product: CatalogProduct,
  palette: ReadonlyMap<string, Color>,
): PlannedVariant[] {
  return product.colors.flatMap((colorName, colorIndex) => {
    const color = palette.get(colorName);
    if (!color) throw new Error(`${product.handle}: unknown color "${colorName}"`);

    return SIZES.map((size) => ({
      color: colorName,
      size,
      sku: skuFor(product.code, color.code, size),
      quantity: quantityFor(product.stock, colorName, colorIndex, size),
    }));
  });
}
