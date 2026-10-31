import { ApiType, shopifyApiProject } from "@shopify/api-codegen-preset";
import { API_VERSION } from "./src/lib/shopify/api-version";

const documents = ["./src/**/*.{ts,tsx}"];

const config = {
  schema: `https://shopify.dev/storefront-graphql-direct-proxy/${API_VERSION}`,
  documents,
  projects: {
    default: shopifyApiProject({
      apiType: ApiType.Storefront,
      apiVersion: API_VERSION,
      documents,
      outputDir: "./generated",
      enumsAsConst: true,
    }),
  },
};

export default config;
