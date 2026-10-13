import { Divider, Heading, Paragraph } from '@digdir/designsystemet-react';
import SearchSortDropdown from '~/features/search/SearchSortDropdown';
import { getTranslator } from '~/lib/translation/translation.actions';
import { listLagretSoek } from './lagretSoek.actions';
import styles from './SavedSearches.module.scss';
import SavedSearchesList from './SavedSearchesList';

const SORT_OPTIONS = ['default', 'labelAsc', 'labelDesc'] as const;

export default async function SavedSearches({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const [t, { sort }, initialPage] = await Promise.all([
    getTranslator(),
    searchParams,
    listLagretSoek(),
  ]);

  const searchPath = `/${t('routing.searchPath')}`;

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.header}>
          <Heading level={1} data-size="md">
            {t('bruker.savedSearches')}
          </Heading>
          <Paragraph>{t('bruker.savedSearchesPage.description')}</Paragraph>
          <Paragraph>
            {t('bruker.savedSearchesPage.notificationInfo')}
          </Paragraph>
        </div>
        <div className={styles.content}>
          <Divider />
          <div className={styles.toolbar}>
            <SearchSortDropdown
              options={SORT_OPTIONS}
              defaultOption="default"
              translationPrefix="bruker.savedSearchesPage.sort"
            />
          </div>
          {initialPage.items.length ? (
            <SavedSearchesList
              initialPage={initialPage}
              sort={sort ?? 'default'}
              searchPath={searchPath}
            />
          ) : (
            <Paragraph>{t('bruker.savedSearchesPage.empty')}</Paragraph>
          )}
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
