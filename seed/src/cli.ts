import { parseArgs } from "node:util";
import { loadConfig } from "./config.ts";
import { createLogger, loggerOptionsFromEnv } from "./logger.ts";
import { summarize, type Outcome, type RunContext } from "./outcome.ts";
import { seed } from "./seed.ts";
import { API_VERSION } from "./shopify/api-version.ts";
import { getAccessToken } from "./shopify/auth.ts";
import { createShopifyClient } from "./shopify/client.ts";
import { teardown } from "./teardown.ts";

const USAGE = `Usage:
  npm run seed [-- --dry-run] [--concurrency 3]
  npm run teardown [-- --yes]

seed       Creates or updates the Everhem catalog. Safe to run again.
teardown   Deletes everything seed created. Without --yes it only lists what it would delete.`;

const logger = createLogger(loggerOptionsFromEnv(process.env, Boolean(process.stdout.isTTY)));

try {
  await main();
} catch (error) {
  logger.error("run.failed", { error: error instanceof Error ? error.message : String(error) });
  process.exitCode = 1;
}

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      "dry-run": { type: "boolean", default: false },
      yes: { type: "boolean", default: false },
      concurrency: { type: "string", default: "3" },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  const command = positionals[0];
  if (values.help || (command !== "seed" && command !== "teardown")) {
    console.log(USAGE);
    if (!values.help) process.exitCode = 1;
    return;
  }

  const concurrency = Number(values.concurrency);
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 10) {
    throw new Error("--concurrency must be a whole number from 1 to 10.");
  }

  // Teardown is destructive, so it only deletes when asked explicitly.
  const dryRun = command === "seed" ? values["dry-run"] : !values.yes;

  const config = loadConfig();
  const accessToken = await getAccessToken(config.storeDomain, config.auth);
  const ctx: RunContext = {
    client: createShopifyClient({ storeDomain: config.storeDomain, accessToken, logger }),
    logger,
    dryRun,
  };

  logger.info("run.start", { command, store: config.storeDomain, apiVersion: API_VERSION, dryRun });
  const startedAt = Date.now();
  const outcomes: Outcome[] =
    command === "seed"
      ? await seed(ctx, { concurrency, storefrontUrl: config.storefrontUrl })
      : await teardown(ctx);

  logger.info("run.summary", { durationMs: Date.now() - startedAt, ...summarize(outcomes) });
  if (command === "teardown" && dryRun) {
    logger.info("run.hint", { message: "Nothing was deleted. Run again with --yes to delete." });
  }
}
