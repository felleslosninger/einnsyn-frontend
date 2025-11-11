import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { EinLink } from '~/components/EinLink/EinLink';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';


export default function MoetemappeModule({ item }: { item: Moetemappe }) {
    return (

        <div className={cn('moetemappemodule', styles.moetemappemodule)} >
            <div className={cn('moduleHeading', styles.moduleHeading)}>
                <EinLink href="">
                    {typeof item.utvalgObjekt === 'string' ? item.utvalgObjekt : item.utvalgObjekt.navn}
                </EinLink>

            </div>
            <div className={cn('moduleInfo', styles.moduleInfo)}>
                {/* <span>{new Date(item.moetedato).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</span> */}
                <span className={styles.parentNameLabel}>
                    {typeof item.utvalgObjekt === 'string'
                        ? ''
                        : (typeof item.utvalgObjekt.parent === 'string'
                            ? item.utvalgObjekt.parent
                            : item.utvalgObjekt.parent?.navn || '')
                    }
                </span>
            </div>
        </div>
    );
}