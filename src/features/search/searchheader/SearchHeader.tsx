'use client';

import { EnhetProvider } from '~/components/EnhetProvider/EnhetProvider';
import { SearchField } from '~/components/SearchField/SearchField';
import type { TrimmedEnhet } from '~/lib/enhet/enhet';
import styles from './SearchHeader.module.scss';
import SearchTabs from './SearchTabs';

type SearchHeaderProps = {
  initialEnhets?: readonly TrimmedEnhet[];
  enhetListVersion?: string | null;
};

export default function SearchHeader({
  initialEnhets,
  enhetListVersion,
}: SearchHeaderProps) {
  return (
    <EnhetProvider
      initialEnhets={initialEnhets}
      enhetListVersion={enhetListVersion}
    >
      <SearchField className={styles.searchForm} />

      <SearchTabs className="header-tabs" />
    </EnhetProvider>
  );
}
