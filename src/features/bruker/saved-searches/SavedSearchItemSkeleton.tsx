'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';
import { skeletonLength } from '~/lib/utils/skeletonUtils';
import styles from './SavedSearches.module.scss';

export function SavedSearchItemSkeleton({ index }: { index: number }) {
  const t = useTranslation();
  return (
    <li className={styles.item}>
      <div className={styles.row}>
        <span className={cn(styles.title, styles.skeletonTitle)}>
          <Skeleton variant="text" width={skeletonLength(index * 2, 3, 30)} />
        </span>
        <div className={styles.actions}>
          <span className={styles.skeletonSwitch}>
            <Skeleton variant="circle" className={styles.skeletonSwitchTrack} />
            <Skeleton variant="text">
              {t('bruker.savedSearchesPage.subscribe')}
            </Skeleton>
          </span>
          <Skeleton variant="text" className={styles.skeletonDelete}>
            {t('common.delete')}
          </Skeleton>
        </div>
      </div>
    </li>
  );
}

export function SavedSearchesListSkeleton() {
  return (
    <ul className={styles.list}>
      <SavedSearchItemSkeleton index={0} />
      <SavedSearchItemSkeleton index={1} />
      <SavedSearchItemSkeleton index={2} />
    </ul>
  );
}
