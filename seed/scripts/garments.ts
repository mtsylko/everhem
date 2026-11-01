import type { CatalogProduct, Fit, ImageView, Texture } from "../src/catalog/types.ts";
import { blur, Canvas, Mask, type Point, type Rgb } from "./raster.ts";
import { ribs, surface } from "./texture.ts";

export const WIDTH = 1000;
export const HEIGHT = 1250;

// Garments are designed on a 100 × 125 grid, all at one scale, so a boxy tee comes out wider than
// a regular one. Each is centred in the image, and only a garment too big for the frame shrinks.
const GRID = WIDTH / 100;
const FRAME_WIDTH = 88;
const FRAME_HEIGHT = 108;

const BACKGROUND = hexToRgb("#ECE9E4");
const BLACK: Rgb = [0, 0, 0];

// Shading, as lightness offsets (see Canvas.shade).
const LIGHT = 0.05; // the shoulders catch more light than the hem
const EDGE = 0.1; // the garment curves away near its outline
const CREASE = 0.2;
const RIDGE = 0.11;
const RIB = 0.07;
const SHADOW = 0.1;
const SHADOW_OFFSET = 12; // pixels below the garment
const OUTLINE = 2.5; // pixels

/** What the drawing needs to know about a product. */
export type Look = Pick<CatalogProduct, "garment" | "fit" | "texture">;

type Paint = (base: Rgb) => Rgb;

interface Layer {
  shape: Point[];
  /** Left out for a layer that only changes the shading, like a panel with its own grain. */
  paint?: Paint;
  /** A piece of the garment, like the body or a sleeve: it gets an outline and casts the shadow. */
  piece?: boolean;
  /** For a rib trim, the direction its ribs run in. */
  ribs?: Point;
  /** For a panel knitted another way, like the foot of a sock, the direction its fabric runs in. */
  grain?: Point;
}

/** A soft fold: a crease from `from` to `to`, with a lit ridge beside it. */
interface Fold {
  from: Point;
  to: Point;
  width: number;
  depth: number;
}

interface Design {
  layers: Layer[];
  folds: Fold[];
}

/** A garment drawn in one view, ready to paint in any of its colors. */
export interface Drawing {
  layers: Layer[];
  /** Lightness offset per pixel: folds, form, fabric and the shadow (see Canvas.shade). */
  shading: Float32Array;
}

/** Draws a product's garment in one view. Painting it is then cheap for every color. */
export function drawGarment(look: Look, view: ImageView): Drawing {
  const { layers, folds } = design(look, view === "front");
  const { place, scale } = frame(layers.filter((layer) => layer.piece).flatMap((l) => l.shape));
  const placed = layers.map((layer) => ({ ...layer, shape: layer.shape.map(place) }));
  const placedFolds = folds.map((fold) => ({
    ...fold,
    from: place(fold.from),
    to: place(fold.to),
    width: fold.width * scale,
  }));
  return { layers: placed, shading: shading(placed, placedFolds, look.texture) };
}

/** Paints a drawing in one color as 8-bit RGB. */
export function paintGarment({ layers, shading }: Drawing, hex: string): Uint8Array {
  const base = hexToRgb(hex);
  // Light garments would blend into the background without an outline.
  const outline = mix(base, BLACK, 0.2);
  const canvas = new Canvas(WIDTH, HEIGHT, BACKGROUND);
  for (const layer of layers) {
    // Outlined right before it is filled, so a piece laid over another shows its seam.
    if (layer.piece) {
      for (const [dx, dy] of OUTLINE_OFFSETS) {
        canvas.fill(
          layer.shape.map(([x, y]) => [x + dx, y + dy]),
          outline,
        );
      }
    }
    if (layer.paint) canvas.fill(layer.shape, layer.paint(base));
  }
  canvas.shade(shading);
  return canvas.toRgb();
}

const OUTLINE_OFFSETS: Point[] = Array.from({ length: 8 }, (_, i) => [
  Math.cos((i * Math.PI) / 4) * OUTLINE,
  Math.sin((i * Math.PI) / 4) * OUTLINE,
]);

/** Centres grid points in the image, shrinking them to the frame if needed. Returns the scale too. */
function frame(points: Point[]): { place: (point: Point) => Point; scale: number } {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const [left, right] = [Math.min(...xs), Math.max(...xs)];
  const [top, bottom] = [Math.min(...ys), Math.max(...ys)];
  const scale = GRID * Math.min(1, FRAME_WIDTH / (right - left), FRAME_HEIGHT / (bottom - top));
  const [cx, cy] = [(left + right) / 2, (top + bottom) / 2];
  return {
    scale,
    place: ([x, y]) => [WIDTH / 2 + (x - cx) * scale, HEIGHT / 2 + (y - cy) * scale],
  };
}

