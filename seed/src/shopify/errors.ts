export class ShopifyApiError extends Error {}

export interface UserErrorLike {
  field?: readonly string[] | null;
  message: string;
  code?: string | null;
}

export class UserErrorsError extends Error {
  readonly errors: readonly UserErrorLike[];

  constructor(context: string, errors: readonly UserErrorLike[]) {
    super(`${context}: ${errors.map(formatUserError).join("; ")}`);
    this.errors = errors;
  }
}

/** Mutations report bad input in `userErrors` with HTTP 200, so we have to check them by hand. */
export function assertNoUserErrors(
  context: string,
  errors: readonly UserErrorLike[] | null | undefined,
): void {
  if (errors && errors.length > 0) throw new UserErrorsError(context, errors);
}

export function formatUserError(error: UserErrorLike): string {
  const field = error.field?.length ? `${error.field.join(".")}: ` : "";
  const code = error.code ? ` (${error.code})` : "";
  return `${field}${error.message}${code}`;
}
