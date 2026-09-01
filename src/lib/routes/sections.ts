import {
  getTranslateFunction,
  supportedLanguages,
} from '~/lib/translation/translation';

// A list of sections that have their own path segment. 'home' and 'enhet' are
// special cases, "home" is the root path, and any unknown root segment is an
// "enhet" slug.
const SECTIONS_WITH_PATH = [
  'search',
  'saksmappe',
  'moetemappe',
  'admin',
  'login',
  'about',
  'privacy',
] as const;
export type SectionWithPath = (typeof SECTIONS_WITH_PATH)[number];
export type Section = 'home' | 'enhet' | SectionWithPath;

// A map of sections, keyed by path name
const SECTION_BY_PATH = new Map(
  SECTIONS_WITH_PATH.flatMap((section) =>
    sectionPaths(section).map((path) => [path, section]),
  ),
);

/**
 * Every word that resolves to a section: its own name, plus a translation per
 * supported language.
 */
export function sectionPaths(section: SectionWithPath): string[] {
  return translatedSegments(`routing.${section}Path`, section);
}

/**
 * Every word a translated path segment may arrive as: its canonical
 * (route-folder) name, plus a translation per supported language, normalized.
 */
function translatedSegments(
  translationKey: string,
  canonical: string,
): string[] {
  const translated = supportedLanguages
    .map((languageCode) => getTranslateFunction(languageCode)(translationKey))
    // `getTranslateFunction` echoes the key back when there is no entry, which
    // is how a segment with no translation yet is recognised.
    .filter((segment) => segment !== translationKey)
    .map((segment) => normalizeSegment(segment));

  return [...new Set([canonical, ...translated])];
}

/**
 * The section a pathname belongs to.
 *
 * An unrecognised root segment is an enhet slug — enhet pages live at the root
 * (`/oslo`), so they cannot be told apart from a typo, and `enhet` is the
 * fallback rather than an explicit match.
 */
export function getSection(pathname: string): Section {
  const rootSegment = getRootSegment(pathname);
  if (rootSegment === undefined) {
    return 'home';
  }

  return SECTION_BY_PATH.get(rootSegment) ?? 'enhet';
}

/** Sections that show search results. */
const SECTIONS_WITH_RESULTS: ReadonlySet<Section> = new Set([
  // The landing page carries the search field with an empty query.
  'home',
  'search',
  'enhet',
]);

/**
 * Sections whose header carries the search field: the ones that show results,
 * plus entity detail pages, which keep the field showing the search that led
 * there. Only sections with no relationship to search at all are absent.
 */
const SECTIONS_WITH_SEARCH_FIELD: ReadonlySet<Section> = new Set([
  ...SECTIONS_WITH_RESULTS,
  'saksmappe',
  'moetemappe',
]);

/**
 * Whether this pathname shows search results.
 *
 * Intercepted modal routes change the pathname while leaving the page beneath
 * them in place, so they read as false here. That is what we want for a
 * remembered search — `/login` must not overwrite it — but it also marks the
 * field dormant. Harmless while `@header/login` renders nothing; a modal opened
 * over a route that *does* show the header would need excluding explicitly.
 */
export function showsSearchResults(pathname: string): boolean {
  return SECTIONS_WITH_RESULTS.has(getSection(pathname));
}

/**
 * Whether the header on this pathname carries the search field.
 *
 * This is what lets the field live in `@header/layout.tsx` as a single
 * persistent element instead of being re-mounted by each slot page.
 */
export function showsSearchField(pathname: string): boolean {
  return SECTIONS_WITH_SEARCH_FIELD.has(getSection(pathname));
}

/**
 * The enhet a URL scopes itself to via its path (`/oslo`), or `undefined` when
 * it is not an enhet page.
 */
export function getPathEnhet(pathname: string): string | undefined {
  return getSection(pathname) === 'enhet'
    ? getRootSegment(pathname)
    : undefined;
}

// The words a saksmappe/journalpost URL may use for its fixed segments —
// `/<saksmappe word>/:saksmappe/<journalpost word>/:journalpost`. The rewrites
// in next.config.ts accept each word in any supported language, mixed locales
// included, so recognising a URL means accepting the same combinations.
const SAKSMAPPE_SEGMENTS = new Set(sectionPaths('saksmappe'));
const JOURNALPOST_SEGMENTS = new Set(
  translatedSegments('journalpost.pathName', 'journalpost'),
);

/**
 * The saksmappe identifier (slug or id) a pathname points at, in any supported
 * language (`/saksmappe/:s`, `/sak/:s`, `/case/:s`, …). A journalpost detail
 * URL carries one too. `undefined` when the pathname is not a saksmappe route.
 */
export function getSaksmappeFromPath(pathname: string): string | undefined {
  const [sectionWord, saksmappe] = pathSegments(pathname);
  if (sectionWord === undefined || saksmappe === undefined) return undefined;
  return SAKSMAPPE_SEGMENTS.has(normalizeSegment(sectionWord))
    ? saksmappe
    : undefined;
}

/**
 * The journalpost identifier (slug or id) a pathname points at, or `undefined`
 * when it is not a journalpost detail URL. Language-agnostic, matching what
 * the rewrites accept: `/saksmappe/:s/journalpost/:j`, `/case/:s/record/:j`,
 * and mixed-locale forms.
 */
export function getJournalpostFromPath(pathname: string): string | undefined {
  const segments = pathSegments(pathname);
  if (segments.length !== 4) return undefined;
  const [sectionWord, , journalpostWord, journalpost] = segments;
  if (!SAKSMAPPE_SEGMENTS.has(normalizeSegment(sectionWord))) {
    return undefined;
  }
  if (!JOURNALPOST_SEGMENTS.has(normalizeSegment(journalpostWord))) {
    return undefined;
  }
  return journalpost;
}

/** Path segments, with any query/hash tail stripped. */
function pathSegments(pathname: string): string[] {
  return pathname.split(/[?#]/)[0].split('/').filter(Boolean);
}

/** The first path segment, normalized for comparison. `undefined` for `/`. */
function getRootSegment(pathname: string): string | undefined {
  const [rootSegment] = pathname.split('/').filter(Boolean);
  return rootSegment === undefined ? undefined : normalizeSegment(rootSegment);
}

// Segments arrive percent-encoded (`/%C3%A1%C5%A1%C5%A1i` vs `/ášši`), so both
// sides are decoded and case-folded before comparing.
function normalizeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment).toLowerCase();
  } catch {
    return segment.toLowerCase();
  }
}