/** Light, folds, fabric and shadow for every pixel, the same for every color of the garment. */
function shading(layers: Layer[], folds: Fold[], texture: Texture): Float32Array {
  const garment = new Mask(WIDTH, HEIGHT);
  for (const layer of layers) if (layer.piece) garment.fill(layer.shape);
  const form = blur(garment.data, WIDTH, HEIGHT, 24);
  const shadow = blur(garment.data, WIDTH, HEIGHT, 16);

  const creases = new Mask(WIDTH, HEIGHT);
  const ridges = new Mask(WIDTH, HEIGHT);
  for (const { from, to, width, depth } of folds) {
    creases.fill(stroke(from, to, width), depth);
    // Light comes from above, so the ridge sits on the upper side of the crease.
    const [nx, ny] = normal(from, to);
    const up: Point =
      ny > 0 || (ny === 0 && nx > 0) ? [-nx * width, -ny * width] : [nx * width, ny * width];
    ridges.fill(stroke(add(from, up), add(to, up), width * 1.4), depth);
  }
  const crease = blur(creases.data, WIDTH, HEIGHT, 6);
  const ridge = blur(ridges.data, WIDTH, HEIGHT, 8);

  const ribPeriod = texture === "rib-knit" || texture === "cable" ? 12 : 8;
  const trims = layers.flatMap(({ shape, ribs: direction }) => {
    if (!direction) return [];
    const mask = new Mask(WIDTH, HEIGHT);
    mask.fill(shape);
    return [{ coverage: mask.data, direction }];
  });
  const panels = layers.flatMap(({ shape, grain }) => {
    if (!grain) return [];
    const mask = new Mask(WIDTH, HEIGHT);
    mask.fill(shape);
    return [{ coverage: mask.data, grain }];
  });

  const out = new Float32Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const i = y * WIDTH + x;
      const cover = garment.data[i] as number;
      const cast = y >= SHADOW_OFFSET ? (shadow[i - SHADOW_OFFSET * WIDTH] as number) : 0;
      let offset = -(1 - cover) * SHADOW * cast;

      if (cover > 0) {
        let fabric = 0;
        let ribbed = 0;
        for (const { coverage, direction } of trims) {
          const share = coverage[i] as number;
          if (share === 0) continue;
          // Ribs run along `direction`, so they repeat at right angles to it.
          fabric += share * RIB * ribs(x * direction[1] - y * direction[0], ribPeriod);
          ribbed += share;
        }
        let turned = 0;
        for (const { coverage, grain } of panels) {
          const share = coverage[i] as number;
          if (share === 0) continue;
          // The surface runs down the image, so turn the pixel into the panel's own frame.
          fabric +=
            share * surface(texture, x * grain[1] - y * grain[0], x * grain[0] + y * grain[1]);
          turned += share;
        }
        fabric += Math.max(0, 1 - ribbed - turned) * surface(texture, x, y);
        const light = LIGHT * (0.5 - y / HEIGHT);
        const edge = -EDGE * (1 - (form[i] as number));
        const fold = RIDGE * (ridge[i] as number) - CREASE * (crease[i] as number);
        offset += cover * (light + edge + fold + fabric);
      }
      out[i] = offset;
    }
  }
  return out;
}

// The garments. Each is drawn on the right half and mirrored, from the top of the centre line.

/** How a fit changes the regular cut, in grid units. */
const FITS: Record<
  Fit,
  { width: number; shoulder: number; drop: number; length: number; sleeve: number }
> = {
  regular: { width: 0, shoulder: 0, drop: 0, length: 0, sleeve: 0 },
  slim: { width: -2, shoulder: -1, drop: 0, length: 1, sleeve: -1 },
  relaxed: { width: 2, shoulder: 1.5, drop: 1.5, length: 2, sleeve: 1 },
  // Dropped shoulders: the seam moves down the arm and the sleeve hangs steeper.
  boxy: { width: 5, shoulder: 5, drop: 4, length: -7, sleeve: 2 },
  oversized: { width: 4.5, shoulder: 5, drop: 5, length: 2, sleeve: 2 },
};

/** Heavier fabrics get wider trims and thicker cords. */
const WEIGHT: Record<Texture, number> = {
  jersey: 1,
  slub: 1,
  pique: 1,
  waffle: 1.1,
  fleece: 1.2,
  terry: 0.8,
  "fine-knit": 1,
  brushed: 1.1,
  "rib-knit": 1.4,
  cable: 1.3,
  canvas: 1,
};

const BASE: Paint = (base) => base;
const INSIDE: Paint = (base) => mix(base, BLACK, 0.35);
const SEAM = tone(0.12);
const STITCH = tone(0.22);

/** The points of the body's right half. */
interface Body {
  /** Where the neckline meets the shoulder seam. */
  neck: Point;
  shoulder: Point;
  armpit: Point;
  /** The bottom of the side seam. */
  side: Point;
  /** The hem's height at the centre. */
  hem: number;
}

function design(look: Look, front: boolean): Design {
  switch (look.garment) {
    case "tee":
    case "v-neck-tee":
    case "pocket-tee":
    case "polo":
      return tee(look, front);
    case "tank":
      return tank(look, front);
    case "long-sleeve":
    case "henley":
    case "sweater":
    case "v-neck-sweater":
    case "turtleneck":
    case "cardigan":
    case "quarter-zip":
      return longSleeved(look, front);
    case "vest":
      return vest(look, front);
    case "hoodie":
    case "zip-hoodie":
    case "sweatshirt":
      return hoodie(look, front);
    // Accessories come in three colours, so they are only ever drawn from the front.
    case "beanie":
      return beanie(look);
    case "scarf":
      return scarf();
    case "socks":
      return socks(look);
    case "tote":
      return tote();
  }
}

