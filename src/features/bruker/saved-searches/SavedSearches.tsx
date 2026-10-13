import { Divider, Heading, Paragraph } from '@digdir/designsystemet-react';
import { buildPathname } from '~/lib/routing/pathname';
import {
  getLanguageCode,
  getTranslator,
} from '~/lib/translation/translation.actions';
import { listLagretSoek } from './lagretSoek.actions';
import styles from './SavedSearches.module.scss';
import SavedSearchesList from './SavedSearchesList';

export default async function SavedSearches() {
  const [t, languageCode, initialPage] = await Promise.all([
    getTranslator(),
    getLanguageCode(),
    listLagretSoek(),
  ]);

  const searchPath = buildPathname({ page: 'search' }, languageCode);

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
          {initialPage.items.length ? (
            <SavedSearchesList
              initialPage={initialPage}
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
