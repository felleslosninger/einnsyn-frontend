'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import { skeletonLength } from '~/lib/utils/skeletonUtils';
import styles from './SavedCases.module.scss';

function SavedCaseItemSkeleton({ index }: { index: number }) {
  return (
    <li className={styles.item}>
      <div className={styles.main}>
        <Skeleton variant="text" width={skeletonLength(index * 2, 3, 30)} />
        <Skeleton
          variant="text"
          data-size="sm"
          width={skeletonLength(index * 2 + 1, 3, 20)}
        />
      </div>
    </li>
  );
}

export function SavedCasesListSkeleton() {
  return (
    <ul className={styles.list}>
      <SavedCaseItemSkeleton index={0} />
      <SavedCaseItemSkeleton index={1} />
      <SavedCaseItemSkeleton index={2} />
    </ul>
  );
}
