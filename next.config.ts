import type { NextConfig } from "next";
import { routeRewrites } from "./src/lib/routing/pathname";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
];

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  devIndicators: false,
  reactProductionProfiling: true,
  poweredByHeader: false,
  headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    // Ahead of Next's interception rewrites, which also run in `beforeFiles`,
    // so a translated `/login` still opens the modal.
    return { beforeFiles: routeRewrites() };
  },
};

export default nextConfig;
