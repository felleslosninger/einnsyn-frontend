import type { NextConfig } from "next";
import { routeRewrites } from "./src/lib/routing/pathname";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  devIndicators: false,
  reactProductionProfiling: true,
  poweredByHeader: false,
  async rewrites() {
    // Ahead of Next's interception rewrites, which also run in `beforeFiles`,
    // so a translated `/login` still opens the modal.
    return { beforeFiles: routeRewrites() };
  },
};

export default nextConfig;
