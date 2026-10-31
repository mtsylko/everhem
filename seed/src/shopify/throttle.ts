export interface ThrottleStatus {
  maximumAvailable: number;
  currentlyAvailable: number;
  restoreRate: number;
}

export interface CostLimiterOptions {
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * Client-side model of the Admin API leaky bucket.
 * Each response carries the real bucket state. Between responses we predict
 * how much the bucket has refilled, and a request waits until its cost fits.
 */
export class CostLimiter {
  #status: ThrottleStatus | undefined;
  #updatedAt = 0;
  #reserved = 0;
  readonly #now: () => number;
  readonly #sleep: (ms: number) => Promise<void>;

  constructor({ now = Date.now, sleep = defaultSleep }: CostLimiterOptions = {}) {
    this.#now = now;
    this.#sleep = sleep;
  }

  /** Points we expect to have right now, minus requests still in flight. */
  available(): number {
    if (!this.#status) return Number.POSITIVE_INFINITY;
    const { maximumAvailable, currentlyAvailable, restoreRate } = this.#status;
    const elapsedSeconds = (this.#now() - this.#updatedAt) / 1000;
    const refilled = Math.min(maximumAvailable, currentlyAvailable + elapsedSeconds * restoreRate);
    return refilled - this.#reserved;
  }

  /** Milliseconds until a request of this cost fits in the bucket. */
  delayFor(cost: number): number {
    if (!this.#status) return 0;
    const { maximumAvailable, restoreRate } = this.#status;
    // A cost above the bucket size never fits, so the most we wait for is a full bucket.
    const missing = Math.min(cost, maximumAvailable) - this.available();
    return missing > 0 ? Math.ceil((missing / Math.max(restoreRate, 1)) * 1000) : 0;
  }

  /** Waits until the cost fits, then reserves it. Returns how long it waited, in ms. */
  async acquire(cost: number): Promise<number> {
    let waited = 0;
    for (let delay = this.delayFor(cost); delay > 0; delay = this.delayFor(cost)) {
      await this.#sleep(delay);
      waited += delay;
    }
    this.#reserved += cost;
    return waited;
  }

  /** Releases the reservation. A fresh status from Shopify already includes the request's cost. */
  settle(cost: number, status?: ThrottleStatus): void {
    this.#reserved = Math.max(0, this.#reserved - cost);
    if (status) {
      this.#status = status;
      this.#updatedAt = this.#now();
    }
  }
}

export function parseThrottleStatus(raw: unknown): ThrottleStatus | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const { maximumAvailable, currentlyAvailable, restoreRate } = raw as Record<string, unknown>;
  if (
    typeof maximumAvailable !== "number" ||
    typeof currentlyAvailable !== "number" ||
    typeof restoreRate !== "number"
  ) {
    return undefined;
  }
  return { maximumAvailable, currentlyAvailable, restoreRate };
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
