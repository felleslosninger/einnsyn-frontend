'use client';

import { isMoetemappe, type LagretSak } from '@digdir/einnsyn-sdk';
import { useId } from 'react';
import { LagretSakItem } from '~/features/bruker/saved-cases/LagretSakItem';
import styles from '~/features/bruker/saved-cases/SavedCases.module.scss';
import MoetemappeResult from '~/features/search/searchresult/MoetemappeResult';

export function SavedMeetingItem({
  savedMeeting,
  onDelete,
}: {
  savedMeeting: LagretSak;
  onDelete: (id: string) => void;
}) {
  const titleId = useId();

  if (!isMoetemappe(savedMeeting.moetemappe)) {
    return null;
  }

  return (
    <LagretSakItem
      lagretSak={savedMeeting}
      titleId={titleId}
      translationKey="savedMeetingsPage"
      onDelete={onDelete}
    >
      <MoetemappeResult
        className={styles.result}
        item={savedMeeting.moetemappe}
        titleId={titleId}
      />
    </LagretSakItem>
  );
}