function tee({ garment, fit, texture }: Look, front: boolean): Design {
  const f = FITS[fit];
  const hem = 104 + f.length;
  const body: Body = {
    neck: [58.5 + f.shoulder * 0.2, 16.5],
    shoulder: [73 + f.shoulder, 20 + f.drop * 0.5],
    armpit: [71.5 + f.width, 39.5 + f.drop],
    side: [71 + f.width, hem - 1],
    hem,
  };
  const { shoulder, armpit, side } = body;
  const outer = add(shoulder, scale(unit([16, 13 + f.drop]), 20.6 + f.sleeve * 1.5));
  const inner = add(outer, scale(unit([-6.5, 12]), 13.6 + f.sleeve));
  const polo = garment === "polo";
  const vNeck = garment === "v-neck-tee" && front;
  const neckDepth = front ? (polo ? 21 : 23) : 18.7;
  const [stitchFrom, stitchTo] = inset(outer, inner, 1.6, shoulder);

  const layers: Layer[] = [
    ...mirror({ shape: sleeveShape(body, [outer, inner]), paint: BASE, piece: true }),
    ...(vNeck
      ? vNeckFront(body, 29, 2.2)
      : [{ shape: torso(body, neckDepth), paint: BASE, piece: true }]),
    ...(polo || vNeck ? [] : neckDetails(body.neck, neckDepth, front, fit === "boxy" ? 3 : 2.2)),
    ...mirror({ shape: stroke(body.neck, shoulder, 0.25), paint: SEAM }),
    // A polo's sleeves end in rib cuffs. A tee's are turned up and held by a line of stitches.
    ...(polo
      ? mirror({
          shape: strip(outer, inner, 2.4, shoulder),
          paint: tone(0.08),
          ribs: along(shoulder, lerp(outer, inner, 0.5)),
        })
      : [
          ...mirror({ shape: strip(outer, inner, 2.4, shoulder), paint: tone(0.05) }),
          ...dashes(stitchFrom, stitchTo).flatMap((shape) => mirror({ shape, paint: STITCH })),
        ]),
    { shape: hemBand(body, 2.6), paint: tone(0.05) },
    ...dashes([101 - side[0], side[1] - 1.6], [side[0] - 1, side[1] - 1.6]).map((shape) => ({
      shape,
      paint: STITCH,
    })),
  ];

  const folds = mirrorFolds([
    // The body drapes from the armpit.
    { from: add(armpit, [-1, 2]), to: add(armpit, [-9, 13]), width: 1.2, depth: 0.7 },
    { from: add(armpit, [-1, 8]), to: add(armpit, [-6, 18]), width: 1, depth: 0.4 },
    { from: lerp(shoulder, armpit, 0.6), to: lerp(outer, inner, 0.55), width: 1, depth: 0.35 },
    { from: [58, hem - 9], to: [63, hem - 3], width: 1, depth: 0.35 },
  ]);
  if (polo) {
    layers.push(...poloCollar(front));
    // The collar points lie on the chest and cast a little shadow, so they read on dark colors.
    if (front) {
      folds.push(
        ...mirrorFolds([
          { from: [61.5, 18.5], to: [56.8, 29.8], width: 0.8, depth: 0.7 },
          { from: [56.4, 30], to: [51.6, 25.6], width: 0.8, depth: 0.6 },
        ]),
      );
    }
  }
  if (garment === "pocket-tee" && front) layers.push(...chestPocket());
  // Linen creases where it likes, which is part of its character.
  if (texture === "slub") folds.push(...LINEN_CREASES);
  return { layers, folds };
}

/** A polo's flat knit collar, and on the front its two-button placket. */
function poloCollar(front: boolean): Layer[] {
  if (!front) {
    return [
      {
        shape: symmetric([
          [50, 13.8],
          ...quad([50, 13.8], [57, 13.8], [60.5, 18]).slice(1),
          [50, 19.5],
        ]),
        paint: tone(0.03),
        piece: true,
      },
    ];
  }
  const wing: Point[] = [
    [50.6, 21.5],
    [57.2, 15.4],
    [61.2, 17.6],
    [56, 29.5],
    [51.2, 25],
  ];
  return [
    // The back of the collar, seen between the two wings.
    {
      shape: symmetric([
        [50, 14.2],
        ...quad([50, 14.2], [56, 14.2], [57.5, 15.6]).slice(1),
        [50, 22],
      ]),
      paint: tone(0.1),
      piece: true,
    },
    { shape: rect(48.2, 20.5, 51.8, 37), paint: tone(0.05) },
    { shape: rect(51.7, 20.5, 51.9, 37), paint: SEAM },
    ...dashes([48.6, 36.4], [51.4, 36.4], 0.6, 0.4).map((shape) => ({ shape, paint: STITCH })),
    ...[26, 32].flatMap((y) => button(50, y, 0.9)),
    ...mirror({ shape: wing, paint: tone(0.03), piece: true }),
  ];
}

/** A patch pocket on the left chest, which is the right of the picture. */
function chestPocket(): Layer[] {
  const [left, top, right, bottom] = [55, 33, 63.5, 43];
  const stitch = (a: Point, b: Point) =>
    dashes(a, b, 0.7, 0.5).map((shape) => ({ shape, paint: STITCH }));
  return [
    {
      shape: [
        [left, top],
        [right, top],
        [right, bottom - 1],
        [(left + right) / 2, bottom],
        [left, bottom - 1],
      ],
      paint: tone(0.03),
      piece: true,
    },
    ...stitch([left + 0.6, top + 1.5], [right - 0.6, top + 1.5]),
    ...stitch([left + 0.7, top + 2.2], [left + 0.7, bottom - 1.6]),
    ...stitch([right - 0.7, top + 2.2], [right - 0.7, bottom - 1.6]),
  ];
}

/** A sleeveless scoop-neck tank, with bound edges. */
function tank({ fit }: Look, front: boolean): Design {
  const f = FITS[fit];
  const hem = 104 + f.length;
  const body = { side: [69.5 + f.width, hem - 1] as Point, hem };
  // The strap runs from the neckline to the armhole.
  const strapIn: Point = [57, 15.5];
  const strapOut: Point = [63, 15.5];
  const armpit: Point = [69.5 + f.width, 44];
  const backNeck = quad([50, 22], [57, 22], strapIn);
  const neck = front ? quad([50, 30], [57, 30], strapIn) : backNeck;
  const armhole = quad(strapOut, [64, 38], armpit);
  return {
    layers: [
      { shape: symmetric([...neck, ...armhole, body.side, [50, hem]]), paint: BASE, piece: true },
      ...(front
        ? [{ shape: [...curve(backNeck), ...curve(neck).toReversed()], paint: INSIDE }]
        : []),
      { shape: band(curve(neck), 1.6, [50, 60]), paint: tone(0.06) },
      ...mirror({ shape: band(armhole, 1.6, [50, 60]), paint: tone(0.06) }),
      { shape: hemBand(body, 2.6), paint: tone(0.05) },
      ...dashes(
        [101 - body.side[0], body.side[1] - 1.6],
        [body.side[0] - 1, body.side[1] - 1.6],
      ).map((shape) => ({ shape, paint: STITCH })),
    ],
    folds: mirrorFolds([
      { from: [62, 52], to: [57, 64], width: 1.2, depth: 0.5 },
      { from: [58, hem - 9], to: [63, hem - 3], width: 1, depth: 0.35 },
    ]),
  };
}

