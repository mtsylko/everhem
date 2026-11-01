import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { themeColours } from "../src/lib/theme";

describe("themeColours", () => {
  it("reads colour tokens from the @theme block only", () => {
    const css = `
      :root { --color-ink: red; }
      @theme {
        /* Ink. */
        --color-ink: #0a0a0a;
        --color-accent-strong: #1c5868;
        --font-sans: "Roundo";
      }
    `;
    expect(themeColours(css)).toEqual({ ink: "#0a0a0a", "accent-strong": "#1c5868" });
  });

  it("finds the colours shared images use in the real stylesheet", () => {
    const colours = themeColours(readFileSync("src/app/globals.css", "utf8"));
    for (const name of ["ground", "ink", "muted", "backdrop"]) {
      expect(colours[name]).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
