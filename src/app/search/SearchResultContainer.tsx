'use client';

import type { Base, PaginatedList } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import SearchResult from './searchresult/SearchResult';

export default function SearchResultContainer({
  searchResults,
}: {
  searchResults: PaginatedList<Base>;
}) {
  const t = useTranslation();

  return (
    <div className="container-wrapper search-container main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className="search-results">
          {searchResults.items.length ? (
            searchResults.items.map((item) => (
              <SearchResult key={item.id} item={item} />
            ))
          ) : (
            <div className="no-results">
              <p>{t('common.noResults')}</p>
            </div>
          )}
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
