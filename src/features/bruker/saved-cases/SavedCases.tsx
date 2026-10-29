import {
  Alert,
  Divider,
  Heading,
  Paragraph,
} from '@digdir/designsystemet-react';
import { Suspense } from 'react';
import { getTranslator } from '~/lib/translation/translation.server';
import { listLagretSak } from './lagretSak.server';
import { SavedCasesListSkeleton } from './SavedCaseItemSkeleton';
import styles from './SavedCases.module.scss';
import SavedCasesList from './SavedCasesList';

async function SavedCasesContent() {
  const [initialPage, t] = await Promise.all([
    listLagretSak(['saksmappe.administrativEnhetObjekt']),
    getTranslator(),
  ]);

  if (!initialPage) {
    return (
      <Alert data-color="danger">{t('bruker.savedCasesPage.loadError')}</Alert>
    );
  }

  return <SavedCasesList initialPage={initialPage} />;
}

export default async function SavedCases() {
  const t = await getTranslator();

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.header}>
          <Heading level={1} data-size="md">
            {t('bruker.savedCases')}
          </Heading>
          <Paragraph>{t('bruker.savedCasesPage.description')}</Paragraph>
        </div>
        <div className={styles.content}>
          <Divider />
          <Suspense fallback={<SavedCasesListSkeleton />}>
            <SavedCasesContent />
          </Suspense>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
