import { readFile } from "node:fs/promises";
import { colors } from "../../catalog/colors.ts";
import { hashBytes } from "../catalog/checksum.ts";
import { mimeTypeFor, planImages, type PlannedImage } from "../catalog/images.ts";
import {
  buildProductSetInput,
  productChecksum,
  type ResolvedImage,
} from "../catalog/product-input.ts";
import type { CatalogProduct } from "../catalog/types.ts";
import { variantKey } from "../catalog/variants.ts";
import { CHECKSUM_METAFIELD } from "../constants.ts";
import { NotOwnedError, type Outcome, type RunContext } from "../outcome.ts";
import { assertNoUserErrors } from "../shopify/errors.ts";
import type { Store } from "./preflight.ts";
import { publishEverywhere } from "./publish.ts";
import { stageFiles } from "./uploads.ts";

export const PRODUCT_BY_HANDLE = `#graphql
  query ProductByHandle($handle: String!, $namespace: String!, $key: String!) {
    productByIdentifier(identifier: { handle: $handle }) {
      id
      tags
      seedChecksum: metafield(namespace: $namespace, key: $key) {
        value
      }
      variants(first: 100) {
        nodes {
          id
          selectedOptions {
            name
            value
          }
        }
      }
      resourcePublicationsV2(first: 25) {
        nodes {
          publication {
            id
          }
        }
      }
    }
  }
`;

const PRODUCT_SET = `#graphql
  mutation ProductSet($identifier: ProductSetIdentifiers!, $input: ProductSetInput!) {
    productSet(identifier: $identifier, input: $input, synchronous: true) {
      product {
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

interface LoadedImage {
  image: PlannedImage;
  hash: string;
  /** Only for local files. */
  data?: Uint8Array;
}

export async function syncProduct(
  ctx: RunContext,
  store: Store,
  product: CatalogProduct,
  collectionIds: ReadonlyMap<string, string>,
  imagesDir: string,
): Promise<Outcome> {
  const { client, logger, dryRun } = ctx;
  const { productByIdentifier: existing } = await client.request(PRODUCT_BY_HANDLE, {
    handle: product.handle,
    namespace: CHECKSUM_METAFIELD.namespace,
    key: CHECKSUM_METAFIELD.key,
  });
  if (existing && !existing.seedChecksum) throw new NotOwnedError("product", product.handle);

  const images = await loadImages(planImages(product, imagesDir));
  // In a dry run a new collection has no id yet. Any placeholder works: the product will change anyway.
  const collectionId = collectionIds.get(product.collection) ?? `pending:${product.collection}`;
  const sum = productChecksum(
    product,
    collectionId,
    Object.fromEntries(images.map(({ image, hash }) => [image.key, hash])),
  );

  let id = existing?.id;
  let action: Outcome["action"];
  if (existing?.seedChecksum?.value === sum) {
    action = "skipped";
  } else if (dryRun) {
    action = existing ? "would-update" : "would-create";
  } else {
    const input = buildProductSetInput(product, {
      palette: colors,
      locationId: store.locationId,
      collectionId,
      images: await resolveSources(ctx, images),
      existingVariantIds: new Map(
        existing?.variants.nodes.map((variant) => [
          variantKeyOf(variant.selectedOptions),
          variant.id,
        ]),
      ),
      checksum: sum,
    });
    // productSet also deletes the old images it no longer lists, so they don't pile up in Files.
    const { productSet } = await client.request(PRODUCT_SET, {
      identifier: { handle: product.handle },
      input,
    });
    assertNoUserErrors(`productSet ${product.handle}`, productSet?.userErrors);
    const saved = productSet?.product;
    if (!saved) throw new Error(`productSet returned no product for ${product.handle}`);

    id = saved.id;
    action = existing ? "updated" : "created";
  }

  logger.info(`product.${action}`, { handle: product.handle, id, images: images.length });
  if (id) {
    const publishedIds =
      existing?.resourcePublicationsV2.nodes.map((node) => node.publication.id) ?? [];
    await publishEverywhere(
      ctx,
      store,
      { id, kind: "product", handle: product.handle },
      publishedIds,
    );
  }
  return { resource: "product", handle: product.handle, action };
}

async function loadImages(images: readonly PlannedImage[]): Promise<LoadedImage[]> {
  return Promise.all(
    images.map(async (image) => {
      const { source } = image;
      if (source.kind === "url") return { image, hash: hashBytes(source.url) };
      const data = await readFile(source.path).catch((error: unknown) => {
        throw new Error(
          `Image not found: ${source.path}. ` +
            "Run `npm run placeholders -w seed` to generate placeholder images.",
          { cause: error },
        );
      });
      return { image, hash: hashBytes(data), data };
    }),
  );
}

/** Remote images are passed as is. Local files go through a staged upload first. */
async function resolveSources(
  { client }: RunContext,
  images: readonly LoadedImage[],
): Promise<ResolvedImage[]> {
  const local = images.filter((loaded) => loaded.data);
  const urls = await stageFiles(
    client,
    local.map(({ image, data }) => ({
      filename: image.filename,
      mimeType: mimeTypeFor(image.filename),
      data: data as Uint8Array,
    })),
  );
  const staged = new Map(local.map((loaded, index) => [loaded.image.key, urls[index] as string]));

  return images.map(({ image }) => ({
    ...image,
    originalSource:
      image.source.kind === "url" ? image.source.url : (staged.get(image.key) as string),
  }));
}

function variantKeyOf(options: ReadonlyArray<{ name: string; value: string }>): string {
  const value = (name: string) => options.find((option) => option.name === name)?.value ?? "";
  return variantKey(value("Color"), value("Size"));
}
