'use client';

import { Search, SearchClear, SearchInput } from '@digdir/designsystemet-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './HomeSearch.module.scss';

export default function HomeSearch() {
  const router = useRouter();
  const t = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' && event.key !== 'Escape') {
      setSearchQuery(event.currentTarget.value ?? '');
    }
    if (event.key === 'Escape') {
      event.currentTarget.value = '';
      setSearchQuery('');
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('q', searchQuery.trim());
      router.push(`/search?${params.toString()}`);
    }
  };

  return (
    <div className={styles.homeSearchContainer}>
      <form
        className={styles.searchForm}
        method="get"
        onSubmit={onSubmit}
        action="/search"
      >
        <Search data-color="brand3">
          <SearchInput
            aria-label={t('search.button')}
            name="q"
            autoComplete="off"
            onKeyDown={onKeyDown}
            onInput={onKeyDown}
            value={searchQuery}
            placeholder={t('search.placeholder')}
          />
          <SearchClear />
        </Search>
      </form>
    </div>
  );
}
