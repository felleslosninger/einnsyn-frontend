'use client';

import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { useCallback, useEffect, useRef, useState } from 'react';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { EinTransition } from '~/components/EinTransition/EinTransition';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useEnhetFilterIds } from '~/hooks/useEnhetFilterIds';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { fetchNextPage } from '~/lib/utils/pagination';
import styles from './SearchResultContainer.module.scss';
import SearchSortDropdown from './SearchSortDropdown';
import SelectedEnhetPanel from './SelectedEnhetPanel';
import SearchResult from './searchresult/SearchResult';
import { SearchResultSkeleton } from './searchresult/SearchResultSkeleton';
import resultStyles from './searchresult/searchResultStyles.module.scss';

export default function SearchResultContainer({
  searchResults,
}: {
  searchResults: PaginatedList<Base>;
}) {
  const t = useTranslation();
  const { selectedEnhetIdentifiers: enhetIds } = useEnhetFilterIds();
  const [currentSearchResults, setCurrentSearchResults] =
    useState<PaginatedList<Base>>(searchResults);
  const { loadingSearchParamsString, searchParamsString, loading } =
    useNavigation();
  const isLoading = loading && loadingSearchParamsString !== searchParamsString;

  const searchSymbolRef = useRef<symbol>(Symbol());

  // Update currentSearchResults when searchResults prop changes (new search)
  useEffect(() => {
    searchSymbolRef.current = Symbol();
    setCurrentSearchResults(searchResults);
  }, [searchResults]);

  const scrollTriggerHandler = useCallback(async () => {
    if (!currentSearchResults.next) {
      return; // No next page to fetch
    }
    const newSearchSymbol = Symbol();
    searchSymbolRef.current = newSearchSymbol;
    const nextPageData = await fetchNextPage(currentSearchResults);

    // Discard this result if a new search has been initiated
    if (searchSymbolRef.current !== newSearchSymbol) {
      return;
    }

    setCurrentSearchResults(nextPageData);
  }, [currentSearchResults]);

  return (
    <EinTransition loading={isLoading} withClassNames>
      <div
        className={cn(
          'container-wrapper',
          'main-content',
          styles.searchContainer,
        )}
      >
        <div className="container-pre collapsible" />
        <div className="container">
          <SearchSortDropdown />
          <div className={styles.resultsLayout}>
            <div
              className={cn(styles.results, resultStyles.searchResults)}
              aria-busy={isLoading}
              aria-live="polite"
            >
              {currentSearchResults.items.length ? (
                currentSearchResults.items.map((item) => (
                  <SearchResult
                    className={styles.searchResult}
                    key={item.id}
                    item={item}
                  />
                ))
              ) : (
                <div className={cn(styles.searchResult, 'no-results')}>
                  <p>{t('common.noResults')}</p>
                </div>
              )}
              {currentSearchResults.next && (
                <EinScrollTrigger onEnter={scrollTriggerHandler}>
                  <SearchResultSkeleton
                    className={styles.searchResult}
                    index={0}
                  />
                  <SearchResultSkeleton
                    className={styles.searchResult}
                    index={1}
                  />
                </EinScrollTrigger>
              )}
            </div>
            {enhetIds.length > 0 && <SelectedEnhetPanel enhetIds={enhetIds} />}
          </div>
        </div>
        <div className="container-post"></div>
      </div>
    </EinTransition>
  );
}
