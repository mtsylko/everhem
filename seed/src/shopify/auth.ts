import type { AuthConfig } from "../config.ts";

/**
 * Returns the static token, or exchanges client credentials for a token.
 * Client credentials only work when the app and the store belong to the same organization.
 * The token lives 24 hours, which is far longer than a seed run.
 */
export async function getAccessToken(
  storeDomain: string,
  auth: AuthConfig,
  fetchFn: typeof fetch = fetch,
): Promise<string> {
  if (auth.kind === "token") return auth.accessToken;

  const response = await fetchFn(`https://${storeDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: auth.clientId,
      client_secret: auth.clientSecret,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `Could not get an access token (HTTP ${response.status}): ${body.slice(0, 300)}. ` +
        "Check that the app is installed on the store and that both belong to the same organization.",
    );
  }

  const token = (JSON.parse(body) as { access_token?: unknown }).access_token;
  if (typeof token !== "string") throw new Error("Token response has no access_token.");
  return token;
}
