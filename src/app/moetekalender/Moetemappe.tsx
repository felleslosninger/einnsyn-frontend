import type { Moetemappe } from '@digdir/einnsyn-sdk';
import { MeetingLargeIcon } from '@navikt/aksel-icons';
import { EinLink } from '~/components/EinLink/EinLink';
import { useTranslation } from '~/hooks/useTranslation';

import cn from '~/lib/utils/className';
import styles from './CalendarContainer.module.scss';

import { Card, Heading, Paragraph } from "@digdir/designsystemet-react";


export default function MoetemappeModule({ item }: { item: Moetemappe }) {
    const t = useTranslation();
    // console.log('Rendering MoetemappeModule for item:', item); // TODO: remove debug log
    return (
        <>
            {/* <div className={cn('moetemappe-module', styles.moetemappeModule,)}>
                <EinLink href="">
                    <h2 className="ds-heading">{item.offentligTittel}</h2>
                </EinLink>
                <div className="ds-paragraph" data-size="sm">
                    <span>{new Date(item.moetedato).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span> {item.utvalgObjekt.navn} </span>
                </div>
            </div> */}

            {/* <Card>
                <Card.Block>
                    <Heading>
                        <a
                            href='/'
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            {item.offentligTittel}
                        </a>
                    </Heading>
                    <Paragraph data-size="sm">
                        <span>{new Date(item.moetedato).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span> {item.utvalgObjekt.navn} </span>
                    </Paragraph>
                </Card.Block>
            </Card> */}

            <div className={cn('moetemappemodule', styles.moetemappemodule)} >
                <div className={cn('moduleHeading', styles.moduleHeading)}>
                    {item.offentligTittel}
                </div>
                <div className={cn('moduleInfo', styles.moduleInfo)}>
                    <span>{new Date(item.moetedato).toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span> {item.utvalgObjekt.navn} </span>
                </div>
            </div>
        </>
    );
}