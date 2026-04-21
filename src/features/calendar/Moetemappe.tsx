import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { Link } from '@digdir/designsystemet-react';
import { EinLink } from '~/components/EinLink/EinLink';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';

export default function MoetemappeModule({ item }: { item: Moetemappe }) {
  return (
    <div className={cn('moetemappemodule', styles.moetemappemodule)}>
      <div className={cn('module-heading', styles.moduleHeading)}>
        <Link color="main" href="localhost:3000">
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
        {/* TODO: if week or day view add in time and place */}
        {/* <div>
          <span>
            {new Date(item.moetedato).toLocaleTimeString('nb-NO', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          <span>
            {item.moetested && item.moetested.length > 0
              ? ' - ' + item.moetested
              : ''}
          </span>
        </div> */}
      </div>
    </div>
  );
}