const LINEN_CREASES: Fold[] = [
  { from: [55, 48], to: [63, 58], width: 0.8, depth: 0.5 },
  { from: [38, 62], to: [44, 70], width: 0.8, depth: 0.45 },
  { from: [57, 76], to: [66, 80], width: 0.7, depth: 0.4 },
  { from: [41, 88], to: [48, 86], width: 0.7, depth: 0.35 },
];

function longSleeved({ garment, fit, texture }: Look, front: boolean): Design {
  const f = FITS[fit];
  const knit = garment !== "long-sleeve" && garment !== "henley";
  const chunky = texture === "rib-knit";
  const hem = 103 + f.length;
  const body: Body = {
    neck: [58 + f.shoulder * 0.2, 16.5],
    shoulder: [72.5 + f.shoulder, 20.5 + f.drop * 0.5],
    armpit: [71.5 + f.width, 41 + f.drop],
    side: [71 + f.width, hem - 1],
    hem,
  };
  const sleeve = longSleeve(body, f, [13.5, 20.5], 49);
  const rib = (knit ? 5 : 3) * WEIGHT[texture];
  const cardigan = garment === "cardigan" && front;
  const vNeck = garment === "v-neck-sweater" && front;
  const turtleneck = garment === "turtleneck";
  const quarterZip = garment === "quarter-zip";
  // A high, thick crew neck on the chunky knit. A collar covers a shallow neckline.
  const crew = {
    depth: turtleneck || quarterZip ? 17.5 : front ? (chunky ? 20 : knit ? 21.5 : 23) : 18.5,
    band: chunky ? 4.5 : knit ? 3 : 2.2,
  };

  const layers: Layer[] = [
    ...mirror({ shape: sleeve.shape, paint: BASE, piece: true }),
    ...(cardigan
      ? cardiganFront(body)
      : vNeck
        ? vNeckFront(body, 37, 3)
        : [{ shape: torso(body, crew.depth), paint: BASE, piece: true }]),
    ...mirror({
      shape: strip(sleeve.cuffOuter, sleeve.cuffInner, rib, sleeve.elbow),
      paint: tone(0.08),
      ribs: along(sleeve.elbow, sleeve.cuffOuter),
    }),
    { shape: hemBand(body, rib * 1.2), paint: tone(0.08), ribs: [0, 1] },
  ];
  if (turtleneck) {
    layers.push(
      { shape: rect(42.5, 7.5, 57.5, 19), paint: tone(0.03), piece: true, ribs: [0, 1] },
      // The fold where the collar turns over.
      { shape: rect(42.5, 12, 57.5, 13.2), paint: tone(0.14), ribs: [0, 1] },
    );
    if (front) layers.push({ shape: ellipse(50, 7.6, 7.2, 1.2), paint: INSIDE });
  } else if (quarterZip) {
    layers.push(...zipCollar(front));
  } else if (!cardigan && !vNeck) {
    layers.push(...neckDetails(body.neck, crew.depth, front, crew.band));
  }
  if (garment === "henley" && front) {
    const top = crew.depth + crew.band - 0.5;
    layers.push(
      { shape: rect(48.3, top, 51.7, top + 15), paint: tone(0.05) },
      { shape: rect(51.6, top, 51.8, top + 15), paint: SEAM },
      ...[4, 8.5, 13].flatMap((y) => button(50, top + y, 0.85)),
    );
  }

  // Knits hold their shape, so they fold less than jersey.
  const softness = chunky ? 0.5 : knit ? 0.7 : 1;
  const ribTop = body.side[1] - rib * 1.2;
  return {
    layers,
    folds: mirrorFolds(
      [
        ...[0.55, 0.7, 0.84].map((t, n) => sleeve.stack(t, 0.35 + n * 0.08)),
        { from: add(body.armpit, [-1, 2]), to: add(body.armpit, [-7, 13]), width: 1.2, depth: 0.5 },
        ...gathers(body, ribTop, 0.3),
      ].map((fold) => ({ ...fold, depth: fold.depth * softness })),
    ),
  };
}

/** A V-neck cardigan from the front: the body opens down to the first button. */
function cardiganFront(body: Body): Layer[] {
  const bottom = 48;
  const buttons = [0, 1, 2, 3, 4].map((n) => bottom + 7 + ((body.hem - bottom - 15) * n) / 4);
  return [
    ...vNeckFront(body, bottom, 2.4),
    { shape: rect(48.6, bottom - 1, 51.4, body.hem), paint: tone(0.08), ribs: [0, 1] },
    { shape: rect(49.9, bottom, 50.1, body.hem), paint: tone(0.25) },
    ...buttons.flatMap((y) => button(50, y, 1.1)),
  ];
}

/** The body with a V-neck: the inside of the back neck shows through it, edged by a rib band. */
function vNeckFront(body: Body, bottom: number, width: number): Layer[] {
  const { neck } = body;
  return [
    {
      shape: symmetric([[50, bottom], neck, ...armhole(body), body.side, [50, body.hem]]),
      paint: BASE,
      piece: true,
    },
    { shape: [...curve(neckline(18.7, neck)), [50, bottom]], paint: INSIDE },
    ...mirror({
      shape: strip(neck, [50, bottom], width, [70, 40]),
      paint: tone(0.08),
      ribs: along(neck, [50, bottom]),
    }),
  ];
}

/** A stand collar with a short zip. From the back, just the collar. */
function zipCollar(front: boolean): Layer[] {
  const collar: Layer = {
    shape: [
      [42, 10.5],
      [58, 10.5],
      [59.5, 19.5],
      [40.5, 19.5],
    ],
    paint: tone(0.03),
    piece: true,
    ribs: [0, 1],
  };
  if (!front) return [collar];
  return [
    collar,
    { shape: ellipse(50, 10.6, 7.8, 1), paint: INSIDE },
    { shape: rect(49.2, 10.8, 50.8, 46), paint: tone(0.15) },
    ...dashes([50, 11.5], [50, 45.5], 1, 0.45, 0.45).map((shape) => ({ shape, paint: tone(0.4) })),
    { shape: rect(49.2, 11, 50.8, 15.5), paint: tone(0.45) },
    { shape: ellipse(50, 16.2, 0.8, 0.8), paint: tone(0.45) },
  ];
}

