import type { ShopifyClient } from "../shopify/client.ts";
import { assertNoUserErrors } from "../shopify/errors.ts";

const STAGED_UPLOADS = `#graphql
  mutation StagedUploads($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export interface LocalFile {
  filename: string;
  mimeType: string;
  data: Uint8Array;
}

/**
 * Uploads local files to Shopify's temporary storage.
 * Returns URLs that productSet accepts as `originalSource`, in the same order.
 */
export async function stageFiles(
  client: ShopifyClient,
  files: readonly LocalFile[],
  fetchFn: typeof fetch = fetch,
): Promise<string[]> {
  if (files.length === 0) return [];

  const { stagedUploadsCreate } = await client.request(STAGED_UPLOADS, {
    input: files.map((file) => ({
      filename: file.filename,
      mimeType: file.mimeType,
      resource: "IMAGE" as const,
      httpMethod: "POST" as const,
      fileSize: String(file.data.byteLength),
    })),
  });
  assertNoUserErrors("stagedUploadsCreate", stagedUploadsCreate?.userErrors);

  const targets = stagedUploadsCreate?.stagedTargets ?? [];
  if (targets.length !== files.length) {
    throw new Error(`Asked for ${files.length} upload targets, got ${targets.length}.`);
  }

  return Promise.all(
    targets.map(async (target, index) => {
      const file = files[index] as LocalFile;
      if (!target.url || !target.resourceUrl) {
        throw new Error(`No upload target for ${file.filename}.`);
      }
      const response = await fetchFn(target.url, {
        method: "POST",
        body: buildUploadForm(target.parameters, file),
      });
      if (!response.ok) {
        throw new Error(`Upload of ${file.filename} failed with HTTP ${response.status}.`);
      }
      return target.resourceUrl;
    }),
  );
}

export function buildUploadForm(
  parameters: ReadonlyArray<{ name: string; value: string }>,
  file: LocalFile,
): FormData {
  const form = new FormData();
  for (const { name, value } of parameters) form.append(name, value);
  // The storage service checks the signed parameters, which must come before the file.
  form.append("file", new Blob([file.data], { type: file.mimeType }), file.filename);
  return form;
}
