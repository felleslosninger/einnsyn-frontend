import {
  Alert,
  Divider,
  Heading,
  Paragraph,
} from '@digdir/designsystemet-react';
import type { ListByBrukerParameters } from '@digdir/einnsyn-sdk';
import { Suspense } from 'react';
import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { getTranslator } from '~/lib/translation/translation.server';
import { logger } from '~/lib/utils/logger';
import BrukerList, {
  BrukerListSkeleton,
  type BrukerListType,
} from './BrukerList';
import styles from './BrukerList.module.scss';

async function listItems(type: BrukerListType) {
  const authInfo = await cachedAuthInfo();
  if (!authInfo?.id) {
    return null;
  }

  // The SDK types `id` and `brukerId` as required query parameters, but the
  // bruker id is already part of the path.
  const query = { sortOrder: 'desc' } as ListByBrukerParameters;
  try {
    const api = await cachedApiClient();
    return type === 'accessRequests'
      ? await api.bruker.listInnsynskrav(authInfo.id, {
          ...query,
          expand: [
            'journalpost.saksmappe',
            'journalpost.administrativEnhetObjekt',
            'journalpost.korrespondansepart',
          ],
        })
      : await api.bruker.listLagretSak(authInfo.id, {
          ...query,
          expand: [
            'saksmappe.administrativEnhetObjekt',
            'moetemappe.utvalgObjekt',
          ],
        });
  } catch (error) {
    logger.error(`Failed to list ${type}`, error);
    return null;
  }
}

async function BrukerListContent({ type }: { type: BrukerListType }) {
  const [initialPage, t] = await Promise.all([
    listItems(type),
    getTranslator(),
  ]);

  if (!initialPage) {
    return <Alert data-color="danger">{t('bruker.loadError')}</Alert>;
  }

  return <BrukerList type={type} initialPage={initialPage} />;
}

/**
 * A page under Mitt eInnsyn listing the user's saved cases, saved meetings or
 * access requests. `type` is also the translation key for the page's texts.
 */
export default async function BrukerListPage({
  type,
}: {
  type: BrukerListType;
}) {
  const t = await getTranslator();

  return (
    <div className="container-wrapper main-content">
      <div className="container-pre collapsible" />
      <div className="container">
        <div className={styles.header}>
          <Heading level={1} data-size="md">
            {t(`bruker.${type}`)}
          </Heading>
          <Paragraph>{t(`bruker.${type}Page.description`)}</Paragraph>
        </div>
        <div className={styles.content}>
          <Divider />
          <Suspense fallback={<BrukerListSkeleton type={type} />}>
            <BrukerListContent type={type} />
          </Suspense>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