/** A sleeveless V-neck knit vest with ribbed armholes. */
function vest({ fit, texture }: Look, front: boolean): Design {
  const f = FITS[fit];
  const hem = 100 + f.length;
  const rib = 4 * WEIGHT[texture];
  const neck: Point = [57.5, 16.5];
  const side: Point = [70 + f.width, hem - 1];
  const armhole = quad([65.5 + f.shoulder * 0.5, 18.5], [64.5, 40], [70 + f.width, 47]);
  const bottom = 42;
  const top: Point[] = front ? [[50, bottom], neck] : neckline(18.5, neck);
  const layers: Layer[] = [
    { shape: symmetric([...top, ...armhole, side, [50, hem]]), paint: BASE, piece: true },
    ...(front
      ? [
          { shape: [...curve(neckline(18.7, neck)), [50, bottom] as Point], paint: INSIDE },
          ...mirror({
            shape: strip(neck, [50, bottom], 3, [70, 40]),
            paint: tone(0.08),
            ribs: along(neck, [50, bottom]),
          }),
        ]
      : neckDetails(neck, 18.5, false, 3)),
    ...mirror({
      shape: band(armhole, 3, [50, 60]),
      paint: tone(0.08),
      ribs: along(armhole[0] as Point, armhole.at(-1) as Point),
    }),
    { shape: hemBand({ side, hem }, rib * 1.2), paint: tone(0.08), ribs: [0, 1] },
  ];
  return {
    layers,
    folds: mirrorFolds([
      { from: [66, 52], to: [60, 62], width: 1.2, depth: 0.35 },
      ...gathers({ side }, side[1] - rib * 1.2, 0.25),
    ]),
  };
}

function hoodie({ garment, fit, texture }: Look, front: boolean): Design {
  const f = FITS[fit];
  const weight = WEIGHT[texture];
  const hooded = garment !== "sweatshirt";
  const hem = 105 + f.length;
  const body: Body = {
    // A hood needs a wider neck than a crew-neck sweatshirt.
    neck: hooded ? [60 + f.shoulder * 0.2, 20.5] : [58.5 + f.shoulder * 0.2, 18],
    shoulder: [74 + f.shoulder, 22 + f.drop * 0.5],
    armpit: [73 + f.width, 43 + f.drop],
    side: [72.5 + f.width, hem - 1],
    hem,
  };
  const sleeve = longSleeve(body, f, [13, 20], 48);
  const rib = 5 * weight;
  const ribTop = body.side[1] - rib * 1.2;
  // An oversized hoodie has a deeper hood.
  const deep = fit === "oversized" ? 1.12 : 1;
  const hood = (points: Point[]) =>
    points.map(([x, y]): Point => [50 + (x - 50) * deep, 26 + (y - 26) * deep]);

  const neckDepth = hooded ? (front ? 30 : 21) : front ? 24 : 20;
  const layers: Layer[] = [];
  if (front && hooded) {
    layers.push({
      shape: hood(
        symmetric([[50, 4.5], ...quad([50, 4.5], [66, 4.5], [65, 26]).slice(1), [50, 32]]),
      ),
      paint: tone(0.05),
      piece: true,
    });
  }
  layers.push(
    ...mirror({ shape: sleeve.shape, paint: BASE, piece: true }),
    { shape: torso(body, neckDepth), paint: BASE, piece: true },
    ...mirror({
      shape: strip(sleeve.cuffOuter, sleeve.cuffInner, rib, sleeve.elbow),
      paint: tone(0.08),
      ribs: along(sleeve.elbow, sleeve.cuffOuter),
    }),
    { shape: hemBand(body, rib * 1.2), paint: tone(0.08), ribs: [0, 1] },
    ...mirror({ shape: stroke(body.neck, body.shoulder, 0.25), paint: SEAM }),
  );

  if (!hooded) {
    const band = 3 * weight;
    layers.push(...neckDetails(body.neck, neckDepth, front, band));
    // The small rib triangle under a sweatshirt's neck.
    if (front) {
      const y = neckDepth + band - 0.3;
      layers.push({
        shape: [
          [47.5, y],
          [52.5, y],
          [50, y + 5],
        ],
        paint: tone(0.08),
        ribs: [0, 1],
      });
    }
  } else if (front) {
    layers.push({
      shape: hood(
        symmetric([[50, 10], ...quad([50, 10], [58.5, 10], [58.5, 22]).slice(1), [50, 30]]),
      ),
      paint: INSIDE,
    });
    if (garment === "zip-hoodie") layers.push(...zipFront(body, ribTop));
    else layers.push(...kangarooPocket(body, ribTop));
    // Heavy oversized hoodies go without drawcords.
    if (fit !== "oversized") {
      const cord = 0.9 * weight;
      layers.push(
        ...mirror({ shape: rect(52.5, 29, 52.5 + cord, 47), paint: tone(0.25) }),
        ...mirror({ shape: rect(52.5 - 0.2, 45, 52.7 + cord, 48.5), paint: tone(0.4) }),
      );
    }
  } else {
    // The hood lies flat over the back.
    layers.push(
      {
        shape: hood(
          symmetric([
            [50, 15],
            ...quad([50, 15], [64, 15], [62, 24]).slice(1),
            ...quad([62, 24], [60, 44], [50, 47]).slice(1),
          ]),
        ),
        paint: tone(0.05),
        piece: true,
      },
      { shape: hood(rect(49.75, 16, 50.25, 46.5)), paint: tone(0.18) },
      { shape: rect(48.6, 22.5, 51.4, 24.5), paint: tone(0.4) },
    );
  }

  // Fleece bunches up at the cuffs, and the hem rib gathers the body above it. On the back, the
  // hood's edge casts a shadow, so it reads on dark colors too.
  const [hoodSide, hoodBottom, hoodTip] = hood([
    [62.5, 26],
    [58.5, 42],
    [50.5, 47.8],
  ]) as [Point, Point, Point];
  return {
    layers,
    folds: mirrorFolds([
      ...[0.5, 0.66, 0.8].map((t, n) => sleeve.stack(t, 0.45 + n * 0.08)),
      { from: add(body.armpit, [-1, 2]), to: add(body.armpit, [-8, 15]), width: 1.4, depth: 0.55 },
      ...gathers(body, ribTop, 0.7),
      ...(front || !hooded
        ? []
        : [
            { from: hoodSide, to: hoodBottom, width: 1, depth: 0.6 },
            { from: hoodBottom, to: hoodTip, width: 1, depth: 0.6 },
          ]),
    ]),
  };
}

