'use client';
import { useNavigation } from '~/components/NavigationProvider/NavigationProvider';
import { SearchField } from '~/components/SearchField/SearchField';
import { useSearchField } from '~/components/SearchField/SearchFieldProvider';
import { useTranslation } from '~/hooks/useTranslation';

import AnimatedHeader from './AnimatedHeader';
import styles from './Home.module.scss';

export default function Home() {
  const navigation = useNavigation();
  const t = useTranslation();
  const { searchQuery } = useSearchField();


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
      <div className={styles.homeContainer}>
        <AnimatedHeader />
        <form
          className={styles.searchForm}
          method="get"
          onSubmit={onSubmit}
          action="/search"
        >
          <SearchField
            aria-label={t('search.button')}
            name="q"
            autoComplete="off"
            className={styles.searchField}
          />
        </form>
      </div>
    </div>
  );
}
