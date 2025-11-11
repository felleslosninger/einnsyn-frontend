import { useTranslation } from '~/hooks/useTranslation';

import { Table } from '@digdir/designsystemet-react';
import { Base, isMoetemappe, PaginatedList } from '@digdir/einnsyn-sdk';

import styles from '../CalendarContainer.module.scss';
import MoetemappeModule from '../Moetemappe';

export default function DayView({ selectedDate, currentSearchResults }: { selectedDate: Date; currentSearchResults: PaginatedList<Base> }) {
    const t = useTranslation();

    const day = {
        date: selectedDate,
        dayNumber: selectedDate.getDate(),
    };

    return (
        <>
            <Table.Head>
                <Table.Row>
                    <Table.HeaderCell>{t('moetekalender.days.monday')}</Table.HeaderCell>
                </Table.Row>
            </Table.Head>
            <Table.Body>
                <Table.Row className={`${styles.row} ${styles.dayrow}`}>
                    <Table.Cell>
                        <div className={styles.cellHeader}>
                            <span className={styles.dateNumber}>{day.dayNumber}</span>
                            {(() => {
                                const count = currentSearchResults.items.filter(item =>
                                    isMoetemappe(item) && new Date(item.moetedato).toDateString() === day.date.toDateString()
                                ).length;
                                return `${count} ${count === 1 ? t('moetemappe.label') : t('moetemappe.labelPlural')}`.toLowerCase();
                            })()}
                        </div>

                        {currentSearchResults.items.map((item) => (
                            (isMoetemappe(item) && (new Date(item.moetedato).toDateString() === day.date.toDateString())) && <MoetemappeModule key={item.id} item={item} />
                        ))}
                    </Table.Cell>
                </Table.Row>
            </Table.Body>
        </>
    );
}