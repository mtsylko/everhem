import type { Garment, ImageView } from "../src/catalog/types.ts";
import { Canvas, type Point, type Rgb } from "./raster.ts";

export const WIDTH = 1000;
export const HEIGHT = 1250;

// Shapes are drawn on a 100 × 125 grid and scaled to the image size.
const SCALE = WIDTH / 100;

const BACKGROUND = hexToRgb("#ECE9E4");
const SHADOW = mix(BACKGROUND, [0, 0, 0], 0.09);

interface Layer {
  shape: Point[];
  color: Rgb;
}

interface Drawing {
  /** Outer shapes. They get a shadow and an outline. */
  silhouette: Layer[];
  details: Layer[];
}

export function renderGarment(garment: Garment, view: ImageView, hex: string): Uint8Array {
  const base = hexToRgb(hex);
  const { silhouette, details } = draw(garment, view, base);
  const canvas = new Canvas(WIDTH, HEIGHT, BACKGROUND);
  const paint = (shape: Point[], color: Rgb, dx = 0, dy = 0) =>
    canvas.fill(
      shape.map(([x, y]) => [(x + dx) * SCALE, (y + dy) * SCALE]),
      color,
    );

  for (const { shape } of silhouette) paint(shape, SHADOW, 0.7, 1);
  // Light garments would blend into the background without an outline.
  const outline = mix(base, [0, 0, 0], 0.22);
  for (const { shape } of silhouette) {
    for (const [dx, dy] of OUTLINE_OFFSETS) paint(shape, outline, dx, dy);
  }
  for (const { shape, color } of [...silhouette, ...details]) paint(shape, color);

  return canvas.toRgb();
}

const OUTLINE_OFFSETS: Point[] = Array.from({ length: 8 }, (_, i) => [
  Math.cos((i * Math.PI) / 4) * 0.3,
  Math.sin((i * Math.PI) / 4) * 0.3,
]);

