import type { NextConfig } from "next";

// Every page in this app is per-user (session + database), so we use the
// classic fully-dynamic rendering model instead of Cache Components.
const nextConfig: NextConfig = {
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
