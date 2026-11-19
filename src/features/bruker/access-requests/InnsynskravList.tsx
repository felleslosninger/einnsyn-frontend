'use client';

import { Paragraph, Skeleton } from '@digdir/designsystemet-react';
import {
  type Innsynskrav,
  isJournalpost,
  type PaginatedList,
} from '@digdir/einnsyn-sdk';
import JournalpostResult from '~/features/search/searchresult/JournalpostResult';
import { SearchResultSkeleton } from '~/features/search/searchresult/SearchResultSkeleton';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { dateFormat } from '~/lib/utils/dateFormat';
import InfiniteList from '../InfiniteList';
import styles from '../List.module.scss';
import ListItem from '../ListItem';
import ListSkeleton from '../ListSkeleton';

export function InnsynskravListSkeleton() {
  return (
    <ListSkeleton
      renderItem={(index) => (
        <>
          <SearchResultSkeleton className={styles.result} index={index} />
          <Paragraph data-size="sm" className={styles.meta}>
            <Skeleton variant="text" width={30} />
          </Paragraph>
        </>
      )}
    />
  );
}

export default function InnsynskravList({
  initialPage,
}: {
  initialPage: PaginatedList<Innsynskrav>;
}) {
  const t = useTranslation();
  const languageCode = useLanguageCode();

  return (
    <InfiniteList
      initialPage={initialPage}
      skeleton={<InnsynskravListSkeleton />}
      emptyText={t('bruker.accessRequestsPage.empty')}
      renderItem={(item, onDelete) => (
        <ListItem
          entity="Innsynskrav"
          id={item.id}
          title={
            isJournalpost(item.journalpost)
              ? item.journalpost.offentligTittel
              : undefined
          }
          onDelete={onDelete}
        >
          {isJournalpost(item.journalpost) && (
            <JournalpostResult
              className={styles.result}
              item={item.journalpost}
            />
          )}
          <Paragraph data-size="sm" className={styles.meta}>
            {item.sent
              ? `${t('bruker.accessRequestsPage.sentAt')} ${dateFormat(item.sent, languageCode)}`
              : t('bruker.accessRequestsPage.notSent')}
          </Paragraph>
        </ListItem>
      )}
    />
  );
}
