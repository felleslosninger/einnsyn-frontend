'use client';

import { Paragraph } from '@digdir/designsystemet-react';
import type { Innsynskrav, PaginatedList } from '@digdir/einnsyn-sdk';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { SavedCasesListSkeleton } from '~/features/bruker/saved-cases/SavedCaseItemSkeleton';
import styles from '~/features/bruker/saved-cases/SavedCases.module.scss';
import { usePaginatedList } from '~/features/bruker/usePaginatedList';
import { useTranslation } from '~/hooks/useTranslation';
import { AccessRequestItem } from './AccessRequestItem';

export default function AccessRequestsList({
  initialPage,
}: {
  initialPage: PaginatedList<Innsynskrav>;
}) {
  const t = useTranslation();
  const { page, loadNextPage, removeItem } = usePaginatedList(initialPage);

  if (!page.items.length && !page.next) {
    return <Paragraph>{t('bruker.accessRequestsPage.empty')}</Paragraph>;
  }

  return (
    <>
      <ul className={styles.list}>
        {page.items.map((innsynskrav) => (
          <AccessRequestItem
            key={innsynskrav.id}
            innsynskrav={innsynskrav}
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
