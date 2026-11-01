export type Point = readonly [number, number];
export type Rgb = readonly [number, number, number];

// Vertical samples per pixel row. Horizontal coverage is computed exactly.
const SUBROWS = 4;

/** A tiny anti-aliased polygon rasterizer. Enough for flat placeholder art. */
export class Canvas {
  readonly width: number;
  readonly height: number;
  readonly #pixels: Float32Array;

  constructor(width: number, height: number, background: Rgb) {
    this.width = width;
    this.height = height;
    this.#pixels = new Float32Array(width * height * 3);
    for (let i = 0; i < this.#pixels.length; i += 3) this.#pixels.set(background, i);
  }

  /** Fills a polygon with the even-odd rule. */
  fill(points: readonly Point[], color: Rgb): void {
    scan(points, this.width, this.height, (y, coverage) => this.#blendRow(y, coverage, color));
  }

  /**
   * Darkens each pixel by its offset when the offset is negative and lightens it when positive,
   * as a share of the way to black or white. Folds stay visible on black and on white this way.
   */
  shade(offsets: Float32Array): void {
    const p = this.#pixels;
    for (let i = 0; i < offsets.length; i++) {
      const offset = offsets[i] as number;
      if (offset === 0) continue;
      for (let c = i * 3; c < i * 3 + 3; c++) {
        const v = p[c] as number;
        p[c] = offset < 0 ? v * (1 + offset) : v + (255 - v) * offset;
      }
    }
  }

  toRgb(): Uint8Array {
    return Uint8Array.from(this.#pixels, (v) => Math.round(Math.min(255, Math.max(0, v))));
  }

  #blendRow(y: number, coverage: Float32Array, [r, g, b]: Rgb): void {
    for (let x = 0; x < this.width; x++) {
      const alpha = Math.min(1, coverage[x] as number);
      if (alpha === 0) continue;
      const i = (y * this.width + x) * 3;
      const p = this.#pixels;
      p[i] = (p[i] as number) * (1 - alpha) + r * alpha;
      p[i + 1] = (p[i + 1] as number) * (1 - alpha) + g * alpha;
      p[i + 2] = (p[i + 2] as number) * (1 - alpha) + b * alpha;
    }
  }
}

/** How much of each pixel a set of shapes covers, 0 to 1. Used for shading, not color. */
export class Mask {
  readonly width: number;
  readonly height: number;
  readonly data: Float32Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Float32Array(width * height);
  }

  /** Adds a polygon at the given strength, keeping the stronger value where shapes overlap. */
  fill(points: readonly Point[], strength = 1): void {
    scan(points, this.width, this.height, (y, coverage) => {
      for (let x = 0; x < this.width; x++) {
        const value = Math.min(1, coverage[x] as number) * strength;
        const i = y * this.width + x;
        if (value > (this.data[i] as number)) this.data[i] = value;
      }
    });
  }
}

/** Calls `row` with the coverage of every pixel row the polygon touches, by the even-odd rule. */
function scan(
  points: readonly Point[],
  width: number,
  height: number,
  row: (y: number, coverage: Float32Array) => void,
): void {
  if (points.length < 3) return;
  const ys = points.map(([, y]) => y);
  const top = Math.max(0, Math.floor(Math.min(...ys)));
  const bottom = Math.min(height, Math.ceil(Math.max(...ys)));
  const coverage = new Float32Array(width);

  for (let y = top; y < bottom; y++) {
    coverage.fill(0);
    for (let s = 0; s < SUBROWS; s++) {
      const crossings = crossingsAt(points, y + (s + 0.5) / SUBROWS);
      for (let i = 0; i + 1 < crossings.length; i += 2) {
        addSpan(coverage, crossings[i] as number, crossings[i + 1] as number, 1 / SUBROWS);
      }
    }
    row(y, coverage);
  }
}

/** X positions where the polygon edges cross a horizontal line, sorted. */
export function crossingsAt(points: readonly Point[], y: number): number[] {
  const xs: number[] = [];
  for (let i = 0; i < points.length; i++) {
    const [x1, y1] = points[i] as Point;
    const [x2, y2] = points[(i + 1) % points.length] as Point;
    // Half-open range, so a vertex shared by two edges is counted once.
    if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
      xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
    }
  }
  return xs.sort((a, b) => a - b);
}

/** Adds `weight` to every pixel covered by [from, to), with partial pixels at both ends. */
export function addSpan(coverage: Float32Array, from: number, to: number, weight: number): void {
  const start = Math.max(0, from);
  const end = Math.min(coverage.length, to);
  if (end <= start) return;

  const first = Math.floor(start);
  const last = Math.floor(end);
  if (first === last) {
    coverage[first] = (coverage[first] as number) + (end - start) * weight;
    return;
  }
  coverage[first] = (coverage[first] as number) + (first + 1 - start) * weight;
  for (let x = first + 1; x < last; x++) coverage[x] = (coverage[x] as number) + weight;
  if (last < coverage.length) coverage[last] = (coverage[last] as number) + (end - last) * weight;
}

/** Blurs a plane with three box blurs in a row, which comes close to a Gaussian. */
export function blur(src: Float32Array, width: number, height: number, radius: number) {
  let plane = src;
  for (let pass = 0; pass < 3; pass++) {
    plane = boxBlur(plane, width, height, radius, 1, width);
    plane = boxBlur(plane, height, width, radius, width, 1);
  }
  return plane;
}

/** Blurs every line of `length` pixels; `step` moves along a line, `next` to the next line. */
function boxBlur(
  src: Float32Array,
  length: number,
  lines: number,
  radius: number,
  step: number,
  next: number,
) {
  const out = new Float32Array(src.length);
  const at = (line: number, i: number) =>
    src[line * next + Math.min(length - 1, Math.max(0, i)) * step] as number;
  for (let line = 0; line < lines; line++) {
    let sum = 0;
    for (let i = -radius; i <= radius; i++) sum += at(line, i);
    for (let i = 0; i < length; i++) {
      out[line * next + i * step] = sum / (2 * radius + 1);
      sum += at(line, i + radius + 1) - at(line, i - radius);
    }
  }
  return out;
}
