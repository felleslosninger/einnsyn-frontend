'use client';

import type { ReactNode } from 'react';
import { useTranslation } from '~/hooks/useTranslation';
import styles from './EntityKindRow.module.scss';

/**
 * The entity-kind row: an icon and the entity type's name ("Sak", "Møte").
 *
 * `EntityPageLayout` renders this as a full-width row above both columns, which
 * is what lets the side card line up with the title rather than with this row.
 */
export default function EntityKindRow({
  icon,
  labelKey,
}: {
  icon: ReactNode;
  labelKey: string;
}) {
  const t = useTranslation();

  return (
    <div className={styles.kindRow}>
      <span className={styles.kindIcon} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.kindLabel}>{t(labelKey)}</span>
    </div>
  );
}
