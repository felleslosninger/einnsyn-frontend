import { Link } from '@digdir/designsystemet-react';
import type { Moetemappe } from '@digdir/einnsyn-sdk';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';

type MoetemappeModuleProps = {
  item: Moetemappe;
  variant?: 'compact' | 'expanded';
};

function formatTime(moetedato: string): string {
  const d = new Date(moetedato);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function MoetemappeModule({
  item,
  variant = 'compact',
}: MoetemappeModuleProps) {
  const utvalg = item.utvalgObjekt;
  const utvalgNavn = typeof utvalg === 'string' ? utvalg : utvalg.navn;
  const parentNavn =
    typeof utvalg === 'string'
      ? ''
      : typeof utvalg.parent === 'string'
        ? utvalg.parent
        : utvalg.parent?.navn || '';

  if (variant === 'expanded') {
    return (
      <div className={cn('moetemappemodule', styles.moetemappemoduleExpanded)}>
        <div className={styles.expandedTimeCol}>
          <span className={styles.expandedTime}>
            {formatTime(item.moetedato)}
          </span>
        </div>
        <div className={styles.moduleHeading}>
          <Link
            color="main"
            href="localhost:3000"
            className={styles.moduleHeadingLink}
          >
            {utvalgNavn}
          </Link>
          <span className={styles.expandedOrg}>{parentNavn}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('moetemappemodule', styles.moetemappemodule)}>
      <div className={cn('module-heading', styles.moduleHeading)}>
        <Link
          color="main"
          href="localhost:3000"
          className={styles.moduleHeadingLink}
        >
          {utvalgNavn}
        </Link>
      </div>
      <div className={cn('module-info', styles.moduleInfo)}>
        <div className={styles.parentNameLabel}>{parentNavn}</div>
      </div>
    </div>
  );
}