// Accessories.

/** A rib beanie with a turned-up cuff. The slim fit is a short fisherman beanie. */
function beanie({ fit }: Look): Design {
  const [top, cuffTop, bottom] = fit === "slim" ? [36, 66, 86] : [16, 70, 96];
  const half = 30;
  return {
    layers: [
      {
        shape: symmetric([
          [50, top],
          ...quad([50, top], [50 + half, top], [50 + half, top + 26]).slice(1),
          [50 + half, cuffTop + 2],
          [50, cuffTop + 2],
        ]),
        paint: BASE,
        piece: true,
      },
      {
        shape: [
          [50 - half - 1, cuffTop],
          [50 + half + 1, cuffTop],
          [50 + half + 1.5, bottom - 1],
          [50, bottom],
          [50 - half - 1.5, bottom - 1],
        ],
        paint: tone(0.05),
        piece: true,
        ribs: [0, 1],
      },
    ],
    folds: [
      { from: [27, cuffTop + 1], to: [73, cuffTop + 1], width: 1.4, depth: 0.6 },
      ...mirrorFolds([{ from: [61, top + 14], to: [63, cuffTop - 3], width: 1.4, depth: 0.35 }]),
    ],
  };
}

/** A scarf folded in half and hung, the front panel a little lower, with fringes. */
function scarf(): Design {
  const back: Point[] = [
    [30, 14],
    [52, 10],
    [54, 98],
    [32, 101],
  ];
  const front: Point[] = [
    [46, 18],
    [68, 16],
    [66, 108],
    [44, 106],
  ];
  const fringe = ([, , right, left]: Point[]) =>
    dashes(left as Point, right as Point, 0.5, 0.8, 0.5).map((_, i, all) => {
      const at = lerp(left as Point, right as Point, (i + 0.5) / all.length);
      return { shape: stroke(at, add(at, [0.3, 6]), 0.5), paint: tone(0.03) };
    });
  return {
    layers: [
      { shape: back, paint: tone(0.06), piece: true },
      ...fringe(back),
      { shape: front, paint: BASE, piece: true },
      ...fringe(front),
    ],
    folds: [
      { from: [41, 20], to: [43, 94], width: 1.4, depth: 0.45 },
      { from: [57, 24], to: [55, 102], width: 1.4, depth: 0.5 },
      { from: [47, 22], to: [66, 20], width: 1.2, depth: 0.4 },
    ],
  };
}

/** A pair of socks laid flat side by side, heel and toe reinforced. Relaxed is a taller boot sock. */
function socks({ fit }: Look): Design {
  const boot = fit === "relaxed";
  // A real sock laid flat: the foot is about as tall as the leg is wide and 2.6 times as long, and
  // the leg stands about 3.2 widths tall on a crew sock, 3.9 on a boot sock.
  const width = boot ? 16 : 15;
  const [back, front] = [54, 54 + width];
  const [top, sole] = [boot ? 38 : 52, 100];
  const instep = sole - width * 0.93;
  const toe = back - 2 + width * 2.6;
  const toeStart: Point = [toe - 9, instep + 1.5];
  // The heel pocket bulges out behind the leg before it rounds into the sole.
  const heelCorner = quad([back + 10, sole], [back - 3, sole], [back - 3, sole - 8]);
  const heelBack = quad([back - 3, sole - 8], [back - 3, sole - 13], [back - 1.5, sole - 16]);
  const toeCap = [
    ...quad(toeStart, [toe, instep + 2], [toe, sole - 5]),
    ...quad([toe, sole - 5], [toe, sole], [toe - 7, sole]).slice(1),
  ];
  const sock: Point[] = [
    [back, top],
    [front, top],
    ...quad([front, instep - 7], [front, instep], [front + 7, instep + 0.3]),
    ...toeCap,
    ...heelCorner,
    ...heelBack.slice(1),
    ...quad([back - 1.5, sole - 16], [back, sole - 19], [back, sole - 23]).slice(1),
  ];
  const heelPatch: Point[] = [
    ...heelCorner,
    ...heelBack.slice(1),
    ...quad([back - 1.5, sole - 16], [back + 7, sole - 11], [back + 10, sole]).slice(1, -1),
  ];
  const toePatch: Point[] = [
    ...toeCap,
    ...quad([toe - 7, sole], [toe - 11, sole - 7], toeStart).slice(1, -1),
  ];
  // Below the ankle the knit turns and runs along the foot. The panel reaches past the outline,
  // where it changes nothing, so only its edge across the ankle matters.
  const ankle: [Point, Point] = [
    [back - 4, sole - 12],
    [front + 3, instep - 7],
  ];
  const foot: Point[] = [
    ...ankle,
    [toe + 2, instep - 7],
    [toe + 2, sole + 2],
    [back - 4, sole + 2],
  ];
  return {
    layers: [
      ...mirror({ shape: sock, paint: BASE, piece: true }),
      ...mirror({ shape: foot, grain: [1, 0] }),
      ...mirror({ shape: heelPatch, paint: tone(0.07) }),
      ...mirror({ shape: toePatch, paint: tone(0.07) }),
      ...mirror({
        shape: rect(back, top, front, top + (boot ? 9 : 6)),
        paint: tone(0.05),
        ribs: [0, 1],
      }),
    ],
    folds: mirrorFolds([
      // The crease where the knit turns hides the change of grain.
      { from: lerp(...ankle, 0.35), to: lerp(...ankle, 0.85), width: 1.2, depth: 0.45 },
      { from: [front + 3, sole - 6], to: [toe - 13, sole - 6.5], width: 1, depth: 0.3 },
    ]),
  };
}

