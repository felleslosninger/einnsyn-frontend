'use client';

import { Paragraph } from '@digdir/designsystemet-react';
import {
  isMoetemappe,
  type LagretSak,
  type PaginatedList,
} from '@digdir/einnsyn-sdk';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { SavedCasesListSkeleton } from '~/features/bruker/saved-cases/SavedCaseItemSkeleton';
import styles from '~/features/bruker/saved-cases/SavedCases.module.scss';
import { usePaginatedList } from '~/features/bruker/usePaginatedList';
import { useTranslation } from '~/hooks/useTranslation';
import { SavedMeetingItem } from './SavedMeetingItem';

export default function SavedMeetingsList({
  initialPage,
}: {
  initialPage: PaginatedList<LagretSak>;
}) {
  const t = useTranslation();
  const { page, loadNextPage, removeItem } = usePaginatedList(initialPage);

  // Saved cases come from the same list, and are shown on their own page.
  const savedMeetings = page.items.filter((item) =>
    isMoetemappe(item.moetemappe),
  );

  if (!savedMeetings.length && !page.next) {
    return <Paragraph>{t('bruker.savedMeetingsPage.empty')}</Paragraph>;
  }

  return (
    <>
      <ul className={styles.list}>
        {savedMeetings.map((savedMeeting) => (
          <SavedMeetingItem
            key={savedMeeting.id}
            savedMeeting={savedMeeting}
            onDelete={removeItem}
          />
        ))}
      </ul>
      {page.next && (
        <EinScrollTrigger onEnter={loadNextPage}>
          <SavedCasesListSkeleton />
        </EinScrollTrigger>
      )}
    </>
  );
}
