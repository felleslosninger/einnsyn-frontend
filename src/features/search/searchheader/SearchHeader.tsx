'use client';

import { EnhetCacheProvider } from '~/components/EnhetCacheProvider/EnhetCacheProvider';
import { SearchField } from '~/components/SearchField/SearchField';
import type { TrimmedEnhet } from '~/lib/utils/trimmedEnhetUtils';
import SearchTabs from './SearchTabs';

type SearchHeaderProps = {
  initialEnhets?: readonly TrimmedEnhet[];
};

export default function SearchHeader({ initialEnhets }: SearchHeaderProps) {
  return (
    <EnhetCacheProvider initialEnhets={initialEnhets}>
      <SearchField />

      <SearchTabs className="header-tabs" />
    </EnhetCacheProvider>
  );
}
