import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // cacheComponents/PPR requires every dynamic read (auth, DB, cookies) to be
  // wrapped in <Suspense>. Almost every page here is inherently per-request
  // (cart, checkout, admin), so it fights the architecture more than it helps.
  images: {
    // Seed data ships SVG placeholders under /public/products.
    dangerouslyAllowSVG: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
