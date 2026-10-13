import { Fragment, type ReactNode } from 'react';
import styles from './EntityHeader.module.scss';

/** One `label: value` pair in an entity's metadata. */
export type EntityMetaItem = {
  label: string;
  value: ReactNode;
};

/**
 * An entity's title and its metadata. Purely presentational: the calling
 * entity component decides which fields to show, in what order, and does its own
 * translating and date formatting.
 */
export default function EntityHeader({
  title,
  meta = [],
}: {
  title: ReactNode;
  meta?: readonly EntityMetaItem[];
}) {
  return (
    <header className={styles.entityHeader}>
      <h1 className={styles.title}>{title}</h1>

      {meta.length > 0 && (
        <dl className={styles.meta}>
          {meta.map(({ label, value }) => (
            <Fragment key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </header>
  );
}
