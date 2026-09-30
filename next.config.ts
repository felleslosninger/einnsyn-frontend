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
  select: (
    translations: (typeof allTranslations)[number],
  ) => string | undefined,
) => [
  ...new Set(
    allTranslations.flatMap((t) => {
      const segment = select(t);
      // A section may not be translated into every language yet; those fall
      // back to its canonical segment, which needs no rewrite.
      return segment ? segmentVariants(segment) : [];
    }),
  ),
];

// Translation files legitimately differ in which routing keys they carry — a
// section may not be translated into every language yet — so they are looked up
// by name rather than by property access, which would fail to typecheck against
// the union of all four files.
const routingSegment =
  (key: string) =>
  (
    translations: (typeof allTranslations)[number],
  ): string | undefined =>
    (translations.routing as Record<string, string | undefined>)[key];

// A single-segment route whose segment is translated (`søk`, `oza`, …) while
// there is only one real route — `app/<canonical>`, named after the section in
// src/lib/routes/sections.ts. Without a rewrite a localized path falls through
// to the `[enhet]` catch-all, so `/søk` would scope the search to a
// non-existent enhet named "søk" and return nothing.
//
// The canonical segment is excluded because it is the destination.
const sectionRewrites = (
  canonical: string,
  select: (
    translations: (typeof allTranslations)[number],
  ) => string | undefined,
) =>
  distinctSegments(select)
    .filter((segment) => segment !== canonical)
    .map((segment) => ({
      source: `/${segment}`,
      destination: `/${canonical}`,
    }));

// The saksmappe/journalpost routes need the same treatment, but both of their
// segments are translated: `routing.saksmappePath` (`sak`, `case`, `ášši`, …)
// and `journalpost.pathName` (`record`, `journalapoasta`, …), while the only
// real routes are `app/saksmappe/[saksmappe]` and
// `app/saksmappe/[saksmappe]/journalpost/[journalpost]`. The two segments are
// combined independently rather than per locale, so a path that mixes locales
// still resolves instead of 404-ing.
//
// Note `case` is rewritten like any other translation now that the route folder
// is named after the section rather than after its English spelling.
const saksmappePaths = distinctSegments(routingSegment("saksmappePath"));
const recordPaths = distinctSegments((t) => t.journalpost.pathName);

const saksmappeRewrites = saksmappePaths
  .filter((saksmappePath) => saksmappePath !== "saksmappe")
  .map((saksmappePath) => ({
    source: `/${saksmappePath}/:saksmappe`,
    destination: "/saksmappe/:saksmappe",
  }));

const journalpostRewrites = saksmappePaths
  .flatMap((saksmappePath) =>
    recordPaths.map((recordPath) => ({ saksmappePath, recordPath })),
  )
  .filter(
    ({ saksmappePath, recordPath }) =>
      saksmappePath !== "saksmappe" || recordPath !== "journalpost",
  )
  .map(({ saksmappePath, recordPath }) => ({
    source: `/${saksmappePath}/:saksmappe/${recordPath}/:journalpost`,
    destination: "/saksmappe/:saksmappe/journalpost/:journalpost",
  }));

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  devIndicators: false,
  reactProductionProfiling: true,
  poweredByHeader: false,
  async rewrites() {
    return [
      ...sectionRewrites("search", routingSegment("searchPath")),
      // `/om` and `/personvern` are live URLs; the route folders are now named
      // after their sections, so these keep them resolving.
      ...sectionRewrites("about", routingSegment("aboutPath")),
      ...sectionRewrites("privacy", routingSegment("privacyPath")),
      ...saksmappeRewrites,
      ...journalpostRewrites,
    ];
  },
};

export default nextConfig;
