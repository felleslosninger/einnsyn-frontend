'use client';

import { Search, SearchClear, SearchInput } from '@digdir/designsystemet-react';
import { useState } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import AnimatedHeader from './AnimatedHeader';
import styles from './Home.module.scss';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';

export default function Home() {
  const navigation = useNavigation();
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
      navigation.push(`/search?${params.toString()}`);
    }
  };

  return (
    <div className="container-wrapper home-search-container">
      {/* <div className="container-pre collapsible" /> */}
      <div className="container">
        <div className={styles.homeContainer}>
          <AnimatedHeader />
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
      </div>
      <div className="container-post" />
    </div>
  );
}
