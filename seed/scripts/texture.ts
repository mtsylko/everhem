import type { Texture } from "../src/catalog/types.ts";

// Fabric surfaces as small lightness offsets, measured in pixels of the output image so every
// product shows the same grain. The patterns are deterministic: a product renders to the same
// bytes every time, and the seed doesn't upload unchanged images again.

const TAU = Math.PI * 2;

/** Lightness offset of a fabric surface at a pixel, roughly between -0.05 and 0.05. */
export function surface(texture: Texture, x: number, y: number): number {
  switch (texture) {
    case "jersey":
      // Fine vertical wales, barely there.
      return 0.012 * Math.sin((TAU * x) / 4) + 0.02 * (noise(x / 2, y / 2) - 0.5);
    case "slub":
      // Linen yarn is uneven: thicker runs stretch along the rows.
      return 0.09 * (noise(x / 40, y / 3) - 0.5) + 0.03 * (noise(x / 2, y / 2) - 0.5);
    case "pique": {
      // Small raised cells, each column shifted by half a cell like a honeycomb.
      const shift = Math.floor(x / 5) % 2 === 0 ? 0 : 2.5;
      return (
        0.03 * Math.cos((TAU * x) / 5) * Math.cos((TAU * (y + shift)) / 5) +
        0.015 * (noise(x / 2, y / 2) - 0.5)
      );
    }
    case "waffle":
      // Square pockets between raised walls.
      return (
        0.045 * (Math.max(Math.cos((TAU * x) / 12), Math.cos((TAU * y) / 12)) - 0.3) +
        0.015 * (noise(x / 2, y / 2) - 0.5)
      );
    case "fleece":
      return 0.05 * (noise(x / 9, y / 9) - 0.5) + 0.035 * (noise(x / 2, y / 2) - 0.5);
    case "terry":
      return 0.06 * (noise(x / 2.2, y / 2.2) - 0.5);
    case "fine-knit":
      return 0.03 * stitches(x, y, 8, 7) + 0.015 * (noise(x / 3, y / 3) - 0.5);
    case "brushed":
      // Brushed wool: a soft haze over the stitches.
      return (
        0.05 * (noise(x / 6, y / 6) - 0.5) +
        0.05 * (noise(x / 1.5, y / 1.5) - 0.5) +
        0.012 * stitches(x, y, 8, 7)
      );
    case "rib-knit":
      return 0.07 * Math.sin((TAU * x) / 22) + 0.02 * stitches(x, y, 11, 9);
    case "cable":
      return cable(x, y);
    case "canvas":
      // A plain weave, warp and weft crossing at right angles, with uneven yarn.
      return (
        0.025 * Math.sin((TAU * x) / 3) * Math.sin((TAU * y) / 3) +
        0.03 * (noise(x / 25, y / 2) - 0.5)
      );
  }
}

/** Ribs across `phase`, the distance in pixels at right angles to them, from -1 to 1. */
export function ribs(phase: number, period: number): number {
  return Math.sin((TAU * phase) / period);
}

/** Columns of V-shaped knit stitches, `width` apart, with rows `height` apart. From -1 to 1. */
export function stitches(x: number, y: number, width: number, height: number): number {
  const fromCenter = Math.abs((((x % width) + width) % width) - width / 2);
  return Math.cos((TAU * (y + fromCenter * 1.2)) / height);
}

/** Columns of cables, two strands crossing over each other, with purl between them. */
function cable(x: number, y: number): number {
  const column = 64;
  const fromCenter = (((x % column) + column) % column) - column / 2;
  if (Math.abs(fromCenter) > 14) {
    // A sunken rib on each side of a cable.
    const valley = Math.abs(fromCenter) < 17 ? -0.05 : 0;
    return valley + 0.015 * stitches(x, y, 6, 6);
  }
  const twist = 7 * Math.sin((TAU * y) / 44);
  const strand = (offset: number) => Math.max(0, 1 - Math.abs(fromCenter - offset) / 6);
  return 0.08 * (Math.max(strand(twist), strand(-twist)) - 0.4);
}

/** Smooth value noise between 0 and 1 that changes over about one unit. */
export function noise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smooth(x - x0);
  const ty = smooth(y - y0);
  const top = hash(x0, y0) + (hash(x0 + 1, y0) - hash(x0, y0)) * tx;
  const bottom = hash(x0, y0 + 1) + (hash(x0 + 1, y0 + 1) - hash(x0, y0 + 1)) * tx;
  return top + (bottom - top) * ty;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** A repeatable pseudo-random value between 0 and 1 for a lattice point. */
function hash(x: number, y: number): number {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
