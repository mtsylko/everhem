import { describe, expect, it } from "vitest";
import { CostLimiter, parseThrottleStatus } from "../src/shopify/throttle.ts";

function fakeClock() {
  let now = 0;
  const sleeps: number[] = [];
  return {
    now: () => now,
    sleep: async (ms: number) => {
      sleeps.push(ms);
      now += ms;
    },
    advance: (ms: number) => {
      now += ms;
    },
    sleeps,
  };
}

const status = { maximumAvailable: 1000, currentlyAvailable: 100, restoreRate: 50 };

describe("CostLimiter", () => {
  it("does not wait before the first response tells it the bucket state", () => {
    expect(new CostLimiter().delayFor(500)).toBe(0);
  });

  it("waits until the bucket refills enough for the cost", () => {
    const clock = fakeClock();
    const limiter = new CostLimiter(clock);
    limiter.settle(0, status);

    // 100 available, 300 needed, 50 points per second → 4 seconds.
    expect(limiter.delayFor(300)).toBe(4000);
    clock.advance(1000);
    expect(limiter.delayFor(300)).toBe(3000);
    expect(limiter.delayFor(100)).toBe(0);
  });

  it("never predicts more than the bucket size", () => {
    const clock = fakeClock();
    const limiter = new CostLimiter(clock);
    limiter.settle(0, status);
    clock.advance(60_000);

    expect(limiter.available()).toBe(1000);
  });

  it("counts requests in flight against the bucket", () => {
    const limiter = new CostLimiter(fakeClock());
    limiter.settle(0, { ...status, currentlyAvailable: 400 });

    return limiter.acquire(300).then(() => {
      expect(limiter.available()).toBe(100);
      expect(limiter.delayFor(200)).toBe(2000);
      limiter.settle(300);
      expect(limiter.available()).toBe(400);
    });
  });

  it("sleeps for the predicted delay before reserving", async () => {
    const clock = fakeClock();
    const limiter = new CostLimiter(clock);
    limiter.settle(0, { ...status, currentlyAvailable: 0 });

    const waited = await limiter.acquire(150);

    expect(clock.sleeps).toEqual([3000]);
    expect(waited).toBe(3000);
  });

  it("caps the wait for a cost above the bucket size at a full bucket", () => {
    const limiter = new CostLimiter(fakeClock());
    limiter.settle(0, { maximumAvailable: 100, currentlyAvailable: 0, restoreRate: 10 });

    expect(limiter.delayFor(5000)).toBe(10_000);
  });
});

describe("parseThrottleStatus", () => {
  it("reads a complete status", () => {
    expect(parseThrottleStatus(status)).toEqual(status);
  });

  it("ignores missing or partial data", () => {
    expect(parseThrottleStatus(undefined)).toBeUndefined();
    expect(parseThrottleStatus({ maximumAvailable: 1000 })).toBeUndefined();
  });
});
