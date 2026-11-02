import { type EnhetPage, parsePathname, type RootPage } from './pathname';

/**
 * Which kind of page a pathname shows, as the UI tells them apart. Read off
 * the route, so it does not depend on the language the URL is spelled in.
 */
export type Section =
  | 'home'
  | RootPage
  | 'enhet'
  | EnhetPage
  | 'saksmappe'
  | 'moetemappe';

/**
 * The section a pathname belongs to. A path below an enhet that matches no
 * route still counts as the enhet's.
 */
export function getSection(pathname: string): Section {
  const route = parsePathname(pathname);
  if (route?.page !== undefined) {
    return route.page;
  }
  if (route?.saksmappeIdentifier !== undefined) {
    return 'saksmappe';
  }
  if (route?.moetemappeIdentifier !== undefined) {
    return 'moetemappe';
  }
  return 'enhet';
}

// Sections with a page in `@modal/(modal)`, which opens over the page beneath
// it. Only a hint before a navigation lands; the router tree decides after.
const MODAL_SECTIONS: ReadonlySet<Section> = new Set(['login']);

/** Whether this section opens as a modal over the page beneath it. */
export function isModalSection(section: Section): boolean {
  return MODAL_SECTIONS.has(section);
}

/** Sections that show search results. */
export const SECTIONS_WITH_RESULTS: ReadonlySet<Section> = new Set([
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
 * remembered search — `/login` must not overwrite it — but it also puts the
 * back link in the search field. Harmless while `@header/login` renders
 * nothing; a modal over a route that *does* show the header would need
 * excluding explicitly.
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
