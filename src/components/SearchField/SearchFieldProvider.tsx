'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { showsSearchResults } from '~/lib/routes/sections';
import { buildSearchHref } from '~/lib/utils/searchHref';
import {
  type SearchToken,
  searchQueryToTokens,
  tokensToSearchQuery,
} from '~/lib/utils/searchStringTokenizer';
import { parseSearchOrigin, useSearchOrigin } from './useSearchOrigin';

interface SearchFieldContextType {
  searchTokens: SearchToken[];
  searchQuery: string;
  getProperty: (property: string) => string | undefined;
  setProperty: (
    property: string,
    value: string | null | undefined,
    push?: boolean,
  ) => void;
  setSearchQuery: (query: string, push?: boolean) => void;
  pushSearchQuery: (query: string) => void;
  /**
   * True when the field is showing a remembered search rather than the one that
   * produced the current page — i.e. on a detail page. The field stays usable;
   * this only drives the dimmed styling and the back-arrow.
   */
  dormant: boolean;
  /** URL of the remembered search, or `undefined` if there was none. */
  searchOrigin: string | undefined;
  /** Where a submitted query goes: the current search, or the remembered one. */
  searchTarget: { pathname: string; searchParams: URLSearchParams };
}

const SearchFieldContext = createContext<SearchFieldContextType | null>(null);

export function SearchFieldProvider({ children }: { children: ReactNode }) {
  const navigation = useNavigation();
  const optimisticPathname = navigation.optimisticPathname;
  const optimisticSearchParams = navigation.optimisticSearchParams;
  const [searchQuery, _setSearchQuery] = useState(
    () => optimisticSearchParams.get('q') ?? '',
  );

  // Stamped against the committed route, so it lands on the history entry the
  // browser has actually moved to. The dormant/live split below uses the
  // optimistic route instead, so the field restyles as navigation starts.
  const searchOrigin = useSearchOrigin(
    navigation.pathname,
    navigation.searchParamsString,
  );
  const dormant = !showsSearchResults(optimisticPathname);
  const parsedSearchOrigin = useMemo(
    () => parseSearchOrigin(searchOrigin),
    [searchOrigin],
  );

  const searchTokens = useMemo(
    () => searchQueryToTokens(searchQuery),
    [searchQuery],
  );

  // Which URL the field's contents are a view of. On a search route that is the
  // page itself; on a detail page it is the remembered search, which is what
  // keeps the query on screen across `search → saksmappe → journalpost` and
  // restores it after a reload. `undefined` means there is nothing
  // authoritative to show — a deep-linked detail page — so whatever has been
  // typed is left alone.
  const authoritativeQuery = useMemo(() => {
    if (!dormant) {
      return optimisticSearchParams.get('q') ?? '';
    }
    return parsedSearchOrigin?.searchParams.get('q') ?? undefined;
  }, [dormant, optimisticSearchParams, parsedSearchOrigin]);

  useEffect(() => {
    if (authoritativeQuery === undefined) return;
    _setSearchQuery(authoritativeQuery);
  }, [authoritativeQuery]);

  // Submitting from a detail page must go back to the search, not to
  // `/case/abc?q=…`, and it has to carry the remembered filters, enhet and sort.
  const searchTarget = useMemo(() => {
    if (!dormant) {
      return {
        // The landing page has no results of its own; searching leaves it.
        pathname: optimisticPathname === '/' ? '/search' : optimisticPathname,
        searchParams: optimisticSearchParams,
      };
    }
    return (
      parsedSearchOrigin ?? {
        pathname: '/search',
        searchParams: new URLSearchParams(),
      }
    );
  }, [dormant, optimisticPathname, optimisticSearchParams, parsedSearchOrigin]);

  const searchStateRef = useRef({ searchQuery, searchTokens });
  useEffect(() => {
    searchStateRef.current = { searchQuery, searchTokens };
  }, [searchQuery, searchTokens]);

  const pushSearchQuery = useCallback(
    (queryToPush: string) => {
      // TODO: decide whether the search path should be localized. The enhet
      // selector uses `routing.searchPath` here, which makes the URL depend on
      // the viewer's session language; localized spellings already resolve via
      // the rewrites in next.config.ts.
      navigation.push(
        buildSearchHref({
          pathname: searchTarget.pathname,
          searchParams: searchTarget.searchParams,
          updates: { q: queryToPush },
        }),
      );
    },
    [navigation, searchTarget],
  );

  const setSearchQuery = useCallback(
    (newSearchQuery: string, push = false) => {
      _setSearchQuery(newSearchQuery);
      if (push) {
        pushSearchQuery(newSearchQuery);
      }
    },
    [pushSearchQuery],
  );

  const getProperty = useCallback(
    (property: string): string | undefined => {
      const token = searchTokens.find((t) => t.prefix === property);
      return token ? token.value : undefined;
    },
    [searchTokens],
  );

  const setProperty = useCallback(
    (property: string, value: string | null | undefined, push = true) => {
      const currentTokens = searchStateRef.current.searchTokens;
      const tokenIndex = currentTokens.findIndex((t) => t.prefix === property);
      const newTokens = [...currentTokens];

      if (tokenIndex > -1) {
        if (value === undefined || value === null) {
          newTokens.splice(tokenIndex, 1);
        } else {
          newTokens[tokenIndex] = { ...newTokens[tokenIndex], value };
        }
      } else if (value !== undefined && value !== null) {
        newTokens.push({
          prefix: property,
          value,
          quoted: false, // TODO: Determine if quoting is needed
          sign: undefined,
          focused: false,
        });
      }

      // Convert tokens to correct translation

      const newSearchQuery = tokensToSearchQuery(newTokens);
      setSearchQuery(newSearchQuery, push);
    },
    [setSearchQuery],
  );

  const value = useMemo(
    () => ({
      searchTokens,
      searchQuery,
      getProperty,
      setProperty,
      setSearchQuery,
      pushSearchQuery,
      dormant,
      searchOrigin,
      searchTarget,
    }),
    [
      searchTokens,
      searchQuery,
      getProperty,
      setProperty,
      setSearchQuery,
      pushSearchQuery,
      dormant,
      searchOrigin,
      searchTarget,
    ],
  );

  return (
    <SearchFieldContext.Provider value={value}>
      {children}
    </SearchFieldContext.Provider>
  );
}

export function useSearchField() {
  const context = useContext(SearchFieldContext);
  if (!context) {
    throw new Error('useSearchField must be used within a SearchFieldProvider');
  }
  return context;
}
