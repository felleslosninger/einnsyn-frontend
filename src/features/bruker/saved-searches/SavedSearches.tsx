'use client';

import { Heading, Paragraph } from '@digdir/designsystemet-react';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './SavedSearches.module.scss';

export default function SavedSearches() {
  const t = useTranslation();

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.header}>
          <Heading level={1} data-size="md">
            {t('bruker.savedSearches')}
          </Heading>
          <Paragraph>{t('bruker.savedSearchesPage.description')}</Paragraph>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
