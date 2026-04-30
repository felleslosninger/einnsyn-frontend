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
            {typeof item.utvalgObjekt === 'string'
              ? item.utvalgObjekt
              : item.utvalgObjekt.navn}
          </Link>
          <span className={styles.expandedOrg}>
            {typeof item.utvalgObjekt === 'string'
              ? ''
              : typeof item.utvalgObjekt.parent === 'string'
                ? item.utvalgObjekt.parent
                : item.utvalgObjekt.parent?.navn || ''}
          </span>
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
          {typeof item.utvalgObjekt === 'string'
            ? item.utvalgObjekt
            : item.utvalgObjekt.navn}
        </Link>
      </div>
      <div className={cn('module-info', styles.moduleInfo)}>
        <div className={styles.parentNameLabel}>
          {typeof item.utvalgObjekt === 'string'
            ? ''
            : typeof item.utvalgObjekt.parent === 'string'
              ? item.utvalgObjekt.parent
              : item.utvalgObjekt.parent?.navn || ''}
        </div>
      </div>
    </div>
  );
}
