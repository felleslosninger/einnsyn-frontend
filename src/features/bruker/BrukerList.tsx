import { Divider, Heading, Paragraph } from '@digdir/designsystemet-react';
import type { ListByBrukerParameters } from '@digdir/einnsyn-sdk';
import { Suspense } from 'react';
import { SearchResultSkeleton } from '~/features/search/searchresult/SearchResultSkeleton';
import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { getTranslator } from '~/lib/translation/translation.server';
import { logger } from '~/lib/utils/logger';
import styles from './BrukerList.module.scss';
import BrukerListItems, { type BrukerListType } from './BrukerListItems';

async function listItems(type: BrukerListType) {
  const [authInfo, api] = await Promise.all([
    cachedAuthInfo(),
    cachedApiClient(),
  ]);
  if (!authInfo?.id) {
    return null;
  }

  // The SDK types `id` and `brukerId` as required query parameters, but the
  // bruker id is already part of the path.
  const query = { sortOrder: 'desc' } as ListByBrukerParameters;
  try {
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

export default async function BrukerList({ type }: { type: BrukerListType }) {
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
          <Suspense fallback={<SearchResultSkeleton index={0} />}>
            <BrukerListItems type={type} initialPage={listItems(type)} />
          </Suspense>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}