function draw(garment: Garment, view: ImageView, base: Rgb): Drawing {
  const front = view === "front";
  const rib = shade(base, 0.1);
  const inside = mix(base, [0, 0, 0], 0.35);

  switch (garment) {
    case "tee": {
      const neck = neckline(front ? 23 : 18.7, 58.5, 16.5);
      const body = symmetric([
        ...neck,
        [73, 20],
        [89, 33],
        [82.5, 45],
        [72, 39.5],
        [71, 103],
        [50, 104],
      ]);
      return {
        silhouette: [{ shape: body, color: base }],
        details: [
          ...neckDetails(neck, front, 2.2, rib, inside, base),
          ...pair(strip([89, 33], [82.5, 45], 2, [70, 35]), rib),
          { shape: hem(29, 71, 101.5, 103, 104), color: shade(base, 0.06) },
        ],
      };
    }

    case "long-sleeve":
    case "sweater":
    case "turtleneck": {
      const knit = garment !== "long-sleeve";
      const neck =
        garment === "turtleneck"
          ? neckline(17.5, 57.5, 15.5)
          : neckline(front ? (knit ? 21.5 : 23) : 18.5, 58, 16.5);
      const body = symmetric([
        ...neck,
        [72.5, 20.5],
        [86, 41],
        [90.5, 90],
        [82.5, 92],
        [75.5, 47],
        [71.5, 41],
        [71, 102],
        [50, 103],
      ]);
      const silhouette: Layer[] = [{ shape: body, color: base }];
      const details: Layer[] = [
        ...pair(strip([90.5, 90], [82.5, 92], knit ? 5 : 3, [80, 60]), rib),
        { shape: hem(29, 71, knit ? 96 : 100, 102, 103), color: rib },
      ];

      if (garment === "turtleneck") {
        silhouette.push({ shape: rect(42.3, 7.5, 57.7, 19), color: shade(base, 0.04) });
        details.push({ shape: rect(42.3, 11.5, 57.7, 13), color: shade(base, 0.12) });
        if (front) details.push({ shape: ellipse(50, 7.6, 7.4, 1.2), color: inside });
      } else {
        details.push(...neckDetails(neck, front, knit ? 3 : 2.2, rib, inside, base));
      }
      return { silhouette, details };
    }

    case "hoodie":
    case "zip-hoodie": {
      const neck = neckline(front ? 30 : 21, 60, 20.5);
      const body = symmetric([
        ...neck,
        [74, 22],
        [87, 42],
        [92, 90],
        [84, 92.5],
        [76.5, 47],
        [73, 43],
        [72.5, 104],
        [50, 105],
      ]);
      const hood = shade(base, 0.05);
      const details: Layer[] = [
        ...pair(strip([92, 90], [84, 92.5], 4, [80, 60]), rib),
        { shape: hem(27.5, 72.5, 98.5, 104, 105), color: rib },
      ];

      if (!front) {
        details.push(
          {
            shape: symmetric([
              [50, 15],
              ...quad([50, 15], [64, 15], [62, 24]).slice(1),
              ...quad([62, 24], [60, 44], [50, 47]).slice(1),
            ]),
            color: hood,
          },
          { shape: rect(49.7, 16, 50.3, 46.5), color: shade(base, 0.18) },
          { shape: rect(48.6, 22.5, 51.4, 24.5), color: shade(base, 0.4) },
        );
        return { silhouette: [{ shape: body, color: base }], details };
      }

      const hoodBack = symmetric([
        [50, 4.5],
        ...quad([50, 4.5], [66, 4.5], [65, 26]).slice(1),
        [50, 32],
      ]);
      const opening = symmetric([
        [50, 10],
        ...quad([50, 10], [58.5, 10], [58.5, 22]).slice(1),
        [50, 30],
      ]);
      const cord = shade(base, 0.25);
      details.unshift({ shape: opening, color: inside });
      details.push(
        { shape: rect(46.6, 29, 47.5, 47), color: cord },
        { shape: rect(52.5, 29, 53.4, 47), color: cord },
        { shape: rect(46.4, 45, 47.7, 48.5), color: shade(base, 0.4) },
        { shape: rect(52.3, 45, 53.6, 48.5), color: shade(base, 0.4) },
      );

      if (garment === "zip-hoodie") {
        details.push(
          ...pair(
            [
              [31, 75],
              [47.5, 75],
              [47.5, 93],
              [29.5, 93],
            ],
            shade(base, 0.07),
          ),
          { shape: rect(49.4, 30, 50.6, 104.5), color: shade(base, 0.3) },
        );
      } else {
        details.push(
          {
            shape: [
              [33, 72],
              [67, 72],
              [70.5, 93],
              [29.5, 93],
            ],
            color: shade(base, 0.07),
          },
          ...pair(strip([33, 72], [29.5, 93], 1.2, [50, 80]), shade(base, 0.14)),
        );
      }
      return {
        silhouette: [
          { shape: hoodBack, color: hood },
          { shape: body, color: base },
        ],
        details,
      };
    }

    case "cardigan": {
      if (!front) return draw("sweater", view, base);
      const body = symmetric([
        [50, 48],
        [57.5, 16.5],
        [72.5, 20.5],
        [86, 41],
        [90.5, 90],
        [82.5, 92],
        [75.5, 47],
        [71.5, 41],
        [71, 102],
        [50, 103],
      ]);
      const backNeck = curve(neckline(18.7, 57.5, 16.5));
      const button = shade(base, 0.45);
      return {
        silhouette: [{ shape: body, color: base }],
        details: [
          { shape: [...backNeck, [50, 48]], color: inside },
          ...pair(strip([57.5, 16.5], [50, 48], 2.4, [70, 40]), rib),
          { shape: rect(48.6, 47, 51.4, 103), color: rib },
          { shape: rect(49.9, 47, 50.1, 103), color: shade(base, 0.25) },
          ...[55, 65, 75, 85, 95].map((y) => ({ shape: ellipse(50, y, 1.1, 1.1), color: button })),
          ...pair(strip([90.5, 90], [82.5, 92], 5, [80, 60]), rib),
          { shape: hem(29, 71, 96, 102, 103), color: rib },
        ],
      };
    }
  }
}

