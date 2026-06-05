'use client';

import { Skeleton } from '@digdir/designsystemet-react';
import { useEffect, useState } from 'react';
import { skeletonString } from '~/lib/utils/skeletonUtils';
import styles from './JournalpostContainer.module.scss';

export default function JournalpostContainerSkeleton() {
  const [data, setData] = useState({
    label: '',
    title: '',
    fields: [] as { dt: string; dd: string }[],
    docTitle: '',
    docMeta: '',
  });

  useEffect(() => {
    setData({
      label: skeletonString(10, 16),
      title: skeletonString(30, 70),
      fields: Array.from({ length: 5 }, () => ({
        dt: skeletonString(8, 14),
        dd: skeletonString(15, 30),
      })),
      docTitle: skeletonString(20, 40),
      docMeta: skeletonString(18, 28),
    });
  }, []);

  return (
    <article className={styles.content} aria-busy="true" aria-live="polite">
      <div className={styles.heading}>
        <span className={styles.label}>
          <Skeleton variant="text">{data.label}</Skeleton>
        </span>
        <h2 className={styles.title}>
          <Skeleton variant="text">{data.title}</Skeleton>
        </h2>
      </div>

      <dl className={styles.fields}>
        {data.fields.map((field) => (
          <div key={`${field.dt}-${field.dd}`} className={styles.field}>
            <dt>
              <Skeleton variant="text">{field.dt}</Skeleton>
            </dt>
            <dd>
              <Skeleton variant="text">{field.dd}</Skeleton>
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
