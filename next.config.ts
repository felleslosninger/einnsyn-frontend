import type { NextConfig } from "next";
import { routeRewrites } from "./src/lib/routing/pathname";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  devIndicators: false,
  reactProductionProfiling: true,
  async rewrites() {
    return routeRewrites();
  },
};

export default nextConfig;
