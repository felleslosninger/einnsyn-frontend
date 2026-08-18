import type { NextConfig } from "next";
import enTranslations from "./src/resources/translations/en/translations.json";
import nbTranslations from "./src/resources/translations/nb/translations.json";
import nnTranslations from "./src/resources/translations/nn/translations.json";
import seTranslations from "./src/resources/translations/se/translations.json";

const allTranslations = [
  nbTranslations,
  nnTranslations,
  enTranslations,
  seTranslations,
];

// Rewrite sources are matched against the raw request path, which browsers
// percent-encode, so a non-ASCII path needs its encoded form listed too —
// `source: "/søk"` alone never matches the `/s%C3%B8k` that actually arrives.
const segmentVariants = (segment: string) => [
  ...new Set([segment, encodeURIComponent(segment)]),
];

const distinctSegments = (
  select: (translations: (typeof allTranslations)[number]) => string,
) => [...new Set(allTranslations.flatMap((t) => segmentVariants(select(t))))];

// `routing.searchPath` is translated (`søk`, `oza`, …) but there is only one
// search route: `app/search`. Without a rewrite, a localized path falls through
// to the `[enhet]` catch-all, so the search gets scoped to a non-existent enhet
// named "søk" and returns nothing.
const searchPathRewrites = distinctSegments((t) => t.routing.searchPath)
  .filter((searchPath) => searchPath !== "search")
  .map((searchPath) => ({
    source: `/${searchPath}`,
    destination: "/search",
  }));

// The saksmappe/journalpost routes need the same treatment, but both of their
// segments are translated: `routing.saksmappePath` (`sak`, `ášši`, …) and
// `journalpost.pathName` (`record`, `journalapoasta`, …), while the only real
// routes are `app/case/[saksmappe]` and
// `app/case/[saksmappe]/journalpost/[journalpost]`. The two segments are
// combined independently rather than per locale, so a path that mixes locales
// still resolves instead of 404-ing.
const casePaths = distinctSegments((t) => t.routing.saksmappePath);
const recordPaths = distinctSegments((t) => t.journalpost.pathName);

const saksmappeRewrites = casePaths
  .filter((casePath) => casePath !== "case")
  .map((casePath) => ({
    source: `/${casePath}/:saksmappe`,
    destination: "/case/:saksmappe",
  }));

const journalpostRewrites = casePaths
  .flatMap((casePath) => recordPaths.map((recordPath) => ({ casePath, recordPath })))
  .filter(
    ({ casePath, recordPath }) =>
      casePath !== "case" || recordPath !== "journalpost",
  )
  .map(({ casePath, recordPath }) => ({
    source: `/${casePath}/:saksmappe/${recordPath}/:journalpost`,
    destination: "/case/:saksmappe/journalpost/:journalpost",
  }));

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  devIndicators: false,
  reactProductionProfiling: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      ...searchPathRewrites,
      ...saksmappeRewrites,
      ...journalpostRewrites,
    ];
  },
};

export default nextConfig;