/** Neck band, plus the inside of the back neck that shows through on the front. */
function neckDetails(
  neck: Point[],
  front: boolean,
  bandWidth: number,
  rib: Rgb,
  inside: Rgb,
  base: Rgb,
): Layer[] {
  const [edgeX, edgeY] = neck.at(-1) as Point;
  const band = curve(neck);
  const layers: Layer[] = [
    {
      shape: [...band, ...band.toReversed().map(([x, y]): Point => [x, y + bandWidth])],
      color: rib,
    },
  ];
  if (front) {
    const backNeck = curve(neckline(18.7, edgeX, edgeY));
    layers.unshift({ shape: [...band, ...backNeck.toReversed()], color: inside });
  } else {
    layers.push({ shape: rect(48.6, 19.6, 51.4, 21.6), color: shade(base, 0.4) });
  }
  return layers;
}

/** Right half of a neckline, from the center to the shoulder edge. */
function neckline(centerY: number, edgeX: number, edgeY: number): Point[] {
  return quad([50, centerY], [edgeX - 3, centerY], [edgeX, edgeY]);
}

/** Full curve from a right half: left edge, center, right edge. */
function curve(rightHalf: Point[]): Point[] {
  return [...rightHalf.toReversed().map(flipX), ...rightHalf.slice(1)];
}

/** Builds a symmetric shape from its right half, listed from top center to bottom center. */
function symmetric(rightHalf: Point[]): Point[] {
  return [...rightHalf, ...rightHalf.slice(1, -1).toReversed().map(flipX)];
}

function pair(shape: Point[], color: Rgb): Layer[] {
  return [
    { shape, color },
    { shape: shape.map(flipX), color },
  ];
}

/** A strip of the given width along the edge a→b, on the side that faces `inside`. */
function strip(a: Point, b: Point, width: number, inside: Point): Point[] {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  let nx = -(b[1] - a[1]) / length;
  let ny = (b[0] - a[0]) / length;
  const toInside = (inside[0] - (a[0] + b[0]) / 2) * nx + (inside[1] - (a[1] + b[1]) / 2) * ny;
  if (toInside < 0) [nx, ny] = [-nx, -ny];
  return [a, b, [b[0] + nx * width, b[1] + ny * width], [a[0] + nx * width, a[1] + ny * width]];
}

function hem(left: number, right: number, top: number, side: number, center: number): Point[] {
  return [
    [left, top],
    [right, top],
    [right, side],
    [50, center],
    [left, side],
  ];
}

function quad(a: Point, control: Point, b: Point, steps = 16): Point[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [
      u * u * a[0] + 2 * u * t * control[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * control[1] + t * t * b[1],
    ];
  });
}

function rect(x1: number, y1: number, x2: number, y2: number): Point[] {
  return [
    [x1, y1],
    [x2, y1],
    [x2, y2],
    [x1, y2],
  ];
}

function ellipse(cx: number, cy: number, rx: number, ry: number, steps = 32): Point[] {
  return Array.from({ length: steps }, (_, i) => {
    const angle = (i / steps) * Math.PI * 2;
    return [cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry];
  });
}

function flipX([x, y]: Point): Point {
  return [100 - x, y];
}

export function hexToRgb(hex: string): Rgb {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Darkens a color, or lightens it when it is already very dark, so details stay visible. */
function shade(color: Rgb, amount: number): Rgb {
  const luminance = (0.2126 * color[0] + 0.7152 * color[1] + 0.0722 * color[2]) / 255;
  return luminance < 0.12
    ? mix(color, [255, 255, 255], amount * 0.6)
    : mix(color, [0, 0, 0], amount);
}
