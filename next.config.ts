import type { NextConfig } from "next";
import enTranslations from "./src/resources/translations/en/translations.json";
import nbTranslations from "./src/resources/translations/nb/translations.json";
import nnTranslations from "./src/resources/translations/nn/translations.json";
import seTranslations from "./src/resources/translations/se/translations.json";

// `routing.searchPath` is translated (`søk`, `oza`, …) but there is only one
// search route: `app/search`. Without a rewrite, a localized path falls through
// to the `[enhet]` catch-all, so the search gets scoped to a non-existent enhet
// named "søk" and returns nothing.
// Rewrite sources are matched against the raw request path, which browsers
// percent-encode, so a non-ASCII path needs its encoded form listed too —
// `source: "/søk"` alone never matches the `/s%C3%B8k` that actually arrives.
const searchPathRewrites = [
  ...new Set(
    [nbTranslations, nnTranslations, enTranslations, seTranslations]
      .map((translations) => translations.routing.searchPath)
      .filter((searchPath) => searchPath !== "search")
      .flatMap((searchPath) => [searchPath, encodeURIComponent(searchPath)]),
  ),
].map((searchPath) => ({
  source: `/${searchPath}`,
  destination: "/search",
}));

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  devIndicators: false,
  reactProductionProfiling: true,
  async rewrites() {
    return searchPathRewrites;
  },
};

export default nextConfig;
