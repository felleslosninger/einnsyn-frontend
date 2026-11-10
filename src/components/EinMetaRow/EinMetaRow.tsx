import { Children } from 'react';
import cn from '~/lib/utils/className';
import styles from './EinMetaRow.module.scss';

/**
 * An inline row of metadata fields (type, number, dates, …) separated by "·".
 * Each child is one field, and empty children are skipped. A field built from
 * several pieces must be a single child — a template string or an element.
 */
export function EinMetaRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn(styles.metaRow, className)}>
      {Children.map(children, (field) =>
        field === null || field === '' ? null : (
          <span className={styles.field}>{field}</span>
        ),
      )}
    </span>
  );
}
