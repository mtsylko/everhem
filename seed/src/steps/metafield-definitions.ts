import { PRODUCT_METAFIELDS } from "../constants.ts";
import type { Outcome, RunContext } from "../outcome.ts";
import { assertNoUserErrors } from "../shopify/errors.ts";

export const PRODUCT_METAFIELD_DEFINITIONS = `#graphql
  query ProductMetafieldDefinitions($namespace: String!) {
    metafieldDefinitions(first: 50, ownerType: PRODUCT, namespace: $namespace) {
      nodes {
        id
        key
        type {
          name
        }
      }
    }
  }
`;

const CREATE_DEFINITION = `#graphql
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const definitions = Object.values(PRODUCT_METAFIELDS);

/** Definitions give the metafields a type, an admin UI and Storefront API access. */
export async function ensureMetafieldDefinitions(ctx: RunContext): Promise<Outcome[]> {
  const { client, logger, dryRun } = ctx;
  const outcomes: Outcome[] = [];

  for (const namespace of new Set(definitions.map((d) => d.namespace))) {
    const { metafieldDefinitions } = await client.request(PRODUCT_METAFIELD_DEFINITIONS, {
      namespace,
    });
    const existing = new Map(metafieldDefinitions.nodes.map((d) => [d.key, d]));

    for (const definition of definitions.filter((d) => d.namespace === namespace)) {
      const handle = `${definition.namespace}.${definition.key}`;
      const found = existing.get(definition.key);

      if (found && found.type.name !== definition.type) {
        throw new Error(
          `Metafield definition ${handle} exists with type ${found.type.name}, expected ${definition.type}.`,
        );
      }

      const action = found ? "skipped" : dryRun ? "would-create" : "created";
      if (action === "created") {
        const { metafieldDefinitionCreate } = await client.request(CREATE_DEFINITION, {
          definition: {
            ...definition,
            ownerType: "PRODUCT",
            pin: true,
            access: { storefront: "PUBLIC_READ" },
          },
        });
        assertNoUserErrors(
          `create metafield definition ${handle}`,
          metafieldDefinitionCreate?.userErrors,
        );
      }

      logger.info(`metafield-definition.${action}`, { handle, type: definition.type });
      outcomes.push({ resource: "metafield-definition", handle, action });
    }
  }
  return outcomes;
}
