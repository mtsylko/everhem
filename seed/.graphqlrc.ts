import { ApiType, shopifyApiProject } from "@shopify/api-codegen-preset";
import { API_VERSION } from "./src/shopify/api-version.ts";

const documents = ["./src/**/*.ts"];

export default {
  schema: `https://shopify.dev/admin-graphql-direct-proxy/${API_VERSION}`,
  documents,
  projects: {
    default: shopifyApiProject({
      apiType: ApiType.Admin,
      apiVersion: API_VERSION,
      documents,
      outputDir: "./generated",
      // String unions instead of TS enums, so Node can run the code without a build step.
      enumsAsConst: true,
    }),
  },
};