/** A canvas tote, its handles sewn onto the front with a box of stitches. */
function tote(): Design {
  const handle = (lift: number): Point[] => [
    ...quad([33, 45], [50, -6 - lift], [67, 45]),
    ...quad([63, 45], [50, 2 - lift], [37, 45]),
  ];
  const strap = (x: number): Layer[] => {
    const [left, right, top, bottom] = [x - 2.5, x + 2.5, 44, 60];
    const stitch = (a: Point, b: Point) =>
      dashes(a, b, 0.7, 0.5).map((shape) => ({ shape, paint: STITCH }));
    return [
      { shape: rect(left, top, right, bottom), paint: tone(0.02), piece: true },
      ...stitch([left + 0.7, 52], [right - 0.7, 52]),
      ...stitch([left + 0.7, 58], [right - 0.7, 58]),
      ...stitch([left + 0.7, 52], [right - 0.7, 58]),
      ...stitch([left + 0.7, 58], [right - 0.7, 52]),
    ];
  };
  return {
    layers: [
      // The back handle, seen behind the bag.
      { shape: handle(3), paint: tone(0.12), piece: true },
      {
        shape: [
          [22, 44],
          [78, 44],
          [80, 108],
          [20, 108],
        ],
        paint: BASE,
        piece: true,
      },
      { shape: rect(22, 44, 78, 48.5), paint: tone(0.04) },
      ...dashes([23, 47.6], [77, 47.6]).map((shape) => ({ shape, paint: STITCH })),
      { shape: handle(0), paint: tone(0.02), piece: true },
      ...strap(35),
      ...strap(65),
    ],
    folds: [
      { from: [36, 64], to: [33, 104], width: 1.4, depth: 0.4 },
      { from: [62, 66], to: [66, 104], width: 1.4, depth: 0.35 },
      { from: [24, 101], to: [76, 101], width: 1.2, depth: 0.3 },
    ],
  };
}

function kangarooPocket({ side }: Body, ribTop: number): Layer[] {
  const half = (side[0] - 50) * 0.75;
  const [top, bottom] = [ribTop - 26, ribTop - 5];
  const opening: [Point, Point] = [
    [50 + half - 1.5, top],
    [50 + half + 2, bottom],
  ];
  const [stitchFrom, stitchTo] = inset(...opening, 1.4, [50, (top + bottom) / 2]);
  return [
    { shape: symmetric([[50, top], opening[0], opening[1], [50, bottom]]), paint: tone(0.07) },
    ...mirror({ shape: strip(...opening, 1.2, [50, top + 8]), paint: tone(0.14) }),
    ...dashes(stitchFrom, stitchTo).flatMap((shape) => mirror({ shape, paint: STITCH })),
    ...dashes([101 - opening[0][0], top + 1], [opening[0][0] - 1, top + 1]).map((shape) => ({
      shape,
      paint: STITCH,
    })),
  ];
}

/** A full-length zip with a split pocket on each side. */
function zipFront({ side, hem }: Body, ribTop: number): Layer[] {
  const outer = 50 + (side[0] - 50) * 0.83;
  const [top, bottom] = [ribTop - 23, ribTop - 5];
  return [
    ...mirror({
      shape: [
        [52.5, top],
        [outer, top],
        [outer + 1.5, bottom],
        [52.5, bottom],
      ],
      paint: tone(0.07),
    }),
    ...mirror({
      shape: strip([outer, top], [outer + 1.5, bottom], 1.2, [60, top + 8]),
      paint: tone(0.14),
    }),
    { shape: rect(48.9, 30, 51.1, hem), paint: tone(0.15) },
    ...dashes([50, 30.5], [50, hem - 0.5], 1, 0.45, 0.45).map((shape) => ({
      shape,
      paint: tone(0.4),
    })),
    { shape: rect(49.1, 30, 50.9, 34.5), paint: tone(0.45) },
    { shape: ellipse(50, 35.3, 0.9, 0.9), paint: tone(0.45) },
  ];
}

function torso(body: Body, neckDepth: number): Point[] {
  return symmetric([
    ...neckline(neckDepth, body.neck),
    ...armhole(body),
    body.side,
    [50, body.hem],
  ]);
}

function armhole({ shoulder, armpit }: Body): Point[] {
  return quad(shoulder, [shoulder[0] - 1.5, (shoulder[1] + armpit[1]) / 2], armpit);
}

function button(x: number, y: number, radius: number): Layer[] {
  return [
    { shape: ellipse(x, y, radius, radius), paint: tone(0.45) },
    { shape: ellipse(x, y, radius / 2, radius / 2), paint: tone(0.3) },
  ];
}

/** A sleeve whose top tucks under the body, which is drawn over it and shows the armhole seam. */
function sleeveShape({ shoulder, armpit }: Body, edge: Point[]): Point[] {
  return [
    [shoulder[0] - 4, shoulder[1] + 2],
    shoulder,
    ...edge,
    armpit,
    [armpit[0] - 4, armpit[1] - 3],
  ];
}

/** A long sleeve that runs out to the elbow and then hangs down to the cuff. */
function longSleeve(body: Body, f: (typeof FITS)[Fit], reach: Point, length: number) {
  const elbow = add(body.shoulder, [reach[0] - f.drop * 0.5, reach[1]]);
  const cuffOuter = add(elbow, [4.5 + f.sleeve * 0.5, length + f.sleeve]);
  const cuffInner = add(cuffOuter, [-(8 + f.sleeve * 0.5), 2.2]);
  const innerElbow = add(cuffInner, [-7 - f.sleeve * 0.3, -(length - 4)]);
  return {
    shape: sleeveShape(body, [elbow, cuffOuter, cuffInner, innerElbow]),
    elbow,
    cuffOuter,
    cuffInner,
    /** A fold across the sleeve, `t` of the way down. */
    stack: (t: number, depth: number): Fold => ({
      from: lerp(innerElbow, cuffInner, t),
      to: lerp(elbow, cuffOuter, t - 0.05),
      width: 1.1,
      depth,
    }),
  };
}

