import {
  Alert,
  Divider,
  Heading,
  Paragraph,
} from '@digdir/designsystemet-react';
import { Suspense } from 'react';
import { listLagretSak } from '~/features/bruker/saved-cases/lagretSak.server';
import { SavedCasesListSkeleton } from '~/features/bruker/saved-cases/SavedCaseItemSkeleton';
import styles from '~/features/bruker/saved-cases/SavedCases.module.scss';
import { getTranslator } from '~/lib/translation/translation.server';
import SavedMeetingsList from './SavedMeetingsList';

async function SavedMeetingsContent() {
  const [initialPage, t] = await Promise.all([
    listLagretSak(['moetemappe.utvalgObjekt']),
    getTranslator(),
  ]);

  if (!initialPage) {
    return (
      <Alert data-color="danger">
        {t('bruker.savedMeetingsPage.loadError')}
      </Alert>
    );
  }

  return <SavedMeetingsList initialPage={initialPage} />;
}

export default async function SavedMeetings() {
  const t = await getTranslator();

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.header}>
          <Heading level={1} data-size="md">
            {t('bruker.savedMeetings')}
          </Heading>
          <Paragraph>{t('bruker.savedMeetingsPage.description')}</Paragraph>
        </div>
        <div className={styles.content}>
          <Divider />
          <Suspense fallback={<SavedCasesListSkeleton />}>
            <SavedMeetingsContent />
          </Suspense>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
