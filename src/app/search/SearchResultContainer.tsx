'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { useCallback, useEffect, useState } from 'react';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { fetchNextPage } from '~/lib/utils/pagination';
import styles from './SearchResultContainer.module.scss';
import SearchResult from './searchresult/SearchResult';

export default function SearchResultContainer({
  searchResults,
}: {
  searchResults: PaginatedList<Base>;
}) {
  const t = useTranslation();
  const [currentSearchResults, setCurrentSearchResults] =
    useState<PaginatedList<Base>>(searchResults);

  // Update currentSearchResults when searchResults prop changes (new search)
  useEffect(() => {
    setCurrentSearchResults(searchResults);
  }, [searchResults]);

  const scrollTriggerHandler = useCallback(async () => {
    if (!currentSearchResults.next) {
      return; // No next page to fetch
    }
    const nextPageData = await fetchNextPage(currentSearchResults);
    setCurrentSearchResults(nextPageData);
  }, [currentSearchResults]);

  return (
    <div
      className={cn(
        'container-wrapper',
        'main-content',
        styles.searchContainer,
      )}
    >
      <div className="container-pre collapsible" />
      <div className="container">
        <div className="search-results">
          {currentSearchResults.items.length ? (
            currentSearchResults.items.map((item) => (
              <SearchResult key={item.id} item={item} />
            ))
          ) : (
            <div className="no-results">
              <p>{t('common.noResults')}</p>
            </div>
          )}

          {/* Conditionally render EinScrollTrigger only if there's a next page */}
          {currentSearchResults.next && (
            <EinScrollTrigger onEnter={scrollTriggerHandler}>
              <div className="search-result">
                <h2 className="ds-heading" data-size="lg">
                  <Skeleton variant="text">
                    A relatively long dummy title for loading skeleton
                  </Skeleton>
                </h2>
                <div className="ds-paragraph" data-size="sm">
                  <div>
                    <Skeleton variant="text">
                      - Journalpost – Published 01.01.1970
                    </Skeleton>
                  </div>
                  <div>
                    <Skeleton variant="text">eInnsyn dummy Enhet</Skeleton>
                  </div>
                  <div>
                    <Skeleton variant="text">Saksmappe: 123456789</Skeleton>
                  </div>
                </div>
              </div>
            </EinScrollTrigger>
          )}
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