/** Short creases above a rib hem, where it gathers the body. */
function gathers({ side }: Pick<Body, "side">, ribTop: number, depth: number): Fold[] {
  return [0.2, 0.5, 0.8].map((t) => {
    const x = 50 + (side[0] - 50) * t;
    return { from: [x, ribTop - 7], to: [x + 0.8, ribTop - 0.3], width: 1.1, depth };
  });
}

/** The neck band, plus the inside of the back neck that shows on the front, or the back label. */
function neckDetails(edge: Point, depth: number, front: boolean, band: number): Layer[] {
  const line = curve(neckline(depth, edge));
  const layers: Layer[] = [
    {
      shape: [...line, ...line.toReversed().map(([x, y]): Point => [x, y + band])],
      paint: tone(0.08),
      ribs: [0, 1],
    },
  ];
  if (front) {
    const backNeck = curve(neckline(18.7, edge));
    layers.unshift({ shape: [...line, ...backNeck.toReversed()], paint: INSIDE });
  } else {
    layers.push({
      shape: rect(48.6, depth + band * 0.4, 51.4, depth + band * 0.4 + 2),
      paint: tone(0.4),
    });
  }
  return layers;
}

function hemBand({ side, hem }: Pick<Body, "side" | "hem">, height: number): Point[] {
  return [
    [100 - side[0], side[1] - height],
    [side[0], side[1] - height],
    side,
    [50, hem],
    [100 - side[0], side[1]],
  ];
}

/** Right half of a neckline, from the centre to the shoulder seam. */
function neckline(depth: number, [edgeX, edgeY]: Point): Point[] {
  return quad([50, depth], [edgeX - 3, depth], [edgeX, edgeY]);
}

/** Full curve from a right half: left edge, centre, right edge. */
function curve(rightHalf: Point[]): Point[] {
  return [...rightHalf.toReversed().map(flipX), ...rightHalf.slice(1)];
}

/** Builds a symmetric shape from its right half, listed from top centre to bottom centre. */
function symmetric(rightHalf: Point[]): Point[] {
  return [...rightHalf, ...rightHalf.slice(1, -1).toReversed().map(flipX)];
}

/** A layer drawn on the right, and its mirror image on the left. */
function mirror(layer: Layer): Layer[] {
  const { shape, ribs: direction, grain } = layer;
  return [
    layer,
    {
      ...layer,
      shape: shape.map(flipX),
      ribs: direction && [-direction[0], direction[1]],
      grain: grain && [-grain[0], grain[1]],
    },
  ];
}

function mirrorFolds(folds: Fold[]): Fold[] {
  return [
    ...folds,
    ...folds.map((fold) => ({ ...fold, from: flipX(fold.from), to: flipX(fold.to) })),
  ];
}

/** A strip of the given width along the edge a→b, on the side that faces `inside`. */
function strip(a: Point, b: Point, width: number, inside: Point): Point[] {
  const [from, to] = inset(a, b, width, inside);
  return [a, b, to, from];
}

/** A band of the given width along a curve, on the side that faces `inside`. */
function band(points: Point[], width: number, inside: Point): Point[] {
  const shifted = points.map((point, i) => {
    const [nx, ny] = normal(
      points[Math.max(0, i - 1)] as Point,
      points[Math.min(points.length - 1, i + 1)] as Point,
    );
    const sign = (inside[0] - point[0]) * nx + (inside[1] - point[1]) * ny < 0 ? -1 : 1;
    return add(point, [nx * width * sign, ny * width * sign]);
  });
  return [...points, ...shifted.toReversed()];
}

/** The line a→b moved `distance` towards `inside`. */
function inset(a: Point, b: Point, distance: number, inside: Point): [Point, Point] {
  let [nx, ny] = normal(a, b);
  const toInside = (inside[0] - (a[0] + b[0]) / 2) * nx + (inside[1] - (a[1] + b[1]) / 2) * ny;
  if (toInside < 0) [nx, ny] = [-nx, -ny];
  const offset: Point = [nx * distance, ny * distance];
  return [add(a, offset), add(b, offset)];
}

/** A line of the given width as a polygon. */
function stroke(a: Point, b: Point, width: number): Point[] {
  const [nx, ny] = normal(a, b);
  const [hx, hy] = [(nx * width) / 2, (ny * width) / 2];
  return [
    [a[0] + hx, a[1] + hy],
    [b[0] + hx, b[1] + hy],
    [b[0] - hx, b[1] - hy],
    [a[0] - hx, a[1] - hy],
  ];
}

/** A dashed line, like a row of stitches. */
function dashes(a: Point, b: Point, dash = 1, gap = 0.7, width = 0.22): Point[][] {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const count = Math.floor((length + gap) / (dash + gap));
  return Array.from({ length: count }, (_, i) =>
    stroke(
      lerp(a, b, (i * (dash + gap)) / length),
      lerp(a, b, (i * (dash + gap) + dash) / length),
      width,
    ),
  );
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

function add(a: Point, b: Point): Point {
  return [a[0] + b[0], a[1] + b[1]];
}

function scale([x, y]: Point, factor: number): Point {
  return [x * factor, y * factor];
}

function lerp(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function unit([x, y]: Point): Point {
  const length = Math.hypot(x, y);
  return [x / length, y / length];
}

/** The unit direction from a to b. */
function along(a: Point, b: Point): Point {
  return unit([b[0] - a[0], b[1] - a[1]]);
}

/** A unit vector at right angles to a→b. */
function normal(a: Point, b: Point): Point {
  const [x, y] = along(a, b);
  return [-y, x];
}

function flipX([x, y]: Point): Point {
  return [100 - x, y];
}

function tone(amount: number): Paint {
  return (base) => shade(base, amount);
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
