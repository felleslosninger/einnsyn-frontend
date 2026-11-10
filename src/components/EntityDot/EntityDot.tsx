import type {
  Journalpost,
  Moetemappe,
  Moetesak,
  Saksmappe,
} from '@digdir/einnsyn-sdk';
import cn from '~/lib/utils/className';
import styles from './EntityDot.module.scss';

type DotEntity = (Journalpost | Moetemappe | Moetesak | Saksmappe)['entity'];

const entityClass: Record<DotEntity, string> = {
  Saksmappe: styles.sak,
  Journalpost: cn(styles.sak, styles.filled),
  Moetemappe: styles.moete,
  Moetesak: cn(styles.moete, styles.filled),
};

/**
 * Marks an entity's type: saker are blue, møter yellow. A folder (saksmappe,
 * møtemappe) is a ring, the records in it (journalpost, møtesak) are filled.
 */
export function EntityDot({
  entity,
  className,
}: {
  entity: DotEntity;
  className?: string;
}) {
  return (
    <span
      className={cn(styles.dot, entityClass[entity], className)}
      aria-hidden="true"
    />
  );
}
