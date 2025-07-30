'use client';

import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { useCallback, useState } from 'react';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useTranslation } from '~/hooks/useTranslation';
import { fetchNextPage } from '~/lib/utils/pagination';
import SearchResult from './searchresult/SearchResult';

export default function SearchResultContainer({
  searchResults,
}: {
  searchResults: PaginatedList<Base>;
}) {
  const t = useTranslation();
  const [currentSearchResults, setCurrentSearchResults] =
    useState<PaginatedList<Base>>(searchResults);

  const scrollTriggerHandler = useCallback(async () => {
    if (!currentSearchResults.next) {
      return; // No next page to fetch
    }
    const nextPageData = await fetchNextPage(currentSearchResults);
    setCurrentSearchResults(nextPageData);
  }, [currentSearchResults]);

  return (
    <div className="container-wrapper search-container main-content">
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
            <EinScrollTrigger onEnter={scrollTriggerHandler} />
          )}
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
