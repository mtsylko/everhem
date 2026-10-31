import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { encodePng, crc32 } from "../scripts/png.ts";
import { addSpan, Canvas, crossingsAt } from "../scripts/raster.ts";

describe("encodePng", () => {
  it("writes a valid PNG that decodes back to the same pixels", () => {
    const rgb = Uint8Array.from([255, 0, 0, 0, 255, 0, 0, 0, 255, 10, 20, 30]);
    const png = encodePng(2, 2, rgb);

    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(png.readUInt32BE(16)).toBe(2);
    expect(png.readUInt32BE(20)).toBe(2);

    const idatLength = png.readUInt32BE(33);
    const raw = inflateSync(png.subarray(41, 41 + idatLength));
    // Each row has a filter byte in front.
    expect([...raw]).toEqual([0, 255, 0, 0, 0, 255, 0, 0, 0, 0, 255, 10, 20, 30]);
  });

  it("uses the standard CRC-32", () => {
    expect(crc32(Buffer.from("IEND"))).toBe(0xae426082);
  });
});

describe("raster", () => {
  it("finds where a square crosses a line", () => {
    const square = [
      [1, 1],
      [3, 1],
      [3, 3],
      [1, 3],
    ] as const;
    expect(crossingsAt(square, 2)).toEqual([1, 3]);
    expect(crossingsAt(square, 5)).toEqual([]);
  });

  it("gives partial coverage to pixels at span edges", () => {
    const coverage = new Float32Array(4);
    addSpan(coverage, 0.5, 2.25, 1);
    expect([...coverage]).toEqual([0.5, 1, 0.25, 0]);
  });

  it("fills covered pixels and blends edge pixels", () => {
    const canvas = new Canvas(2, 1, [0, 0, 0]);
    canvas.fill(
      [
        [0, 0],
        [1.5, 0],
        [1.5, 1],
        [0, 1],
      ],
      [200, 100, 50],
    );
    expect([...canvas.toRgb()]).toEqual([200, 100, 50, 100, 50, 25]);
  });
});
