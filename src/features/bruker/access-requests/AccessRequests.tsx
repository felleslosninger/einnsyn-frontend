import {
  Alert,
  Divider,
  Heading,
  Paragraph,
} from '@digdir/designsystemet-react';
import { Suspense } from 'react';
import { SavedCasesListSkeleton } from '~/features/bruker/saved-cases/SavedCaseItemSkeleton';
import styles from '~/features/bruker/saved-cases/SavedCases.module.scss';
import { getTranslator } from '~/lib/translation/translation.server';
import AccessRequestsList from './AccessRequestsList';
import { listInnsynskrav } from './innsynskrav.server';

async function AccessRequestsContent() {
  const [initialPage, t] = await Promise.all([
    listInnsynskrav(),
    getTranslator(),
  ]);

  if (!initialPage) {
    return (
      <Alert data-color="danger">
        {t('bruker.accessRequestsPage.loadError')}
      </Alert>
    );
  }

  return <AccessRequestsList initialPage={initialPage} />;
}

export default async function AccessRequests() {
  const t = await getTranslator();

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.header}>
          <Heading level={1} data-size="md">
            {t('bruker.accessRequests')}
          </Heading>
          <Paragraph>{t('bruker.accessRequestsPage.description')}</Paragraph>
        </div>
        <div className={styles.content}>
          <Divider />
          <Suspense fallback={<SavedCasesListSkeleton />}>
            <AccessRequestsContent />
          </Suspense>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
