import { matchesExactPath, matchesPath } from './pathname';

/**
 * Whether this pathname opens as a modal over the page beneath it, from
 * `@modal/(modal)`. Only a hint before a navigation lands; the router tree
 * decides after.
 */
export function isModal(pathname: string): boolean {
  return !!matchesPath(pathname, '/login');
}

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
  // The landing page carries the search field with an empty query.
  return !!(
    matchesExactPath(pathname, '/') ||
    matchesExactPath(pathname, '/search') ||
    matchesExactPath(pathname, '/[enhet]')
  );
}

/**
 * Whether the header on this pathname carries the search field: where results
 * show, and on the case and meeting pages below an enhet, which keep the field
 * showing the search that led there.
 *
 * This is what lets the field live in `@header/layout.tsx` as a single
 * persistent element instead of being re-mounted by each slot page.
 */
export function showsSearchField(pathname: string): boolean {
  return !!(
    matchesExactPath(pathname, '/') ||
    matchesPath(pathname, '/search') ||
    matchesPath(pathname, '/[enhet]')
  );
}
