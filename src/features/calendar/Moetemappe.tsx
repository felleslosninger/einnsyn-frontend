import { Link } from '@digdir/designsystemet-react';
import type { Moetemappe } from '@digdir/einnsyn-sdk';
import styles from './CalendarContainer.module.scss';

type Props = {
  item: Moetemappe;
  variant?: 'compact' | 'expanded';
};

const getUtvalgNames = (item: Moetemappe) => {
  const utvalg = item.utvalgObjekt;
  if (typeof utvalg === 'string') {
    return { utvalgNavn: utvalg, parentNavn: '' };
  }
  if (!utvalg) {
    return { utvalgNavn: '', parentNavn: '' };
  }
  const parent = utvalg.parent;
  const parentNavn = typeof parent === 'string' ? parent : (parent?.navn ?? '');
  return { utvalgNavn: utvalg.navn ?? '', parentNavn };
};

const formatTime = (moetedato: string | undefined): string => {
  if (!moetedato) return '';
  const d = new Date(moetedato);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export default function MoetemappeModule({ item, variant = 'compact' }: Props) {
  const { utvalgNavn, parentNavn } = getUtvalgNames(item);

  if (variant === 'expanded') {
    return (
      <div className={styles.moetemappemoduleExpanded}>
        <div className={styles.expandedTimeCol}>
          <span className={styles.expandedTime}>
            {formatTime(item.moetedato)}
          </span>
        </div>
        <div className={styles.moduleHeading}>
          <Link color="main" href="" className={styles.moduleHeadingLink}>
            {utvalgNavn}
          </Link>
          <span className={styles.expandedOrg}>{parentNavn}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.moetemappemodule}>
      <div className={styles.moduleHeading}>
        <Link color="main" href="" className={styles.moduleHeadingLink}>
          {utvalgNavn}
        </Link>
      </div>
      <div className={styles.moduleInfo}>
        <div className={styles.parentNameLabel}>{parentNavn}</div>
      </div>
    </div>
  );
}
