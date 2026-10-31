export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogFormat = "json" | "pretty";
export type LogFields = Record<string, unknown>;

export interface Logger {
  debug(event: string, fields?: LogFields): void;
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  error(event: string, fields?: LogFields): void;
}

export interface LoggerOptions {
  level?: LogLevel;
  format?: LogFormat;
  write?: (line: string) => void;
  now?: () => Date;
}

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export function createLogger({
  level = "info",
  format = "json",
  write = (line) => process.stdout.write(`${line}\n`),
  now = () => new Date(),
}: LoggerOptions = {}): Logger {
  const at =
    (lvl: LogLevel) =>
    (event: string, fields: LogFields = {}) => {
      if (LEVELS[lvl] < LEVELS[level]) return;
      const time = now();
      write(
        format === "json"
          ? JSON.stringify({ time: time.toISOString(), level: lvl, event, ...fields })
          : formatPretty(time, lvl, event, fields),
      );
    };

  return { debug: at("debug"), info: at("info"), warn: at("warn"), error: at("error") };
}

export function formatPretty(
  time: Date,
  level: LogLevel,
  event: string,
  fields: LogFields,
): string {
  const pairs = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${isBareWord(value) ? value : JSON.stringify(value)}`);
  return [time.toISOString().slice(11, 19), level.toUpperCase().padEnd(5), event, ...pairs].join(
    " ",
  );
}

function isBareWord(value: unknown): value is string {
  return typeof value === "string" && value !== "" && !/[\s"]/.test(value);
}

/** JSON for pipes and CI, readable lines in a terminal. LOG_FORMAT and LOG_LEVEL override. */
export function loggerOptionsFromEnv(
  env: Readonly<Record<string, string | undefined>>,
  isTTY: boolean,
): LoggerOptions {
  const format = env.LOG_FORMAT ?? (isTTY ? "pretty" : "json");
  const level = env.LOG_LEVEL ?? "info";
  if (format !== "json" && format !== "pretty") throw new Error(`Unknown LOG_FORMAT "${format}"`);
  if (!(level in LEVELS)) throw new Error(`Unknown LOG_LEVEL "${level}"`);
  return { format, level: level as LogLevel };
}
