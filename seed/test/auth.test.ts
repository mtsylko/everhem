import { describe, expect, it, vi } from "vitest";
import { getAccessToken } from "../src/shopify/auth.ts";

describe("getAccessToken", () => {
  it("returns a static token as is", async () => {
    const fetchFn = vi.fn();
    const token = await getAccessToken(
      "a.myshopify.com",
      { kind: "token", accessToken: "shpat_1" },
      fetchFn,
    );

    expect(token).toBe("shpat_1");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("exchanges client credentials for a token", async () => {
    const fetchFn = vi.fn(async () => Response.json({ access_token: "tok", expires_in: 86399 }));
    const auth = { kind: "client-credentials", clientId: "id", clientSecret: "secret" } as const;

    await expect(getAccessToken("a.myshopify.com", auth, fetchFn)).resolves.toBe("tok");

    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://a.myshopify.com/admin/oauth/access_token");
    expect(init.method).toBe("POST");
    expect(String(init.body)).toBe(
      "grant_type=client_credentials&client_id=id&client_secret=secret",
    );
  });

  it("explains a rejected exchange", async () => {
    const fetchFn = vi.fn(
      async () => new Response('{"error":"shop_not_permitted"}', { status: 400 }),
    );
    const auth = { kind: "client-credentials", clientId: "id", clientSecret: "secret" } as const;

    await expect(getAccessToken("a.myshopify.com", auth, fetchFn)).rejects.toThrow(
      /HTTP 400.*shop_not_permitted.*same organization/,
    );
  });
});
