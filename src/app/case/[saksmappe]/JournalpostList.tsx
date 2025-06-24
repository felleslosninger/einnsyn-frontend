'use client';

import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { useCallback, useState } from 'react';
import { fetchNextPage } from '~/actions/api/pagination';
import type { Journalpost, PaginatedList } from '@digdir/einnsyn-sdk';
import { useTranslation } from '~/hooks/useTranslation';
import JournalpostRow from '~/app/case/[saksmappe]/JournalpostRow';

export default function JournalpostList({
  journalposts,
}: { journalposts: PaginatedList<Journalpost> }) {
  const t = useTranslation();
  const [currentJournalposts, setCurrentJournalposts] = useState(journalposts);

  const scrollTriggerHandler = useCallback(async () => {
    const nextPageData = await fetchNextPage(currentJournalposts);
    setCurrentJournalposts(nextPageData);
  }, [currentJournalposts]);

  return (
    <div className="container-wrapper">
      <div className="container-pre" />
      <div className="container">
        <table>
          <thead className="ein-table four-col">
            <tr className="table-row table-header">
              <th className="table-cell">{'Title'}</th>
              <th className="table-cell">{'Doc no.'}</th>
              <th className="table-cell">{'Journal date'}</th>
              <th className="table-cell">{'Published date'}</th>
            </tr>
          </thead>
          <tbody className="ein-table four-col">
            {currentJournalposts.items.length &&
              currentJournalposts.items.map((journalpost) => (
                <JournalpostRow
                  key={journalpost.id}
                  journalpost={journalpost}
                />
              ))}
          </tbody>
        </table>

        {currentJournalposts.next && (
          <EinScrollTrigger onEnter={scrollTriggerHandler} />
        )}
        <div className="container-post" />
      </div>
    </div>
  );
}
