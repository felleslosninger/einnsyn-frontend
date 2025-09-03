'use client';

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
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
  const optimisticPathname = navigation.optimisticPathname;
  const optimisticSearchParams = navigation.optimisticSearchParams;
  const [searchQuery, _setSearchQuery] = useState(
    () => optimisticSearchParams.get('q') ?? '',
  );

  const searchTokens = useMemo(
    () => searchQueryToTokens(searchQuery),
    [searchQuery],
  );
  useEffect(() => {
    _setSearchQuery(optimisticSearchParams.get('q') ?? '');
  }, [optimisticSearchParams]);

  const searchStateRef = useRef({ searchQuery, searchTokens });
  useEffect(() => {
    searchStateRef.current = { searchQuery, searchTokens };
  }, [searchQuery, searchTokens]);

  const pushSearchQuery = useCallback(
    (queryToPush: string) => {
      const searchParams = new URLSearchParams(
        optimisticSearchParams.toString(),
      );
      if (queryToPush.length) {
        searchParams.set('q', queryToPush);
      } else {
        searchParams.delete('q');
      }
      const newSearchParamsString = searchParams.toString();
      navigation.push(`${optimisticPathname}?${newSearchParamsString}`);
    },
    [navigation, optimisticPathname, optimisticSearchParams],
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
        newTokens.push({ prefix: property, value });
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
