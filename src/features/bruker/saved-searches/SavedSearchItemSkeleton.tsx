'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import { useTranslation } from '~/hooks/useTranslation';
import { skeletonLength } from '~/lib/utils/skeletonUtils';
import styles from './SavedSearches.module.scss';

export function SavedSearchItemSkeleton({ index }: { index: number }) {
  const t = useTranslation();
  return (
    <li className={styles.item}>
      <span className={styles.title} style={{ pointerEvents: 'none' }}>
        <Skeleton variant="text" width={skeletonLength(index * 2, 3, 30)} />
      </span>
      <div className={styles.actions}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--ds-size-1)',
            marginRight: 'var(--ds-size-1)',
          }}
        >
          <Skeleton variant="circle" width="40.5px" height="1.5rem" />
          <Skeleton variant="text">
            {t('bruker.savedSearchesPage.subscribe')}
          </Skeleton>
        </span>
        <Skeleton
          variant="text"
          style={{
            margin: '0 var(--ds-size-1)',
            paddingLeft: 'var(--ds-size-9)',
          }}
        >
          {t('common.delete')}
        </Skeleton>
      </div>
    </li>
  );
}
