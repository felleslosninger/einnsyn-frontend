'use client';

import { useCallback } from 'react';
import { EnhetCacheProvider } from '~/components/EnhetCacheProvider/EnhetCacheProvider';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { SearchField } from '~/components/SearchField/SearchField';
import { useSearchField } from '~/components/SearchField/SearchFieldProvider';
import type { TrimmedEnhet } from '~/lib/utils/trimmedEnhetUtils';
import styles from './SearchHeader.module.scss';
import SearchTabs from './SearchTabs';

type SearchHeaderProps = {
  initialEnhets?: readonly TrimmedEnhet[];
};

export default function SearchHeader({ initialEnhets }: SearchHeaderProps) {
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
    <EnhetCacheProvider initialEnhets={initialEnhets}>
      <form
        className={styles.searchForm}
        method="get"
        onSubmit={onSubmit}
        action={optimisticPathname}
      >
        <SearchField />

        {/* Include current query parameters as hidden inputs */}
        {Array.from(optimisticSearchParams?.entries() ?? []).map(
          ([key, value]) =>
            key !== 'q' && (
              <input key={key} type="hidden" name={key} value={value} />
            ),
        )}
      </form>

      <SearchTabs className="header-tabs" />
    </EnhetCacheProvider>
  );
}
