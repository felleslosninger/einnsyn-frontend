'use client';

import {
  type Base,
  type Enhet,
  isEnhet,
  isJournalpost,
  isMoetemappe,
  isMoetesak,
  isSaksmappe,
  type PaginatedList,
} from '@digdir/einnsyn-sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { EinTransition } from '~/components/EinTransition/EinTransition';
import { seedEnhets } from '~/components/EnhetProvider/enhetStore';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { useTranslation } from '~/hooks/useTranslation';
import { type TrimmedEnhet, toTrimmedEnhet } from '~/lib/enhet/enhet';
import { getPathEnhet } from '~/lib/routing/pathname';
import { getEnhetSelection } from '~/lib/routing/searchParams';
import cn from '~/lib/utils/className';
import { fetchNextPage } from '~/lib/utils/pagination';
import styles from './SearchResultContainer.module.scss';
import SearchSortDropdown from './SearchSortDropdown';
import SelectedEnhetPanel from './SelectedEnhetPanel';
import SearchResult from './searchresult/SearchResult';
import { SearchResultSkeleton } from './searchresult/SearchResultSkeleton';
import resultStyles from './searchresult/searchResultStyles.module.scss';

/** The enhets the results link to, with the parent chains the search expands. */
function getLinkedEnhets(items: readonly Base[]): TrimmedEnhet[] {
  const enhetsById = new Map<string, TrimmedEnhet>();
  for (const item of items) {
    let current: Enhet | string | undefined =
      isSaksmappe(item) || isJournalpost(item)
        ? item.administrativEnhetObjekt
        : isMoetemappe(item) || isMoetesak(item)
          ? item.utvalgObjekt
          : undefined;
    // A seen enhet has had its chain walked already.
    while (isEnhet(current) && !enhetsById.has(current.id)) {
      enhetsById.set(current.id, toTrimmedEnhet(current));
      current = current.parent;
    }
  }
  return Array.from(enhetsById.values());
}

export default function SearchResultContainer({
  searchResults,
}: {
  searchResults: PaginatedList<Base>;
}) {
  const t = useTranslation();
  const {
    loadingPathname,
    pathname,
    loadingSearchParamsString,
    searchParamsString,
    loading,
    optimisticPathname,
    optimisticSearchParams,
  } = useNavigation();
  const enhetIds = useMemo(
    () =>
      getEnhetSelection(
        getPathEnhet(optimisticPathname),
        optimisticSearchParams,
      ),
    [optimisticPathname, optimisticSearchParams],
  );
  const [currentSearchResults, setCurrentSearchResults] =
    useState<PaginatedList<Base>>(searchResults);
  const isLoading =
    loading &&
    (loadingPathname !== pathname ||
      loadingSearchParamsString !== searchParamsString);

  const searchSymbolRef = useRef<symbol>(Symbol());

  // Update currentSearchResults when searchResults prop changes (new search)
  useEffect(() => {
    searchSymbolRef.current = Symbol();
    setCurrentSearchResults(searchResults);
  }, [searchResults]);

  // The header layout seeds the enhet selector only on a full load, so an enhet
  // reached through a result's link has to be in the store before the click.
  useEffect(() => {
    seedEnhets(getLinkedEnhets(currentSearchResults.items));
  }, [currentSearchResults]);

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
