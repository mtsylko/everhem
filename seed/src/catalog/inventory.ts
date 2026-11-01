import { ONE_SIZE, type Size, type StockPlan } from "./types.ts";

// Basics sell mostly in M and L. A one-size accessory gets the whole run in one variant.
const SIZE_CURVE: Record<Size, number> = { XS: 4, S: 9, M: 14, L: 12, XL: 6, [ONE_SIZE]: 30 };

// The first color of a product is its bestseller, so it gets more stock.
const LEAD_COLOR_BONUS = 4;

export function quantityFor(
  stock: StockPlan,
  color: string,
  colorIndex: number,
  size: Size,
): number {
  if (stock.kind === "sold-out") return 0;
  if (stock.soldOut?.some((v) => v.color === color && v.size === size)) return 0;
  return SIZE_CURVE[size] + (colorIndex === 0 ? LEAD_COLOR_BONUS : 0);
}
