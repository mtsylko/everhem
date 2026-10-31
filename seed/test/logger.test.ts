import { describe, expect, it } from "vitest";
import { createLogger, formatPretty, loggerOptionsFromEnv } from "../src/logger.ts";

const now = () => new Date("2026-10-30T12:34:56.000Z");

describe("createLogger", () => {
  it("writes one JSON object per line", () => {
    const lines: string[] = [];
    const logger = createLogger({ write: (line) => lines.push(line), now });

    logger.info("product.created", { handle: "essential-crew-tee" });

    expect(JSON.parse(lines[0] as string)).toEqual({
      time: "2026-10-30T12:34:56.000Z",
      level: "info",
      event: "product.created",
      handle: "essential-crew-tee",
    });
  });

  it("drops events below the level", () => {
    const lines: string[] = [];
    const logger = createLogger({ level: "warn", write: (line) => lines.push(line), now });

    logger.info("hidden");
    logger.warn("shown");

    expect(lines).toHaveLength(1);
  });
});

describe("formatPretty", () => {
  it("prints time, level, event and fields", () => {
    expect(
      formatPretty(now(), "info", "product.skipped", { handle: "a", images: 3, x: undefined }),
    ).toBe("12:34:56 INFO  product.skipped handle=a images=3");
  });

  it("quotes strings that would not read as one value", () => {
    expect(
      formatPretty(now(), "info", "preflight.ok", { location: "Shop location", note: "" }),
    ).toBe('12:34:56 INFO  preflight.ok location="Shop location" note=""');
  });
});

describe("loggerOptionsFromEnv", () => {
  it("defaults to pretty in a terminal and JSON elsewhere", () => {
    expect(loggerOptionsFromEnv({}, true).format).toBe("pretty");
    expect(loggerOptionsFromEnv({}, false).format).toBe("json");
    expect(loggerOptionsFromEnv({ LOG_FORMAT: "json" }, true).format).toBe("json");
  });

  it("rejects unknown values", () => {
    expect(() => loggerOptionsFromEnv({ LOG_LEVEL: "loud" }, true)).toThrow();
  });
});
