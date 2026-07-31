import { normalizeParamList, serializeParamList } from './paramList';

/**
 * Whether the first path segment is this enhet, i.e. we are on `/{enhet}` or
 * somewhere below it.
 *
 * The segment is decoded before comparing, since `params.enhet` arrives decoded
 * but the pathname does not (`/m%C3%B8re-og-romsdal` vs `møre-og-romsdal`).
 */
export function pathnameContainsEnhet(
  pathname: string,
  pathEnhet: string | undefined,
): boolean {
  if (!pathEnhet) {
    return false;
  }

  const firstPathSegment = pathname.split('/').filter(Boolean)[0];
  if (!firstPathSegment) {
    return false;
  }

  try {
    return decodeURIComponent(firstPathSegment) === pathEnhet;
  } catch {
    return firstPathSegment === pathEnhet;
  }
}

/**
 * The href for a new enhet selection.
 *
 * An enhet can be selected in two places: the path (`/oslo`) or the `enhet`
 * search param. This keeps the path enhet in the path and everything else in
 * the param, and moves to `searchPathname` when the path enhet is deselected —
 * there is nowhere else for an unscoped search to live.
 */
export function buildEnhetSelectionHref({
  pathname,
  searchPathname,
  searchParams,
  pathEnhetValue,
  selectedEnhetIdentifiers,
}: {
  pathname: string;
  searchPathname: string;
  searchParams: URLSearchParams;
  pathEnhetValue?: string;
  selectedEnhetIdentifiers: readonly string[];
}): string {
  const normalizedIdentifiers = normalizeParamList(selectedEnhetIdentifiers);
  const keepsPathEnhet =
    pathEnhetValue !== undefined &&
    normalizedIdentifiers.includes(pathEnhetValue);
  const queryEnhetIdentifiers = keepsPathEnhet
    ? normalizedIdentifiers.filter(
        (identifier) => identifier !== pathEnhetValue,
      )
    : normalizedIdentifiers;
  const nextPathname =
    pathEnhetValue && !keepsPathEnhet ? searchPathname : pathname;

  const nextSearchParams = new URLSearchParams(searchParams.toString());
  nextSearchParams.delete('enhet');

  const enhetParam = serializeParamList(queryEnhetIdentifiers);
  if (enhetParam) {
    nextSearchParams.set('enhet', enhetParam);
  }

  const searchParamsString = nextSearchParams.toString();
  return searchParamsString
    ? `${nextPathname}?${searchParamsString}`
    : nextPathname;
}
