import { useTranslation } from '~/hooks/useTranslation';
import cn from '~/lib/utils/className';

import { Table } from '@digdir/designsystemet-react';

import styles from '../CalendarContainer.module.scss';

import type { PaginatedList, Base } from '@digdir/einnsyn-sdk';

export default function DynamicView({ selectedDate, displayWeekends, currentSearchResults }: { selectedDate: Date; displayWeekends: boolean, currentSearchResults: PaginatedList<Base> }) {
    const t = useTranslation();

    return (
        <>
            <Table.Head className={cn(styles.head)}>
                <Table.Row>
                    <Table.HeaderCell>{t('moetekalender.days.monday')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('moetekalender.days.tuesday')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('moetekalender.days.wednesday')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('moetekalender.days.thursday')}</Table.HeaderCell>
                    <Table.HeaderCell>{t('moetekalender.days.friday')}</Table.HeaderCell>
                    {displayWeekends && (
                        <>
                            <Table.HeaderCell>{t('moetekalender.days.saturday')}</Table.HeaderCell>
                            <Table.HeaderCell>{t('moetekalender.days.sunday')}</Table.HeaderCell>
                        </>
                    )}
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {/* Dynamic content goes here */}
            </Table.Body>
        </>
    );
}