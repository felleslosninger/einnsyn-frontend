'use client';

import { Paragraph } from '@digdir/designsystemet-react';
import {
  isSaksmappe,
  type LagretSak,
  type PaginatedList,
} from '@digdir/einnsyn-sdk';
import { EinScrollTrigger } from '~/components/EinScrollTrigger/EinScrollTrigger';
import { usePaginatedList } from '~/features/bruker/usePaginatedList';
import { useTranslation } from '~/hooks/useTranslation';
import { SavedCaseItem } from './SavedCaseItem';
import { SavedCasesListSkeleton } from './SavedCaseItemSkeleton';
import styles from './SavedCases.module.scss';

export default function SavedCasesList({
  initialPage,
}: {
  initialPage: PaginatedList<LagretSak>;
}) {
  const t = useTranslation();
  const { page, loadNextPage, removeItem } = usePaginatedList(initialPage);

  // Saved meetings come from the same list, and are shown on their own page.
  const savedCases = page.items.filter((item) => isSaksmappe(item.saksmappe));

  if (!savedCases.length && !page.next) {
    return <Paragraph>{t('bruker.savedCasesPage.empty')}</Paragraph>;
  }

  return (
    <>
      <ul className={styles.list}>
        {savedCases.map((savedCase) => (
          <SavedCaseItem
            key={savedCase.id}
            savedCase={savedCase}
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
