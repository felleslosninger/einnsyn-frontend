'use client';

import { useCallback } from 'react';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { SearchField } from '~/components/SearchField/SearchField';
import { useSearchField } from '~/components/SearchField/SearchFieldProvider';
import styles from './SearchHeader.module.scss';
import SearchTabs from './SearchTabs';

export default function SearchHeader() {
  const { optimisticPathname, optimisticSearchParams } = useNavigation();
  const { searchQuery, pushSearchQuery } = useSearchField();

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      pushSearchQuery(searchQuery);
      event.preventDefault();
    },
    [searchQuery, pushSearchQuery],
  );

  return (
    <>
      <form
        className={styles.searchForm}
        method="get"
        onSubmit={onSubmit}
        action={optimisticPathname}
      >
        <SearchField name="q" autoComplete="off" />

        {/* Include current query parameters as hidden inputs */}
        {Array.from(optimisticSearchParams?.entries() ?? []).map(
          ([key, value]) =>
            key !== 'q' && (
              <input key={key} type="hidden" name={key} value={value} />
            ),
        )}
      </form>

      <SearchTabs className="header-tabs" />
    </>
  );
}
