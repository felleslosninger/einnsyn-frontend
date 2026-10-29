'use client';

import { isSaksmappe, type LagretSak } from '@digdir/einnsyn-sdk';
import { useId } from 'react';
import SaksmappeResult from '~/features/search/searchresult/SaksmappeResult';
import { LagretSakItem } from './LagretSakItem';
import styles from './SavedCases.module.scss';

export function SavedCaseItem({
  savedCase,
  onDelete,
}: {
  savedCase: LagretSak;
  onDelete: (id: string) => void;
}) {
  const titleId = useId();

  if (!isSaksmappe(savedCase.saksmappe)) {
    return null;
  }

  return (
    <LagretSakItem
      lagretSak={savedCase}
      titleId={titleId}
      translationKey="savedCasesPage"
      onDelete={onDelete}
    >
      <SaksmappeResult
        className={styles.result}
        item={savedCase.saksmappe}
        titleId={titleId}
      />
    </LagretSakItem>
  );
}
