'use client';

import { useEffect, useRef, useState } from 'react';
import { showsSearchResults } from '~/lib/routes/sections';

// Key under which the remembered search URL is stored on the history entry.
//
// `history.state` is used rather than a ref or sessionStorage for two reasons:
// it survives a reload, and it is *per history entry*. Backing into an older
// journalpost therefore restores the search that journalpost was reached from,
// not whichever search happened most recently.
const SEARCH_ORIGIN_KEY = '__einSearchOrigin';

function readSearchOrigin(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = window.history.state?.[SEARCH_ORIGIN_KEY];
  return typeof value === 'string' ? value : undefined;
}

function writeSearchOrigin(url: string | undefined) {
  if (typeof window === 'undefined') return;
  if (readSearchOrigin() === url) return;

  // Next owns `history.state` — it keeps its own routing internals there — so
  // the existing object is spread rather than replaced.
  window.history.replaceState(
    { ...window.history.state, [SEARCH_ORIGIN_KEY]: url },
    '',
  );
}

/**
 * The URL of the search results the user is currently "inside".
 *
 * On a search route this is the current URL. On a detail page it is whichever
 * search led there, carried across arbitrarily many hops
 * (`search → saksmappe → journalpost → …`) and restored after a reload. It is
 * `undefined` when the page was deep-linked without a search in front of it.
 *
 * Visiting any search route — including the landing page or an enhet page with
 * no query — overwrites it, so the value cannot go stale.
 *
 * Pass the *committed* pathname and search params, not the optimistic ones: the
 * stamp has to land on the history entry the browser has actually moved to.
 */
export function useSearchOrigin(
  pathname: string,
  searchParamsString: string,
): string | undefined {
  const [searchOrigin, setSearchOrigin] = useState<string | undefined>(
    undefined,
  );
  // Mirrors the state so the effect can carry the previous value forward
  // without re-running when it changes.
  const searchOriginRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentUrl = searchParamsString
      ? `${pathname}?${searchParamsString}`
      : pathname;

    const nextSearchOrigin = showsSearchResults(pathname)
      ? currentUrl
      : // A stamped entry means we have been here before (back/forward, or a
        // reload); otherwise this is a fresh hop away from the last search.
        (readSearchOrigin() ?? searchOriginRef.current);

    searchOriginRef.current = nextSearchOrigin;
    setSearchOrigin(nextSearchOrigin);
    writeSearchOrigin(nextSearchOrigin);
  }, [pathname, searchParamsString]);

  return searchOrigin;
}

/**
 * Splits a remembered search URL into the parts `buildSearchHref` needs.
 * Returns `undefined` for `undefined`, so callers can fall back to `/search`.
 */
export function parseSearchOrigin(
  searchOrigin: string | undefined,
): { pathname: string; searchParams: URLSearchParams } | undefined {
  if (!searchOrigin) return undefined;

  // The origin is always a root-relative path; the base is only there to
  // satisfy the URL parser.
  const url = new URL(searchOrigin, 'http://einnsyn.invalid');
  return { pathname: url.pathname, searchParams: url.searchParams };
}
