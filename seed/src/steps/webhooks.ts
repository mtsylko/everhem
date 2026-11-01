import { REVALIDATE_PATH, WEBHOOK_TOPICS } from "../constants.ts";
import type { Outcome, RunContext } from "../outcome.ts";
import { assertNoUserErrors } from "../shopify/errors.ts";

/** Lists this app's own subscriptions: a handful, so one page is enough. */
export const WEBHOOK_SUBSCRIPTIONS = `#graphql
  query WebhookSubscriptions {
    webhookSubscriptions(first: 100) {
      nodes {
        id
        topic
        uri
      }
    }
  }
`;

const CREATE_WEBHOOK = `#graphql
  mutation CreateWebhookSubscription($topic: WebhookSubscriptionTopic!, $uri: String!) {
    webhookSubscriptionCreate(topic: $topic, webhookSubscription: { uri: $uri }) {
      webhookSubscription {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const UPDATE_WEBHOOK = `#graphql
  mutation UpdateWebhookSubscription($id: ID!, $uri: String!) {
    webhookSubscriptionUpdate(id: $id, webhookSubscription: { uri: $uri }) {
      webhookSubscription {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const DELETE_WEBHOOK = `#graphql
  mutation DeleteWebhookSubscription($id: ID!) {
    webhookSubscriptionDelete(id: $id) {
      deletedWebhookSubscriptionId
      userErrors {
        field
        message
      }
    }
  }
`;

interface Subscription {
  id: string;
  topic: string;
  uri: string;
}

type Topic = (typeof WEBHOOK_TOPICS)[number];

export type WebhookChange =
  { topic: Topic; change: "create" } | { topic: Topic; change: "update" | "keep"; id: string };

/** Ours are the subscriptions that call the storefront's webhook route, wherever it is deployed. */
export function isRevalidation(subscription: Pick<Subscription, "uri">): boolean {
  return URL.parse(subscription.uri)?.pathname === REVALIDATE_PATH;
}

/**
 * What each topic needs to reach `uri`. A subscription that calls the route at another address,
 * say an earlier deploy, is moved rather than duplicated.
 */
export function planWebhooks(existing: readonly Subscription[], uri: string): WebhookChange[] {
  return WEBHOOK_TOPICS.map((topic): WebhookChange => {
    const ours = existing.filter((s) => s.topic === topic && isRevalidation(s));
    const current = ours.find((s) => s.uri === uri) ?? ours[0];
    if (!current) return { topic, change: "create" };
    return { topic, change: current.uri === uri ? "keep" : "update", id: current.id };
  });
}

/**
 * Subscribes the storefront to every change that puts its cached catalog out of date, so a price
 * edited in the admin shows on the next visit rather than hours later. Shopify signs each delivery
 * with this app's client secret, which the storefront holds as SHOPIFY_WEBHOOK_SECRET.
 */
export async function ensureWebhooks(
  { client, logger, dryRun }: RunContext,
  storefrontUrl: string | undefined,
): Promise<Outcome[]> {
  if (!storefrontUrl) {
    logger.info("webhook.skipped", { reason: "STOREFRONT_URL is not set" });
    return [];
  }
  const uri = new URL(REVALIDATE_PATH, storefrontUrl).href;
  const { webhookSubscriptions } = await client.request(WEBHOOK_SUBSCRIPTIONS);

  const outcomes: Outcome[] = [];
  for (const planned of planWebhooks(webhookSubscriptions.nodes, uri)) {
    const action: Outcome["action"] =
      planned.change === "keep"
        ? "skipped"
        : planned.change === "create"
          ? dryRun
            ? "would-create"
            : "created"
          : dryRun
            ? "would-update"
            : "updated";

    if (action === "created") {
      const { webhookSubscriptionCreate } = await client.request(CREATE_WEBHOOK, {
        topic: planned.topic,
        uri,
      });
      assertNoUserErrors(`subscribe ${planned.topic}`, webhookSubscriptionCreate?.userErrors);
    }
    if (action === "updated" && planned.change === "update") {
      const { webhookSubscriptionUpdate } = await client.request(UPDATE_WEBHOOK, {
        id: planned.id,
        uri,
      });
      assertNoUserErrors(`move ${planned.topic}`, webhookSubscriptionUpdate?.userErrors);
    }

    logger.info(`webhook.${action}`, { topic: planned.topic, uri });
    outcomes.push({ resource: "webhook", handle: planned.topic, action });
  }
  return outcomes;
}
