import { Skeleton } from '@digdir/designsystemet-react';
import { skeletonLength } from '~/lib/utils/skeletonUtils';
import styles from './JournalpostContainer.module.scss';

// Mirrors the `Field` rows in JournalpostContainer, so the placeholder has the
// same shape as the content that replaces it.
const FIELD_ROWS = [
  'recordType',
  'docDate',
  'recordDate',
  'correspondence',
  'legalBasis',
] as const;

export default function JournalpostContainerSkeleton() {
  return (
    <article className={styles.content} aria-busy="true" aria-live="polite">
      <div className={styles.heading}>
        <span className={styles.label}>
          <Skeleton variant="text" width={skeletonLength(0, 10, 16)} />
        </span>
        <h2 className={styles.title}>
          <Skeleton variant="text" width={skeletonLength(1, 30, 70)} />
        </h2>
      </div>

      <dl className={styles.fields}>
        {FIELD_ROWS.map((row, index) => (
          <div key={row} className={styles.field}>
            <dt>
              <Skeleton
                variant="text"
                width={skeletonLength(index * 2 + 2, 8, 14)}
              />
            </dt>
            <dd>
              <Skeleton
                variant="text"
                width={skeletonLength(index * 2 + 3, 15, 30)}
              />
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
