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
import { useSearchHref } from '~/hooks/useSearchHref';
import {
  type SearchToken,
  searchQueryToTokens,
  tokensToSearchQuery,
} from '~/lib/utils/searchStringTokenizer';

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
}

const SearchFieldContext = createContext<SearchFieldContextType | null>(null);

export function SearchFieldProvider({ children }: { children: ReactNode }) {
  const navigation = useNavigation();
  const searchHref = useSearchHref();
  const urlSearchQuery = navigation.optimisticSearchParams.get('q') ?? '';
  const [searchQuery, _setSearchQuery] = useState(urlSearchQuery);

  const searchTokens = useMemo(
    () => searchQueryToTokens(searchQuery),
    [searchQuery],
  );
  useEffect(() => {
    _setSearchQuery(urlSearchQuery);
  }, [urlSearchQuery]);

  const searchStateRef = useRef({ searchQuery, searchTokens });
  useEffect(() => {
    searchStateRef.current = { searchQuery, searchTokens };
  }, [searchQuery, searchTokens]);

  const pushSearchQuery = useCallback(
    (queryToPush: string) => {
      navigation.push(searchHref({ q: queryToPush }));
    },
    [navigation, searchHref],
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
          quoted: false,
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
    }),
    [
      searchTokens,
      searchQuery,
      getProperty,
      setProperty,
      setSearchQuery,
      pushSearchQuery,
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
