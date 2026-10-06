import type { NextConfig } from "next";
import enTranslations from "./src/resources/translations/en/translations.json";
import nbTranslations from "./src/resources/translations/nb/translations.json";
import nnTranslations from "./src/resources/translations/nn/translations.json";
import seTranslations from "./src/resources/translations/se/translations.json";

// Languages differ in which routing keys they carry, so any key may be missing.
type Translations = { routing: Partial<Record<string, string>> };

const allTranslations: Translations[] = [
  nbTranslations,
  nnTranslations,
  enTranslations,
  seTranslations,
];

// Rewrites every language's version of a route to the canonical one, e.g.
// `("saksmappe", ":saksmappe")` covers `/sak/:saksmappe`, `/case/:saksmappe`, …
// `:` segments are params and pass through as-is. Each source uses a single
// language throughout, so `/sak/:saksmappe/record/:journalpost` is not matched.
//
// Without these, a localized path falls through to the `[enhet]` catch-all:
// `/søk` would search a non-existent enhet named "søk".
const getTranslationRewrites = (...segments: string[]) => {
  const destination = `/${segments.join("/")}`;
  const translate = (t: Translations, encode: boolean) =>
    segments.map((segment) => {
      if (segment.startsWith(":")) {
        return segment;
      }
      const translation = t.routing[segment] ?? segment;
      // Browsers send non-ASCII segments percent-encoded: `ášši` as `%C3%A1…`.
      return encode ? encodeURIComponent(translation) : translation;
    });

  const sourceList = allTranslations.flatMap((t) =>
    [false, true].map((encode) => `/${translate(t, encode).join("/")}`),
  );

  // Remove duplicates and the destination itself
  const sourceSet = new Set(sourceList);
  sourceSet.delete(destination);

  return [...sourceSet].map((source) => ({ source, destination }));
};

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  devIndicators: false,
  reactProductionProfiling: true,
  async rewrites() {
    return [
      ...getTranslationRewrites("search"),
      ...getTranslationRewrites("about"),
      ...getTranslationRewrites("privacy"),
    ];
  },
};

export default nextConfig;
