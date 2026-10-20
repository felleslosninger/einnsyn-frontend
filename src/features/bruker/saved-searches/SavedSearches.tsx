import { Divider, Heading, Paragraph } from '@digdir/designsystemet-react';
import { Suspense } from 'react';
import { buildPathname } from '~/lib/routing/pathname';
import { getSettings } from '~/lib/settings/settings.server';
import { getTranslator } from '~/lib/translation/translation.server';
import { listLagretSoek } from './lagretSoek.server';
import styles from './SavedSearches.module.scss';
import SavedSearchesList from './SavedSearchesList';
import { SavedSearchesListSkeleton } from './SavedSearchItemSkeleton';

async function SavedSearchesContent() {
  const [{ language }, initialPage] = await Promise.all([
    getSettings(),
    listLagretSoek(),
  ]);

  const searchPath = buildPathname({ page: 'search' }, language);

  return (
    <SavedSearchesList initialPage={initialPage} searchPath={searchPath} />
  );
}

export default async function SavedSearches() {
  const t = await getTranslator();

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.header}>
          <Heading level={1} data-size="sm">
            {t('bruker.savedSearches')}
          </Heading>
          <Paragraph>{t('bruker.savedSearchesPage.description')}</Paragraph>
          <Paragraph>
            {t('bruker.savedSearchesPage.notificationInfo')}
          </Paragraph>
        </div>
        <div className={styles.content}>
          <Divider />
          <Suspense fallback={<SavedSearchesListSkeleton />}>
            <SavedSearchesContent />
          </Suspense>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
