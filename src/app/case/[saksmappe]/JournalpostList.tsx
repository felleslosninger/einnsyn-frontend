'use client';

import type { Journalpost, PaginatedList } from '@digdir/einnsyn-sdk';
import { useCallback, useState } from 'react';
import JournalpostRow from '~/app/case/[saksmappe]/JournalpostRow';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { fetchNextPage } from '~/lib/utils/pagination';
import styles from './JournalpostList.module.scss';

export default function JournalpostList({
  journalposts,
}: {
  journalposts: PaginatedList<Journalpost>;
}) {
  const t = useTranslation();
  const [currentJournalposts, setCurrentJournalposts] = useState(journalposts);

  const scrollTriggerHandler = useCallback(async () => {
    const nextPageData = await fetchNextPage(currentJournalposts);
    setCurrentJournalposts(nextPageData);
  }, [currentJournalposts]);

  return (
    <div className={cn(styles.journalpostList, 'container')}>
      {/*
      todo:
       - sideways scrolling+max-width conflicts with sticky header...
       -- scrollbar on top?
       */}
      <table className="ds-table" data-sticky-header="true" data-zebra="true">
        <caption>{t('journalpost.labelPlural')}</caption>
        <thead>
          <tr className="table-row table-header">
            <th className="table-cell" scope="col">
              {t('common.title')}
            </th>
            <th className="table-cell" scope="col">
              {t('journalpost.docNumber')}
            </th>
            <th className="table-cell" scope="col">
              {t('journalpost.fromTo')}
            </th>
            <th className="table-cell" scope="col">
              {t('journalpost.recordType')}
            </th>
            <th className="table-cell" scope="col">
              {t('journalpost.docDate')}
            </th>
            <th className="table-cell" scope="col">
              {t('journalpost.recordDate')}
            </th>
            <th className="table-cell" scope="col">
              {t('journalpost.pubDate')}
            </th>
            <th className="table-cell" scope="col">
              {t('journalpost.legalBasis')}
            </th>
            <th className="table-cell" scope="col">
              {/* button-column */}
            </th>
          </tr>
        </thead>
        <tbody>
          {currentJournalposts.items.length &&
            currentJournalposts.items.map((journalpost) => (
              <JournalpostRow key={journalpost.id} journalpost={journalpost} />
            ))}
        </tbody>
      </table>

      {currentJournalposts.next && (
        <EinScrollTrigger onEnter={scrollTriggerHandler} />
      )}
    </div>
  );
}
