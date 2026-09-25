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
   * Whether the current page shows the results the field describes. False on a
   * detail page, where the field is a view of the search that led there rather
   * than of this URL.
   */
  showsResults: boolean;
  /**
   * The search to go back to, set only when there is one and the current page
   * is not it. The field shows this as a link in place of its query; the field
   * is otherwise unchanged, so a submit still runs against {@link searchTarget}.
   */
  backToSearchHref: string | undefined;
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
  // browser has actually moved to. The split below uses the optimistic route
  // instead, so the field swaps to the back link as navigation starts.
  const searchOrigin = useSearchOrigin(
    navigation.pathname,
    navigation.searchParamsString,
  );
  const showsResults = showsSearchResults(optimisticPathname);
  const backToSearchHref = showsResults ? undefined : searchOrigin;
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
    if (showsResults) {
      return optimisticSearchParams.get('q') ?? '';
    }
    return parsedSearchOrigin?.searchParams.get('q') ?? undefined;
  }, [showsResults, optimisticSearchParams, parsedSearchOrigin]);

  useEffect(() => {
    if (authoritativeQuery === undefined) return;
    _setSearchQuery(authoritativeQuery);
  }, [authoritativeQuery]);

  // Submitting from a detail page must go back to the search, not to
  // `/case/abc?q=…`, and it has to carry the remembered filters, enhet and sort.
  const searchTarget = useMemo(() => {
    if (showsResults) {
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
  }, [
    showsResults,
    optimisticPathname,
    optimisticSearchParams,
    parsedSearchOrigin,
  ]);

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
      showsResults,
      backToSearchHref,
      searchTarget,
    }),
    [
      searchTokens,
      searchQuery,
      getProperty,
      setProperty,
      setSearchQuery,
      pushSearchQuery,
      showsResults,
      backToSearchHref,
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
