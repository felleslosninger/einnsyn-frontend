'use client';

import { Paragraph, Skeleton } from '@digdir/designsystemet-react';
import {
  type Innsynskrav,
  isEnhet,
  isJournalpost,
  type PaginatedList,
} from '@digdir/einnsyn-sdk';
import { XMarkIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { SearchResultSkeleton } from '~/features/search/searchresult/SearchResultSkeleton';
import { useLanguageCode } from '~/hooks/useLanguageCode';
import { useTranslation } from '~/hooks/useTranslation';
import { getName } from '~/lib/enhet/enhet';
import cn from '~/lib/utils/className';
import { dateFormat } from '~/lib/utils/dateFormat';
import { generateJournalpostURL } from '~/lib/utils/urlGenerators';
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
      renderItem={(item, onDelete) => {
        const journalpost = isJournalpost(item.journalpost)
          ? item.journalpost
          : undefined;
        const enhet = journalpost?.administrativEnhetObjekt;
        return (
          <ListItem
            entity="Innsynskrav"
            id={item.id}
            title={journalpost?.offentligTittel}
            deleteLabel={t('bruker.accessRequestsPage.remove')}
            deleteIcon={<XMarkIcon aria-hidden="true" />}
            onDelete={onDelete}
          >
            <span className={styles.subtle}>
              {t('bruker.accessRequestsPage.requestedDocument')}
            </span>
            {journalpost ? (
              <h2 className={cn('ds-heading', styles.title)}>
                <EinLink
                  href={generateJournalpostURL(journalpost, languageCode)}
                >
                  {journalpost.offentligTittel}
                </EinLink>
              </h2>
            ) : (
              <span>{t('bruker.accessRequestsPage.unavailable')}</span>
            )}
            {isEnhet(enhet) && (
              <span className={styles.meta}>
                {getName(enhet, languageCode)}
              </span>
            )}
            <span className={cn(styles.meta, styles.subtle)}>
              {item.sent
                ? `${t('bruker.accessRequestsPage.sentAt')} ${dateFormat(item.sent, languageCode)}`
                : t('bruker.accessRequestsPage.notSent')}
            </span>
          </ListItem>
        );
      }}
    />
  );
}
