import {
  Alert,
  Divider,
  Heading,
  Paragraph,
} from '@digdir/designsystemet-react';
import type {
  Base,
  ListByBrukerParameters,
  PaginatedList,
} from '@digdir/einnsyn-sdk';
import { Fragment, type ReactNode, Suspense } from 'react';
import { cachedApiClient } from '~/lib/api/api.server';
import { cachedAuthInfo } from '~/lib/auth/auth.server';
import { getTranslator } from '~/lib/translation/translation.server';
import { logger } from '~/lib/utils/logger';
import styles from './List.module.scss';

export type ListPageType =
  | 'savedSearches'
  | 'savedCases'
  | 'savedMeetings'
  | 'accessRequests';

type ApiClient = Awaited<ReturnType<typeof cachedApiClient>>;

/**
 * The frame of a page under Mitt eInnsyn listing the user's saved searches,
 * saved cases, saved meetings or access requests. `type` is the translation key
 * for the page's texts. `load` fetches the first page of the user's list, and
 * `children` renders it, while `skeleton` stands in for it while it loads.
 */
export default async function ListPage<T extends Base>({
  type,
  skeleton,
  load,
  children,
}: {
  type: ListPageType;
  skeleton: ReactNode;
  load: (
    api: ApiClient,
    brukerId: string,
    query: ListByBrukerParameters,
  ) => Promise<PaginatedList<T>>;
  children: (page: PaginatedList<T>) => ReactNode;
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
          {type === 'savedSearches' && (
            <Paragraph>
              {t('bruker.savedSearchesPage.notificationInfo')}
            </Paragraph>
          )}
        </div>
        <div className={styles.content}>
          <Divider />
          <Suspense fallback={skeleton}>
            <LoadedList type={type} load={load}>
              {children}
            </LoadedList>
          </Suspense>
        </div>
      </div>
      <div className="container-post" />
    </div>
  );
}

async function LoadedList<T extends Base>({
  type,
  load,
  children,
}: {
  type: ListPageType;
  load: (
    api: ApiClient,
    brukerId: string,
    query: ListByBrukerParameters,
  ) => Promise<PaginatedList<T>>;
  children: (page: PaginatedList<T>) => ReactNode;
}) {
  const [authInfo, t] = await Promise.all([cachedAuthInfo(), getTranslator()]);

  let page: PaginatedList<T> | null = null;
  if (authInfo?.id) {
    try {
      // The SDK types `id` and `brukerId` as required query parameters, but the
      // bruker id is already part of the path.
      const query = { sortOrder: 'desc' } as ListByBrukerParameters;
      page = await load(await cachedApiClient(), authInfo.id, query);
    } catch (error) {
      logger.error(`Failed to list ${type}`, error);
    }
  }

  if (!page) {
    return <Alert data-color="danger">{t('bruker.loadError')}</Alert>;
  }

  // The list keeps its items in state, so another user needs a new list.
  return <Fragment key={authInfo?.id}>{children(page)}</Fragment>;
}
