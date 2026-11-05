import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bound parallel rendering: some laws contain large legal tables.
  experimental: { cpus: 2, staticGenerationMaxConcurrency: 1 },
  staticPageGenerationTimeout: 300,
  output: "export",
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
