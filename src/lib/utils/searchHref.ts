import { normalizeParamList, serializeParamList } from './paramList';

/**
 * A search href: the given pathname with `updates` applied to its search params.
 *
 * Every search navigation in the app has this shape — take the current
 * (optimistic) params, change one key, recombine with a pathname that may
 * itself change. An `undefined` or empty-string value deletes the param, since
 * that is what all callers mean by "no value". The `?` is omitted when nothing
 * remains, so clearing the last param gives `/search` rather than `/search?`.
 *
 * `searchParams` accepts `undefined` (treated as empty) because
 * `useOptimisticSearchParams` is typed as possibly undefined.
 */
export function buildSearchHref({
  pathname,
  searchParams,
  updates,
}: {
  pathname: string;
  searchParams: URLSearchParams | undefined;
  updates?: Record<string, string | undefined>;
}): string {
  const nextSearchParams = new URLSearchParams(searchParams?.toString());

  for (const [key, value] of Object.entries(updates ?? {})) {
    if (value) {
      nextSearchParams.set(key, value);
    } else {
      nextSearchParams.delete(key);
    }
  }

  const searchParamsString = nextSearchParams.toString();
  return searchParamsString ? `${pathname}?${searchParamsString}` : pathname;
}

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
 * search param. The path form is only used while a single enhet is selected and
 * it is already the path enhet — the path names one enhet, so it cannot
 * represent a wider selection. Selecting a second enhet therefore moves to
 * `searchPathname` with the whole selection in the param, as does deselecting
 * the path enhet.
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
    normalizedIdentifiers.length === 1 &&
    normalizedIdentifiers[0] === pathEnhetValue;
  // Keeping the path enhet means it is the entire selection, so the param is
  // always empty in that case — the path already carries it.
  const queryEnhetIdentifiers = keepsPathEnhet ? [] : normalizedIdentifiers;

  return buildSearchHref({
    pathname: pathEnhetValue && !keepsPathEnhet ? searchPathname : pathname,
    searchParams,
    updates: { enhet: serializeParamList(queryEnhetIdentifiers) },
  });
}
