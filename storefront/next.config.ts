import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  images: {
    // Shopify's CDN resizes product images, so Next.js doesn't have to.
    loader: "custom",
    loaderFile: "./src/lib/shopify/image-loader.ts",
  },
  turbopack: {
    rules: {
      // `as` makes every match plain CSS, so a CSS module would lose its scoped class names.
      "*.css": {
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
